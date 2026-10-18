import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { defaultMarketingRepo } from "@/lib/marketing/adapters/supabase-marketing-repository";
import { triggerDueCampaigns } from "@/lib/marketing/service";
import { getParisDateString, getParisTimeString, TIMEZONE_PARIS } from "@/lib/utils/timezone";

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Cron Job Endpoint for Marketing Deals (Exécuté chaque nuit à Minuit 00:00).
 *
 * Déclenchable par :
 * - Supabase pg_cron (à 00:00)
 * - Vercel Cron (schedule: "0 0 * * *")
 * - Appel système sécurisé avec header Authorization ou CRON_SECRET
 */
export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}

async function handleCronExecution(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Sécurité : refuse toujours l'accès si aucun secret n'est configuré (fail closed)
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthorized =
    bearer.length > 0 &&
    ((!!cronSecret && safeEqual(bearer, cronSecret)) ||
      (!!serviceRoleKey && safeEqual(bearer, serviceRoleKey)));

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Accès non autorisé au déclencheur du cron." },
      { status: 401 }
    );
  }

  try {
    const todayStr = getParisDateString();
    const currentParisTime = getParisTimeString();
    const results = await triggerDueCampaigns(defaultMarketingRepo);

    return NextResponse.json({
      success: true,
      timezone: TIMEZONE_PARIS,
      parisDate: todayStr,
      parisTime: currentParisTime,
      utcTimestamp: new Date().toISOString(),
      totalProcessedCampaigns: results.length,
      details: results,
    });
  } catch (err) {
    console.error("[Cron Marketing Deals] Erreur lors du job de minuit:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur interne du cron de minuit." },
      { status: 500 }
    );
  }
}
