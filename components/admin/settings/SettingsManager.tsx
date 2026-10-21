'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSettings, DEFAULT_APP_SETTINGS } from '@/lib/settings/types';
import { updateSettingsAction, resetSettingsAction } from '@/app/admin/settings/actions';
import { Card } from '@/components/ui/card';
import { OpeningHoursEditor } from '@/components/admin/settings/OpeningHoursEditor';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import {
  Coins,
  Store,
  CreditCard,
  Bell,
  Clock,
  Save,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calculator,
} from 'lucide-react';

interface SettingsManagerProps {
  initialSettings: AppSettings;
}

export function SettingsManager({ initialSettings }: SettingsManagerProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<'loyalty' | 'pos' | 'store' | 'hours' | 'notifications'>('loyalty');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // String states for numeric fields to prevent HTML5 step-mismatch errors
  const [pointValueStr, setPointValueStr] = useState(
    initialSettings.loyalty.pointValueInEuro.toString()
  );
  const [ratioStr, setRatioStr] = useState(
    initialSettings.loyalty.euroToPointsRatio.toString()
  );
  const [minRedeemStr, setMinRedeemStr] = useState(
    initialSettings.loyalty.minPointsToRedeem.toString()
  );
  const [maxDiscountStr, setMaxDiscountStr] = useState(
    initialSettings.loyalty.maxDiscountPerTransactionEuro.toString()
  );
  const [tierSilverStr, setTierSilverStr] = useState(
    initialSettings.loyalty.tierSilverMinPoints.toString()
  );
  const [tierGoldStr, setTierGoldStr] = useState(
    initialSettings.loyalty.tierGoldMinPoints.toString()
  );
  const [tierVipStr, setTierVipStr] = useState(
    initialSettings.loyalty.tierVipMinPoints.toString()
  );

  // Helper to parse arrays from comma-separated strings
  const [quickAmountsStr, setQuickAmountsStr] = useState(
    initialSettings.pos.quickPurchaseAmounts.join(', ')
  );
  const [quickPointsStr, setQuickPointsStr] = useState(
    initialSettings.pos.quickRedeemPoints.join(', ')
  );

  // Live conversion simulator helpers (supports both dot and comma decimal input)
  const simulatedPointValue = parseFloat(pointValueStr.trim().replace(',', '.')) || 0;
  const sim50 = (50 * simulatedPointValue).toFixed(2);
  const sim100 = (100 * simulatedPointValue).toFixed(2);
  const sim250 = (250 * simulatedPointValue).toFixed(2);
  const sim500 = (500 * simulatedPointValue).toFixed(2);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    // Parse and validate numeric fields
    const parsedPointValue = parseFloat(pointValueStr.trim().replace(',', '.'));
    if (isNaN(parsedPointValue) || parsedPointValue < 0.001 || parsedPointValue > 1) {
      setErrorMsg("La valeur de 1 point doit être un nombre valide entre 0.001 € et 1.00 € (ex: 0.05).");
      setSaving(false);
      return;
    }

    const parsedRatio = parseFloat(ratioStr.trim().replace(',', '.'));
    if (isNaN(parsedRatio) || parsedRatio < 0.1 || parsedRatio > 50) {
      setErrorMsg("Le taux de points par euro doit être un nombre entre 0.1 et 50.");
      setSaving(false);
      return;
    }

    const parsedMinRedeem = parseInt(minRedeemStr.trim(), 10);
    if (isNaN(parsedMinRedeem) || parsedMinRedeem < 0) {
      setErrorMsg("Le seuil minimum de points doit être un nombre entier supérieur ou égal à 0.");
      setSaving(false);
      return;
    }

    const parsedMaxDiscount = parseFloat(maxDiscountStr.trim().replace(',', '.'));
    if (isNaN(parsedMaxDiscount) || parsedMaxDiscount < 0) {
      setErrorMsg("La remise maximale doit être un nombre supérieur ou égal à 0 (0 pour illimité).");
      setSaving(false);
      return;
    }

    const parsedSilver = parseInt(tierSilverStr.trim(), 10);
    const parsedGold = parseInt(tierGoldStr.trim(), 10);
    const parsedVip = parseInt(tierVipStr.trim(), 10);

    if (isNaN(parsedSilver) || isNaN(parsedGold) || isNaN(parsedVip)) {
      setErrorMsg("Les seuils de paliers doivent être des nombres entiers.");
      setSaving(false);
      return;
    }

    if (parsedSilver >= parsedGold) {
      setErrorMsg("Le seuil Gold doit être strictement supérieur au seuil Silver.");
      setSaving(false);
      return;
    }

    if (parsedGold >= parsedVip) {
      setErrorMsg("Le seuil VIP doit être strictement supérieur au seuil Gold.");
      setSaving(false);
      return;
    }

    if (
      !settings.notifications.senderEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.notifications.senderEmail.trim())
    ) {
      setErrorMsg("Veuillez saisir une adresse email d'expédition valide pour les notifications.");
      setSaving(false);
      return;
    }

    // Store identity validation
    if (!settings.store.storeName || settings.store.storeName.trim().length < 2) {
      setErrorMsg("Le nom de l'enseigne doit comporter au moins 2 caractères.");
      setSaving(false);
      return;
    }

    if (
      settings.store.email &&
      settings.store.email.trim() !== "" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.store.email.trim())
    ) {
      setErrorMsg("L'adresse email de contact du magasin est invalide.");
      setSaving(false);
      return;
    }

    // Parse comma separated arrays
    const parsedAmounts = quickAmountsStr
      .split(',')
      .map((s) => parseFloat(s.trim().replace(',', '.')))
      .filter((n) => !isNaN(n) && n > 0);

    const parsedPoints = quickPointsStr
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    const updatedSettings: AppSettings = {
      ...settings,
      loyalty: {
        pointValueInEuro: parsedPointValue,
        euroToPointsRatio: parsedRatio,
        minPointsToRedeem: parsedMinRedeem,
        maxDiscountPerTransactionEuro: parsedMaxDiscount,
        tierSilverMinPoints: parsedSilver,
        tierGoldMinPoints: parsedGold,
        tierVipMinPoints: parsedVip,
      },
      pos: {
        ...settings.pos,
        quickPurchaseAmounts: parsedAmounts.length > 0 ? parsedAmounts : DEFAULT_APP_SETTINGS.pos.quickPurchaseAmounts,
        quickRedeemPoints: parsedPoints.length > 0 ? parsedPoints : DEFAULT_APP_SETTINGS.pos.quickRedeemPoints,
      },
    };

    try {
      const res = await updateSettingsAction(updatedSettings);
      if (res.success && res.settings) {
        setSettings(res.settings);
        setPointValueStr(res.settings.loyalty.pointValueInEuro.toString());
        setRatioStr(res.settings.loyalty.euroToPointsRatio.toString());
        setMinRedeemStr(res.settings.loyalty.minPointsToRedeem.toString());
        setMaxDiscountStr(res.settings.loyalty.maxDiscountPerTransactionEuro.toString());
        setTierSilverStr(res.settings.loyalty.tierSilverMinPoints.toString());
        setTierGoldStr(res.settings.loyalty.tierGoldMinPoints.toString());
        setTierVipStr(res.settings.loyalty.tierVipMinPoints.toString());
        toast.success("Paramètres enregistrés avec succès !");
        router.refresh();
      } else {
        const err = res.error || "Une erreur est survenue lors de l'enregistrement.";
        setErrorMsg(err);
        toast.error(err);
      }
    } catch {
      const netErr = "Erreur de communication avec le serveur.";
      setErrorMsg(netErr);
      toast.error(netErr);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    setErrorMsg(null);
    try {
      const res = await resetSettingsAction();
      if (res.success && res.settings) {
        setSettings(res.settings);
        setPointValueStr(res.settings.loyalty.pointValueInEuro.toString());
        setRatioStr(res.settings.loyalty.euroToPointsRatio.toString());
        setMinRedeemStr(res.settings.loyalty.minPointsToRedeem.toString());
        setMaxDiscountStr(res.settings.loyalty.maxDiscountPerTransactionEuro.toString());
        setTierSilverStr(res.settings.loyalty.tierSilverMinPoints.toString());
        setTierGoldStr(res.settings.loyalty.tierGoldMinPoints.toString());
        setTierVipStr(res.settings.loyalty.tierVipMinPoints.toString());
        setQuickAmountsStr(res.settings.pos.quickPurchaseAmounts.join(', '));
        setQuickPointsStr(res.settings.pos.quickRedeemPoints.join(', '));
        setShowResetConfirm(false);
        toast.success("Configuration réinitialisée aux valeurs par défaut !");
        router.refresh();
      } else {
        toast.error("Échec de la réinitialisation.");
      }
    } catch {
      toast.error("Erreur serveur lors de la réinitialisation.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-surface)] to-[var(--color-surface-hover)] border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning-subtle text-warning-text border border-warning-border">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Console Administrateur · Configuration Globale</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
            Paramètres du Magasin &amp; Fidélité
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Configurez la valeur monétaire des points de fidélité, les seuils de remise, les paramètres de caisse, l&apos;identité commerciale et les horaires d&apos;ouverture de votre enseigne.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowResetConfirm(true)}
            disabled={saving || resetting}
            className="text-xs h-10 px-3.5 gap-1.5 border-[var(--color-border)]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <span>Rétablir défaut</span>
          </Button>

          <Button
            type="submit"
            form="settings-form"
            disabled={saving || resetting}
            className="text-xs h-10 px-5 gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-on-color shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-danger-subtle border border-danger-border text-xs font-semibold text-danger-text flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setActiveTab('loyalty')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'loyalty'
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Points &amp; Fidélité</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'pos'
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Caisse &amp; Raccourcis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'store'
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Identité Magasin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hours')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'hours'
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Horaires &amp; Fermetures</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Emails &amp; Notifications</span>
        </button>
      </div>

      {/* Main Form (noValidate disables browser native step tooltips) */}
      <form id="settings-form" onSubmit={handleSave} noValidate className="space-y-6">
        {/* TAB 1: POINTS & FIDÉLITÉ */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6">
            {/* 1.1 Highlight: Point Value in Euros */}
            <Card padded="lg" className="border-[var(--color-primary)]/30 bg-[var(--color-surface)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-primary)]" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--color-text)]">
                      Valeur Monétaire du Point Fidélité
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Définit le montant exact en Euros déduit pour chaque point utilisé en caisse (par défaut : 0.05 € = 5 centimes).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[var(--color-text)]">
                      Valeur de 1 point en Euro (€) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={pointValueStr}
                        onChange={(e) => setPointValueStr(e.target.value)}
                        placeholder="0.05"
                        className="w-full h-12 text-lg font-bold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 pr-16 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--color-text-muted)] select-none pointer-events-none">
                        € / pt
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--color-text-muted)] block">
                      Valeur standard recommandée : <strong>0.05 €</strong> (soit 100 points = 5.00 € de réduction).
                    </span>
                  </div>

                  {/* Realtime Live Simulator */}
                  <div className="p-4 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
                      <Calculator className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      <span>Simulateur de conversion en direct</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
                        <span className="text-[10px] text-[var(--color-text-muted)] block">50 pts</span>
                        <strong className="text-xs font-extrabold text-[var(--color-primary)]">{sim50} €</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
                        <span className="text-[10px] text-[var(--color-text-muted)] block">100 pts</span>
                        <strong className="text-xs font-extrabold text-[var(--color-primary)]">{sim100} €</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
                        <span className="text-[10px] text-[var(--color-text-muted)] block">250 pts</span>
                        <strong className="text-xs font-extrabold text-[var(--color-primary)]">{sim250} €</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
                        <span className="text-[10px] text-[var(--color-text-muted)] block">500 pts</span>
                        <strong className="text-xs font-extrabold text-[var(--color-primary)]">{sim500} €</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 1.2 Acquisition & Redemption Rules */}
            <Card padded="lg" className="border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-text)]">
                Règles de Collecte &amp; Limites de Remise
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Points gagnés par Euro dépensé
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={ratioStr}
                      onChange={(e) => setRatioStr(e.target.value)}
                      placeholder="1"
                      className="w-full h-11 text-sm font-bold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <span className="text-[11px] text-[var(--color-text-muted)] block">
                    1 € dépensé crédite {ratioStr} point(s).
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Seuil minimum pour utiliser des points (pts)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minRedeemStr}
                    onChange={(e) => setMinRedeemStr(e.target.value)}
                    placeholder="50"
                    className="w-full h-11 text-sm font-bold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] block">
                    Minimum de points requis avant de pouvoir déduire une remise en caisse.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Remise max par passage en caisse (€)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={maxDiscountStr}
                    onChange={(e) => setMaxDiscountStr(e.target.value)}
                    placeholder="50"
                    className="w-full h-11 text-sm font-bold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] block">
                    Plafond de réduction en Euros (0 = sans plafond).
                  </span>
                </div>
              </div>
            </Card>

            {/* 1.3 Tier Thresholds */}
            <Card padded="lg" className="border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text)]">
                  Paliers des Statuts Clients (Points Historiques Cumulés)
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Le statut d&apos;un client est calculé d&apos;après le total historique de points cumulés depuis son inscription (le statut ne redescend jamais lors d&apos;une utilisation de points).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-[var(--color-surface-hover)]">
                  <span className="text-xs font-bold text-text block">
                    🥈 Seuil Silver (pts)
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tierSilverStr}
                    onChange={(e) => setTierSilverStr(e.target.value)}
                    placeholder="500"
                    className="w-full h-10 text-sm font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)]"
                  />
                  <span className="text-[10px] text-[var(--color-text-muted)] block">Bronze : 0 à {parseInt(tierSilverStr, 10) - 1 || 499} pts</span>
                </div>

                <div className="space-y-1.5 p-3.5 rounded-xl border border-warning-border bg-warning-subtle">
                  <span className="text-xs font-bold text-warning-text block">
                    🥇 Seuil Gold (pts)
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tierGoldStr}
                    onChange={(e) => setTierGoldStr(e.target.value)}
                    placeholder="2000"
                    className="w-full h-10 text-sm font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)]"
                  />
                  <span className="text-[10px] text-[var(--color-text-muted)] block">Silver : {tierSilverStr} à {parseInt(tierGoldStr, 10) - 1 || 1999} pts</span>
                </div>

                <div className="space-y-1.5 p-3.5 rounded-xl border border-highlight-border bg-highlight-subtle">
                  <span className="text-xs font-bold text-highlight-text block">
                    👑 Seuil VIP (pts)
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tierVipStr}
                    onChange={(e) => setTierVipStr(e.target.value)}
                    placeholder="5000"
                    className="w-full h-10 text-sm font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)]"
                  />
                  <span className="text-[10px] text-[var(--color-text-muted)] block">VIP : {tierVipStr} pts et plus</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: CAISSE & RACCOURCIS POS */}
        {activeTab === 'pos' && (
          <div className="space-y-6">
            <Card padded="lg" className="border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-highlight-subtle text-highlight-text flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text)]">
                    Paramètres de l&apos;Interface Caisse
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Personnalisez les boutons d&apos;accès rapide proposés aux caissiers pour accélérer l&apos;encaissement.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Nom du poste de caisse par défaut
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.pos.defaultCashierStation}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pos: {
                          ...settings.pos,
                          defaultCashierStation: e.target.value,
                        },
                      })
                    }
                    placeholder="Caisse #1"
                    className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] block">
                    Libellé imprimé sur les historiques et fiches clients.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Motif de déduction par défaut
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.pos.defaultRedeemReason}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pos: {
                          ...settings.pos,
                          defaultRedeemReason: e.target.value,
                        },
                      })
                    }
                    placeholder="Remise fidélité en caisse"
                    className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] block">
                    Libellé par défaut enregistré pour les transactions de déduction de points.
                  </span>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Boutons de montants d&apos;achat rapides en caisse (€)
                  </label>
                  <input
                    type="text"
                    value={quickAmountsStr}
                    onChange={(e) => setQuickAmountsStr(e.target.value)}
                    placeholder="12.5, 45.8, 75.5, 120.0"
                    className="w-full h-11 text-sm font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] block">
                    Séparez les montants par des virgules (ex: 10, 25, 50, 100).
                  </span>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Boutons de raccourcis de points à déduire (pts)
                  </label>
                  <input
                    type="text"
                    value={quickPointsStr}
                    onChange={(e) => setQuickPointsStr(e.target.value)}
                    placeholder="50, 100, 250, 500"
                    className="w-full h-11 text-sm font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] block">
                    Séparez les nombres de points par des virgules (ex: 50, 100, 200, 500).
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: IDENTITÉ MAGASIN */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <Card padded="lg" className="border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-subtle text-success-text flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text)]">
                    Identité Commerciale du Magasin
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Coordonnées officielles de l&apos;enseigne utilisées sur les cartes de fidélité et dans les emails.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Nom de l&apos;enseigne *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.store.storeName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: {
                          ...settings.store,
                          storeName: e.target.value,
                        },
                      })
                    }
                    className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Slogan commercial
                  </label>
                  <input
                    type="text"
                    value={settings.store.tagline}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: {
                          ...settings.store,
                          tagline: e.target.value,
                        },
                      })
                    }
                    className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Adresse postale du magasin
                  </label>
                  <input
                    type="text"
                    value={settings.store.address}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: {
                          ...settings.store,
                          address: e.target.value,
                        },
                      })
                    }
                    className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Téléphone de contact
                  </label>
                  <input
                    type="tel"
                    value={settings.store.phone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: {
                          ...settings.store,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--color-text)]">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    required
                    value={settings.store.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: {
                          ...settings.store,
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: HORAIRES & FERMETURES EXCEPTIONNELLES */}
        {activeTab === 'hours' && (
          <OpeningHoursEditor value={settings.hours} onChange={(hours) => setSettings({ ...settings, hours })} />
        )}

        {/* TAB 5: NOTIFICATIONS & EMAILS */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card padded="lg" className="border-[var(--color-border)] bg-[var(--color-surface)] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info-subtle text-info-text flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text)]">
                    Emails Automatiques &amp; Activation
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Contrôle des envois automatiques via l&apos;API Brevo lors des créations de comptes.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {/* Expéditeur des notifications */}
                <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📬</span>
                    <h3 className="text-sm font-bold text-[var(--color-text)]">
                      Expéditeur des notifications (Sender Email)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                        Adresse email d&apos;expédition *
                      </label>
                      <input
                        type="email"
                        value={settings.notifications.senderEmail || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              senderEmail: e.target.value,
                            },
                          })
                        }
                        placeholder="notifications@supermarket-calais.fr"
                        className="w-full h-11 text-sm font-medium font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        required
                      />
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Adresse utilisée comme expéditeur (« From ») pour tous les e-mails envoyés aux clients et caissiers via Brevo.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                        Nom d&apos;affichage de l&apos;expéditeur
                      </label>
                      <input
                        type="text"
                        value={settings.notifications.senderName || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              senderName: e.target.value,
                            },
                          })
                        }
                        placeholder="Super Market Calais"
                        className="w-full h-11 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Nom affiché dans la boîte de messagerie du destinataire.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toggles d'envoi automatique */}
                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] cursor-pointer hover:border-[var(--color-primary)]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sendWelcomeEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          sendWelcomeEmail: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 mt-0.5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[var(--color-text)] block">
                      Envoi d&apos;email d&apos;activation lors de la création d&apos;un client
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                      Envoie automatiquement le lien sécurisé pour définir son mot de passe et accéder à sa carte de fidélité numérique.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] cursor-pointer hover:border-[var(--color-primary)]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sendCashierInviteEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          sendCashierInviteEmail: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 mt-0.5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[var(--color-text)] block">
                      Envoi d&apos;email d&apos;invitation lors de la création d&apos;un caissier
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                      Envoie un e-mail professionnel invitant le nouveau collaborateur de caisse à activer son accès.
                    </span>
                  </div>
                </label>
              </div>
            </Card>
          </div>
        )}

        {/* Footer info & Save bar */}
        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success-text shrink-0" />
            <span>
              {settings.updatedAt ? (
                <>Dernière mise à jour le <strong>{new Date(settings.updatedAt).toLocaleString('fr-FR')}</strong>{settings.updatedBy ? ` par ${settings.updatedBy}` : ''}</>
              ) : (
                'Paramètres initiaux par défaut appliqués'
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={saving || resetting}
              className="text-xs h-10 px-5 gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-on-color shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-overlay backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-warning-subtle text-warning-text flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[var(--color-text)]">
                Rétablir la configuration par défaut ?
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Toutes les valeurs (valeur du point à 0.05 €, ratios, seuils de statuts, raccourcis de caisse, horaires d&apos;ouverture et fermetures exceptionnelles) seront réinitialisées aux valeurs usine d&apos;origine.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="text-xs h-9 px-4"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="text-xs h-9 px-4 bg-warning hover:bg-warning/90 text-on-color"
              >
                {resetting ? 'Rétablissement...' : 'Confirmer la réinitialisation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
