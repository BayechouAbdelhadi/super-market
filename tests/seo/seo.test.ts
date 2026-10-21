import { describe, it, expect, afterEach, vi } from 'vitest';
import { searchEngineVerification } from '@/lib/seo/config';
import {
  breadcrumbJsonLd,
  jsonLdGraph,
  newsPostJsonLd,
  serializeJsonLd,
  storeJsonLd,
  toInternationalPhone,
  toPostalAddress,
} from '@/lib/seo/structured-data';
import { newsPostDescription, newsPostHeadline, newsPostPath, parseNewsPostParam, slugify } from '@/lib/news/permalink';
import { buildStoreFaq, formatList } from '@/lib/store/faq';
import { DEPARTMENTS, findDepartment } from '@/lib/store/departments';
import type { OpeningHours, WeeklySchedule } from '@/lib/store/opening-hours';

const SITE = 'https://supermarketcalais.com';
const ID = '6f1c1a8e-6d3b-4c2a-9a59-3a8b0f1d2e4c';

const weekly: WeeklySchedule = {
  0: [{ open: '09:00', close: '19:30' }],
  1: [{ open: '09:00', close: '12:30' }, { open: '14:00', close: '19:30' }],
  2: [{ open: '09:00', close: '19:30' }],
  3: [{ open: '09:00', close: '19:30' }],
  4: [{ open: '09:00', close: '19:30' }],
  5: [{ open: '09:00', close: '19:30' }],
  6: [{ open: '09:00', close: '19:30' }],
};
const hours: OpeningHours = { weekly, closures: [{ id: 'c1', startDate: '2026-12-25', endDate: '2026-12-25', reason: 'Noël' }] };
const store = { storeName: 'Super Market Calais', address: '205 Avenue Antoine de Saint-Exupéry, 62100 Calais', phone: '06 71 54 05 28', email: 'contact@example.com' };

describe('structured data', () => {
  it('formats French phone numbers internationally', () => {
    expect(toInternationalPhone('06 71 54 05 28')).toBe('+33671540528');
    expect(toInternationalPhone('+33 6 71 54 05 28')).toBe('+33671540528');
    expect(toInternationalPhone('0033671540528')).toBe('+33671540528');
    expect(toInternationalPhone('12 34')).toBe('12 34');
  });

  it('splits a French address, and keeps unknown formats as text', () => {
    expect(toPostalAddress(store.address)).toEqual({
      '@type': 'PostalAddress',
      streetAddress: '205 Avenue Antoine de Saint-Exupéry',
      postalCode: '62100',
      addressLocality: 'Calais',
      addressCountry: 'FR',
    });
    expect(toPostalAddress('205 Avenue Antoine de Saint-Exupéry 62100 Calais, France')).toMatchObject({ postalCode: '62100', addressLocality: 'Calais' });
    expect(toPostalAddress('Près de la gare')).toBe('Près de la gare');
  });

  it('describes the store with absolute URLs, hours and closures', () => {
    const node = storeJsonLd(store, hours, SITE);
    expect(node).toMatchObject({ '@type': 'GroceryStore', '@id': `${SITE}/#store`, url: SITE, telephone: '+33671540528', priceRange: '€' });
    expect(node.sameAs).toEqual(['https://www.facebook.com/supermarketcalais']);
    expect((node.image as string[]).every((url) => url.startsWith(SITE))).toBe(true);
    expect(node.openingHoursSpecification).toHaveLength(8);
    expect(node.specialOpeningHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', validFrom: '2026-12-25', validThrough: '2026-12-25', opens: '00:00', closes: '00:00' },
    ]);
  });

  it('numbers breadcrumbs and makes their URLs absolute', () => {
    const node = breadcrumbJsonLd([{ name: 'Accueil', path: '/' }, { name: 'Actualités', path: '/actualites' }], SITE);
    expect(node.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Actualités', item: `${SITE}/actualites` },
    ]);
  });

  it('falls back to the share image for a post without photo', () => {
    const node = newsPostJsonLd({ headline: 'H', body: 'B', path: '/actualites/x', imageUrls: [], createdAt: '2026-10-01T10:00:00Z', updatedAt: null }, SITE);
    expect(node.image).toEqual([`${SITE}/og-image.jpg`]);
    expect(node.dateModified).toBe('2026-10-01T10:00:00Z');
  });

  it('escapes "<" so the JSON can never close its script tag', () => {
    const json = serializeJsonLd(jsonLdGraph([{ name: '</script><script>alert(1)</script>' }]));
    expect(json).not.toContain('</script>');
    expect(JSON.parse(json)['@graph'][0].name).toBe('</script><script>alert(1)</script>');
  });
});

