"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LoyaltyTier } from "@/lib/loyalty/types";
import { toast } from "@/components/ui/sonner";
import { renderDealEmailHtml } from "@/lib/marketing/templates/deal-email";
import { EmailVisualizerModal } from "./EmailVisualizerModal";
import { getParisTimeString } from "@/lib/utils/timezone";
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
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  Wand2,
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

export const CAMPAIGN_PRESETS = [
  {
    name: "🥦 Primeurs & -20% Frais",
    title: "Arrivage Primeurs Frais & -20% Week-end",
    subject: "🔥 Bonnes Affaires : -20% sur les Primeurs et Points Doublés ce week-end !",
    content: `Profitez de nos offres fraîches exclusives dès ce vendredi dans votre magasin Super Market Calais !\n\n- 20% de remise immédiate sur l'ensemble du rayon fruits & légumes dès 25€ d'achat\n- Vos points fidélité sont doublés sur tout votre ticket de caisse\n- Dégustation gratuite de nos nouveaux arrivages locaux ce samedi matin\n\nOffre exclusive réservée à nos membres fidélité sur simple indication de votre nom ou numéro de téléphone lors de votre passage au comptoir caisse.`,
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Découvrir les offres en magasin",
    ctaUrl: "https://supermarket-calais.fr",
  },
  {
    name: "🥩 Boucherie Halal & Volailles",
    title: "Arrivages Boucherie Halal & Volailles Fraîches",
    subject: "🥩 Boucherie Halal : -15% sur nos viandes fraîches et volailles ce week-end !",
    content: `Profitez de notre arrivage exceptionnel de viandes fraîches certifiées 100% Halal dans votre magasin Super Market Calais :\n\n- 15% de remise immédiate sur l'agneau, le veau et le boeuf de première qualité\n- Offres spéciales sur nos volailles fraîches et préparations bouchères maison\n- Points fidélité doublés sur l'ensemble du rayon boucherie dès 30€ d'achat\n\nNos artisans bouchers sont à votre disposition pour vos découpes personnalisées. Indiquez simplement votre numéro de téléphone en caisse pour activer vos réductions fidélité !`,
    imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Découvrir la boucherie en magasin",
    ctaUrl: "https://supermarket-calais.fr",
  },
  {
    name: "🌙 Saveurs d'Orient & Épicerie",
    title: "Sélection Saveurs d'Orient & Épicerie du Monde",
    subject: "✨ Arrivage Épicerie : Dattes Medjool, Épices & Spécialités d'Orient en promo !",
    content: `Découvrez notre nouvelle sélection d'épicerie orientale et de produits authentiques chez Super Market Calais :\n\n- 15% de remise sur nos dattes Medjool premium, fruits secs et graines\n- Sélection d'épices parfumées, thés à la menthe et douceurs traditionnelles\n- 100 points fidélité bonus crédités instantanément dès 35€ d'achat\n\nRendez-vous dès aujourd'hui en magasin pour savourer nos arrivages exclusifs !`,
    imageUrl: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Voir les arrivages en magasin",
    ctaUrl: "https://supermarket-calais.fr",
  },
  {
    name: "⚡ Ventes Flash & Points x3",
    title: "Journées Privilège : Points Triplés & Super Promos",
    subject: "⚡ Ventes Flash : Points fidélité x3 et remises exceptionnelles en magasin !",
    content: `Pour vous remercier de votre fidélité, toute l'équipe de Super Market Calais vous invite à ses Journées Privilège :\n\n- Points fidélité multipliés par 3 sur tous vos achats sans minimum\n- Jusqu'à -30% sur une sélection de plus de 150 produits du quotidien\n- 1 bon d'achat de 5€ offert dès 50€ d'achat valable sur votre prochaine visite\n\nPrésentez simplement votre nom ou numéro de téléphone en caisse pour activer vos avantages immédiats !`,
    imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Profiter des promotions",
    ctaUrl: "https://supermarket-calais.fr",
  },
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
  const [scheduledTime, setScheduledTime] = useState("00:00");

  // Step 4: Content
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("Découvrir les offres en magasin");
  const [ctaUrl, setCtaUrl] = useState("https://supermarket-calais.fr");
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);

  // Paris local time tracking & 24h helper calculations
  const [currentParisTime, setCurrentParisTime] = useState(() => getParisTimeString());
  useEffect(() => {
    const timer = setInterval(() => setCurrentParisTime(getParisTimeString()), 5000);
    return () => clearInterval(timer);
  }, []);

  const [schedH, schedM] = scheduledTime.split(":").map((v) => parseInt(v || "0", 10));
  const isMorning = !isNaN(schedH) && schedH < 12;
  const pmEquivalent = !isNaN(schedH) && !isNaN(schedM)
    ? `${String((schedH % 12) + 12).padStart(2, "0")}:${String(schedM).padStart(2, "0")}`
    : "12:00";
  const amEquivalent = !isNaN(schedH) && !isNaN(schedM)
    ? `${String(schedH % 12).padStart(2, "0")}:${String(schedM).padStart(2, "0")}`
    : "00:00";

  const isStartDateToday = startDate === today;
  const isTimePassedToday = isStartDateToday && scheduledTime <= currentParisTime;
  const isSuspiciousMorningTime = isStartDateToday && isMorning && currentParisTime >= "12:00";

  const getOffsetTime = (mins: number) => {
    const [h, m] = currentParisTime.split(":").map(Number);
    const total = (h || 0) * 60 + (m || 0) + mins;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
  };

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/deals/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Échec de l'upload.");

      setImageUrl(data.url);
      toast.success("Image importée avec succès !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi de l'image.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApplyPreset = (preset: (typeof CAMPAIGN_PRESETS)[0]) => {
    setTitle(preset.title);
    setSubject(preset.subject);
    setContent(preset.content);
    setImageUrl(preset.imageUrl);
    setCtaText(preset.ctaText);
    setCtaUrl(preset.ctaUrl);
    setErrorMsg("");
    toast.success(`Exemple « ${preset.name} » pré-rempli !`);
  };

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
        scheduledTime: scheduledTime || "00:00",
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
    setScheduledTime("00:00");
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

        {/* Universal Email Visualizer Shortcut */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60">
          <div className="flex items-center gap-2 text-xs text-indigo-950 dark:text-indigo-200 font-medium">
            <span className="text-base select-none">👁️</span>
            <span>Envie de prévisualiser le rendu final des e-mails avant de continuer ?</span>
          </div>
          <button
            type="button"
            onClick={() => setIsVisualizerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 transition-all shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visualiser l&apos;email</span>
          </button>
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

            {/* Execution Hour: Interactive Time Input */}
            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <label htmlFor="deal-scheduled-time" className="flex items-center gap-2 text-xs font-bold text-[var(--color-text)] cursor-pointer">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Heure d&apos;exécution du job *</span>
                  </label>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Heure précise d&apos;envoi des emails (format 24h, heure de Paris).
                  </p>
                  <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Heure actuelle à Paris : <strong>{currentParisTime}</strong></span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 self-start sm:self-auto">
                  {/* AM/PM Switcher */}
                  <div className="inline-flex p-0.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isMorning) setScheduledTime(amEquivalent);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        isMorning
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      ☀️ Matin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isMorning) setScheduledTime(pmEquivalent);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        !isMorning
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      🌙 Après-midi
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="deal-scheduled-time"
                      type="time"
                      required
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="h-11 px-3.5 text-sm font-bold font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                    {scheduledTime === "00:00" && (
                      <span className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-500/20 whitespace-nowrap">
                        🌙 Minuit
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning for Suspicious Morning Time (e.g. 05:24 entered in the afternoon) */}
              {isSuspiciousMorningTime && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-950 dark:text-amber-200 space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">
                        Attention au format 24h : vous avez saisi « {scheduledTime} » ({schedH}h{String(schedM).padStart(2, "0")} du matin)
                      </strong>
                      <p className="text-[11px] leading-relaxed opacity-90 mt-0.5">
                        Il est actuellement <strong>{currentParisTime}</strong>. Cette heure du matin est donc déjà passée aujourd&apos;hui.
                        Si vous vouliez programmer pour cet après-midi à <strong>{pmEquivalent}</strong> ({pmEquivalent.replace(":", "h")}), cliquez ci-dessous :
                      </p>
                    </div>
                  </div>
                  <div className="pl-6">
                    <button
                      type="button"
                      onClick={() => setScheduledTime(pmEquivalent)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Passer à {pmEquivalent} ({pmEquivalent.replace(":", "h")} après-midi)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Live Scheduling Timeline Status Badge */}
              <div className="p-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs flex items-center justify-between gap-2">
                <span className="text-[var(--color-text-muted)] font-medium">Statut du déclenchement :</span>
                {isStartDateToday ? (
                  scheduledTime > currentParisTime ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>🟢 Prévu aujourd&apos;hui à {scheduledTime} — En attente (ne sera PAS envoyé immédiatement)</span>
                    </span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>⚡ Heure passée ({scheduledTime}) : l&apos;envoi se lancera à la création</span>
                    </span>
                  )
                ) : (
                  <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>📅 Programmé pour le {startDate} à {scheduledTime}</span>
                  </span>
                )}
              </div>

              {/* Quick time presets with dynamic test offsets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--color-border)]/60 text-xs">
                <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Raccourcis rapides :</span>
                {[
                  { label: `⚡ Dans 2 min (${getOffsetTime(2)})`, val: getOffsetTime(2) },
                  { label: `⚡ Dans 5 min (${getOffsetTime(5)})`, val: getOffsetTime(5) },
                  { label: `⚡ Dans 15 min (${getOffsetTime(15)})`, val: getOffsetTime(15) },
                  { label: "Minuit (00:00)", val: "00:00" },
                  { label: "Matin (08:00)", val: "08:00" },
                  { label: "Midi (12:00)", val: "12:00" },
                  { label: "Après-midi (15:00)", val: "15:00" },
                  { label: "Soir (18:30)", val: "18:30" },
                ].map((preset) => (
                  <button
                    key={preset.val + preset.label}
                    type="button"
                    onClick={() => setScheduledTime(preset.val)}
                    className={`px-2.5 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      scheduledTime === preset.val
                        ? "bg-indigo-600 text-white font-bold shadow-2xs"
                        : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-indigo-400"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsVisualizerOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualiser l&apos;email</span>
                </button>

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
                    <span>Aperçu</span>
                  </button>
                </div>
              </div>
            </div>

            {previewTab === "edit" ? (
              <div className="space-y-4">
                {/* PREFILL BANNER & PRESETS */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-pink-50/60 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/20 border border-indigo-200/80 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Modèles prêts à l&apos;emploi</span>
                    </div>
                    <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                      Pré-remplit en 1 clic un titre, un objet attractif, un message structuré et une image adaptée.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(CAMPAIGN_PRESETS[0])}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>⚡ Pré-remplir</span>
                    </button>

                    {CAMPAIGN_PRESETS.slice(1).map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 hover:bg-indigo-50/50 text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 transition-all cursor-pointer shadow-2xs"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[var(--color-text)]">
                      Nom interne de la campagne *
                    </label>
                    <span className="text-[10px] text-[var(--color-text-muted)]">Visible uniquement par l&apos;équipe</span>
                  </div>
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

                <div className="space-y-2 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      <span>Bannière promotionnelle de l&apos;offre (optionnelle)</span>
                    </label>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Retirer l&apos;image</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... ou cliquez sur « Importer »"
                      className="flex-1 h-10 text-xs font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      <span>{isUploadingImage ? "Importation..." : "Importer un fichier"}</span>
                    </button>
                  </div>

                  {/* Thumbnail Preview */}
                  {imageUrl && (
                    <div className="relative mt-2 rounded-xl overflow-hidden border border-[var(--color-border)] bg-slate-900/5 max-h-36 flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt="Aperçu bannière"
                        className="w-full h-36 object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Image prête pour l&apos;email</span>
                      </div>
                    </div>
                  )}

                  {/* Curated Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[var(--color-text-muted)]">
                    <span className="font-medium">Suggestions :</span>
                    {[
                      {
                        label: "🥬 Primeurs & Frais",
                        url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
                      },
                      {
                        label: "🛒 Supermarché Promo",
                        url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80",
                      },
                      {
                        label: "🍇 Fruits de Saison",
                        url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80",
                      },
                      {
                        label: "🥩 Boucherie Halal",
                        url: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=1200&q=80",
                      },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className="px-2 py-0.5 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all cursor-pointer text-[10px]"
                      >
                        {preset.label}
                      </button>
                    ))}
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

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVisualizerOpen(true)}
                  className="gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 hover:bg-indigo-100/50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualiser l&apos;email</span>
                </Button>

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

      {/* Standalone Responsive Email Visualizer */}
      <EmailVisualizerModal
        isOpen={isVisualizerOpen}
        onClose={() => setIsVisualizerOpen(false)}
        title={title}
        subject={subject}
        content={content}
        imageUrl={imageUrl}
        ctaText={ctaText}
        ctaUrl={ctaUrl}
        storeName={storeName}
        storeAddress={storeAddress}
        storePhone={storePhone}
        targetTiers={selectedTiers}
      />
    </Modal>
  );
}
