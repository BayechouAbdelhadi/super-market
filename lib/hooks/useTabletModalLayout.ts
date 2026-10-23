import { useState, useEffect, useSyncExternalStore, type CSSProperties } from "react";

/** Touch device at least as wide as the `md:` breakpoint: tablets, not phones or desktops. */
const TABLET_QUERY = "(pointer: coarse) and (min-width: 768px)";

/** Height difference (px) between layout and visual viewport above which the keyboard is considered open. */
const KEYBOARD_THRESHOLD_PX = 150;

/** Keyboard height assumed (share of the screen height) until a real keyboard has been measured. */
const DEFAULT_KEYBOARD_RATIO = 0.45;

/** Space (px) kept between the dialog and the keyboard / screen edges. */
const EDGE_GAP_PX = 16;

/** Last keyboard height measured, reused so the next dialog is sized before the keyboard opens. */
let lastKeyboardHeight: number | null = null;

function subscribeTablet(onChange: () => void) {
  const query = window.matchMedia(TABLET_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Tablet layout for dialogs: from the first render, the dialog is anchored to the top,
 * uses the full width and never grows past the area the on-screen keyboard leaves visible,
 * so opening the keyboard does not cover or move it.
 *
 * @param active Whether the dialog is open
 * @returns `isTablet` to switch the content to its horizontal layout, and the popup style
 */
export function useTabletModalLayout(active: boolean): {
  isTablet: boolean;
  style: CSSProperties | undefined;
} {
  const isTablet = useSyncExternalStore(
    subscribeTablet,
    () => window.matchMedia(TABLET_QUERY).matches,
    () => false
  );
  const [visibleHeight, setVisibleHeight] = useState<number | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !isTablet || !viewport) return;

    const update = () => {
      const keyboardHeight = window.innerHeight - viewport.height;
      if (keyboardHeight > KEYBOARD_THRESHOLD_PX) lastKeyboardHeight = keyboardHeight;
      setVisibleHeight(viewport.height);
    };

    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      setVisibleHeight(null);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [active, isTablet]);

  if (!active || !isTablet) return { isTablet, style: undefined };

  const screenHeight = window.innerHeight;
  const keyboardHeight = lastKeyboardHeight ?? screenHeight * DEFAULT_KEYBOARD_RATIO;
  const availableHeight = Math.min(visibleHeight ?? screenHeight, screenHeight - keyboardHeight);
  const offsetTop = window.visualViewport?.offsetTop ?? 0;

  return {
    isTablet,
    style: {
      top: `${offsetTop + EDGE_GAP_PX}px`,
      translate: "-50% 0",
      maxHeight: `${availableHeight - EDGE_GAP_PX * 2}px`,
      maxWidth: `calc(100% - ${EDGE_GAP_PX * 2}px)`,
    },
  };
}
