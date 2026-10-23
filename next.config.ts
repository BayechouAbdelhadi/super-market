import type { NextConfig } from "next";
import { PRODUCTION_APP_URL, REDIRECTED_HOSTS } from "./lib/utils/app-url";

const isDev = process.env.NODE_ENV !== "production";

/** Public files of the Supabase bucket (news photos), as an images.remotePatterns entry. */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
const supabasePublicStorage = supabaseUrl ? new URL(`${supabaseUrl}/storage/v1/object/public/**`) : null;

/**
 * Content Security Policy, built from what the pages actually load:
 * - scripts: only this origin (Next.js inline bootstrap needs 'unsafe-inline'; no third-party scripts);
 * - images: this origin, data:/blob: (QR codes, flyer export) and any https source (Supabase storage,
 *   Unsplash, admin-provided campaign images);
 * - workers: blob: for the loyalty card QR scanner (qr-scanner builds its decoder worker from a blob);
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
  "worker-src 'self' blob:",
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
  // Camera: same origin only, for the loyalty card scanner at the checkout
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  // Ignored by browsers on plain-http responses (local / LAN development)
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // pg-boss runs in the server process (instrumentation.ts): load it from node_modules, not bundled
  serverExternalPackages: ["pg-boss"],
  // LAN origins allowed to reach `next dev` (comma-separated), e.g. ALLOWED_DEV_ORIGINS=192.168.1.69
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "192.168.1.69").split(",").map((o) => o.trim()).filter(Boolean),
  poweredByHeader: false,
  images: {
    // 90: the home hero photo, where compression artifacts show at full width
    qualities: [75, 90],
    // News photos live in Supabase Storage: let the optimizer resize them for each screen
    remotePatterns: supabasePublicStorage ? [supabasePublicStorage] : [],
  },
  // One canonical URL per page; old paths keep working (query strings are passed through)
  async redirects() {
    return [
      // One canonical domain: www and the .fr domain move permanently to supermarketcalais.com, same path
      ...REDIRECTED_HOSTS.map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host.replaceAll(".", "\\.") }],
        destination: `${PRODUCTION_APP_URL}/:path*`,
        permanent: true,
      })),
      { source: "/privacy", destination: "/politique-de-confidentialite", permanent: true },
      { source: "/confidentialite", destination: "/politique-de-confidentialite", permanent: true },
      { source: "/loyalty", destination: "/cashier/pos", permanent: true },
      { source: "/cashier/loyalty", destination: "/cashier/pos", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
