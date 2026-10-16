"use client";

import React, { useState } from "react";
import { inviteUser } from "@/app/admin/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  Send,
  Users,
  ShieldCheck,
  Sparkles,
  Link as LinkIcon,
  Phone,
  User,
  ArrowRight,
  Printer,
  QrCode,
} from "lucide-react";
import { PrintInviteQrModal } from "./PrintInviteQrModal";

interface SentInvite {
  email: string;
  name?: string;
  role: "CUSTOMER" | "CASHIER";
  activationLink: string;
  sentAt: string;
}

export function InviteUserManager() {
  const [role, setRole] = useState<"CUSTOMER" | "CASHIER">("CUSTOMER");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastInvite, setLastInvite] = useState<SentInvite | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);
  const [recentInvites, setRecentInvites] = useState<SentInvite[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const publicInviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite`
      : "https://supermarket-calais.fr/invite";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set("email", email.trim());
    formData.set("role", role);
    formData.set("first_name", firstName.trim());
    formData.set("last_name", lastName.trim());
    formData.set("phone_number", phone.trim());

    try {
      const result = await inviteUser(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Invitation envoyée avec succès !");
        const newInvite: SentInvite = {
          email: result.email || email.trim(),
          name: `${firstName} ${lastName}`.trim(),
          role: (result.role as any) || role,
          activationLink: result.activationLink || "",
          sentAt: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        };
        setLastInvite(newInvite);
        setRecentInvites((prev) => [newInvite, ...prev.slice(0, 9)]);

        // Reset inputs
        setEmail("");
        setFirstName("");
        setLastName("");
        setPhone("");
      }
    } catch {
      toast.error("Erreur inattendue lors de l'envoi de l'invitation.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, isPublic = false) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isPublic) {
      setCopiedPublicLink(true);
      setTimeout(() => setCopiedPublicLink(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    toast.success("Lien copié dans le presse-papiers !");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserPlus className="w-7 h-7 text-rose-600" />
            Inviter des utilisateurs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Envoyez une invitation par e-mail ou partagez le lien pour permettre aux clients et caissiers de créer leur compte.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPrintModalOpen(true)}
          className="w-full sm:w-auto h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer border border-slate-800 group"
          title="Affiche Magasin & QR Code d'invitation"
          aria-label="Affiche Magasin & QR Code d'invitation"
        >
          <QrCode className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
          <span>Affiche &amp; QR Code</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 sm:p-7 border-slate-200/90 shadow-sm">
            <form onSubmit={handleInvite} className="space-y-5">
              {/* Role Toggle Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Type de compte à créer
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("CUSTOMER")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      role === "CUSTOMER"
                        ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        role === "CUSTOMER" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Client Fidélité</div>
                      <div className="text-xs text-slate-500 mt-0.5">Accès solde, remises & offres</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("CASHIER")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      role === "CASHIER"
                        ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        role === "CASHIER" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Caissier(e)</div>
                      <div className="text-xs text-slate-500 mt-0.5">Accès au terminal de caisse</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Email (Primary) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adresse e-mail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@exemple.fr ou caissier@supermarket.fr"
                    required
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Un e-mail d'invitation avec lien d'activation sécurisé sera automatiquement envoyé à cette adresse.
                </p>
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Prénom <span className="text-slate-400 font-normal">(Optionnel)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean"
                      className="pl-10 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nom <span className="text-slate-400 font-normal">(Optionnel)</span>
                  </label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Numéro de téléphone <span className="text-slate-400 font-normal">(Optionnel)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Envoi de l'invitation en cours..."
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer l&apos;invitation par e-mail
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Last Sent Invite Card */}
          {lastInvite && lastInvite.activationLink && (
            <Card className="p-5 sm:p-6 border-emerald-200 bg-emerald-50/40 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Invitation créée avec succès pour {lastInvite.email}
                </div>
                <span className="text-xs text-slate-500">Envoyée à {lastInvite.sentAt}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Le courriel d&apos;invitation est en route. Vous pouvez également copier directement le lien personnalisé ci-dessous pour l&apos;envoyer par SMS, WhatsApp ou messagerie :
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={lastInvite.activationLink}
                  className="flex-1 h-10 px-3 bg-white rounded-xl border border-emerald-300 text-xs font-mono text-slate-700 select-all"
                />
                <Button
                  type="button"
                  onClick={() => copyToClipboard(lastInvite.activationLink)}
                  className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? "Copié !" : "Copier le lien"}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Shareable Store Link & Info */}
        <div className="space-y-6">
          {/* Public Store Invite Link Card */}
          <Card className="p-6 border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <LinkIcon className="w-4 h-4" />
              </div>
              Lien public d&apos;invitation
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Partagez ce lien direct à tous vos clients (en magasin, sur les tickets, affiches ou réseaux sociaux) pour qu&apos;ils puissent créer leur compte fidélité en ligne à tout moment :
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicInviteUrl}
                  className="flex-1 min-w-0 h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-slate-900/10 truncate"
                />

                {/* Copier le lien button */}
                <button
                  type="button"
                  onClick={() => copyToClipboard(publicInviteUrl, true)}
                  className="h-11 px-3 sm:px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Copier le lien d'invitation"
                  aria-label="Copier le lien d'invitation"
                >
                  {copiedPublicLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="hidden sm:inline text-emerald-600 font-bold">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600 shrink-0" />
                      <span className="hidden sm:inline">Copier</span>
                    </>
                  )}
                </button>

                {/* Bouton SVG QR Code au lieu de texte */}
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="h-11 w-11 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-xs transition-all active:scale-95 cursor-pointer border border-slate-800 group"
                  title="Afficher et imprimer l'affiche & le QR Code"
                  aria-label="Afficher le QR Code"
                >
                  <QrCode className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Lien actif permanent
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Cliquez sur <QrCode className="w-3.5 h-3.5 inline text-slate-600 -mt-0.5" /> pour l&apos;affiche
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <a
                href="/invite"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
              >
                Aperçu de la page d&apos;invitation
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>

          {/* Quick Guidance Box */}
          <Card className="p-6 border-slate-200/90 shadow-sm space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Users className="w-4 h-4 text-slate-500" />
              Comment ça fonctionne ?
            </div>

            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">1.</span>
                L&apos;utilisateur reçoit un e-mail avec un lien d&apos;activation valable 7 jours.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">2.</span>
                En un clic, il définit son mot de passe pour finaliser son accès sécurisé.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">3.</span>
                Le compte fidélité ou caisse est immédiatement opérationnel.
              </li>
            </ul>
          </Card>

          {/* Recent Invites History */}
          {recentInvites.length > 0 && (
            <Card className="p-5 border-slate-200/90 shadow-sm space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Invitations récentes de la session
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {recentInvites.map((inv, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 truncate">{inv.email}</div>
                      <div className="text-[11px] text-slate-500">
                        {inv.role === "CASHIER" ? "Caissier" : "Client"} · {inv.sentAt}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inv.activationLink)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 shrink-0"
                      title="Copier le lien d'activation"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <PrintInviteQrModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        inviteUrl={publicInviteUrl}
      />
    </div>
  );
}
