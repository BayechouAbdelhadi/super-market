import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  unsubscribeCustomerEmail,
  resubscribeCustomerEmail,
  isCustomerEmailUnsubscribed,
  requestUnsubscribeConfirmation,
} from "@/lib/marketing/service";
import { verifySignedValue } from "@/lib/email/otp-security";
import { UNSUBSCRIBE_SIGNATURE_PURPOSE } from "@/lib/marketing/utils";
import { RATE_LIMITS, getClientIp, rateLimitMessage } from "@/lib/security/rate-limit";
import { enforceRateLimits } from "@/lib/security/enforce";
import { getAppOrigin } from "@/lib/utils/app-url";

/**
 * SECURITY: every change of marketing consent (unsubscribe, re-subscribe) and
 * every status check requires the HMAC `sig` carried by the link in our emails,
 * so nobody can change or probe someone else's preferences.
 * A request typed into the public form (no `sig`) only triggers a confirmation
 * email with a signed link (double opt-out), with the same answer whether or not
 * the address is known.
 */
function hasValidSignature(email: string, sig: string | null | undefined): boolean {
  return verifySignedValue(UNSUBSCRIBE_SIGNATURE_PURPOSE, email, sig);
}

const INVALID_SIGNATURE_MESSAGE =
  "Lien invalide. Pour modifier vos préférences, utilisez le lien reçu dans votre dernier e-mail.";

const CONFIRMATION_SENT_MESSAGE =
  "Si cette adresse est inscrite à nos offres, vous allez recevoir un e-mail pour confirmer votre désabonnement.";

const UnsubscribeBodySchema = z.object({
  email: z.string().email("Format d'adresse e-mail invalide"),
  reason: z.string().max(500).optional(),
  sig: z.string().max(200).optional(),
  action: z.enum(["unsubscribe", "resubscribe", "status"]).optional().default("unsubscribe"),
});

async function rateLimited(req: NextRequest): Promise<NextResponse | null> {
  const limit = await enforceRateLimits([[`unsubscribe:ip:${getClientIp(req.headers)}`, RATE_LIMITS.unsubscribePerIp]]);
  return limit.allowed ? null : NextResponse.json({ error: rateLimitMessage(limit) }, { status: 429 });
}

function readEmail(value: string | null): string | null {
  const parsed = z.string().trim().toLowerCase().email().safeParse(value ?? "");
  return parsed.success ? parsed.data : null;
}

function preferencesPageUrl(req: NextRequest, email: string, status: string, sig: string): URL {
  return new URL(
    `/unsubscribe?email=${encodeURIComponent(email)}&status=${status}&sig=${encodeURIComponent(sig)}`,
    req.url
  );
}

/**
 * GET /api/marketing/unsubscribe?email=...&sig=...
 * One-click links from emails (signed), and signed status checks.
 */
export async function GET(req: NextRequest) {
  const blocked = await rateLimited(req);
  if (blocked) return blocked;

  const searchParams = req.nextUrl.searchParams;
  const email = readEmail(searchParams.get("email"));
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
    return NextResponse.redirect(new URL("/unsubscribe?error=missing_email", req.url));
  }

  if (!sig || !hasValidSignature(email, sig)) {
    if (wantsJson) {
      return NextResponse.json({ error: INVALID_SIGNATURE_MESSAGE }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/unsubscribe?error=invalid_link", req.url));
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
    return NextResponse.redirect(preferencesPageUrl(req, email, "resubscribed", sig));
  }

  // Default: unsubscribe
  await unsubscribeCustomerEmail(email, "Lien e-mail en pied de page");

  if (wantsJson) {
    return NextResponse.json({ success: true, unsubscribed: true, email });
  }
  return NextResponse.redirect(preferencesPageUrl(req, email, "unsubscribed", sig));
}

/**
 * POST /api/marketing/unsubscribe
 * - with a valid `sig`: unsubscribe / re-subscribe / status for that address;
 * - "unsubscribe" without `sig` (public form): sends a signed confirmation email.
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
    const isSigned = hasValidSignature(cleanEmail, sig);

    if (!isSigned && action === "unsubscribe" && !sig) {
      // Double opt-out: identical answer whether the address is known, unknown or throttled
      const limit = await enforceRateLimits([
        [`unsubscribe-confirm:email:${cleanEmail}`, RATE_LIMITS.unsubscribeConfirmationPerEmail],
      ]);
      if (limit.allowed) {
        await requestUnsubscribeConfirmation(cleanEmail, getAppOrigin(req.headers));
      }
      return NextResponse.json({
        success: true,
        confirmationSent: true,
        message: CONFIRMATION_SENT_MESSAGE,
      });
    }

    if (!isSigned) {
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
