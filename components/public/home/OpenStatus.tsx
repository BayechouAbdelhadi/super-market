"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";
import { getOpeningStatus, type OpeningStatus } from "@/lib/store/opening-hours";
import { OPENING_HOURS, STORE_TIME_ZONE } from "@/lib/store/config";

const REFRESH_MS = 60_000;

interface OpenStatusProps {
  /** Status computed on the server for this request, so the first paint is already right */
  initial: OpeningStatus;
  /** "compact": dot + "Ouvert"; "full": dot + "Ouvert · Ferme à 19h30" */
  variant?: "compact" | "full";
  className?: string;
}

/** Live open/closed pill, refreshed every minute in store-local time. */
export function OpenStatus({ initial, variant = "full", className }: OpenStatusProps) {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    const refresh = () => setStatus(getOpeningStatus(new Date(), OPENING_HOURS, STORE_TIME_ZONE));
    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
        status.isOpen
          ? "bg-success-subtle text-success-text border-success-border"
          : "bg-warning-subtle text-warning-text border-warning-border",
        className
      )}
    >
      <span aria-hidden className={cn("h-2 w-2 rounded-full", status.isOpen ? "bg-success" : "bg-warning")} />
      <span className="font-semibold">{status.label}</span>
      {variant === "full" && (
        <>
          <span aria-hidden className="opacity-50">·</span>
          <span>{status.detail}</span>
        </>
      )}
    </span>
  );
}
