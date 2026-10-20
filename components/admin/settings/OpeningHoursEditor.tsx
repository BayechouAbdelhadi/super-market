'use client';

import React from 'react';
import { CalendarX, Clock, Copy, Plus, Trash2 } from 'lucide-react';
import { cn } from 'cn';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NEW_TIME_RANGE, OPENING_HOURS_LIMITS, STORE_TIME_ZONE } from '@/lib/store/config';
import {
  DAY_NAMES,
  WEEK_ORDER,
  formatClosureDates,
  getZonedDayTime,
  type DayIndex,
  type ExceptionalClosure,
  type OpeningHours,
  type TimeRange,
} from '@/lib/store/opening-hours';

interface OpeningHoursEditorProps {
  value: OpeningHours;
  onChange: (hours: OpeningHours) => void;
}

/** Random id for a new closure (getRandomValues works outside secure contexts, unlike randomUUID). */
function newClosureId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Admin editor for the weekly opening hours and exceptional closures.
 * Controlled: changes are kept in the settings form and persisted by its "Enregistrer" button.
 */
export function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
  const today = getZonedDayTime(new Date(), STORE_TIME_ZONE).date;

  const setDay = (day: DayIndex, ranges: TimeRange[]) =>
    onChange({ ...value, weekly: { ...value.weekly, [day]: ranges } });

  const updateRange = (day: DayIndex, index: number, patch: Partial<TimeRange>) =>
    setDay(
      day,
      value.weekly[day].map((range, i) => (i === index ? { ...range, ...patch } : range))
    );

  const addRange = (day: DayIndex) => {
    const ranges = value.weekly[day];
    const last = ranges[ranges.length - 1];
    // Start the new range where the previous one closes, so the day stays in order
    setDay(day, [...ranges, last ? { open: last.close, close: NEW_TIME_RANGE.close } : { ...NEW_TIME_RANGE }]);
  };

  const copyToAllDays = (day: DayIndex) => {
    const ranges = value.weekly[day];
    const weekly = { ...value.weekly };
    for (const other of WEEK_ORDER) weekly[other] = ranges.map((range) => ({ ...range }));
    onChange({ ...value, weekly });
  };

  // Closures are edited in place in the settings value: what is on screen is exactly what "Enregistrer" saves
  const addClosure = () =>
    onChange({
      ...value,
      closures: [...value.closures, { id: newClosureId(), startDate: today, endDate: today, reason: '' }],
    });

  const updateClosure = (id: string, patch: Partial<ExceptionalClosure>) =>
    onChange({
      ...value,
      closures: value.closures.map((closure) => {
        if (closure.id !== id) return closure;
        const next = { ...closure, ...patch };
        // Moving the start past the end drags the end along (one-day closure by default)
        if (patch.startDate && next.endDate < next.startDate) next.endDate = next.startDate;
        return next;
      }),
    });

  const removeClosures = (keep: (closure: ExceptionalClosure) => boolean) =>
    onChange({ ...value, closures: value.closures.filter(keep) });

  const upcoming = value.closures.filter((closure) => closure.endDate >= today);
  const past = value.closures.filter((closure) => closure.endDate < today);

  return (
    <div className="space-y-6">
      {/* Weekly schedule */}
      <Card padded="lg" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-info-subtle text-info-text flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)]">Horaires d&apos;ouverture</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Horaires habituels affichés sur le site, dans l&apos;espace client et utilisés pour l&apos;indicateur « Ouvert / Fermé ».
            </p>
          </div>
        </div>

        <ul className="divide-y divide-[var(--color-border)]">
          {WEEK_ORDER.map((day) => {
            const ranges = value.weekly[day];
            const isOpen = ranges.length > 0;
            return (
              <li key={day} className="flex flex-col gap-3 py-4 first:pt-2 last:pb-0 md:flex-row md:items-start">
                <div className="flex items-center justify-between gap-3 md:w-48 md:shrink-0 md:min-h-11">
                  <span className="text-sm font-semibold text-[var(--color-text)]">{DAY_NAMES[day]}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOpen}
                    aria-label={`${DAY_NAMES[day]} : ${isOpen ? 'ouvert' : 'fermé'}`}
                    onClick={() => setDay(day, isOpen ? [] : [{ ...NEW_TIME_RANGE }])}
                    className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-button)] px-1 text-xs font-semibold text-[var(--color-text-muted)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'relative h-6 w-10 rounded-full transition-colors',
                        isOpen ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-[var(--color-surface)] shadow-xs transition-transform',
                          isOpen && 'translate-x-4'
                        )}
                      />
                    </span>
                    <span className="w-12 text-left">{isOpen ? 'Ouvert' : 'Fermé'}</span>
                  </button>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {ranges.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        aria-label={`${DAY_NAMES[day]}, plage ${index + 1} : ouverture`}
                        value={range.open}
                        onChange={(e) => updateRange(day, index, { open: e.target.value })}
                        className="tabular-nums"
                      />
                      <span aria-hidden className="text-[var(--color-text-muted)]">–</span>
                      <Input
                        type="time"
                        aria-label={`${DAY_NAMES[day]}, plage ${index + 1} : fermeture`}
                        value={range.close}
                        onChange={(e) => updateRange(day, index, { close: e.target.value })}
                        className="tabular-nums"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Supprimer la plage ${index + 1} du ${DAY_NAMES[day].toLowerCase()}`}
                        onClick={() => setDay(day, ranges.filter((_, i) => i !== index))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}

                  {isOpen && (
                    <div className="flex flex-wrap gap-2">
                      {ranges.length < OPENING_HOURS_LIMITS.maxRangesPerDay && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => addRange(day)} className="min-h-11">
                          <Plus />
                          <span>Ajouter une plage</span>
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="sm" onClick={() => copyToAllDays(day)} className="min-h-11">
                        <Copy />
                        <span>Appliquer à tous les jours</span>
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Exceptional closures */}
      <Card padded="lg" className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-subtle text-warning-text flex items-center justify-center shrink-0">
            <CalendarX className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)]">Fermetures exceptionnelles</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Jours fériés, inventaire, congés… Le magasin est affiché fermé toute la journée et les clients sont prévenus sur le site.
            </p>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Aucune fermeture exceptionnelle prévue.</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((closure) => (
              <EditableClosureRow
                key={closure.id}
                closure={closure}
                today={today}
                onChange={(patch) => updateClosure(closure.id, patch)}
                onRemove={() => removeClosures((c) => c.id !== closure.id)}
              />
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={addClosure}
            disabled={value.closures.length >= OPENING_HOURS_LIMITS.maxClosures}
          >
            <Plus />
            <span>Ajouter une fermeture</span>
          </Button>
          <p className="text-xs text-[var(--color-text-muted)]">
            Mettez la même date de début et de fin pour un seul jour. Pensez à enregistrer.
          </p>
        </div>

        {past.length > 0 && (
          <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Passées</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11"
                onClick={() => removeClosures((closure) => closure.endDate >= today)}
              >
                <Trash2 />
                <span>Tout supprimer</span>
              </Button>
            </div>
            <ul className="space-y-2 opacity-70">
              {past.map((closure) => (
                <ClosureRow key={closure.id} closure={closure} onRemove={() => removeClosures((c) => c.id !== closure.id)} />
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}

function EditableClosureRow({
  closure,
  today,
  onChange,
  onRemove,
}: {
  closure: ExceptionalClosure;
  today: string;
  onChange: (patch: Partial<ExceptionalClosure>) => void;
  onRemove: () => void;
}) {
  const invalidRange = closure.endDate < closure.startDate;
  return (
    <li className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-4 sm:grid-cols-2 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
      <Input
        type="date"
        label="Du"
        value={closure.startDate}
        min={today}
        onChange={(e) => e.target.value && onChange({ startDate: e.target.value })}
      />
      <Input
        type="date"
        label="Au (inclus)"
        value={closure.endDate}
        min={closure.startDate}
        error={invalidRange ? 'Doit être après la date de début.' : undefined}
        onChange={(e) => e.target.value && onChange({ endDate: e.target.value })}
      />
      <Input
        type="text"
        label="Motif (optionnel)"
        value={closure.reason}
        maxLength={OPENING_HOURS_LIMITS.maxClosureReasonLength}
        placeholder="Noël, inventaire…"
        onChange={(e) => onChange({ reason: e.target.value })}
        // Enter would submit the whole settings form
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Supprimer la fermeture du ${formatClosureDates(closure)}`}
        onClick={onRemove}
        className="justify-self-end text-[var(--color-danger)] hover:text-[var(--color-danger)]"
      >
        <Trash2 />
      </Button>
    </li>
  );
}

function ClosureRow({ closure, onRemove }: { closure: ExceptionalClosure; onRemove: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-4 py-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text)] tabular-nums">{formatClosureDates(closure)}</p>
        {closure.reason && <p className="text-xs text-[var(--color-text-muted)] break-words">{closure.reason}</p>}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Supprimer la fermeture du ${formatClosureDates(closure)}`}
        onClick={onRemove}
        className="text-[var(--color-danger)] hover:text-[var(--color-danger)]"
      >
        <Trash2 />
      </Button>
    </li>
  );
}
