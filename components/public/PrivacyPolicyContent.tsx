"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  Trash2,
  FileText,
  Mail,
  MapPin,
  Phone,
  CheckCircle2,
  Building2,
  UserCheck,
  Server,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export function PrivacyPolicyContent() {
  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[var(--color-background)] text-[var(--color-text)] font-sans">
      {/* Scrollable Container (§ 25.1 AGENTS.md) */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {/* Top Minimal Navigation Bar */}
        <header className="sticky top-0 z-20 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-[var(--color-border)] px-4 sm:px-8 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors py-1.5 px-3 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Accueil</span>
            </Link>

            <span className="text-neutral-300 dark:text-neutral-700">|</span>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center p-0.5 overflow-hidden shrink-0 shadow-xs">
                <Image
                  src="/logo-hq.png"
                  alt="Super Market Calais"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-extrabold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                Super Market Calais
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Conforme RGPD &amp; Meta</span>
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 py-10 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto w-full">
          {/* Header Banner */}
          <div className="mb-10 text-center sm:text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Document Légal Officiel</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-text)] tracking-tight">
              Politique de Confidentialité
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
              Protection et gestion de vos données personnelles chez <strong>Super Market Calais</strong>. 
              Cette politique décrit en toute transparence comment nous traitons, sécurisons et respectons vos données conformément au Règlement Général sur la Protection des Données (RGPD) et aux exigences des plateformes tierces (Meta / Facebook).
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)]">
              <span>Dernière mise à jour : <strong>17 Octobre 2026</strong></span>
              <span>•</span>
              <span>Statut : <strong>En vigueur &amp; Accessible publiquement</strong></span>
            </div>
          </div>

          {/* Quick Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-1.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center mb-2">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[var(--color-text)]">Sécurité Maximale</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Vos données sont chiffrées (SSL/TLS) et hébergées sur des serveurs sécurisés situés au sein de l'Union Européenne.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-1.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center mb-2">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[var(--color-text)]">Zéro Revente</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Nous ne vendons, ne louons et ne cédons jamais vos données personnelles à des courtiers de données ou tiers publicitaires.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-1.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center mb-2">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[var(--color-text)]">Suppression Simple</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Vous disposez d'un droit total à l'oubli et pouvez demander la suppression immédiate de toutes vos données à tout moment.
              </p>
            </div>
          </div>

          {/* Legal Sections */}
          <div className="space-y-8 text-sm leading-relaxed text-[var(--color-text)]">
            {/* 1. Responsable de traitement */}
            <section id="responsable" className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  1. Responsable du Traitement des Données
                </h2>
              </div>
              <p className="text-[var(--color-text-muted)]">
                Le responsable du traitement des données personnelles collectées dans le cadre de l'utilisation du site internet, du programme de fidélité et des applications associées est :
              </p>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--color-border)] space-y-1.5 text-xs">
                <p><strong>Raison sociale :</strong> Super Market Calais</p>
                <p><strong>Adresse de l'établissement :</strong> 205 Avenue Antoine de Saint-Exupéry, 62100 Calais, France</p>
                <p><strong>Téléphone :</strong> 06 71 54 05 28</p>
                <p><strong>E-mail de contact &amp; DPO :</strong> <a href="mailto:contact@supermarket-calais.fr" className="text-[var(--color-primary)] hover:underline font-semibold">contact@supermarket-calais.fr</a></p>
              </div>
            </section>

            {/* 2. Données collectées */}
            <section id="donnees-collectees" className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  2. Quelles données personnelles collectons-nous ?
                </h2>
              </div>
              <p className="text-[var(--color-text-muted)]">
                Dans le cadre de votre relation avec <strong>Super Market Calais</strong>, nous limitons la collecte aux données strictement nécessaires aux finalités poursuivies (« minimisation des données ») :
              </p>
              <ul className="space-y-2.5 pl-1">
                <li className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Données d'identification et de contact :</strong> Nom, prénom, numéro de téléphone portable (utilisé comme identifiant de fidélité en caisse), adresse e-mail.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Données du programme de fidélité :</strong> Solde de points cumulés, historique des passages en caisse, dates des achats, montants éligibles aux remises, et statuts associés (Bronze, Silver, Gold, VIP).
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Données techniques de connexion :</strong> Adresse IP, type et version de navigateur, horodatage de connexion à des fins strictes de journalisation de sécurité et prévention des abus.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Données provenant des plateformes Meta / Facebook (le cas échéant) :</strong> Si vous choisissez d'interagir avec notre application via les fonctionnalités de connexion Facebook (Meta Login) ou les widgets associés, nous ne recevons que l'identifiant utilisateur Facebook public (Facebook User ID) et l'adresse e-mail autorisée par vos soins. Aucune publication sur votre profil n'est effectuée sans votre accord explicite.
                  </div>
                </li>
              </ul>
            </section>

            {/* 3. Finalités et bases légales */}
            <section id="finalites" className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  3. Finalités du Traitement &amp; Bases Légales (RGPD)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                      <th className="py-2.5 pr-4">Finalité</th>
                      <th className="py-2.5 px-4">Base légale (Art. 6 RGPD)</th>
                      <th className="py-2.5 pl-4">Données concernées</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                    <tr>
                      <td className="py-3 pr-4 font-medium">Gestion du compte fidélité &amp; calcul des remises</td>
                      <td className="py-3 px-4 text-[var(--color-text-muted)]">Exécution contractuelle (Art. 6.1.b)</td>
                      <td className="py-3 pl-4">Nom, téléphone, points, achats</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium">Envoi des bons plans &amp; promotions par e-mail</td>
                      <td className="py-3 px-4 text-[var(--color-text-muted)]">Consentement de l'utilisateur (Art. 6.1.a)</td>
                      <td className="py-3 pl-4">Adresse e-mail, prénom</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium">Sécurité du service &amp; prévention des fraudes</td>
                      <td className="py-3 px-4 text-[var(--color-text-muted)]">Intérêt légitime du responsable (Art. 6.1.f)</td>
                      <td className="py-3 pl-4">Logs techniques, adresse IP</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium">Obligations légales et comptables</td>
                      <td className="py-3 px-4 text-[var(--color-text-muted)]">Obligation légale (Art. 6.1.c)</td>
                      <td className="py-3 pl-4">Historique des transactions de caisse</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Durée de conservation */}
            <section id="conservation" className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                4. Durée de Conservation des Données
              </h2>
              <p className="text-[var(--color-text-muted)]">
                Vos données personnelles sont conservées uniquement pendant la durée nécessaire à l'accomplissement des finalités pour lesquelles elles ont été collectées :
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[var(--color-text-muted)]">
                <li><strong>Compte fidélité actif :</strong> Conservé pendant toute la durée d'utilisation de votre compte. En l'absence d'activité pendant une durée consécutive de <strong>3 ans</strong> (aucun passage en caisse, aucune connexion), le compte et les données associées sont automatiquement archivés puis anonymisés/supprimés.</li>
                <li><strong>Communications marketing :</strong> Jusqu'à votre désabonnement (accessible en un clic via le lien de désinscription au bas de chaque e-mail ou via notre page de désabonnement).</li>
                <li><strong>Pièces comptables &amp; facturation :</strong> 10 ans conformément aux dispositions du Code de commerce français.</li>
              </ul>
            </section>

            {/* 5. Destinataires et sous-traitants */}
            <section id="destinataires" className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                5. Destinataires et Transferts de Données
              </h2>
              <p className="text-[var(--color-text-muted)]">
                Les données collectées sont strictement destinées au personnel habilité de <strong>Super Market Calais</strong>. 
                Elles ne sont jamais vendues, louées ou communiquées à des tiers à des fins commerciales sans votre accord exprès.
              </p>
              <p className="text-[var(--color-text-muted)]">
                Pour assurer le fonctionnement technique du service, nous faisons appel à des prestataires de confiance opérant en conformité avec le RGPD :
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-[var(--color-text-muted)]">
                <li><strong>Hébergement des bases de données :</strong> Serveurs cloud certifiés situés au sein de l'Union Européenne (RGPD compliant).</li>
                <li><strong>Routage des e-mails transactionnels et newsletters :</strong> Brevo (prestataire français certifié conforme aux standards européens de protection des données).</li>
              </ul>
            </section>

            {/* 6. VOS DROITS (RGPD) */}
            <section id="vos-droits" className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  6. Vos Droits Concernant Vos Données Personnelles
                </h2>
              </div>
              <p className="text-[var(--color-text-muted)]">
                Conformément aux articles 15 à 22 du Règlement Général sur la Protection des Données (RGPD), vous disposez à tout moment des droits suivants :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit d'accès (Art. 15)</strong>
                  Obtenir la confirmation que des données vous concernant sont traitées et en obtenir une copie intégrale.
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit de rectification (Art. 16)</strong>
                  Demander la correction immédiate de données inexactes ou incomplètes.
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit à l'effacement (Art. 17)</strong>
                  Obtenir l'effacement définitif de vos données (« droit à l'oubli »).
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit à la portabilité (Art. 20)</strong>
                  Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit d'opposition (Art. 21)</strong>
                  Vous opposer à tout moment au traitement de vos données à des fins de prospection commerciale.
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit à la limitation (Art. 18)</strong>
                  Geler temporairement l'utilisation de certaines données en cas de contestation.
                </div>
              </div>
            </section>

            {/* 7. INSTRUCTIONS DE SUPPRESSION DES DONNÉES (Exigence Meta / Facebook & RGPD) */}
            <section
              id="suppression-donnees"
              className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300/80 dark:border-amber-700/60 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="text-lg font-bold text-amber-950 dark:text-amber-200">
                  7. Instructions de Suppression des Données (Data Deletion Instructions)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                Conformément aux exigences de la plateforme pour développeurs <strong>Meta (Facebook Platform Terms)</strong> et aux règles du <strong>RGPD</strong>, 
                vous avez le plein pouvoir de supprimer à tout moment l'ensemble des données personnelles associées à votre compte ou transmises via Facebook.
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-1.5">
                    <span>Option A : Suppression directe depuis votre compte client</span>
                  </h4>
                  <p className="text-[var(--color-text-muted)]">
                    Connectez-vous à votre espace personnel sur notre site (<Link href="/login" className="text-[var(--color-primary)] font-semibold underline">Espace Client</Link>), 
                    rendez-vous dans la rubrique <strong>Mon Compte &gt; Sécurité &amp; Données</strong>, et cliquez sur <strong>« Supprimer mon compte et mes données »</strong>. 
                    L'effacement de l'intégralité de vos points et informations personnelles est traité immédiatement.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-1.5">
                    <span>Option B : Demande par e-mail ou courrier postal</span>
                  </h4>
                  <p className="text-[var(--color-text-muted)]">
                    Vous pouvez simplement nous envoyer un e-mail à :
                  </p>
                  <p className="font-mono font-bold text-xs text-[var(--color-primary)] bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg inline-block">
                    contact@supermarket-calais.fr
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    avec pour objet <em>« Demande de suppression de mes données personnelles »</em>, en mentionnant votre nom et le numéro de téléphone associé à votre compte. 
                    Votre demande sera traitée sous <strong>30 jours calendaires maximum</strong> sans aucun frais.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. Cookies et traceurs */}
            <section id="cookies" className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                8. Gestion des Cookies et Traceurs
              </h2>
              <p className="text-[var(--color-text-muted)]">
                Notre site utilise exclusivement des cookies techniques strictement indispensables au fonctionnement de la session (maintien de l'authentification et sécurité de l'espace caisse et compte client). 
                Ces cookies ne nécessitent pas de consentement préalable conformément aux recommandations de la CNIL. Aucun cookie publicitaire tiers intrusif n'est déposé à votre insu.
              </p>
            </section>

            {/* 9. Contact et Réclamation auprès de la CNIL */}
            <section id="contact-dpo" className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  9. Contact, DPO &amp; Droit de Réclamation
                </h2>
              </div>
              <p className="text-[var(--color-text-muted)]">
                Pour toute question relative à la présente politique de confidentialité ou pour faire valoir vos droits, vous pouvez contacter notre référent à la protection des données :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--color-border)] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text)]">
                    <Mail className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>Contact électronique</span>
                  </div>
                  <p className="text-[var(--color-text-muted)]">
                    E-mail : <a href="mailto:contact@supermarket-calais.fr" className="text-[var(--color-primary)] hover:underline font-semibold">contact@supermarket-calais.fr</a>
                  </p>
                  <p className="text-[var(--color-text-muted)]">Délai de réponse moyen : 48 à 72 heures ouvrées.</p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--color-border)] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text)]">
                    <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>Courrier postal</span>
                  </div>
                  <p className="text-[var(--color-text-muted)]">
                    Super Market Calais — Protection des Données<br />
                    205 Avenue Antoine de Saint-Exupéry, 62100 Calais, France
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                <div>
                  Si vous estimez, après nous avoir contactés, que vos droits Informatique et Libertés ne sont pas respectés, 
                  vous avez le droit d'introduire une réclamation auprès de l'autorité de contrôle compétente : 
                  la <strong>Commission Nationale de l'Informatique et des Libertés (CNIL)</strong> sur le site{" "}
                  <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline font-semibold inline-flex items-center gap-0.5">
                    <span>www.cnil.fr</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>{" "}
                  ou par courrier postal au 3 Place de Fontenoy, 75007 Paris.
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Back Button */}
          <div className="mt-12 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-neutral-100 dark:hover:bg-neutral-900 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à l'accueil du magasin</span>
            </Link>
            <p>© {new Date().getFullYear()} Super Market Calais. Tous droits réservés.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
export default PrivacyPolicyContent;
