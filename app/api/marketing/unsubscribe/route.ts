import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  unsubscribeCustomerEmail,
  resubscribeCustomerEmail,
  isCustomerEmailUnsubscribed,
} from "@/lib/marketing/service";
import { verifySignedValue } from "@/lib/email/otp-security";
import { RATE_LIMITS, getClientIp, rateLimitMessage } from "@/lib/security/rate-limit";
import { enforceRateLimits } from "@/lib/security/enforce";

async function rateLimited(req: NextRequest): Promise<NextResponse | null> {
  const limit = await enforceRateLimits([[`unsubscribe:ip:${getClientIp(req.headers)}`, RATE_LIMITS.unsubscribePerIp]]);
  return limit.allowed ? null : NextResponse.json({ error: rateLimitMessage(limit) }, { status: 429 });
}
import { UNSUBSCRIBE_SIGNATURE_PURPOSE } from "@/lib/marketing/utils";

/**
 * SECURITY: unsubscribing stays possible from any link (including links sent
 * before signatures existed — the safe direction). Re-subscribing and status
 * checks change consent / reveal customers, so they require the HMAC `sig`
 * carried by the unsubscribe link of the email itself.
 */
function hasValidSignature(email: string, sig: string | null | undefined): boolean {
  return verifySignedValue(UNSUBSCRIBE_SIGNATURE_PURPOSE, email, sig);
}

const INVALID_SIGNATURE_MESSAGE =
  "Lien invalide. Pour modifier vos préférences, utilisez le lien reçu dans votre dernier e-mail.";

const UnsubscribeBodySchema = z.object({
  email: z.string().email("Format d'adresse e-mail invalide"),
  reason: z.string().max(500).optional(),
  sig: z.string().max(200).optional(),
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
  const blocked = await rateLimited(req);
  if (blocked) return blocked;

  const searchParams = req.nextUrl.searchParams;
  const email = extractEmailFromParams(searchParams);
  const action = searchParams.get("action") || "unsubscribe";
  const sig = searchParams.get("sig");
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

  if ((action === "status" || action === "resubscribe") && !hasValidSignature(email, sig)) {
    return NextResponse.json({ error: INVALID_SIGNATURE_MESSAGE }, { status: 403 });
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
      `/unsubscribe?email=${encodeURIComponent(email)}&status=resubscribed${sig ? `&sig=${encodeURIComponent(sig)}` : ""}`,
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
    `/unsubscribe?email=${encodeURIComponent(email)}&status=unsubscribed${sig ? `&sig=${encodeURIComponent(sig)}` : ""}`,
    req.url
  );
  return NextResponse.redirect(redirectUrl);
}

/**
 * POST /api/marketing/unsubscribe
 * Handles structured programmatic or client form unsubscribe / resubscribe requests
 */
export async function POST(req: NextRequest) {
  const blocked = await rateLimited(req);
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const parsed = UnsubscribeBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Requête invalide", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, reason, action, sig } = parsed.data;
    const cleanEmail = email.trim().toLowerCase();

    if ((action === "status" || action === "resubscribe") && !hasValidSignature(cleanEmail, sig)) {
      return NextResponse.json({ error: INVALID_SIGNATURE_MESSAGE }, { status: 403 });
    }

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
  } catch (err) {
    console.error("[POST /api/marketing/unsubscribe] Error:", err);
    return NextResponse.json(
      { error: "Erreur interne lors du traitement" },
      { status: 500 }
    );
  }
}
