"use client";

import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: string;
  maxWidth?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  maxWidth = "md",
  children,
}: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-[var(--color-surface)] flex flex-col border border-[var(--color-border)] rounded-[var(--radius-dialog,20px)] w-full ${maxWidthClasses} shadow-xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || icon) && (
          <div className="px-6 py-5 border-b border-[var(--color-border)] flex-shrink-0 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                {icon && <span className="text-xl">{icon}</span>}
                <span>{title}</span>
              </h2>
              {description && (
                <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
              )}
            </div>

            <button
              onClick={onClose}
              type="button"
              className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 p-1">
          {children}
        </div>
      </div>
    </div>
  );
}
