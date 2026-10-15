"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoyaltyTier } from "@/lib/loyalty/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { EmailVisualizerModal } from "./EmailVisualizerModal";
import { getParisDateString, getParisTimeString } from "@/lib/utils/timezone";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Layers,
  Calendar,
  Clock,
  FileText,
  Eye,
  Send,
  Upload,
  Trash2,
  AlertCircle,
  Wand2,
  Check,
} from "lucide-react";

interface CampaignEditorPageProps {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

const ALL_TIERS: { id: LoyaltyTier; label: string; desc: string }[] = [
  { id: "BRONZE", label: "Bronze", desc: "Nouveaux clients & achats réguliers" },
  { id: "SILVER", label: "Silver", desc: "Clients fréquents (+500 pts)" },
  { id: "GOLD", label: "Gold", desc: "Clients fidèles (+2 000 pts)" },
  { id: "VIP", label: "VIP", desc: "Clients premium (+5 000 pts)" },
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
    name: "🍷 Terroir & Épicerie Fine",
    title: "Sélection Terroir & Épicerie Fine d'Automne",
    subject: "✨ Offre Privilège : Dégustation & Réductions exclusives sur notre Terroir",
    content: `Découvrez notre nouvelle sélection d'épicerie fine et de produits du terroir soigneusement choisis pour vous :\n\n- 15% de remise sur nos fromages affinés et notre charcuterie artisanale\n- 1 bouteille de jus de pomme artisanal offerte dès 40€ d'achats en rayon terroir\n- Crédit fidélité instantané de 100 points bonus sur votre compte\n\nRendez-vous en magasin pour profiter de cette sélection gourmande disponible jusqu'à épuisement des stocks !`,
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
    ctaText: "En savoir plus sur nos arrivages",
    ctaUrl: "https://supermarket-calais.fr",
  },
  {
    name: "⚡ Ventes Flash x3 Points",
    title: "Journées Privilège : Points Fidélité Triplés",
    subject: "⚡ Ventes Flash : Multipliez vos points par 3 sur tout le magasin !",
    content: `Ce week-end seulement, transformez vos courses en avalanche de points fidélité !\n\n- Tous vos achats vous rapportent 3 fois plus de points en caisse\n- Débloquez instantanément vos prochains bons d'achat de 5€ et 10€\n- Accès prioritaire à notre comptoir caisse pour les membres Silver, Gold et VIP\n\nN'oubliez pas d'indiquer vos coordonnées à notre hôte(sse) de caisse avant la fin de votre encaissement.`,
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Voir mon solde de points fidélité",
    ctaUrl: "https://supermarket-calais.fr",
  },
];

