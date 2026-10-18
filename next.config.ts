import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy, built from what the pages actually load:
 * - scripts: only this origin (Next.js inline bootstrap needs 'unsafe-inline'; no third-party scripts);
 * - images: this origin, data:/blob: (QR codes, flyer export) and any https source (Supabase storage,
 *   Unsplash, admin-provided campaign images);
 * - frames: the Google Maps embed on the home page (+ srcdoc email previews, same origin);
 * - fetch/XHR: this origin only (all data goes through the Next.js BFF).
 * Development adds what hot reload needs ('unsafe-eval', websockets).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'self' https://maps.google.com https://www.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

/**
 * Security headers applied to every response.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Ignored by browsers on plain-http responses (local / LAN development)
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // LAN origins allowed to reach `next dev` (comma-separated), e.g. ALLOWED_DEV_ORIGINS=192.168.1.69
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "192.168.1.69").split(",").map((o) => o.trim()).filter(Boolean),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
