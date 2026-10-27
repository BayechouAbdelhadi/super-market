import { describe, it, expect } from 'vitest';
import {
  assertItemChangesAllowed,
  buildArrivalStats,
  canCustomerCancel,
  canTransition,
  getArrivalPhase,
  isVisibleOnSite,
  maxReservable,
  reservationTotal,
  unitLabelFor,
} from '@/lib/arrivals/domain';
import { ArrivalSchema, CreateReservationSchema, UpdateReservationStatusSchema } from '@/lib/arrivals/validation';
import { deleteArrival, getVisibleArrivals, reserve, setReservationStatus, updateArrival } from '@/lib/arrivals/service';
import type { RawArrivalStats } from '@/lib/arrivals/domain';
import type { IArrivalRepository, IReservationRepository } from '@/lib/arrivals/ports';
import {
  ArrivalError,
  type Arrival,
  type ArrivalDraft,
  type ArrivalItem,
  type Reservation,
  type ReservationRequestLine,
  type ReservationStatus,
} from '@/lib/arrivals/types';

const ITEM_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ITEM_ID = '22222222-2222-4222-8222-222222222222';
const ARRIVAL_ID = '33333333-3333-4333-8333-333333333333';

function item(overrides: Partial<ArrivalItem> = {}): ArrivalItem {
  return {
    id: ITEM_ID,
    name: 'Filet de poulet',
    unitLabel: 'barquette de 500 g',
    weightGrams: 500,
    unitPrice: 12.5,
    stockTotal: 10,
    stockReserved: 0,
    maxPerCustomer: null,
    position: 0,
    ...overrides,
  };
}

/** Arrival open from yesterday to tomorrow, pickup in two days. */
function arrival(overrides: Partial<Arrival> = {}): Arrival {
  const day = 24 * 3600 * 1000;
  const now = Date.now();
  return {
    id: ARRIVAL_ID,
    title: 'Arrivage poulet',
    description: null,
    category: 'CHICKEN',
    reservationOpensAt: new Date(now - day).toISOString(),
    reservationClosesAt: new Date(now + day).toISOString(),
    pickupDate: new Date(now + 2 * day).toISOString().slice(0, 10),
    closedAt: null,
    createdAt: new Date(now - 2 * day).toISOString(),
    items: [item()],
    ...overrides,
  };
}

function draftOf(a: Arrival): ArrivalDraft {
  return {
    title: a.title,
    description: a.description,
    category: a.category,
    reservationOpensAt: a.reservationOpensAt,
    reservationClosesAt: a.reservationClosesAt,
    pickupDate: a.pickupDate,
    items: a.items.map(({ id, name, unitLabel, weightGrams, unitPrice, stockTotal, maxPerCustomer }) => ({
      id,
      name,
      unitLabel,
      weightGrams: weightGrams ?? 500,
      unitPrice,
      stockTotal,
      maxPerCustomer,
    })),
  };
}

class MemoryArrivalRepository implements IArrivalRepository {
  activeReservations = 0;
  constructor(public arrivals: Arrival[] = []) {}
  async list(offset: number, limit: number) {
    return { items: this.arrivals.slice(offset, offset + limit), total: this.arrivals.length };
  }
  async listVisible(now: Date, limit: number) {
    return this.arrivals.filter((a) => !a.closedAt && new Date(a.reservationClosesAt) > now).slice(0, limit);
  }
  async get(id: string) {
    return this.arrivals.find((a) => a.id === id) ?? null;
  }
  async create(draft: ArrivalDraft): Promise<Arrival> {
    const created = arrival({ ...draft, id: `a-${this.arrivals.length}`, items: [] });
    this.arrivals.push(created);
    return created;
  }
  async update(id: string, draft: ArrivalDraft) {
    const current = await this.get(id);
    if (!current) return null;
    Object.assign(current, { ...draft, items: current.items });
    return current;
  }
  async close(id: string) {
    const current = await this.get(id);
    if (current) current.closedAt = new Date().toISOString();
    return current;
  }
  async delete(id: string) {
    const before = this.arrivals.length;
    this.arrivals = this.arrivals.filter((a) => a.id !== id);
    return this.arrivals.length < before;
  }
  async countActiveReservations() {
    return this.activeReservations;
  }
  async stats(): Promise<RawArrivalStats> {
    return { byStatus: {}, customers: 0, expectedRevenue: 0, collectedRevenue: 0, items: [], daily: [] };
  }
}