export function CampaignEditorPage({
  storeName = "Super Market Calais",
  storeAddress = "205 Avenue Antoine de Saint-Exupéry, 62100 Calais",
  storePhone = "06 71 54 05 28",
}: CampaignEditorPageProps) {
  const router = useRouter();

  // Wizard Step State (1 to 4)
  const [step, setStep] = useState<number>(1);

  // Audience State (Step 1)
  const [selectedTiers, setSelectedTiers] = useState<LoyaltyTier[]>(["GOLD", "VIP"]);
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Dispatch Mode State (Step 2)
  const [dispatchMode, setDispatchMode] = useState<"ALL_AT_ONCE" | "DAILY_LIMIT">("ALL_AT_ONCE");
  const [dailyLimitStr, setDailyLimitStr] = useState<string>("50");

  // Scheduling State (Step 3)
  const today = getParisDateString();
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return getParisDateString(d);
  });
  const [scheduledTime, setScheduledTime] = useState<string>("00:00");

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

  // Content State (Step 4)
  const [title, setTitle] = useState("Offres Exclusives Fidélité");
  const [subject, setSubject] = useState("🔥 Vos bons plans de la semaine chez Super Market Calais !");
  const [content, setContent] = useState(
    "Profitez de nos offres exceptionnelles dès aujourd'hui dans votre magasin.\n\n- Remises exclusives sur une large sélection de produits frais\n- Points fidélité doublés sur votre passage en caisse\n- Dégustations et surprises au rayon primeurs\n\nPrésentez simplement votre nom ou numéro en caisse pour en bénéficier."
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
  );
  const [ctaText, setCtaText] = useState("Découvrir les offres en magasin");
  const [ctaUrl, setCtaUrl] = useState("https://supermarket-calais.fr");

  // Visualizer Modal & Loading State
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live audience calculation
  useEffect(() => {
    if (selectedTiers.length === 0) {
      setTargetCount(0);
      return;
    }

    let isMounted = true;
    setLoadingCount(true);

    const query = selectedTiers.join(",");
    fetch(`/api/admin/deals/audience?tiers=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject("Fetch error")))
      .then((data) => {
        if (isMounted) setTargetCount(data.totalTargets ?? null);
      })
      .catch(() => {
        if (isMounted) setTargetCount(null);
      })
      .finally(() => {
        if (isMounted) setLoadingCount(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTiers]);

  // Campaign UUID ref for grouping uploads under compaigns/${campaignId}/...
  const campaignIdRef = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `camp_${Date.now()}`
  );

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("campaignId", campaignIdRef.current);

      const res = await fetch("/api/admin/deals/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Échec de l'upload.");

      setImageUrl(data.fullUrl || data.url);
      toast.success("Image importée avec succès !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi de l'image.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const applyPreset = (preset: (typeof CAMPAIGN_PRESETS)[number]) => {
    setTitle(preset.title);
    setSubject(preset.subject);
    setContent(preset.content);
    setImageUrl(preset.imageUrl);
    setCtaText(preset.ctaText);
    setCtaUrl(preset.ctaUrl);
    toast.success(`Modèle « ${preset.name} » appliqué avec succès !`);
  };

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

  // Step Validation guards
  const validateStep1 = () => {
    if (selectedTiers.length === 0) {
      setErrorMsg("Veuillez sélectionner au moins un palier de fidélité.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const validateStep2 = () => {
    if (dispatchMode === "DAILY_LIMIT") {
      const parsedLimit = parseInt(dailyLimitStr, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        setErrorMsg("Le quota d'emails quotidien doit être supérieur à 0.");
        return false;
      }
    }
    setErrorMsg("");
    return true;
  };

  const validateStep3 = () => {
    if (!startDate || !endDate) {
      setErrorMsg("Veuillez définir une période valide.");
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
    if (step > 1) setStep(step - 1);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg("Le titre interne doit comporter au moins 3 caractères.");
      return;
    }

    if (!subject.trim() || subject.trim().length < 3) {
      setErrorMsg("L'objet de l'email doit comporter au moins 3 caractères.");
      return;
    }

    if (!content.trim() || content.trim().length < 10) {
      setErrorMsg("Le message doit comporter au moins 10 caractères.");
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
        imageUrl: imageUrl?.trim() || null,
        ctaText: ctaText.trim() || "Découvrir les offres en magasin",
        ctaUrl: ctaUrl.trim() || "https://supermarket-calais.fr",
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

      toast.success("Campagne enregistrée et programmée avec succès !");
      router.push("/admin/deals");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de sauvegarder la campagne.");
      toast.error(err.message || "Erreur de création.");
    } finally {
      setLoadingSubmit(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/deals"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors py-1 px-2.5 rounded-lg hover:bg-[var(--color-surface-hover)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour aux campagnes</span>
          </Link>
          <span className="text-xs text-[var(--color-text-muted)] opacity-40">/</span>
          <span className="text-xs font-semibold text-[var(--color-primary)]">
            Nouvelle campagne
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
              Création &amp; Configuration de Campagne
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
              Étape {step} sur 4 : {
                step === 1 ? "Ciblage de l'audience et des catégories de clients" :
                step === 2 ? "Mode d'envoi (groupé ou quota quotidien lissé)" :
                step === 3 ? "Période de validité et heure d'exécution 24h" :
                "Contenu de l'e-mail, modèles et prévisualisation"
              }
            </p>
          </div>
          <span className="text-xs font-bold font-mono px-3.5 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shrink-0 self-start sm:self-auto">
            Étape {step} / 4
          </span>
        </div>
      </div>

      {/* Stepper Tabs - Freely clickable to jump to any step */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { num: 1, label: "Audience & Cibles", icon: Users },
          { num: 2, label: "Mode d'envoi", icon: Layers },
          { num: 3, label: "Planification 24h", icon: Calendar },
          { num: 4, label: "Contenu & Aperçu", icon: FileText },
        ].map((s) => {
          const Icon = s.icon;
          const isCurrent = step === s.num;
          const isDone = step > s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                setErrorMsg("");
                setStep(s.num);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                isCurrent
                  ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] font-bold shadow-xs ring-2 ring-[var(--color-primary)]/20"
                  : isDone
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold hover:border-emerald-500"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/50"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                  Étape {s.num}
                </span>
                <strong className="text-xs truncate block">{s.label}</strong>
              </div>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: AUDIENCE & CIBLAGE */}
      {step === 1 && (
        <Card padded="lg" className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--color-primary)]" />
                <span>1. Choisissez les catégories de clients à cibler</span>
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Sélectionnez les paliers de fidélité concernés par cette offre commerciale (sélection multiple).
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
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

          {/* Tier Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ALL_TIERS.map((t) => {
              const isChecked = selectedTiers.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTier(t.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                    isChecked
                      ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-2xs"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                      isChecked
                        ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <strong className="text-sm font-bold text-[var(--color-text)] block">
                      Palier {t.label}
                    </strong>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                      {t.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Audience Counter */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none">🎯</span>
              <div>
                <span className="text-xs font-bold text-[var(--color-text)] block">
                  Estimation de l&apos;audience ciblée
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Clients disposant d&apos;une adresse e-mail valide dans les paliers sélectionnés.
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              {loadingCount ? (
                <span className="text-xs text-[var(--color-text-muted)] animate-pulse">Calcul...</span>
              ) : (
                <strong className="text-xl sm:text-2xl font-mono font-black text-[var(--color-primary)]">
                  {targetCount !== null ? `${targetCount} client${targetCount > 1 ? "s" : ""}` : "—"}
                </strong>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-4 flex items-center justify-between border-t border-[var(--color-border)]">
            <Link href="/admin/deals">
              <Button type="button" variant="ghost">
                Annuler
              </Button>
            </Link>

            <Button type="button" variant="primary" onClick={handleNext} className="gap-2 font-bold">
              <span>Continuer vers le mode d&apos;envoi</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: MODE DE DIFFUSION */}
      {step === 2 && (
        <Card padded="lg" className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-[var(--color-border)] space-y-0.5">
            <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--color-primary)]" />
              <span>2. Choisissez le mode d&apos;envoi des e-mails</span>
            </h2>
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

          {dispatchMode === "DAILY_LIMIT" && (
            <div className="p-4 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-3 animate-in fade-in">
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
                    className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-mono hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                  >
                    {preset}/j
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="pt-4 flex items-center justify-between border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Précédent</span>
            </Button>

            <Button type="button" variant="primary" onClick={handleNext} className="gap-2 font-bold">
              <span>Continuer vers la planification</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: PLANIFICATION & HEURE 24H */}
      {step === 3 && (
        <Card padded="lg" className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-[var(--color-border)] space-y-0.5">
            <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
              <span>3. Définissez la période et l&apos;heure précise d&apos;envoi</span>
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Le job est synchronisé en permanence sur l&apos;heure locale Europe/Paris.
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

          {/* Smart 24H Time Input Block */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-4">
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
                <div className="inline-flex p-0.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs">
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

            {/* Warning for Suspicious Morning Time */}
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
            <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs flex items-center justify-between gap-2">
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

            {/* Quick time presets */}
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

          {/* Navigation */}
          <div className="pt-4 flex items-center justify-between border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Précédent</span>
            </Button>

            <Button type="button" variant="primary" onClick={handleNext} className="gap-2 font-bold">
              <span>Continuer vers le contenu</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: CONTENU & APERÇU EN MODALE (DERNIÈRE ÉTAPE) */}
      {step === 4 && (
        <form onSubmit={handleSubmit}>
          <Card padded="lg" className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>4. Rédigez le contenu et prévisualisez l&apos;email</span>
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Personnalisez l&apos;offre commerciale. Vous pouvez visualiser l&apos;e-mail complet via la modale d&apos;aperçu.
                </p>
              </div>

              {/* Prefill button & Visualize Modal button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(CAMPAIGN_PRESETS[0])}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Remplir instantanément avec un modèle de promotion prêt à l'envoi"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>⚡ Pré-remplir</span>
                </button>

                {/* THE ONLY PLACE IN CREATION TO VISUALIZE THE EMAIL */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVisualizerOpen(true)}
                  className="gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 hover:bg-indigo-100/50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualiser l&apos;email (Aperçu en modale)</span>
                </Button>
              </div>
            </div>

            {/* Ready-to-use Preset chips */}
            <div className="p-3.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-2">
              <span className="text-[11px] font-semibold text-[var(--color-text-muted)] block">
                Modèles de campagne prêts à l&apos;emploi :
              </span>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 text-xs font-medium text-[var(--color-text)] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Internal Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--color-text)]">
                Titre interne de la campagne *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Ventes Flash Primeurs -20% Week-end"
                className="w-full h-11 text-sm font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            {/* Banner Image Upload & Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-text)]">
                Image d&apos;en-tête (Bannière promotionnelle)
              </label>

              {imageUrl ? (
                <div className="relative rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-hover)] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Bannière campagne"
                    className="w-full h-44 object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Remplacer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-surface-hover)] text-center cursor-pointer transition-colors space-y-2"
                >
                  <div className="inline-flex p-3 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-primary)]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-[var(--color-text)]">
                    {isUploadingImage ? "Téléversement en cours..." : "Cliquez pour importer une bannière"}
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Format recommandé : JPG, PNG ou WebP (environ 1200 x 600 px)
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Email Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--color-text)]">
                Objet de l&apos;email (ce que le client voit dans sa boîte de réception) *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex : 🔥 Bonnes Affaires : -20% sur les Primeurs et Points Doublés !"
                className="w-full h-11 text-sm font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            {/* Email Message Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[var(--color-text)]">
                  Corps du message promotionnel *
                </label>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Astuce : Utilisez des tirets « - » pour créer des puces stylisées.
                </span>
              </div>
              <textarea
                required
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Rédigez ici le détail des offres, dates et avantages..."
                className="w-full text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-sans leading-relaxed"
              />
            </div>

            {/* CTA Button Text & URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text)]">
                  Texte du bouton d&apos;action (CTA)
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Découvrir les offres en magasin"
                  className="w-full h-11 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                  className="w-full h-11 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-4 flex items-center justify-between border-t border-[var(--color-border)]">
              <Button type="button" variant="secondary" onClick={handleBack} disabled={loadingSubmit}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Précédent</span>
              </Button>

              <div className="flex items-center gap-2.5">
                {/* Visualizer modal button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVisualizerOpen(true)}
                  className="gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 hover:bg-indigo-100/50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualiser l&apos;email (Aperçu en modale)</span>
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
          </Card>
        </form>
      )}

      {/* Standalone Fullscreen Email Visualizer Modal (available at Step 4) */}
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
    </div>
  );
}
