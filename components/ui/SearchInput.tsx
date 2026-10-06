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
      <div className="absolute inset-y-0 left-0 pl-6 sm:pl-8 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors duration-300">
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[48px] sm:min-h-[56px] pl-12 sm:pl-14 pr-12 py-3 text-base sm:text-lg font-medium rounded-full border border-gray-200 bg-white text-[var(--color-text)] placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
        {...props}
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          title="Effacer la recherche"
          aria-label="Effacer la recherche"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
