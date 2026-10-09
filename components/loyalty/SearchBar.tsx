import React from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  query: string;
  onChange?: (query: string) => void;
  onDebouncedChange?: (query: string) => void;
  debounceMs?: number;
  onOpenNewCustomer: () => void;
  loading?: boolean;
}

export function SearchBar({
  query,
  onChange,
  onDebouncedChange,
  debounceMs,
  onOpenNewCustomer,
  loading = false,
}: SearchBarProps) {
  return (
    <div className="w-full">
      {/* Central action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={onChange}
            onDebouncedChange={onDebouncedChange}
            debounceMs={debounceMs}
            loading={loading}
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
    </div>
  );
}
