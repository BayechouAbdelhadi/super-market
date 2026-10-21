import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ALERTS_CONFIG } from '@/lib/alerts/config';
import { dismissAlert, dismissedStore, parseDismissedIds, HIDE_DISMISSED_SCRIPT } from '@/components/public/dismissed-alerts';

const KEY = ALERTS_CONFIG.dismissedStorageKey;

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe('Dismissed site alerts', () => {
  let storage: ReturnType<typeof memoryStorage>;

  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('remembers a closed alert id once', () => {
    dismissAlert('a1');
    dismissAlert('a1');
    dismissAlert('a2');
    expect(parseDismissedIds(dismissedStore.getSnapshot())).toEqual(['a1', 'a2']);
  });

  it('keeps only the most recent ids', () => {
    for (let i = 0; i < ALERTS_CONFIG.dismissedMaxIds + 5; i++) dismissAlert(`id-${i}`);
    const ids = parseDismissedIds(storage.getItem(KEY) ?? '');
    expect(ids).toHaveLength(ALERTS_CONFIG.dismissedMaxIds);
    expect(ids.at(-1)).toBe(`id-${ALERTS_CONFIG.dismissedMaxIds + 4}`);
    expect(ids).not.toContain('id-0');
  });

  it('ignores corrupted or foreign values', () => {
    expect(parseDismissedIds('not json')).toEqual([]);
    expect(parseDismissedIds('{"a":1}')).toEqual([]);
    expect(parseDismissedIds('["ok", 3, null]')).toEqual(['ok']);
  });

  it('keeps working when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => dismissAlert('a1')).not.toThrow();
    expect(dismissedStore.getSnapshot()).toBe('');
  });

  it('pre-paint script hides closed alerts and strips anything but uuid characters', () => {
    const appended: { textContent: string }[] = [];
    const style = { textContent: '' };
    const document = {
      createElement: () => style,
      head: { appendChild: (el: { textContent: string }) => appended.push(el) },
    };
    storage.setItem(KEY, JSON.stringify(['3f1c2b9e-8a7d', '"]}body{display:none']));
    new Function('localStorage', 'document', HIDE_DISMISSED_SCRIPT)(storage, document);

    expect(appended).toHaveLength(1);
    expect(style.textContent).toBe('[data-alert-id="3f1c2b9e-8a7d"],[data-alert-id="bddae"]{display:none!important}');
  });
});
