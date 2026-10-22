import { ADMIN_MANIFEST } from "@/lib/seo/manifests";

/** Manifest of the installable admin app (linked from app/admin/layout.tsx only). Public: it holds no data. */
export function GET() {
  return Response.json(ADMIN_MANIFEST, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
