"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, MailCheck, ShieldCheck } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const rawEmail = searchParams.get("email") || "";
  // HMAC signature from the email link: required by the API to re-subscribe
  const sig = searchParams.get("sig") || undefined;
  const initialStatus = searchParams.get("status");

  const [email, setEmail] = useState(rawEmail);
  const linkError = searchParams.get("error");
  // Only a signed link from one of our emails can change preferences directly
  const isSignedLink = Boolean(rawEmail && sig);

  const [isUnsubscribed, setIsUnsubscribed] = useState(
    isSignedLink && initialStatus !== "resubscribed"
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    linkError === "invalid_link"
      ? "Ce lien n'est pas valide. Saisissez votre adresse ci-dessous pour recevoir un lien de confirmation."
      : linkError === "unavailable"
        ? "Service temporairement indisponible. Réessayez dans quelques minutes."
        : null
  );

  // Signed link from an email: confirm the unsubscribe on mount
  useEffect(() => {
    if (isSignedLink && initialStatus !== "resubscribed" && rawEmail.includes("@")) {
      setEmail(rawEmail);
      // Ensure backend knows it's unsubscribed
      fetch("/api/marketing/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: rawEmail, action: "unsubscribe", sig }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsUnsubscribed(true);
            setMessage("Votre désabonnement a bien été confirmé.");
          }
        })
        .catch(() => {
          // Silent fallback, state is already positive
        });
    }
  }, [rawEmail, sig, isSignedLink, initialStatus]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/marketing/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The signature only belongs to the address of the link it came with
        body: JSON.stringify({ email, action: "unsubscribe", sig: email === rawEmail ? sig : undefined }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.confirmationSent) {
        // Double opt-out: the change happens when the emailed link is opened
        setMessage(data.message);
      } else if (res.ok && data.success) {
        setIsUnsubscribed(true);
        setMessage("Votre demande de désabonnement a bien été prise en compte.");
      } else {
        setError(data.error || "Une erreur est survenue lors du désabonnement.");
      }
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/marketing/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "resubscribe", sig }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsUnsubscribed(false);
        setMessage("🎉 Vous êtes de nouveau réabonné(e) à nos bons plans et offres promotionnelles !");
      } else {
        setError(data.error || "Une erreur est survenue lors du réabonnement.");
      }
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-surface rounded-2xl border border-border/80 shadow-sm p-6 sm:p-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-danger-subtle text-danger-text mb-3 border border-danger-border">
          <span className="text-xl">🛒</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
          Super Market Calais
        </h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mt-1">
          Gestion des préférences e-mail
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-danger-subtle border border-danger-border text-danger-text text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-5 p-3.5 rounded-xl bg-success-subtle border border-success-border text-success-text text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-success-text" />
          <span>{message}</span>
        </div>
      )}

      {isUnsubscribed ? (
        /* Confirmed Unsubscribed State */
        <div className="space-y-5">
          <div className="text-center py-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success-subtle text-success-text mb-3 border border-success-border">
              <MailCheck className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-text">
              Désabonnement confirmé
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-2 leading-relaxed">
              L'adresse <strong className="text-text font-semibold">{email || "renseignée"}</strong> a été retirée de nos listes de diffusion. Vous ne recevrez plus nos e-mails d'offres promotionnelles.
            </p>
          </div>

          {/* Loyalty Preservation Reassurance Box */}
          <div className="p-4 rounded-xl bg-surface-hover border border-border/70 text-xs text-text-muted leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-info-text shrink-0 mt-0.5" />
            <div>
              <strong className="text-text font-semibold block mb-0.5">
                Vos points fidélité restent 100% actifs
              </strong>
              Ce désabonnement concerne uniquement les e-mails publicitaires. Votre compte fidélité en magasin et vos remises en caisse continuent de fonctionner normalement.
            </div>
          </div>

          {/* Misclick recovery */}
          <div className="pt-2 text-center">
            <p className="text-xs text-text-muted mb-3">
              Vous avez cliqué par mégarde ou vous changez d'avis ?
            </p>
            <button
              onClick={handleResubscribe}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-xs sm:text-sm bg-text hover:bg-text/90 text-background transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mise à jour en cours...
                </>
              ) : (
                "Je souhaite me réabonner aux offres"
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Unsubscribe Input Form */
        <form onSubmit={handleUnsubscribe} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
              Adresse e-mail à désabonner
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              required
              className="w-full h-11 px-3.5 rounded-xl border border-border-hover text-sm focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Vous ne recevrez plus les e-mails d'offres et bons plans hebdomadaires.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-danger hover:bg-danger/90 text-on-color transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              "Confirmer le désabonnement"
            )}
          </button>
        </form>
      )}

      {/* Return home link */}
      <div className="mt-8 pt-4 border-t border-border text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au site Super Market Calais
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-surface-hover flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <Suspense
        fallback={
          <div className="p-8 text-center text-text-muted text-sm">
            Chargement de la page de désabonnement...
          </div>
        }
      >
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
