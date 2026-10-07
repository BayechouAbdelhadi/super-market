import React from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
  onOpenNewCustomer: () => void;
}

export function SearchBar({ query, onChange, onOpenNewCustomer }: SearchBarProps) {
  const quickQueries = [
    { label: "Ahmed", query: "Ahmed" },
    { label: "Bayechou", query: "Bayechou" },
    { label: "06 12 34 56 78", query: "06 12 34 56 78" },
    { label: "Benali", query: "Benali" },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Central action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={onChange}
            placeholder="Nom, prénom, téléphone ou email..."
            autoFocus
          />
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onOpenNewCustomer}
          className="shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nouveau client</span>
        </Button>
      </div>

      {/* Quick shortcuts */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <span className="font-medium">Raccourcis caisse :</span>
        {quickQueries.map((item) => (
          <button
            key={item.label}
            onClick={() => onChange(item.query)}
            type="button"
            className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] font-mono text-[11px] transition-colors cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
