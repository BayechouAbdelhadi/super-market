"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
  onClear?: () => void;
  loading?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onDebouncedChange,
  debounceMs = LOYALTY_CONFIG.search?.debounceMs ?? 300,
  onClear,
  loading = false,
  placeholder = "Rechercher...",
  className = "",
  ...props
}: SearchInputProps) {
  // Local state ensures instant typing without keyboard stutter or lag
  const [localValue, setLocalValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync localValue when parent value changes externally (e.g. reset/cleared from outside)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setLocalValue(nextVal);
    onChange?.(nextVal);

    if (onDebouncedChange) {
      setIsDebouncing(true);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setIsDebouncing(false);
        onDebouncedChange(nextVal);
      }, debounceMs);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Flush debounce immediately on Enter
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setIsDebouncing(false);
      onDebouncedChange?.(localValue);
    } else if (e.key === "Escape") {
      handleClear();
    }
    props.onKeyDown?.(e);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsDebouncing(false);
    setLocalValue("");
    onChange?.("");
    onDebouncedChange?.("");
    onClear?.();
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const isSpinning = loading || isDebouncing;

  return (
    <div className={`relative w-full group ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-5 sm:pl-6 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors duration-200">
        <svg
          className="w-5 h-5 sm:w-5.5 sm:h-5.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full min-h-[48px] sm:min-h-[56px] pl-12 sm:pl-14 pr-12 py-3 text-sm sm:text-base font-medium rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] shadow-[0_2px_6px_0_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.06)] hover:border-[var(--color-border-hover)] focus:shadow-[0_6px_20px_0_rgba(0,0,0,0.08)] transition-all duration-200"
        {...props}
      />

      {isSpinning ? (
        <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : localValue ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-5 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          title="Effacer la recherche"
          aria-label="Effacer la recherche"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : (
        <div className="hidden sm:flex absolute inset-y-0 right-0 pr-5 items-center pointer-events-none">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
            ⌘K
          </span>
        </div>
      )}
    </div>
  );
}
