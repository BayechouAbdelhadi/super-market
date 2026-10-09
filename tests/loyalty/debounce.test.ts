import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

describe("Search debounce configuration & timing logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("declares centralized search debounce configuration", () => {
    expect(LOYALTY_CONFIG.search).toBeDefined();
    expect(LOYALTY_CONFIG.search.debounceMs).toBe(300);
    expect(LOYALTY_CONFIG.search.minQueryLength).toBe(1);
  });

  it("debounces rapid sequential keystrokes so only the last one fires", () => {
    const callback = vi.fn();

    let timeoutId: any = null;
    const triggerDebounced = (val: string) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(val);
      }, LOYALTY_CONFIG.search.debounceMs);
    };

    // Simulate fast typing "A", "Ah", "Ahm", "Ahme", "Ahmed" within 100ms intervals
    triggerDebounced("A");
    vi.advanceTimersByTime(50);
    triggerDebounced("Ah");
    vi.advanceTimersByTime(50);
    triggerDebounced("Ahm");
    vi.advanceTimersByTime(50);
    triggerDebounced("Ahme");
    vi.advanceTimersByTime(50);
    triggerDebounced("Ahmed");

    // Before debounce delay expires, callback has not fired
    expect(callback).not.toHaveBeenCalled();

    // Advance 250ms (total from last call: 250 < 300)
    vi.advanceTimersByTime(250);
    expect(callback).not.toHaveBeenCalled();

    // Advance past 300ms
    vi.advanceTimersByTime(60);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("Ahmed");
  });

  it("cancels debounce when search is cleared", () => {
    const callback = vi.fn();

    let timeoutId: any = null;
    const triggerDebounced = (val: string) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(val);
      }, LOYALTY_CONFIG.search.debounceMs);
    };

    const cancelDebounce = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    triggerDebounced("SearchTerm");
    vi.advanceTimersByTime(150);

    // User clears search or hits Escape
    cancelDebounce();

    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
  });
});
