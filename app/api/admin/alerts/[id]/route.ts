import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { AlertIdSchema, UpdateAlertSchema } from "@/lib/alerts/validation";
import { deleteAlert, setAlertActive } from "@/lib/alerts/service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function validationError(message: string) {
  return NextResponse.json({ error: "VALIDATION_ERROR", message }, { status: 400 });
}

const NOT_FOUND = { error: "NOT_FOUND", message: "Alerte introuvable ou déjà supprimée." };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const id = AlertIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error.issues[0]?.message || "Identifiant d'alerte invalide.");

  const parsed = UpdateAlertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error.issues[0]?.message || "Modification invalide.");

  try {
    const alert = await setAlertActive(id.data, parsed.data.isActive);
    if (!alert) return NextResponse.json(NOT_FOUND, { status: 404 });
    return NextResponse.json({
      success: true,
      alert,
      message: alert.isActive ? "Alerte affichée sur le site." : "Alerte masquée du site.",
    });
  } catch (err) {
    console.error("[PATCH /api/admin/alerts/[id]] Error:", err);
    return NextResponse.json(
      { error: "UPDATE_FAILED", message: "Erreur lors de la modification de l'alerte." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const id = AlertIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error.issues[0]?.message || "Identifiant d'alerte invalide.");

  try {
    const deleted = await deleteAlert(id.data);
    if (!deleted) return NextResponse.json(NOT_FOUND, { status: 404 });
    return NextResponse.json({ success: true, message: "Alerte supprimée." });
  } catch (err) {
    console.error("[DELETE /api/admin/alerts/[id]] Error:", err);
    return NextResponse.json(
      { error: "DELETE_FAILED", message: "Erreur lors de la suppression de l'alerte." },
      { status: 500 }
    );
  }
}
