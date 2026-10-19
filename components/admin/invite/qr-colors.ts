/**
 * QR code module colors. Fixed on purpose: a QR code needs dark-on-light contrast to scan and
 * print reliably, whatever the viewer's theme.
 */
export const QR_COLORS = {
  dark: "#0f172a",
  light: "#ffffff",
} as const;
