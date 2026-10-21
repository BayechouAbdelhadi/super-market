import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { parsePageParams } from "@/lib/loyalty/pagination";
import { ACCEPTED_IMAGE_LABEL, NEWS_CONFIG } from "@/lib/news/config";
import { CreateNewsPostSchema } from "@/lib/news/validation";
import { createNewsPost, listNews } from "@/lib/news/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const pageParams = parsePageParams(req.nextUrl.searchParams, NEWS_CONFIG.listPageSize, NEWS_CONFIG.listMaxPageSize) ?? {
    page: 1,
    limit: NEWS_CONFIG.listPageSize,
    offset: 0,
  };

  try {
    const { items, total } = await listNews(pageParams.offset, pageParams.limit);
    return NextResponse.json({ posts: items, total, page: pageParams.page, limit: pageParams.limit });
  } catch (err) {
    console.error("[GET /api/admin/news] Error:", err);
    return NextResponse.json(
      { error: "FETCH_FAILED", message: "Impossible de récupérer les actualités." },
      { status: 500 }
    );
  }
}

/** Multipart form: `body` (text) and `images` (0 to NEWS_CONFIG.maxImages files). */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Formulaire de publication invalide." },
      { status: 400 }
    );
  }

  const body = form.get("body");
  const parsed = CreateNewsPostSchema.safeParse({
    body: typeof body === "string" ? body : "",
    images: form.getAll("images"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: issue?.message || "Publication invalide.", field: issue?.path[0] },
      { status: 400 }
    );
  }

  try {
    const images = await Promise.all(
      parsed.data.images.map(async (file) => ({ bytes: new Uint8Array(await file.arrayBuffer()) }))
    );
    const result = await createNewsPost({ body: parsed.data.body, images }, auth.user.email ?? null);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "INVALID_IMAGE",
          message: `L'image n°${result.index + 1} est illisible ou n'est pas une image ${ACCEPTED_IMAGE_LABEL}.`,
          field: "images",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: true, post: result.post, message: "Actualité publiée sur le site." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/news] Error:", err);
    return NextResponse.json(
      { error: "CREATION_FAILED", message: "Erreur lors de la publication de l'actualité." },
      { status: 500 }
    );
  }
}
