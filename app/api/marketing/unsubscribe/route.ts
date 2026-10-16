import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  unsubscribeCustomerEmail,
  resubscribeCustomerEmail,
  isCustomerEmailUnsubscribed,
} from "@/lib/marketing/service";

const UnsubscribeBodySchema = z.object({
  email: z.string().email("Format d'adresse e-mail invalide"),
  reason: z.string().max(500).optional(),
  action: z.enum(["unsubscribe", "resubscribe", "status"]).optional().default("unsubscribe"),
});

/**
 * Helper to extract email from query params or base64 token
 */
function extractEmailFromParams(searchParams: URLSearchParams): string | null {
  const directEmail = searchParams.get("email");
  if (directEmail && directEmail.includes("@")) {
    return directEmail.trim().toLowerCase();
  }

  const token = searchParams.get("token");
  if (token) {
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf-8");
      if (decoded.includes("@")) {
        return decoded.trim().toLowerCase();
      }
    } catch {
      // invalid token
    }
  }

  return null;
}

/**
 * GET /api/marketing/unsubscribe?email=...
 * Supports one-click browser links from emails or status checks
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const email = extractEmailFromParams(searchParams);
  const action = searchParams.get("action") || "unsubscribe";
  const wantsJson =
    searchParams.get("format") === "json" ||
    req.headers.get("accept")?.includes("application/json") ||
    !req.headers.get("accept")?.includes("text/html");

  if (!email) {
    if (wantsJson) {
      return NextResponse.json(
        { error: "Paramètre email manquant ou invalide" },
        { status: 400 }
      );
    }
    const redirectUrl = new URL("/unsubscribe?error=missing_email", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (action === "status") {
    const unsubscribed = await isCustomerEmailUnsubscribed(email);
    return NextResponse.json({ success: true, unsubscribed, email });
  }

  if (action === "resubscribe") {
    await resubscribeCustomerEmail(email);
    if (wantsJson) {
      return NextResponse.json({ success: true, resubscribed: true, email });
    }
    const redirectUrl = new URL(
      `/unsubscribe?email=${encodeURIComponent(email)}&status=resubscribed`,
      req.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Default: unsubscribe
  await unsubscribeCustomerEmail(email, "Lien e-mail en pied de page");

  if (wantsJson) {
    return NextResponse.json({ success: true, unsubscribed: true, email });
  }

  const redirectUrl = new URL(
    `/unsubscribe?email=${encodeURIComponent(email)}&status=unsubscribed`,
    req.url
  );
  return NextResponse.redirect(redirectUrl);
}

/**
 * POST /api/marketing/unsubscribe
 * Handles structured programmatic or client form unsubscribe / resubscribe requests
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UnsubscribeBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Requête invalide", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, reason, action } = parsed.data;
    const cleanEmail = email.trim().toLowerCase();

    if (action === "status") {
      const unsubscribed = await isCustomerEmailUnsubscribed(cleanEmail);
      return NextResponse.json({ success: true, unsubscribed, email: cleanEmail });
    }

    if (action === "resubscribe") {
      await resubscribeCustomerEmail(cleanEmail);
      return NextResponse.json({
        success: true,
        resubscribed: true,
        email: cleanEmail,
        message: "Votre réabonnement aux e-mails d'offres a bien été enregistré.",
      });
    }

    // Unsubscribe action
    await unsubscribeCustomerEmail(cleanEmail, reason || "Désabonnement utilisateur");
    return NextResponse.json({
      success: true,
      unsubscribed: true,
      email: cleanEmail,
      message: "Votre désabonnement a bien été pris en compte.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur interne lors du traitement" },
      { status: 500 }
    );
  }
}
