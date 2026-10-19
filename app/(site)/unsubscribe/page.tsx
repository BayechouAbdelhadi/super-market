"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, MailCheck, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/public/AuthShell";

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
        setMessage("Vous êtes de nouveau abonné(e) à nos bons plans et offres.");
      } else {
        setError(data.error || "Une erreur est survenue lors du réabonnement.");
      }
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const feedback = (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}
    </>
  );

  if (isUnsubscribed) {
    return (
      <AuthShell
        withPhoto={false}
        icon={MailCheck}
        iconTone="success"
        title="Désabonnement confirmé"
        description={
          <>
            L&apos;adresse <strong className="font-semibold text-text break-all">{email || "renseignée"}</strong> ne
            recevra plus nos e-mails d&apos;offres.
          </>
        }
      >
        <div className="space-y-5">
          {feedback}
          <div className="flex gap-3">
            <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-success-text" />
            <div>
              <p className="text-base font-semibold text-text">Vos points fidélité restent actifs</p>
              <p className="text-sm leading-relaxed text-text-muted">
                Seuls les e-mails publicitaires sont concernés. Votre compte fidélité et vos remises en caisse
                continuent de fonctionner normalement.
              </p>
            </div>
          </div>
          <div className="space-y-3 border-t border-border pt-5">
            <p className="text-sm text-text-muted">Vous avez cliqué par erreur ou changé d&apos;avis ?</p>
            <Button variant="secondary" fullWidth loading={loading} onClick={handleResubscribe}>
              {loading ? "Mise à jour…" : "Me réabonner aux offres"}
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      withPhoto={false}
      icon={Mail}
      title="Préférences e-mail"
      description="Vous ne souhaitez plus recevoir nos offres et bons plans par e-mail ? Indiquez votre adresse."
    >
      <form onSubmit={handleUnsubscribe} className="space-y-5">
        {feedback}
        <Input
          id="unsubscribe-email"
          type="email"
          label="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre.email@exemple.com"
          autoComplete="email"
          required
          helperText="Votre compte fidélité n'est pas concerné."
        />
        <Button type="submit" variant="destructive" size="lg" fullWidth loading={loading}>
          {loading ? "Traitement…" : "Me désabonner"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="flex-1 p-8 text-center text-sm text-text-muted">Chargement…</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
