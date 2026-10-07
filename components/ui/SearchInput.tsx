"use client";

import React from "react";
export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Rechercher...",
  className = "",
  ...props
}: SearchInputProps) {
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[48px] sm:min-h-[56px] pl-12 sm:pl-14 pr-12 py-3 text-sm sm:text-base font-medium rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] shadow-[0_2px_6px_0_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.06)] hover:border-[var(--color-border-hover)] focus:shadow-[0_6px_20px_0_rgba(0,0,0,0.08)] transition-all duration-200"
        {...props}
      />

      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
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
