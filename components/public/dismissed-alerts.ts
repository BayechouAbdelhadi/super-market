import { ALERTS_CONFIG } from "@/lib/alerts/config";

/**
 * Ids of the alerts this visitor closed, kept in localStorage (per browser).
 * Every access is guarded: storage can be blocked (private mode, disabled site data),
 * in which case the alerts simply stay visible.
 */

const { dismissedStorageKey: KEY, dismissedMaxIds: MAX_IDS } = ALERTS_CONFIG;

const listeners = new Set<() => void>();

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function parseDismissedIds(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function dismissAlert(id: string): void {
  const ids = parseDismissedIds(read()).filter((existing) => existing !== id);
  ids.push(id);
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(-MAX_IDS)));
  } catch {
    // Storage unavailable: the alert closes for this page view only
  }
  listeners.forEach((listener) => listener());
}

/** useSyncExternalStore source: the raw stored string (stable between reads). */
export const dismissedStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },
  getSnapshot: read,
  getServerSnapshot: () => "",
};

/**
 * Inline script run before first paint: hides the closed banners so they never flash in
 * before React hydrates. Only UUID characters are kept, so nothing can be injected into the CSS.
 */
export const HIDE_DISMISSED_SCRIPT = `try{var d=JSON.parse(localStorage.getItem(${JSON.stringify(KEY)})||"[]");if(Array.isArray(d)&&d.length){var s=document.createElement("style");s.textContent=d.map(function(i){return'[data-alert-id="'+String(i).replace(/[^a-f0-9-]/gi,"")+'"]'}).join(",")+"{display:none!important}";document.head.appendChild(s)}}catch(e){}`;
