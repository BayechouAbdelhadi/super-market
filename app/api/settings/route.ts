import { NextResponse } from "next/server";
import { getAppSettings } from "@/lib/settings/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json(
      { error: "SETTINGS_ERROR", message: "Impossible de charger la configuration." },
      { status: 500 }
    );
  }
}
