import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppOrigin } from "@/lib/utils/app-url";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const EXTENSIONS_BY_MIME: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/jpg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
};

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "NO_FILE", message: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    // Validate mime type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          error: "INVALID_TYPE",
          message: "Format d'image non supporté. Formats acceptés : JPG, PNG, WEBP, GIF.",
        },
        { status: 400 }
      );
    }

    // Limit size to 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: "FILE_TOO_LARGE",
          message: "L'image ne doit pas dépasser 5 Mo.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Campaign ID from form data or generated
    // SECURITY: campaignId becomes a path segment — restrict it to safe characters (no "../")
    const rawCampaignId =
      (formData.get("campaignId") as string) ||
      (formData.get("compaignId") as string) ||
      "";
    const campaignId = SAFE_ID_PATTERN.test(rawCampaignId) ? rawCampaignId : crypto.randomUUID();

    // Folder structure requested: compaigns/${compaignId}/img-timestamps...png
    const timestamp = Date.now();
    // SECURITY: the extension must match the validated image type (never .html, .svg, ...)
    const mimeType = file.type.toLowerCase();
    const rawExt = path.extname(file.name).slice(1).toLowerCase();
    const ext = EXTENSIONS_BY_MIME[mimeType].includes(rawExt) ? rawExt : EXTENSIONS_BY_MIME[mimeType][0];
    const sanitizedName = file.name
      .replace(/\.[^.]*$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 20);
    const fileName = `img-${timestamp}-${sanitizedName}.${ext}`;
    const storagePath = `compaigns/${campaignId}/${fileName}`;

    // 1. Primary: Upload to Supabase Storage bucket 'super-market'
    try {
      const supabase = createAdminClient();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("super-market")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("super-market")
          .getPublicUrl(storagePath);

        const publicUrl = publicUrlData?.publicUrl;
        if (publicUrl) {
          return NextResponse.json({
            success: true,
            storage: "supabase",
            bucket: "super-market",
            path: storagePath,
            url: publicUrl,
            fullUrl: publicUrl,
            fileName,
          });
        }
      } else if (uploadError) {
        console.warn(
          "[Upload Image] Supabase Storage upload failed, attempting local fallback:",
          uploadError.message || uploadError
        );
      }
    } catch (sbErr) {
      console.warn(
        "[Upload Image] Supabase client error, attempting local fallback:",
        sbErr instanceof Error ? sbErr.message : sbErr
      );
    }

    // 2. Resilient fallback: Local server storage
    const localDir = path.join(process.cwd(), "public", "uploads", "deals", campaignId);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    const localFilePath = path.join(localDir, fileName);
    fs.writeFileSync(localFilePath, buffer);

    const relativeUrl = `/uploads/deals/${campaignId}/${fileName}`;
    // SECURITY: never derive emailed URLs from the request Host header
    const origin = getAppOrigin(req.headers);
    const fullUrl = `${origin}${relativeUrl}`;

    return NextResponse.json({
      success: true,
      storage: "local",
      path: relativeUrl,
      url: relativeUrl,
      fullUrl,
      fileName,
    });
  } catch (err) {
    console.error("[POST /api/admin/deals/upload-image] Error:", err);
    return NextResponse.json(
      { error: "UPLOAD_FAILED", message: "Échec du téléchargement de l'image." },
      { status: 500 }
    );
  }
}