/**
 * Takes stock the way arrival_reserve does: check and decrement as one step,
 * so concurrent calls can never take more than the stock.
 */
class MemoryReservationRepository implements IReservationRepository {
  reservations: Reservation[] = [];
  constructor(private arrivals: MemoryArrivalRepository) {}
  async reserve(arrivalId: string, customerId: string, lines: ReservationRequestLine[]) {
    const a = (await this.arrivals.get(arrivalId))!;
    if (this.reservations.some((r) => r.customer.id === customerId && r.arrivalId === arrivalId && r.status === 'CONFIRMED')) {
      throw new ArrivalError('ALREADY_RESERVED');
    }
    for (const line of lines) {
      const i = a.items.find((x) => x.id === line.itemId)!;
      if (i.stockReserved + line.quantity > i.stockTotal) throw new ArrivalError('OUT_OF_STOCK', i.id);
    }
    for (const line of lines) a.items.find((x) => x.id === line.itemId)!.stockReserved += line.quantity;
    const id = `r-${this.reservations.length}`;
    this.reservations.push({
      id,
      arrivalId,
      status: 'CONFIRMED',
      totalAmount: 0,
      createdAt: new Date().toISOString(),
      statusChangedAt: new Date().toISOString(),
      history: [{ status: 'CONFIRMED', at: new Date().toISOString() }],
      lines: [],
      arrival: a,
      customer: { id: customerId, fullName: 'Client', phone: null, email: null },
    });
    return id;
  }
  async setStatus(id: string, status: ReservationStatus) {
    this.reservations.find((r) => r.id === id)!.status = status;
  }
  async get(id: string) {
    return this.reservations.find((r) => r.id === id) ?? null;
  }
  async listForArrival() {
    return { items: this.reservations, total: this.reservations.length };
  }
  async listForCustomer() {
    return { items: this.reservations, total: this.reservations.length };
  }
  async findLatestActiveForCustomer() {
    return null;
  }
}

