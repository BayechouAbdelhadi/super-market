import { NextResponse } from "next/server";
import { getAppSettings } from "@/lib/settings/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Public endpoint: expose only what storefront / POS screens need
    // (no sender configuration, no admin email in updatedBy).
    const { notifications: _notifications, updatedBy: _updatedBy, ...publicSettings } = await getAppSettings();
    return NextResponse.json({ settings: publicSettings });
  } catch {
    return NextResponse.json(
      { error: "SETTINGS_ERROR", message: "Impossible de charger la configuration." },
      { status: 500 }
    );
  }
}
