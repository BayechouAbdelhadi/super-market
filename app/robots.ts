import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/politique-de-confidentialite",
          "/unsubscribe",
          "/actualites",
        ],
        disallow: ["/admin/", "/cashier/", "/api/"],
      },
      {
        userAgent: ["facebookexternalhit", "Facebot", "meta-externalagent"],
        allow: "/",
      },
    ],
  };
}