describe('news permalinks', () => {
  const post = { id: ID, body: 'Arrivage de dattes Medjool !\nVenez vite.', createdAt: '2026-10-01T10:00:00Z' };

  it('builds a readable, accent-free slug ending with the id', () => {
    expect(slugify("Été : l'arrivage des pastèques")).toBe('ete-l-arrivage-des-pasteques');
    expect(newsPostPath(post)).toBe(`/actualites/arrivage-de-dattes-medjool-${ID}`);
    expect(newsPostPath({ ...post, body: '' })).toBe(`/actualites/actualite-${ID}`);
  });

  it('keeps slugs short without cutting words', () => {
    const slug = slugify('Très longue annonce '.repeat(10));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
    expect(slug.split('-').every((word) => ['tres', 'longue', 'annonce'].includes(word))).toBe(true);
  });

  it('finds the id at the end of the segment, whatever the slug', () => {
    expect(parseNewsPostParam(`arrivage-de-dattes-${ID}`)).toBe(ID);
    expect(parseNewsPostParam(`ancien-titre-${ID.toUpperCase()}`)).toBe(ID);
    expect(parseNewsPostParam('arrivage-de-dattes')).toBeNull();
  });

  it('takes the headline from the first line and the description from the text', () => {
    expect(newsPostHeadline(post)).toBe('Arrivage de dattes Medjool !');
    expect(newsPostHeadline({ ...post, body: '' })).toMatch(/^Actualité du /);
    expect(newsPostDescription(post)).toBe('Arrivage de dattes Medjool ! Venez vite.');
    expect(newsPostDescription({ ...post, body: 'mot '.repeat(80) }).length).toBeLessThanOrEqual(155);
  });
});

describe('store FAQ', () => {
  it('answers from the live hours and loyalty ratio', () => {
    const faq = buildStoreFaq({ storeName: store.storeName, address: store.address, weekly, euroToPointsRatio: 2 });
    const answer = (start: string) => faq.find((item) => item.question.startsWith(start))?.answer;
    expect(answer('Le magasin est-il ouvert le dimanche')).toBe('Oui, le dimanche de 9h à 19h30.');
    expect(answer('Quels sont les horaires')).toMatch(/^Le magasin est ouvert 7 jours sur 7\./);
    expect(answer('Comment fonctionne la carte')).toContain('2 points');
  });

  it('says the store is closed on Sunday when it is', () => {
    const faq = buildStoreFaq({ storeName: 'S', address: 'A', weekly: { ...weekly, 0: [] }, euroToPointsRatio: 1 });
    expect(faq.find((item) => item.question.includes('dimanche'))?.answer).toBe('Non, le magasin est fermé le dimanche.');
  });

  it('lists payment methods with a capital only at the start', () => {
    expect(formatList(['carte bancaire', 'Apple Pay', 'espèces'])).toBe('Carte bancaire, Apple Pay et espèces');
  });
});

describe('departments', () => {
  it('have unique slugs, short titles and meta descriptions', () => {
    expect(new Set(DEPARTMENTS.map((d) => d.slug)).size).toBe(DEPARTMENTS.length);
    for (const department of DEPARTMENTS) {
      expect(department.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(`${department.heading} — Super Market Calais`.length).toBeLessThanOrEqual(65);
      expect(department.metaDescription.length).toBeLessThanOrEqual(160);
      expect(department.heading).toContain('Calais');
      expect(department.faq.length).toBeGreaterThan(0);
    }
    expect(findDepartment('poulet-frais-halal')?.title).toBe('Poulet frais & charcuterie');
    expect(findDepartment('inconnu')).toBeUndefined();
  });
});

describe('search engine verification', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('adds only the codes that are configured', () => {
    vi.stubEnv('GOOGLE_SITE_VERIFICATION', ' g-code ');
    vi.stubEnv('BING_SITE_VERIFICATION', '');
    expect(searchEngineVerification()).toEqual({ google: 'g-code' });
    vi.stubEnv('BING_SITE_VERIFICATION', 'b-code');
    expect(searchEngineVerification()).toEqual({ google: 'g-code', other: { 'msvalidate.01': 'b-code' } });
  });
});
