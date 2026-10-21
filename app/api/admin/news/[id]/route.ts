import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { ACCEPTED_IMAGE_LABEL, NEWS_CONFIG } from "@/lib/news/config";
import { NewsPostIdSchema, UpdateNewsPostContentSchema, UpdateNewsPostSchema } from "@/lib/news/validation";
import { deleteNewsPost, setNewsPostPublished, updateNewsPost } from "@/lib/news/service";
import { readFiles } from "@/lib/utils/form-files";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function validationError(message: string) {
  return NextResponse.json({ error: "VALIDATION_ERROR", message }, { status: 400 });
}

const NOT_FOUND = { error: "NOT_FOUND", message: "Actualité introuvable ou déjà supprimée." };

/**
 * Edits the text and photos. Multipart form: `body`, `images` (new files) and `layout` (JSON: every photo of the
 * post in display order, kept ones by storage path and new ones by file position, each with its description).
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const id = NewsPostIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error.issues[0]?.message || "Identifiant de publication invalide.");

  const form = await req.formData().catch(() => null);
  if (!form) return validationError("Formulaire de modification invalide.");

  const body = form.get("body");
  const layout = form.get("layout");
  const parsed = UpdateNewsPostContentSchema.safeParse({
    body: typeof body === "string" ? body : "",
    images: form.getAll("images"),
    layout: typeof layout === "string" ? layout : "",
  });
  if (!parsed.success) return validationError(parsed.error.issues[0]?.message || "Modification invalide.");

  try {
    const files = await readFiles(parsed.data.images);
    const result = await updateNewsPost(id.data, {
      body: parsed.data.body,
      photos: parsed.data.layout.map((item) =>
        item.kind === "existing"
          ? { kind: "existing", path: item.path, alt: item.alt }
          : { kind: "new", upload: { bytes: files[item.file], alt: item.alt } }
      ),
    });
    if (result.ok) return NextResponse.json({ success: true, post: result.post, message: "Actualité modifiée." });

    switch (result.reason) {
      case "NOT_FOUND":
        return NextResponse.json(NOT_FOUND, { status: 404 });
      case "INVALID_IMAGE":
        return validationError(
          `La nouvelle image n°${result.index + 1} est illisible ou n'est pas une image ${ACCEPTED_IMAGE_LABEL}.`
        );
      case "TOO_MANY_IMAGES":
        return validationError(`${NEWS_CONFIG.maxImages} images au maximum par publication.`);
      case "EMPTY":
        return validationError("Ajoutez un texte ou au moins une image.");
    }
  } catch (err) {
    console.error("[PUT /api/admin/news/[id]] Error:", err);
    return NextResponse.json(
      { error: "UPDATE_FAILED", message: "Erreur lors de la modification de l'actualité." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const id = NewsPostIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error.issues[0]?.message || "Identifiant de publication invalide.");

  const parsed = UpdateNewsPostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error.issues[0]?.message || "Modification invalide.");

  try {
    const post = await setNewsPostPublished(id.data, parsed.data.isPublished);
    if (!post) return NextResponse.json(NOT_FOUND, { status: 404 });
    return NextResponse.json({
      success: true,
      post,
      message: post.isPublished ? "Actualité affichée sur le site." : "Actualité masquée du site.",
    });
  } catch (err) {
    console.error("[PATCH /api/admin/news/[id]] Error:", err);
    return NextResponse.json(
      { error: "UPDATE_FAILED", message: "Erreur lors de la modification de l'actualité." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const id = NewsPostIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error.issues[0]?.message || "Identifiant de publication invalide.");

  try {
    const deleted = await deleteNewsPost(id.data);
    if (!deleted) return NextResponse.json(NOT_FOUND, { status: 404 });
    return NextResponse.json({ success: true, message: "Actualité supprimée." });
  } catch (err) {
    console.error("[DELETE /api/admin/news/[id]] Error:", err);
    return NextResponse.json(
      { error: "DELETE_FAILED", message: "Erreur lors de la suppression de l'actualité." },
      { status: 500 }
    );
  }
}
