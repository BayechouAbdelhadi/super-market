"use client";

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { parseLoyaltyCardCode } from "@/lib/loyalty/card-code";
import { playScanBeep } from "@/lib/loyalty/scan-beep";

interface CardScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerScanned: (customerId: string) => void;
}

/** Scans a customer's loyalty card QR code with the device camera (back camera first). */
export function CardScannerModal({ isOpen, onClose, onCustomerScanned }: CardScannerModalProps) {
  // Callback ref: the video mounts with the dialog portal, after the open render
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  // Latest callback, read by the scanner without restarting the camera on each render
  const onScannedRef = useRef(onCustomerScanned);
  useEffect(() => {
    onScannedRef.current = onCustomerScanned;
  });

  useEffect(() => {
    if (!isOpen || !video) return;

    let cancelled = false;
    let scanner: import("qr-scanner").default | null = null;

    // Loaded on demand: the scanner and its worker only ship when the camera is used
    import("qr-scanner").then(async ({ default: QrScanner }) => {
      if (cancelled) return;
      scanner = new QrScanner(
        video,
        (result) => {
          const customerId = parseLoyaltyCardCode(result.data);
          if (!customerId) {
            setErrorMsg("Carte non reconnue : ce code n'est pas une carte de fidélité.");
            return;
          }
          scanner?.stop();
          playScanBeep();
          onScannedRef.current(customerId);
        },
        { preferredCamera: "environment", highlightScanRegion: true, returnDetailedScanResult: true }
      );
      try {
        await scanner.start();
      } catch {
        if (!cancelled) {
          setErrorMsg("Caméra inaccessible : autorisez l'accès à la caméra dans le navigateur.");
        }
      }
    });

    return () => {
      cancelled = true;
      scanner?.destroy();
      setErrorMsg("");
    };
  }, [isOpen, video]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scanner une carte"
      description="Placez le QR code de la carte du client devant la caméra."
      maxWidth="full"
    >
      <div className="p-4 h-full flex flex-col gap-3">
        <div className="relative w-full flex-1 min-h-0 rounded-[var(--radius-card,16px)] overflow-hidden bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
          <video ref={setVideo} className="w-full h-full object-cover" muted playsInline />
        </div>
        {errorMsg && (
          <p role="alert" className="text-sm font-medium text-danger-text">
            {errorMsg}
          </p>
        )}
      </div>
    </Modal>
  );
}
