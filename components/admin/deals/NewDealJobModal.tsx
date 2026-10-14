"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LoyaltyTier } from "@/lib/loyalty/types";
import { toast } from "@/components/ui/sonner";
import { renderDealEmailHtml } from "@/lib/marketing/templates/deal-email";
import {
  Users,
  Calendar,
  Send,
  FileText,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";

interface NewDealJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

const ALL_TIERS: { id: LoyaltyTier; label: string; desc: string; color: string }[] = [
  { id: "BRONZE", label: "Bronze", desc: "Nouveaux clients & achats réguliers", color: "amber" },
  { id: "SILVER", label: "Silver", desc: "Clients fréquents (+500 pts)", color: "slate" },
  { id: "GOLD", label: "Gold", desc: "Clients fidèles (+2 000 pts)", color: "yellow" },
  { id: "VIP", label: "VIP", desc: "Clients premium (+5 000 pts)", color: "purple" },
];

export function NewDealJobModal({
  isOpen,
  onClose,
  onCreated,
  storeName = "Super Market Calais",
  storeAddress = "205 Avenue Antoine de Saint-Exupéry, 62100 Calais",
  storePhone = "06 71 54 05 28",
}: NewDealJobModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Target Tiers
  const [selectedTiers, setSelectedTiers] = useState<LoyaltyTier[]>(["BRONZE", "SILVER", "GOLD", "VIP"]);
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Step 2: Dispatch Mode
  const [dispatchMode, setDispatchMode] = useState<"ALL_AT_ONCE" | "DAILY_LIMIT">("ALL_AT_ONCE");
  const [dailyLimitStr, setDailyLimitStr] = useState("100");

  // Step 3: Date range schedule
  const today = new Date().toISOString().slice(0, 10);
  const defaultEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEnd);

  // Step 4: Content
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("Découvrir les offres en magasin");
  const [ctaUrl, setCtaUrl] = useState("https://supermarket-calais.fr");
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Calculate live audience count when selected tiers change
  useEffect(() => {
    if (!isOpen) return;
    if (selectedTiers.length === 0) {
      setTargetCount(0);
      return;
    }

    const abortCtrl = new AbortController();
    setLoadingCount(true);

    async function fetchCount() {
      try {
        const res = await fetch("/api/admin/deals/recipients-count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tiers: selectedTiers }),
          signal: abortCtrl.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setTargetCount(data.count ?? 0);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Erreur calcul audience:", err);
        }
      } finally {
        setLoadingCount(false);
      }
    }

    fetchCount();
    return () => abortCtrl.abort();
  }, [selectedTiers, isOpen]);

  const toggleTier = (tier: LoyaltyTier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const handleSelectAllTiers = () => {
    setSelectedTiers(["BRONZE", "SILVER", "GOLD", "VIP"]);
  };

  const handleClearTiers = () => {
    setSelectedTiers([]);
  };

  // Step validation guards
  const validateStep1 = () => {
    if (selectedTiers.length === 0) {
      setErrorMsg("Veuillez sélectionner au moins un palier client.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const validateStep2 = () => {
    if (dispatchMode === "DAILY_LIMIT") {
      const parsedLimit = parseInt(dailyLimitStr, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        setErrorMsg("Veuillez saisir un quota de clients par jour supérieur à 0.");
        return false;
      }
    }
    setErrorMsg("");
    return true;
  };

  const validateStep3 = () => {
    if (!startDate || !endDate) {
      setErrorMsg("Veuillez définir une date de début et de fin valides.");
      return false;
    }
    if (endDate < startDate) {
      setErrorMsg("La date de fin ne peut pas être antérieure à la date de début.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handleBack = () => {
    setErrorMsg("");
    if (step === 4) setStep(3);
    else if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg("Veuillez renseigner un titre de campagne d'au moins 3 caractères.");
      return;
    }
    if (!subject.trim() || subject.trim().length < 3) {
      setErrorMsg("Veuillez renseigner un objet d'email percutant.");
      return;
    }
    if (!content.trim() || content.trim().length < 10) {
      setErrorMsg("Le texte de l'offre doit comporter au moins 10 caractères.");
      return;
    }

    setLoadingSubmit(true);
    try {
      const payload = {
        title: title.trim(),
        targetTiers: selectedTiers,
        dispatchMode,
        dailyLimit: dispatchMode === "DAILY_LIMIT" ? parseInt(dailyLimitStr, 10) : null,
        startDate,
        endDate,
        subject: subject.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim() || null,
        ctaText: ctaText.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
      };

      const res = await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de la création de la campagne.");
      }

      toast.success(data.message || "Campagne de bons plans créée avec succès !");
      onCreated();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement du job.");
      toast.error(err.message || "Erreur lors de l'enregistrement du job.");
    } finally {
      setLoadingSubmit(false);
    }
  }

  function handleClose() {
    setStep(1);
    setErrorMsg("");
    setTitle("");
    setSubject("");
    setContent("");
    setImageUrl("");
    setPreviewTab("edit");
    onClose();
  }

  // Live HTML email string for preview
  const livePreviewHtml = renderDealEmailHtml({
    customerName: "Marie Dupont",
    tier: selectedTiers[0] || "GOLD",
    subject: subject || "🔥 Bonnes affaires de la semaine chez Super Market !",
    content:
      content ||
      "Profitez de nos offres exclusives cette semaine sur tout le rayon fruits & primeurs frais !\n\nPrésentez simplement votre nom ou numéro en caisse pour bénéficier de vos réductions immédiates.",
    imageUrl: imageUrl.trim() || undefined,
    ctaText: ctaText || "Découvrir les offres en magasin",
    ctaUrl: ctaUrl || "https://supermarket-calais.fr",
    storeName,
    storeAddress,
    storePhone,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Programmer des Bons Plans par Email"
      icon="✨"
      description="Planifiez une campagne d'emails personnalisés pour informer vos clients de vos offres exclusives."
      maxWidth="lg"
    >
      <div className="p-6 space-y-6">
        {/* Stepper Header */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, label: "Audience", icon: Users },
            { num: 2, label: "Diffusion", icon: Layers },
            { num: 3, label: "Planning", icon: Calendar },
            { num: 4, label: "Contenu", icon: FileText },
          ].map((s) => {
            const Icon = s.icon;
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                className={`p-2.5 rounded-xl border transition-all text-center flex flex-col items-center gap-1 ${
                  isCurrent
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] font-bold shadow-xs"
                    : isDone
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] opacity-60"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Icon className="w-3.5 h-3.5" />}
                  <span>Étape {s.num}</span>
                </div>
                <span className="text-[11px] font-medium hidden sm:block">{s.label}</span>
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: CIBLAGE DES PALIERS CLIENTS */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--color-primary)]" />
                <span>1. Choisissez les catégories de clients à cibler</span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Sélectionnez les paliers de fidélité concernés par cette offre commerciale (sélection multiple).
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)] font-medium">Paliers éligibles :</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllTiers}
                  className="text-xs text-[var(--color-primary)] hover:underline font-semibold cursor-pointer"
                >
                  Tout cocher
                </button>
                <span className="opacity-40">•</span>
                <button
                  type="button"
                  onClick={handleClearTiers}
                  className="text-xs text-[var(--color-text-muted)] hover:underline font-medium cursor-pointer"
                >
                  Tout décocher
                </button>
              </div>
            </div>

            {/* Tier checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_TIERS.map((t) => {
                const isChecked = selectedTiers.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTier(t.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isChecked
                        ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-xs"
                        : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border text-[10px] font-bold ${
                            isChecked
                              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                              : "border-[var(--color-border)] bg-[var(--color-surface)]"
                          }`}
                        >
                          {isChecked && "✓"}
                        </span>
                        <strong className="text-sm font-bold text-[var(--color-text)]">
                          Palier {t.label}
                        </strong>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] pl-5.5">
                        {t.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Target Audience Summary */}
            <div className="p-4 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl select-none">🎯</span>
                <div>
                  <span className="text-xs font-bold text-[var(--color-text)] block">
                    Estimation de l&apos;audience ciblée
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    Clients avec une adresse email valide dans les paliers sélectionnés.
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {loadingCount ? (
                  <span className="text-xs text-[var(--color-text-muted)] animate-pulse">Calcul...</span>
                ) : (
                  <strong className="text-lg sm:text-xl font-mono font-extrabold text-[var(--color-primary)]">
                    {targetCount !== null ? `${targetCount} client${targetCount > 1 ? "s" : ""}` : "—"}
                  </strong>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MODE DE DIFFUSION */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--color-primary)]" />
                <span>2. Choisissez le mode d&apos;envoi des emails</span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Envoyez à tous les clients d&apos;un coup ou lissez l&apos;envoi quotidiennement pour réguler la fréquentation en magasin.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: One-shot */}
              <button
                type="button"
                onClick={() => setDispatchMode("ALL_AT_ONCE")}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                  dispatchMode === "ALL_AT_ONCE"
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-sm"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="inline-flex p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xl">
                    ⚡
                  </div>
                  <strong className="block text-sm font-bold text-[var(--color-text)]">
                    Envoi groupé (One-shot)
                  </strong>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    L&apos;ensemble des {targetCount || 0} clients ciblés reçoivent l&apos;email dès le démarrage de la campagne en un seul passage.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Idéal pour : Promotions flash &amp; arrivages du jour
                </div>
              </button>

              {/* Option 2: Daily Limit */}
              <button
                type="button"
                onClick={() => setDispatchMode("DAILY_LIMIT")}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                  dispatchMode === "DAILY_LIMIT"
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-sm"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="inline-flex p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xl">
                    📅
                  </div>
                  <strong className="block text-sm font-bold text-[var(--color-text)]">
                    Quota quotidien lissé
                  </strong>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    Le job s&apos;exécute chaque jour en envoyant une limite définie de clients jusqu&apos;à la date de fin ou épuisement de l&apos;audience.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  Idéal pour : Éviter l&apos;engorgement en caisse
                </div>
              </button>
            </div>

            {/* Daily limit configuration input */}
            {dispatchMode === "DAILY_LIMIT" && (
              <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3 animate-in fade-in duration-200">
                <label className="block text-xs font-semibold text-[var(--color-text)]">
                  Limite maximale de clients contactés par jour *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={dailyLimitStr}
                    onChange={(e) => setDailyLimitStr(e.target.value)}
                    className="w-36 h-11 text-base font-bold font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-xs text-[var(--color-text-muted)] font-medium">
                    clients / jour
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                  <span className="text-[var(--color-text-muted)] text-[11px]">Raccourcis :</span>
                  {[25, 50, 100, 250].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDailyLimitStr(preset.toString())}
                      className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-xs font-mono hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                    >
                      {preset}/j
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PROGRAMMATION (DATES) */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                <span>3. Définissez la période d&apos;activité du job</span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                L&apos;envoi débutera à la date de début. Pour les quotas quotidiens, il tournera chaque jour jusqu&apos;à la date de fin ou lorsque tous les clients ciblés auront été contactés.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text)]">
                  Date de début d&apos;envoi *
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text)]">
                  Date de fin de validité *
                </label>
                <input
                  type="date"
                  required
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            {/* Behavior Explanation Card */}
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Comportement automatique programmé</span>
              </div>
              <p className="leading-relaxed">
                {dispatchMode === "ALL_AT_ONCE"
                  ? `Dès le démarrage (${startDate}), l'ensemble des ${targetCount || 0} clients ciblés seront contactés. Le job passera automatiquement en statut « Terminé » avec le bilan complet des envois réussis et des échecs éventuels.`
                  : `Le job distribuera jusqu'à ${dailyLimitStr} emails par jour entre le ${startDate} et le ${endDate}. Dès que les ${targetCount || 0} clients ciblés auront été contactés (ou à expiration de la date de fin), le job s'achèvera avec les statistiques finales.`}
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: CONTENU & TEMPLATE DE L'EMAIL */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>4. Rédigez le contenu et prévisualisez l&apos;email</span>
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  L&apos;email sera automatiquement habillé avec le logo, les couleurs et les coordonnées de {storeName}.
                </p>
              </div>

              {/* Edit / Preview Tabs */}
              <div className="inline-flex p-1 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab("edit")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    previewTab === "edit"
                      ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  Édition
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("preview")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewTab === "preview"
                      ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Aperçu client</span>
                </button>
              </div>
            </div>

            {previewTab === "edit" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Nom interne de la campagne *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Arrivage Primeurs Frais & -20% Week-end"
                    className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Objet de l&apos;email (reçu par le client) *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: 🔥 Bonnes Affaires : Vos réductions exclusives ce week-end chez Super Market !"
                    className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Texte de l&apos;offre / Message commercial *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Profitez de nos offres exclusives dès ce vendredi !\n\n- 20% sur tout le rayon fruits & légumes frais\n- 2x plus de points fidélité crédités sur votre compte\n\nOffre valable en magasin sur présentation de votre compte au comptoir.`}
                    className="w-full text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Image / Bannière promotionnelle (URL)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... ou URL de votre affiche"
                    className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-[var(--color-text-muted)]">
                    <span>Exemple rapide :</span>
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrl(
                          "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
                        )
                      }
                      className="text-[var(--color-primary)] hover:underline cursor-pointer"
                    >
                      Bannière Primeur Frais
                    </button>
                    <span className="opacity-40">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrl(
                          "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80"
                        )
                      }
                      className="text-[var(--color-primary)] hover:underline cursor-pointer"
                    >
                      Bannière Soldes / Promo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--color-text)]">
                      Texte du bouton d&apos;action (CTA)
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Découvrir les offres en magasin"
                      className="w-full h-10 text-xs font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--color-text)]">
                      Lien du bouton (URL)
                    </label>
                    <input
                      type="url"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://supermarket-calais.fr"
                      className="w-full h-10 text-xs font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Live rendered client HTML email preview */
              <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden bg-slate-50 shadow-inner">
                <div className="p-3 bg-slate-100 border-b border-[var(--color-border)] text-xs text-slate-600 flex items-center justify-between">
                  <span className="font-semibold">Prévisualisation email reçue par le client</span>
                  <span className="text-[11px] text-slate-500 font-mono">HTML responsive 600px</span>
                </div>
                <div className="p-4 overflow-x-auto max-h-[480px]">
                  <div
                    className="max-w-[600px] mx-auto shadow-md rounded-xl overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: livePreviewHtml }}
                  />
                </div>
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-[var(--color-border)]">
              <Button type="button" variant="secondary" onClick={handleBack} disabled={loadingSubmit}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Retour</span>
              </Button>

              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={loadingSubmit}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loadingSubmit}
                  className="font-bold gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Programmer la campagne</span>
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Wizard Navigation for Steps 1, 2, 3 */}
        {step < 4 && (
          <div className="pt-4 flex items-center justify-between border-t border-[var(--color-border)]">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Précédent</span>
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={handleClose}>
                Annuler
              </Button>
            )}

            <Button type="button" variant="primary" onClick={handleNext} className="gap-2 font-bold">
              <span>Suivant</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
