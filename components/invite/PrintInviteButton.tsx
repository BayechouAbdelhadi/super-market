"use client";

import React, { useState } from "react";
import { QrCode } from "lucide-react";
import { PrintInviteQrModal } from "@/components/admin/invite/PrintInviteQrModal";

interface PrintInviteButtonProps {
  className?: string;
  variant?: "badge" | "button" | "ghost";
}

export function PrintInviteButton({
  className = "",
  variant = "badge",
}: PrintInviteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "ghost") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer ${className}`}
        >
          <QrCode className="w-3.5 h-3.5 text-rose-500" />
          <span>Affiche &amp; QR Code</span>
        </button>

        <PrintInviteQrModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all active:scale-[0.98] cursor-pointer ${className}`}
      >
        <span className="p-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
          <QrCode className="w-3.5 h-3.5" />
        </span>
        <span>Affiche Magasin &amp; QR Code</span>
      </button>

      <PrintInviteQrModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
