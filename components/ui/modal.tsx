"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import { useTabletModalLayout } from "@/lib/hooks/useTabletModalLayout";

/**
 * Layout classes for modal forms: stacked by default; on tablets (see useTabletModalLayout)
 * the inputs sit side by side above the details, with the action buttons in a column on the right.
 * Structure: form > [main > [inputs, details], actions].
 */
export const modalSplitLayout = {
  form: "flex flex-col gap-5 tablet:grid tablet:grid-cols-[minmax(0,1fr)_14rem] tablet:gap-6",
  main: "flex flex-col gap-5 min-w-0 tablet:gap-3",
  inputs: "flex flex-col gap-5 tablet:grid tablet:grid-cols-2 tablet:gap-4 tablet:items-start",
  details: "flex flex-col gap-4 min-w-0 tablet:gap-2",
  // Primary action rendered last in the DOM: on top once reversed in the column
  actions: "pt-4 flex items-center justify-end gap-3 border-t border-[var(--color-border)] tablet:flex-col-reverse tablet:justify-center tablet:items-stretch tablet:pt-0 tablet:pl-6 tablet:border-t-0 tablet:border-l",
};

export interface ModalAlert {
  message: React.ReactNode;
  tone: "danger" | "warning";
}

const alertToneClass: Record<ModalAlert["tone"], string> = {
  danger: "bg-danger-subtle border-danger-border text-danger-text",
  warning: "bg-warning-subtle border-warning-border text-warning-text",
};

/**
 * Single message zone of a modal form: shows the alert in place of the details when
 * there is one. Both share the same grid cell, so the zone keeps the details' height.
 */
export function ModalDetails({
  alert,
  children,
}: {
  alert: ModalAlert | null;
  children: React.ReactNode;
}) {
  return (
    <div className="grid *:col-start-1 *:row-start-1">
      <div className={alert ? "invisible" : undefined} aria-hidden={alert ? true : undefined}>
        {children}
      </div>
      {alert && (
        <div
          role="alert"
          className={`flex items-center gap-2 p-4 rounded-[var(--radius-card,16px)] border text-sm font-medium ${alertToneClass[alert.tone]}`}
        >
          <span className="shrink-0">⚠️</span>
          <span>{alert.message}</span>
        </div>
      )}
    </div>
  );
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: React.ReactNode;
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
  const maxWidthClass = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
  }[maxWidth];
  const tabletLayout = useTabletModalLayout(isOpen);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={`${maxWidthClass} p-0 gap-0 overflow-hidden`}
        showCloseButton={true}
        style={tabletLayout.style}
        data-layout={tabletLayout.isTablet ? "tablet" : undefined}
      >
        {(title || icon) && (
          <DialogHeader className="px-6 py-5 border-b border-[var(--color-border)] tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-x-4 tablet:gap-y-1 tablet:py-2 tablet:pr-14">
            <DialogTitle className="flex items-center gap-2 pr-8 tablet:pr-0 tablet:text-base">
              {icon && <span className="text-xl shrink-0 tablet:text-base">{icon}</span>}
              <span>{title}</span>
            </DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <div className="overflow-y-auto overflow-x-hidden flex-1 tablet:overflow-hidden">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
