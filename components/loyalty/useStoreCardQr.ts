"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { encodeLoyaltyCardCode } from "@/lib/loyalty/card-code";
import { QR_COLORS } from "@/components/admin/invite/qr-colors";

/** Data URL of the store card QR code, generated once `enabled` turns true; empty until ready. */
export function useStoreCardQr(customerId: string, enabled: boolean): string {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!enabled || qrDataUrl) return;
    QRCode.toDataURL(encodeLoyaltyCardCode(customerId), {
      width: 640,
      margin: 2,
      color: QR_COLORS,
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("Failed to generate store card QR code:", err));
  }, [enabled, qrDataUrl, customerId]);

  return qrDataUrl;
}
