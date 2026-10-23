import { useSyncExternalStore } from "react";

/** Touch device at least as wide as the `md:` breakpoint: tablets, not phones or desktops. */
export const TABLET_QUERY = "(pointer: coarse) and (min-width: 768px)";

function subscribeTablet(onChange: () => void) {
  const query = window.matchMedia(TABLET_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Whether the app runs on a tablet. Always `false` during server rendering. */
export function useIsTablet(): boolean {
  return useSyncExternalStore(
    subscribeTablet,
    () => window.matchMedia(TABLET_QUERY).matches,
    () => false
  );
}
