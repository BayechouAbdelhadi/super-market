import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 * The CSP only restricts framing, plugins, <base> and form targets: it does
 * not restrict scripts/styles/images, so it cannot break existing pages.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
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
