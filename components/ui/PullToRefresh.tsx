"use client";

import React, { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useIsTablet } from "@/lib/hooks/useIsTablet";

/** Pull distance (px) past which releasing reloads the app. */
const PULL_THRESHOLD_PX = 80;

/** Maximum distance (px) the content follows the finger. */
const PULL_MAX_PX = 120;

/** Finger travel is damped so the content moves slower than the finger. */
const PULL_DAMPING = 0.5;

/** Downward travel (px) before the gesture counts as a pull: taps and small drags stay untouched. */
const PULL_START_PX = 12;

interface PullToRefreshProps {
  /** Off: renders a plain scroll container */
  enabled: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Whether an element between the touch target and the container can still scroll up. */
function hasScrolledAncestor(target: EventTarget | null, container: HTMLElement): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== container) {
    if (el.scrollTop > 0) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Scroll container that reloads the whole app when pulled down from the top, on tablets only.
 * Needed because the app shell blocks the browser's own pull-to-refresh (html/body overflow hidden).
 * Scrolling is left alone: the gesture only starts on a vertical downward drag with everything
 * under the finger already at the top, and the pull is drawn without re-rendering the page.
 */
export function PullToRefresh({ enabled, className, children }: PullToRefreshProps) {
  const isTablet = useIsTablet();
  const active = enabled && isTablet;
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<SVGSVGElement>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    const indicator = indicatorRef.current;
    if (!active || !container || !content || !indicator) return;

    let start: { x: number; y: number } | null = null;
    let pulling = false;
    let distance = 0;

    const draw = (value: number, animate: boolean) => {
      distance = value;
      const transition = animate ? "transform 200ms ease" : "none";
      content.style.transition = transition;
      content.style.transform = value > 0 ? `translateY(${value}px)` : "";
      indicator.style.transition = transition;
      indicator.style.transform = `translate(-50%, ${value - 48}px)`;
      indicator.style.visibility = value > 0 ? "visible" : "hidden";
      const progress = Math.min(value / PULL_THRESHOLD_PX, 1);
      if (iconRef.current) {
        iconRef.current.style.transform = `rotate(${progress * 270}deg)`;
        iconRef.current.style.opacity = String(0.4 + progress * 0.6);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      pulling = false;
      start =
        e.touches.length === 1 && container.scrollTop <= 0 && !hasScrolledAncestor(e.target, container)
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!start) return;
      const dx = e.touches[0].clientX - start.x;
      const dy = e.touches[0].clientY - start.y;

      if (!pulling) {
        if (Math.abs(dy) < PULL_START_PX && Math.abs(dx) < PULL_START_PX) return;
        // Upward or sideways first move: a normal scroll, leave this touch alone
        if (dy <= 0 || Math.abs(dx) > dy || container.scrollTop > 0) {
          start = null;
          return;
        }
        pulling = true;
      }

      e.preventDefault();
      draw(Math.min(Math.max(dy - PULL_START_PX, 0) * PULL_DAMPING, PULL_MAX_PX), false);
    };

    const onTouchEnd = () => {
      start = null;
      if (!pulling) return;
      pulling = false;
      if (distance >= PULL_THRESHOLD_PX) {
        draw(PULL_THRESHOLD_PX, true);
        setRefreshing(true);
        window.location.reload();
      } else {
        draw(0, true);
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", onTouchEnd);
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [active]);

  return (
    <main ref={containerRef} className={`relative ${className ?? ""}`}>
      {active && (
        <div
          ref={indicatorRef}
          className="absolute left-1/2 top-0 z-30 pointer-events-none invisible"
          role="status"
          aria-label={refreshing ? "Actualisation" : undefined}
        >
          <div className="h-10 w-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] flex items-center justify-center text-[var(--color-primary)]">
            <RefreshCw ref={iconRef} className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          </div>
        </div>
      )}
      <div ref={contentRef}>{children}</div>
    </main>
  );
}
