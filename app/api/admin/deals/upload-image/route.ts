import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { ACCEPTED_IMAGE_LABEL } from "@/lib/media/config";
import { uploadCampaignImage } from "@/lib/marketing/campaign-images";
import { CampaignImageUploadSchema } from "@/lib/marketing/validation";

export const dynamic = "force-dynamic";

/**
 * Banner image of a campaign email. Multipart form: `file`, and `campaignId` (uuid) once the draft has one.
 * The image is re-encoded as an email-safe JPEG and stored in the public bucket.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Formulaire d'envoi invalide." }, { status: 400 });
  }

  const campaignId = form.get("campaignId");
  const parsed = CampaignImageUploadSchema.safeParse({
    file: form.get("file"),
    campaignId: typeof campaignId === "string" && campaignId ? campaignId : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Image invalide." },
      { status: 400 }
    );
  }

  try {
    const bytes = new Uint8Array(await parsed.data.file.arrayBuffer());
    const result = await uploadCampaignImage(bytes, parsed.data.campaignId);
    if (!result.ok) {
      return NextResponse.json(
        { error: "INVALID_IMAGE", message: `Ce fichier est illisible ou n'est pas une image ${ACCEPTED_IMAGE_LABEL}.` },
        { status: 400 }
      );
    }
    // `fullUrl` kept for the editor: the stored URL is already absolute
    return NextResponse.json({ success: true, url: result.url, fullUrl: result.url, path: result.path });
  } catch (err) {
    console.error("[POST /api/admin/deals/upload-image] Error:", err);
    return NextResponse.json(
      { error: "UPLOAD_FAILED", message: "Échec de l'envoi de l'image. Réessayez dans quelques instants." },
      { status: 500 }
    );
  }
}
