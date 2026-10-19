import Link from "next/link";
import {
  Lock,
  Eye,
  Trash2,
  FileText,
  Mail,
  MapPin,
  CheckCircle2,
  Building2,
  UserCheck,
  Server,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

/** Sections of the policy, in order (anchor id + table of contents label). */
const SECTIONS = [
  { id: "responsable", label: "Responsable du traitement" },
  { id: "donnees-collectees", label: "Données collectées" },
  { id: "finalites", label: "Finalités et bases légales" },
  { id: "conservation", label: "Durée de conservation" },
  { id: "destinataires", label: "Destinataires" },
  { id: "vos-droits", label: "Vos droits" },
  { id: "suppression-donnees", label: "Suppression des données" },
  { id: "cookies", label: "Cookies" },
  { id: "contact-dpo", label: "Contact et réclamation" },
];

export function PrivacyPolicyContent() {
  return (
    <div className="w-full flex-1">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[220px_1fr] lg:gap-16">
        {/* Table of contents: sticky inside the site scroll container (§ 25.4) */}
        <nav aria-label="Sommaire" className="hidden lg:block">
          <div className="sticky top-28 space-y-3">
            <p className="text-sm font-semibold text-text">Sommaire</p>
            <ol className="space-y-1 text-sm">
              {SECTIONS.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-2 rounded-[var(--radius-button)] px-2 py-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
                  >
                    <span className="tabular-nums">{index + 1}.</span>
                    <span>{section.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <main className="min-w-0 max-w-3xl">
          {/* Header Banner */}
          <div className="mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary-ink">
              <FileText className="w-4 h-4" />
              <span>Document Légal Officiel</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] tracking-tight">
              Politique de Confidentialité
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
              Protection et gestion de vos données personnelles chez <strong>Super Market Calais</strong>. 
              Cette politique décrit en toute transparence comment nous traitons, sécurisons et respectons vos données conformément au Règlement Général sur la Protection des Données (RGPD) et aux exigences des plateformes tierces (Meta / Facebook).
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)] pt-4 border-t border-[var(--color-border)]">
              <span>Dernière mise à jour : <strong>17 Octobre 2026</strong></span>
              <span>•</span>
              <span>Statut : <strong>En vigueur &amp; Accessible publiquement</strong></span>
            </div>
          </div>

          {/* Quick Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 rounded-[var(--radius-card)] bg-surface-hover p-6">
            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-surface text-info-text flex items-center justify-center mb-3">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-[var(--color-text)]">Sécurité Maximale</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Vos données sont chiffrées (SSL/TLS) et hébergées sur des serveurs sécurisés situés au sein de l’Union Européenne.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-surface text-success-text flex items-center justify-center mb-3">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-[var(--color-text)]">Zéro Revente</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Nous ne vendons, ne louons et ne cédons jamais vos données personnelles à des courtiers de données ou tiers publicitaires.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-surface text-danger-text flex items-center justify-center mb-3">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-[var(--color-text)]">Suppression Simple</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Vous disposez d’un droit total à l’oubli et pouvez demander la suppression immédiate de toutes vos données à tout moment.
              </p>
            </div>
          </div>

          {/* Legal Sections */}
          <div className="space-y-10 text-base leading-relaxed text-[var(--color-text)]">
            {/* 1. Responsable de traitement */}
            <section id="responsable" className="scroll-mt-24 border-t border-[var(--color-border)] pt-10 space-y-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                  1. Responsable du Traitement des Données
                </h2>
              </div>
              <p className="text-[var(--color-text-muted)]">
                Le responsable du traitement des données personnelles collectées dans le cadre de l’utilisation du site internet, du programme de fidélité et des applications associées est :
              </p>
              <div className="p-4 rounded-[var(--radius-button)] bg-surface-hover border border-[var(--color-border)] space-y-1.5 text-sm">
                <p><strong>Raison sociale :</strong> Super Market Calais</p>
                <p><strong>Adresse de l’établissement :</strong> 205 Avenue Antoine de Saint-Exupéry, 62100 Calais, France</p>
                <p><strong>Téléphone :</strong> 06 71 54 05 28</p>
                <p><strong>E-mail de contact &amp; DPO :</strong> <a href="mailto:contact@supermarket-calais.fr" className="text-[var(--color-primary)] hover:underline font-semibold">contact@supermarket-calais.fr</a></p>
              </div>
            </section>

            {/* 2. Données collectées */}
            <section id="donnees-collectees" className="scroll-mt-24 border-t border-[var(--color-border)] pt-10 space-y-4">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                  2. Quelles données personnelles collectons-nous ?
                </h2>
              </div>
              <p className="text-[var(--color-text-muted)]">
                Dans le cadre de votre relation avec <strong>Super Market Calais</strong>, nous limitons la collecte aux données strictement nécessaires aux finalités poursuivies (« minimisation des données ») :
              </p>
              <ul className="space-y-2.5 pl-1">
                <li className="flex items-start gap-2.5 text-base">
                  <CheckCircle2 className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
                  <div>
                    <strong>Données d’identification et de contact :</strong> Nom, prénom, numéro de téléphone portable (utilisé comme identifiant de fidélité en caisse), adresse e-mail.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-base">
                  <CheckCircle2 className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
                  <div>
                    <strong>Données du programme de fidélité :</strong> Solde de points cumulés, historique des passages en caisse, dates des achats, montants éligibles aux remises, et statuts associés (Bronze, Silver, Gold, VIP).
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-base">
                  <CheckCircle2 className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
                  <div>
                    <strong>Données techniques de connexion :</strong> Adresse IP, type et version de navigateur, horodatage de connexion à des fins strictes de journalisation de sécurité et prévention des abus.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-base">
                  <CheckCircle2 className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
                  <div>
                    <strong>Données provenant des plateformes Meta / Facebook (le cas échéant) :</strong> Si vous choisissez d’interagir avec notre application via les fonctionnalités de connexion Facebook (Meta Login) ou les widgets associés, nous ne recevons que l’identifiant utilisateur Facebook public (Facebook User ID) et l’adresse e-mail autorisée par vos soins. Aucune publication sur votre profil n’est effectuée sans votre accord explicite.
                  </div>
                </li>
              </ul>
            </section>

            {/* 3. Finalités et bases légales */}
            <section id="finalites" className="scroll-mt-24 border-t border-[var(--color-border)] pt-10 space-y-4">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                  3. Finalités du Traitement &amp; Bases Légales (RGPD)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
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
                      <td className="py-3 px-4 text-[var(--color-text-muted)]">Consentement de l’utilisateur (Art. 6.1.a)</td>
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
            <section id="conservation" className="scroll-mt-24 border-t border-[var(--color-border)] pt-10 space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                4. Durée de Conservation des Données
              </h2>
              <p className="text-[var(--color-text-muted)]">
                Vos données personnelles sont conservées uniquement pendant la durée nécessaire à l’accomplissement des finalités pour lesquelles elles ont été collectées :
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-base text-[var(--color-text-muted)]">
                <li><strong>Compte fidélité actif :</strong> Conservé pendant toute la durée d’utilisation de votre compte. En l’absence d’activité pendant une durée consécutive de <strong>3 ans</strong> (aucun passage en caisse, aucune connexion), le compte et les données associées sont automatiquement archivés puis anonymisés/supprimés.</li>
                <li><strong>Communications marketing :</strong> Jusqu’à votre désabonnement (accessible en un clic via le lien de désinscription au bas de chaque e-mail ou via notre page de désabonnement).</li>
                <li><strong>Pièces comptables &amp; facturation :</strong> 10 ans conformément aux dispositions du Code de commerce français.</li>
              </ul>
            </section>

            {/* 5. Destinataires et sous-traitants */}
            <section id="destinataires" className="scroll-mt-24 border-t border-[var(--color-border)] pt-10 space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                5. Destinataires et Transferts de Données
              </h2>
              <p className="text-[var(--color-text-muted)]">
                Les données collectées sont strictement destinées au personnel habilité de <strong>Super Market Calais</strong>. 
                Elles ne sont jamais vendues, louées ou communiquées à des tiers à des fins commerciales sans votre accord exprès.
              </p>
              <p className="text-[var(--color-text-muted)]">
                Pour assurer le fonctionnement technique du service, nous faisons appel à des prestataires de confiance opérant en conformité avec le RGPD :
              </p>
              <ul className="list-disc list-inside space-y-1 text-base text-[var(--color-text-muted)]">
                <li><strong>Hébergement des bases de données :</strong> Serveurs cloud certifiés situés au sein de l’Union Européenne (RGPD compliant).</li>
                <li><strong>Routage des e-mails transactionnels et newsletters :</strong> Brevo (prestataire français certifié conforme aux standards européens de protection des données).</li>
              </ul>
            </section>

            {/* 6. VOS DROITS (RGPD) */}
            <section id="vos-droits" className="scroll-mt-24 border-t border-[var(--color-border)] pt-10 space-y-3">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                  6. Vos Droits Concernant Vos Données Personnelles
                </h2>
              </div>
              <p className="text-[var(--color-text-muted)]">
                Conformément aux articles 15 à 22 du Règlement Général sur la Protection des Données (RGPD), vous disposez à tout moment des droits suivants :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-1">
                <div className="p-3 rounded-[var(--radius-button)] bg-surface-hover border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit d’accès (Art. 15)</strong>
                  Obtenir la confirmation que des données vous concernant sont traitées et en obtenir une copie intégrale.
                </div>
                <div className="p-3 rounded-[var(--radius-button)] bg-surface-hover border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit de rectification (Art. 16)</strong>
                  Demander la correction immédiate de données inexactes ou incomplètes.
                </div>
                <div className="p-3 rounded-[var(--radius-button)] bg-surface-hover border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit à l’effacement (Art. 17)</strong>
                  Obtenir l’effacement définitif de vos données (« droit à l’oubli »).
                </div>
                <div className="p-3 rounded-[var(--radius-button)] bg-surface-hover border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit à la portabilité (Art. 20)</strong>
                  Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.
                </div>
                <div className="p-3 rounded-[var(--radius-button)] bg-surface-hover border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit d’opposition (Art. 21)</strong>
                  Vous opposer à tout moment au traitement de vos données à des fins de prospection commerciale.
                </div>
                <div className="p-3 rounded-[var(--radius-button)] bg-surface-hover border border-[var(--color-border)]">
                  <strong className="block text-[var(--color-text)] mb-1">Droit à la limitation (Art. 18)</strong>
                  Geler temporairement l’utilisation de certaines données en cas de contestation.
                </div>
              </div>
            </section>

            {/* 7. INSTRUCTIONS DE SUPPRESSION DES DONNÉES (Exigence Meta / Facebook & RGPD) */}
            <section
              id="suppression-donnees"
              className="scroll-mt-24 rounded-[var(--radius-card)] border border-warning-border bg-warning-subtle p-6 sm:p-8 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-warning-text" />
                <h2 className="text-xl font-semibold tracking-tight text-warning-text">
                  7. Instructions de Suppression des Données (Data Deletion Instructions)
                </h2>
              </div>
              <p className="text-base text-warning-text/90 leading-relaxed">
                Conformément aux exigences de la plateforme pour développeurs <strong>Meta (Facebook Platform Terms)</strong> et aux règles du <strong>RGPD</strong>, 
                vous avez le plein pouvoir de supprimer à tout moment l’ensemble des données personnelles associées à votre compte ou transmises via Facebook.
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-4 rounded-[var(--radius-button)] bg-surface border border-warning-border space-y-2 text-sm">
                  <h4 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-1.5">
                    <span>Option A : Suppression directe depuis votre compte client</span>
                  </h4>
                  <p className="text-[var(--color-text-muted)]">
                    Connectez-vous à votre espace personnel sur notre site (<Link href="/login" className="text-[var(--color-primary)] font-semibold underline">Espace Client</Link>), 
                    rendez-vous dans la rubrique <strong>Mon Compte &gt; Sécurité &amp; Données</strong>, et cliquez sur <strong>« Supprimer mon compte et mes données »</strong>. 
                    L’effacement de l’intégralité de vos points et informations personnelles est traité immédiatement.
                  </p>
                </div>

                <div className="p-4 rounded-[var(--radius-button)] bg-surface border border-warning-border space-y-2 text-sm">
                  <h4 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-1.5">
                    <span>Option B : Demande par e-mail ou courrier postal</span>
                  </h4>
                  <p className="text-[var(--color-text-muted)]">
                    Vous pouvez simplement nous envoyer un e-mail à :
                  </p>
                  <p className="font-mono font-bold text-sm text-[var(--color-primary)] bg-surface-hover p-2 rounded-lg inline-block">
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
            <section id="cookies" className="scroll-mt-24 border-t border-[var(--color-border)] pt-10 space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                8. Gestion des Cookies et Traceurs
              </h2>
              <p className="text-[var(--color-text-muted)]">
                Notre site utilise exclusivement des cookies techniques strictement indispensables au fonctionnement de la session (maintien de l’authentification et sécurité de l’espace caisse et compte client). 
                Ces cookies ne nécessitent pas de consentement préalable conformément aux recommandations de la CNIL. Aucun cookie publicitaire tiers intrusif n’est déposé à votre insu.
              </p>
            </section>

            {/* 9. Contact et Réclamation auprès de la CNIL */}
            <section id="contact-dpo" className="scroll-mt-24 border-t border-[var(--color-border)] pt-10 space-y-4">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                  9. Contact, DPO &amp; Droit de Réclamation
                </h2>
              </div>
              <p className="text-[var(--color-text-muted)]">
                Pour toute question relative à la présente politique de confidentialité ou pour faire valoir vos droits, vous pouvez contacter notre référent à la protection des données :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-4 rounded-[var(--radius-button)] bg-surface-hover border border-[var(--color-border)] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text)]">
                    <Mail className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>Contact électronique</span>
                  </div>
                  <p className="text-[var(--color-text-muted)]">
                    E-mail : <a href="mailto:contact@supermarket-calais.fr" className="text-[var(--color-primary)] hover:underline font-semibold">contact@supermarket-calais.fr</a>
                  </p>
                  <p className="text-[var(--color-text-muted)]">Délai de réponse moyen : 48 à 72 heures ouvrées.</p>
                </div>

                <div className="p-4 rounded-[var(--radius-button)] bg-surface-hover border border-[var(--color-border)] space-y-1">
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

              <div className="p-4 rounded-[var(--radius-button)] bg-surface-hover border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                <div>
                  Si vous estimez, après nous avoir contactés, que vos droits Informatique et Libertés ne sont pas respectés, 
                  vous avez le droit d’introduire une réclamation auprès de l’autorité de contrôle compétente : 
                  la <strong>Commission Nationale de l’Informatique et des Libertés (CNIL)</strong> sur le site{" "}
                  <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline font-semibold inline-flex items-center gap-0.5">
                    <span>www.cnil.fr</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>{" "}
                  ou par courrier postal au 3 Place de Fontenoy, 75007 Paris.
                </div>
              </div>
            </section>
          </div>

        </main>
      </div>
    </div>
  );
}
export default PrivacyPolicyContent;
