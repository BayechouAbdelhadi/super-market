import { useState, useEffect, useRef } from "react";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

/**
 * Hook to debounce any rapidly changing value.
 * Commonly used for search inputs to prevent overwhelming external APIs.
 *
 * @param value The value to debounce
 * @param delay The delay in milliseconds (defaults to LOYALTY_CONFIG.search.debounceMs)
 * @returns The debounced value
 */
export function useDebounce<T>(
  value: T,
  delay: number = LOYALTY_CONFIG.search?.debounceMs ?? 300
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