describe('Arrivals', () => {
  describe('phase', () => {
    const base = { reservationOpensAt: '2026-11-10T08:00:00Z', reservationClosesAt: '2026-11-12T18:00:00Z', pickupDate: '2026-11-14', closedAt: null };

    it('is scheduled before opening, open in the window, closed after it, finished after the pickup day', () => {
      expect(getArrivalPhase(base, new Date('2026-11-09T12:00:00Z'))).toBe('SCHEDULED');
      expect(getArrivalPhase(base, new Date('2026-11-11T12:00:00Z'))).toBe('OPEN');
      expect(getArrivalPhase(base, new Date('2026-11-13T12:00:00Z'))).toBe('CLOSED');
      expect(getArrivalPhase(base, new Date('2026-11-14T20:00:00Z'))).toBe('CLOSED');
      expect(getArrivalPhase(base, new Date('2026-11-15T12:00:00Z'))).toBe('FINISHED');
    });

    it('is closed as soon as an admin closes it by hand', () => {
      expect(getArrivalPhase({ ...base, closedAt: '2026-11-11T09:00:00Z' }, new Date('2026-11-11T12:00:00Z'))).toBe('CLOSED');
    });

    it('stays on the site only while scheduled or open', () => {
      expect(isVisibleOnSite(base, new Date('2026-11-09T12:00:00Z'))).toBe(true);
      expect(isVisibleOnSite(base, new Date('2026-11-11T12:00:00Z'))).toBe(true);
      expect(isVisibleOnSite(base, new Date('2026-11-13T12:00:00Z'))).toBe(false);
    });

    it('lets a customer cancel until reservations close', () => {
      expect(canCustomerCancel('CONFIRMED', base, new Date('2026-11-11T12:00:00Z'))).toBe(true);
      expect(canCustomerCancel('CONFIRMED', base, new Date('2026-11-13T12:00:00Z'))).toBe(false);
      expect(canCustomerCancel('COLLECTED', base, new Date('2026-11-11T12:00:00Z'))).toBe(false);
    });
  });

  describe('status transitions', () => {
    it('moves an active reservation forward only', () => {
      expect(canTransition('CONFIRMED', 'REMINDED')).toBe(true);
      expect(canTransition('REMINDED', 'COLLECTED')).toBe(true);
      expect(canTransition('REMINDED', 'REMINDED')).toBe(false);
      expect(canTransition('COLLECTED', 'CANCELLED')).toBe(false);
      expect(canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
      expect(canTransition('NO_SHOW', 'COLLECTED')).toBe(false);
    });
  });

  describe('quantities and totals', () => {
    it('caps a line at the stock left, the per-customer limit and the per-line cap', () => {
      expect(maxReservable(item({ stockReserved: 7 }), 50)).toBe(3);
      expect(maxReservable(item({ maxPerCustomer: 2 }), 50)).toBe(2);
      expect(maxReservable(item({ stockTotal: 100 }), 5)).toBe(5);
      expect(maxReservable(item({ stockReserved: 10 }), 50)).toBe(0);
    });

    it('sums lines to the cent', () => {
      expect(reservationTotal([{ unitPrice: 12.5, quantity: 3 }, { unitPrice: 0.1, quantity: 3 }])).toBe(37.8);
    });
  });

  describe('edit checks', () => {
    it('refuses to drop a reserved product or set its stock below what is reserved', () => {
      const current = arrival({ items: [item({ stockReserved: 4 })] });
      expect(() => assertItemChangesAllowed(current, { ...draftOf(current), items: [] })).toThrow('ITEM_HAS_RESERVATIONS');
      const lower = draftOf(current);
      lower.items[0].stockTotal = 3;
      expect(() => assertItemChangesAllowed(current, lower)).toThrow('STOCK_BELOW_RESERVED');
      const ok = draftOf(current);
      ok.items[0].stockTotal = 4;
      expect(() => assertItemChangesAllowed(current, ok)).not.toThrow();
    });

    it('rejects an item id that belongs to another arrival', () => {
      const current = arrival();
      const draft = draftOf(current);
      draft.items[0].id = OTHER_ITEM_ID;
      expect(() => assertItemChangesAllowed(current, draft)).toThrow('ITEM_NOT_FOUND');
    });
  });

  describe('stats', () => {
    it('derives the collection rate and average basket', () => {
      const stats = buildArrivalStats({
        byStatus: { CONFIRMED: 2, COLLECTED: 3, NO_SHOW: 1, CANCELLED: 4 },
        customers: 6,
        expectedRevenue: 100,
        collectedRevenue: 60,
        items: [],
        daily: [],
      });
      expect(stats.totalReservations).toBe(6);
      expect(stats.byStatus.REMINDED).toBe(0);
      expect(stats.collectionRate).toBe(0.75);
      expect(stats.averageBasket).toBe(20);
    });

    it('has no rate nor average before any reservation', () => {
      const stats = buildArrivalStats({ byStatus: {}, customers: 0, expectedRevenue: 0, collectedRevenue: 0, items: [], daily: [] });
      expect(stats.collectionRate).toBeNull();
      expect(stats.averageBasket).toBeNull();
    });
  });

  describe('validation', () => {
    const valid = {
      title: '  Poulets fermiers ',
      description: '',
      category: 'CHICKEN',
      reservationOpensAt: '2026-11-10T08:00:00.000Z',
      reservationClosesAt: '2026-11-12T18:00:00.000Z',
      pickupDate: '2026-11-14',
      items: [{ name: 'Filet de poulet', weightGrams: 1500, unitPrice: 12.499, stockTotal: 20, maxPerCustomer: null }],
    };

    it('accepts an arrival, trims text and rounds prices', () => {
      const parsed = ArrivalSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
      expect(parsed.data?.title).toBe('Poulets fermiers');
      expect(parsed.data?.description).toBeNull();
      expect(parsed.data?.items[0].unitPrice).toBe(12.5);
    });

    it('defaults the category and builds the unit from the tray weight', () => {
      const { category: _category, ...withoutCategory } = valid;
      const parsed = ArrivalSchema.safeParse(withoutCategory);
      expect(parsed.data?.category).toBe('CHICKEN');
      expect(parsed.data?.items[0].unitLabel).toBe('barquette de 1,5 kg');
      expect(unitLabelFor(500)).toBe('barquette de 500 g');
    });

    it('only accepts the category products, once each, with a tray weight', () => {
      const [line] = valid.items;
      expect(ArrivalSchema.safeParse({ ...valid, items: [{ ...line, name: 'Poulet entier' }] }).success).toBe(false);
      expect(ArrivalSchema.safeParse({ ...valid, items: [line, line] }).success).toBe(false);
      expect(ArrivalSchema.safeParse({ ...valid, items: [{ ...line, weightGrams: 0 }] }).success).toBe(false);
      const { weightGrams: _weight, ...withoutWeight } = line;
      expect(ArrivalSchema.safeParse({ ...valid, items: [withoutWeight] }).success).toBe(false);
    });

    it('rejects closing before opening, pickup before closing, no product or a negative stock', () => {
      expect(ArrivalSchema.safeParse({ ...valid, reservationClosesAt: '2026-11-09T08:00:00.000Z' }).success).toBe(false);
      expect(ArrivalSchema.safeParse({ ...valid, pickupDate: '2026-11-11' }).success).toBe(false);
      expect(ArrivalSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
      expect(ArrivalSchema.safeParse({ ...valid, items: [{ ...valid.items[0], stockTotal: -1 }] }).success).toBe(false);
    });

    it('answers in French when the body is not an object', () => {
      for (const schema of [ArrivalSchema, CreateReservationSchema, UpdateReservationStatusSchema]) {
        expect(schema.safeParse(null).error?.issues[0].message).toBe('Requête invalide : le contenu doit être un objet JSON.');
      }
      expect(ArrivalSchema.safeParse({ ...valid, items: [null] }).error?.issues[0].message).toBe('Article invalide.');
      const messages = (r: { error?: { issues: { message: string }[] } }) => r.error?.issues.map((i) => i.message) ?? [];
      expect(messages(ArrivalSchema.safeParse({}))).not.toContainEqual(expect.stringMatching(/Invalid input/));
      expect(messages(CreateReservationSchema.safeParse({}))).toEqual(['Choisissez au moins un article.']);
    });

    it('validates reservation lines and staff statuses', () => {
      expect(CreateReservationSchema.safeParse({ lines: [{ itemId: ITEM_ID, quantity: 2 }] }).success).toBe(true);
      expect(CreateReservationSchema.safeParse({ lines: [{ itemId: ITEM_ID, quantity: 0 }] }).success).toBe(false);
      expect(CreateReservationSchema.safeParse({ lines: [] }).success).toBe(false);
      expect(UpdateReservationStatusSchema.safeParse({ status: 'COLLECTED' }).success).toBe(true);
      expect(UpdateReservationStatusSchema.safeParse({ status: 'CONFIRMED' }).success).toBe(false);
    });
  });

  describe('service', () => {
    it('reserves on an open arrival and takes the stock', async () => {
      const arrivals = new MemoryArrivalRepository([arrival()]);
      const reservations = new MemoryReservationRepository(arrivals);
      const created = await reserve(ARRIVAL_ID, 'c1', { lines: [{ itemId: ITEM_ID, quantity: 3 }] }, null, arrivals, reservations);
      expect(created.status).toBe('CONFIRMED');
      expect(arrivals.arrivals[0].items[0].stockReserved).toBe(3);
    });

    it('refuses before opening and after a manual closure', async () => {
      const later = arrival({ reservationOpensAt: new Date(Date.now() + 3600_000).toISOString() });
      const arrivals = new MemoryArrivalRepository([later]);
      const reservations = new MemoryReservationRepository(arrivals);
      const lines = { lines: [{ itemId: ITEM_ID, quantity: 1 }] };
      await expect(reserve(ARRIVAL_ID, 'c1', lines, null, arrivals, reservations)).rejects.toThrow('RESERVATION_NOT_OPEN');
      later.reservationOpensAt = new Date(Date.now() - 3600_000).toISOString();
      later.closedAt = new Date().toISOString();
      await expect(reserve(ARRIVAL_ID, 'c1', lines, null, arrivals, reservations)).rejects.toThrow('RESERVATION_CLOSED');
    });

    it('refuses more than the per-customer limit', async () => {
      const arrivals = new MemoryArrivalRepository([arrival({ items: [item({ maxPerCustomer: 2 })] })]);
      const reservations = new MemoryReservationRepository(arrivals);
      await expect(
        reserve(ARRIVAL_ID, 'c1', { lines: [{ itemId: ITEM_ID, quantity: 3 }] }, null, arrivals, reservations)
      ).rejects.toThrow('MAX_PER_CUSTOMER');
    });

    it('never sells more than the stock when customers reserve at the same time', async () => {
      const arrivals = new MemoryArrivalRepository([arrival({ items: [item({ stockTotal: 5 })] })]);
      const reservations = new MemoryReservationRepository(arrivals);
      const results = await Promise.allSettled(
        Array.from({ length: 8 }, (_, i) =>
          reserve(ARRIVAL_ID, `c${i}`, { lines: [{ itemId: ITEM_ID, quantity: 2 }] }, null, arrivals, reservations)
        )
      );
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      expect(ok).toBe(2);
      expect(arrivals.arrivals[0].items[0].stockReserved).toBe(4);
      expect(arrivals.arrivals[0].items[0].stockReserved).toBeLessThanOrEqual(5);
    });

    it('rejects a status change the reservation cannot make', async () => {
      const arrivals = new MemoryArrivalRepository([arrival()]);
      const reservations = new MemoryReservationRepository(arrivals);
      const created = await reserve(ARRIVAL_ID, 'c1', { lines: [{ itemId: ITEM_ID, quantity: 1 }] }, null, arrivals, reservations);
      const collected = await setReservationStatus(created.id, 'COLLECTED', 'caisse@test', reservations);
      expect(collected.status).toBe('COLLECTED');
      await expect(setReservationStatus(created.id, 'CANCELLED', null, reservations)).rejects.toThrow('INVALID_TRANSITION');
    });

    it('does not delete an arrival with active reservations', async () => {
      const arrivals = new MemoryArrivalRepository([arrival()]);
      arrivals.activeReservations = 1;
      await expect(deleteArrival(ARRIVAL_ID, arrivals)).rejects.toThrow('HAS_ACTIVE_RESERVATIONS');
      arrivals.activeReservations = 0;
      expect(await deleteArrival(ARRIVAL_ID, arrivals)).toBe(true);
    });

    it('checks an edit against the reserved stock', async () => {
      const current = arrival({ items: [item({ stockReserved: 6 })] });
      const arrivals = new MemoryArrivalRepository([current]);
      const draft = draftOf(current);
      draft.items[0].stockTotal = 5;
      await expect(updateArrival(ARRIVAL_ID, draft, arrivals)).rejects.toThrow('STOCK_BELOW_RESERVED');
      expect(await updateArrival('missing', draft, arrivals)).toBeNull();
    });

    it('hides the section instead of failing when storage is down', async () => {
      const broken = new MemoryArrivalRepository();
      broken.listVisible = async () => {
        throw new Error('down');
      };
      expect(await getVisibleArrivals(new Date(), broken)).toEqual([]);
    });
  });
});
