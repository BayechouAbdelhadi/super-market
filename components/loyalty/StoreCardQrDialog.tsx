"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreCardQr } from "./useStoreCardQr";

interface StoreCardQrDialogProps {
  customerId: string;
  fullName: string;
  /** Element that opens the dialog (button of the home page, center of the bottom nav) */
  trigger: React.ReactElement;
}

/**
 * Full-screen store card QR code, shown at the checkout to identify the customer.
 * Fixed light background: the code needs dark-on-light contrast whatever the theme.
 */
export function StoreCardQrDialog({ customerId, fullName, trigger }: StoreCardQrDialogProps) {
  const [open, setOpen] = useState(false);
  const qrDataUrl = useStoreCardQr(customerId, open);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger render={trigger} />
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup className="scheme-light fixed inset-0 z-50 flex flex-col bg-[var(--color-surface)] text-[var(--color-text)] outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
          <div className="flex shrink-0 justify-end p-4" style={{ paddingTop: "max(1rem, env(safe-area-inset-top, 0px))" }}>
            <DialogPrimitive.Close render={<Button variant="ghost" size="icon" aria-label="Fermer" />}>
              <X className="size-6" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 pb-12">
            <div className="space-y-1 text-center">
              <DialogPrimitive.Title className="text-2xl font-bold tracking-tight">Carte du magasin</DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-base text-[var(--color-text-muted)]">
                Présentez ce code au caissier
              </DialogPrimitive.Description>
            </div>
            <div className="aspect-square w-full max-w-sm">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt="QR code de la carte du magasin"
                  width={384}
                  height={384}
                  unoptimized
                  className="h-full w-full"
                />
              ) : (
                <div className="h-full w-full animate-pulse rounded-[var(--radius-card,16px)] bg-[var(--color-surface-hover)]" />
              )}
            </div>
            <p className="max-w-full truncate text-lg font-semibold">{fullName}</p>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
