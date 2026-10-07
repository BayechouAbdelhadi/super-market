"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";

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
  const maxWidthClass = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
  }[maxWidth];

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
      >
        {(title || icon) && (
          <DialogHeader className="px-6 py-5 border-b border-[var(--color-border)]">
            <DialogTitle className="flex items-center gap-2 pr-8">
              {icon && <span className="text-xl shrink-0">{icon}</span>}
              <span>{title}</span>
            </DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <div className="overflow-y-auto overflow-x-hidden flex-1">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
