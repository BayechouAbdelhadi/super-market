"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { AlertTriangle, HelpCircle, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export type ConfirmTone = "danger" | "default";

export interface ConfirmOptions {
  title: string;
  /** What will happen, in one or two sentences. */
  description?: ReactNode;
  /** Defaults to "Confirmer" ("Supprimer" reads better for a delete: pass it). */
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" (default) for irreversible actions: red button, warning icon. */
  tone?: ConfirmTone;
  /** Replaces the tone's icon. */
  icon?: LucideIcon;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const TONES: Record<ConfirmTone, { icon: LucideIcon; iconClass: string; button: "destructive" | "primary" }> = {
  danger: { icon: AlertTriangle, iconClass: "bg-danger-subtle text-danger-text", button: "destructive" },
  default: { icon: HelpCircle, iconClass: "bg-surface-hover text-text", button: "primary" },
};

/**
 * Confirmation before a dangerous action, replacing `window.confirm`. Built on the Base UI AlertDialog
 * (role="alertdialog", focus trap, Escape cancels, a click outside does not dismiss). Focus starts on
 * "Annuler" so a stray Enter never confirms. Usually driven by `useConfirm`.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "danger",
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const style = TONES[tone];
  const Icon = icon ?? style.icon;

  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 isolate z-50 bg-overlay duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <AlertDialog.Popup
          initialFocus={cancelRef}
          className="fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-dialog,20px)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-text)] shadow-xl outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 sm:max-w-md"
        >
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", style.iconClass)}>
              <Icon aria-hidden className="size-6" />
            </span>
            <div className="min-w-0 space-y-2">
              <AlertDialog.Title className="text-lg font-bold tracking-tight text-[var(--color-text)]">{title}</AlertDialog.Title>
              {description && (
                <AlertDialog.Description className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {description}
                </AlertDialog.Description>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={style.button} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/**
 * Promise-based confirmation, used like `window.confirm`:
 *
 *   const [confirm, confirmDialog] = useConfirm();
 *   if (!(await confirm({ title: "Supprimer ?", confirmLabel: "Supprimer" }))) return;
 *   …
 *   return <>{…}{confirmDialog}</>;
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  // Kept after closing so the text does not vanish during the fade-out
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" });
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false);
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setOpen(false);
  };

  const dialog = (
    <ConfirmDialog {...options} open={open} onConfirm={() => settle(true)} onCancel={() => settle(false)} />
  );

  return [confirm, dialog] as const;
}
