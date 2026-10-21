# Backlog — Super Market Calais

Dernière mise à jour : 21 octobre 2026.

**Priorités** : **P0** bloquant ou touche des clients aujourd'hui · **P1** fort impact · **P2** utile · **P3** confort.
**Effort** : **S** < 1 h · **M** ½ journée · **L** 1 jour ou plus.

Chaque ticket a un identifiant (`SEO-03`, `ACT-02`…) à reprendre dans les commits.

---

## Ordre conseillé

| Sprint | Tickets | Résultat attendu |
|---|---|---|
| **1 — Fondations** ✅ | SEO-01, SEO-02, SEO-03, SEO-04, SEO-12, SEO-15 | Un seul domaine, Google peut tout explorer, plus de pages privées indexées |
| **2 — Partage et données riches** | SEO-05, SEO-06, SEO-11, SEO-10 | Belles vignettes sur Facebook et WhatsApp, fiche Google enrichie, suivi dans la Search Console |
| **3 — Contenu local** | SEO-08, SEO-09, SEO-07, SEO-14 | Positionnement sur « halal Calais », « produits turcs Calais »… |
| **4 — Performance et dette** | SEO-13, TECH-01 à TECH-05 | Lighthouse ≥ 95 partout, lint propre |
| **En continu** | ACT-* | Actualités plus engageantes |

---

## Épic SEO — être n°1 sur « supermarché Calais » et les recherches locales

### Audit de l'existant (21/10/2026)

| Point | État | Ticket |
|---|---|---|
| Domaine canonique | ❌ Deux domaines dans le code (`supermarket-calais.fr` et `supermarketcalais.com`), `APP_URL` vide | SEO-01 |
| `metadataBase` | ❌ Absent : les URL des images de partage sont relatives, donc invalides pour Facebook et WhatsApp | SEO-02 |
| Titre et description par défaut | ⚠️ « SuperMarket », générique, sans « Calais » ; la page confidentialité finit en « … \| Super Market Calais \| SuperMarket » | SEO-02 |
| `sitemap.xml` | ❌ Absent | SEO-03 |
| `robots.txt` | ⚠️ Ne déclare pas le sitemap ; `/login`, `/signup`, `/account`… sont indexables ; `/unsubscribe` est explicitement autorisé | SEO-04 |
| Open Graph / Twitter | ⚠️ Image de 3888×1584 en WebP (format conseillé : 1200×630 en JPG) ; pas de carte Twitter ni d'`og:url` | SEO-05 |
| Données structurées | ⚠️ `GroceryStore` présent, mais image en URL relative, sans `url`, `logo`, `sameAs` (Facebook), `priceRange` ni adresse structurée | SEO-06 |
| Une URL par actualité | ❌ Les actualités ne sont pas partageables ni indexables une par une | SEO-07 |
| Pages par rayon | ❌ Aucune page ciblant les recherches locales (« boucherie halal Calais »…) | SEO-08 |
| FAQ | ❌ Absente | SEO-09 |
| Search Console / Bing | ❓ Aucune balise de vérification | SEO-11 |
| Icônes / manifest | ⚠️ `layout.tsx` force `/logo.jpeg` comme favicon et masque `app/icon.svg` et `app/apple-icon.png` ; pas de `manifest` | SEO-12 |
| Images | ⚠️ Photos des actualités servies sans redimensionnement ; ~8 Mo d'images inutilisées dans `public/` | SEO-13, TECH-04 |
| Page 404 | ❌ Page d'erreur par défaut de Next | SEO-15 |
| `lang="fr"`, H1 unique, polices `display: swap` | ✅ | — |

### SEO-01 · Choisir et imposer un domaine canonique unique — **P0 · S** — ✅ fait le 21/10/2026
Le code mélange `https://supermarket-calais.fr` (`PRODUCTION_APP_URL` dans `lib/utils/app-url.ts`, liens des e-mails de campagne, invitation, e-mail de contact RGPD) et `supermarketcalais.com`, l'URL de Supabase. Si l'un des deux n'est pas à nous, **les liens des e-mails envoyés aux clients sont cassés**.
- [ ] Décider du domaine officiel, avec ou sans `www`.
- [ ] Le définir dans `APP_URL` / `NEXT_PUBLIC_APP_URL` (Coolify) et dans `PRODUCTION_APP_URL`.
- [ ] Remplacer les URL écrites en dur (`CampaignEditorPage.tsx`, `DealsManager.tsx`, `InviteUserManager.tsx`, `PrivacyPolicyContent.tsx`, `SettingsManager.tsx`) par la configuration centrale.
- [ ] Redirection 301 : `http` → `https` et `www` → domaine sans `www` (ou l'inverse), au niveau du proxy.
- **Fait quand** : `curl -I` sur chaque variante renvoie un seul 301 vers l'URL canonique, et `grep -r "supermarket-calais.fr"` ne renvoie plus rien si ce domaine est abandonné.
- **Réalisé** : domaine principal `https://supermarketcalais.com` (`PRODUCTION_APP_URL`, `getSiteUrl()` dans `lib/utils/app-url.ts`). `www.supermarketcalais.com`, `supermarketcalais.fr` et `www.supermarketcalais.fr` redirigent en 308 (permanent) vers lui, chemin et paramètres conservés (`next.config.ts`). Le QR code des affiches encode toujours le domaine principal. L'e-mail de contact de la page confidentialité vient des paramètres du magasin.
- **Reste à faire hors code** : définir `NEXT_PUBLIC_APP_URL=https://supermarketcalais.com` dans Coolify ; passer la redirection `http` → `https` de Coolify de 302 à 301. Les adresses e-mail d'expédition `@supermarket-calais.fr` sont des valeurs fictives volontaires (remplacées par `BREVO_SENDER_EMAIL` dans `lib/email/brevo-adapter.ts`) : ne les changer qu'une fois le domaine `.com` authentifié dans Brevo.

### SEO-02 · `metadataBase`, titres et descriptions — **P0 · S** — ✅ fait le 21/10/2026
- [ ] `metadataBase: new URL(siteUrl)` dans `app/layout.tsx`, depuis la configuration de SEO-01.
- [ ] Modèle de titre : `"%s — Super Market Calais"` ; titre par défaut : « Super Market Calais — Supermarché de quartier ouvert 7j/7 ».
- [ ] Description par défaut avec les mots-clés locaux : « supermarché Calais », « produits halal », « produits turcs et marocains », « Saint-Exupéry ».
- [ ] Corriger le double suffixe de la page confidentialité.
- [ ] Descriptions de 140 à 160 caractères, uniques pour chaque page publique.
- **Fait quand** : chaque page publique a un titre de 60 caractères maximum et une description uniques, et aucune balise `og:image` n'est relative.

### SEO-03 · Sitemap dynamique — **P0 · S** — ✅ fait le 21/10/2026
- [ ] `app/sitemap.ts` : accueil, `/actualites`, chaque actualité (SEO-07), chaque rayon (SEO-08), pages légales.
- [ ] `lastModified` réel : date de la dernière actualité pour l'accueil et `/actualites`, `updatedAt` pour chaque post.
- [ ] Requête bornée : uniquement les actualités publiées, avec une limite.
- **Fait quand** : `/sitemap.xml` est valide (validateur XML) et accepté dans la Search Console.

### SEO-04 · Robots et `noindex` des pages privées — **P0 · S** — ✅ fait le 21/10/2026
- [ ] `robots.ts` : ajouter `sitemap: <domaine>/sitemap.xml` ; interdire `/account`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/confirm-account`, `/invite`, `/unsubscribe`.
- [ ] `robots: { index: false, follow: false }` dans les métadonnées de ces pages : `robots.txt` seul n'empêche pas l'indexation d'une URL trouvée via un lien.
- **Fait quand** : aucune page d'authentification ou de compte n'apparaît dans un `site:` sur Google, une fois Google repassé.

### SEO-05 · Vignettes de partage (Open Graph et Twitter) — **P1 · S**
- [ ] `app/opengraph-image.tsx` (ou une image statique) en 1200×630 JPG : la devanture avec l'enseigne « Super Market Calais ».
- [ ] `twitter: { card: "summary_large_image" }`, `siteName`, `locale: "fr_FR"`, `url`.
- [ ] Image propre à `/actualites` et à chaque actualité (SEO-07).
- **Fait quand** : le [débogueur de partage Facebook](https://developers.facebook.com/tools/debug/) affiche la bonne image, le bon titre et la bonne description sans avertissement.

### SEO-06 · Données structurées complètes (JSON-LD) — **P1 · M**
- [ ] `GroceryStore` : URL absolues, `url`, `logo`, `image` (plusieurs photos), `sameAs: [Facebook]`, `priceRange: "€"`, adresse en `PostalAddress` (rue, code postal, ville, pays), téléphone au format `+33…`, `areaServed: "Calais"`, `paymentAccepted`, `currenciesAccepted`, horaires (déjà présents).
- [ ] `WebSite` et `Organization` sur l'accueil.
- [ ] `BlogPosting` pour chaque actualité (SEO-07), `BreadcrumbList` sur les pages internes, `FAQPage` (SEO-09).
- [ ] Un test unitaire qui vérifie que le JSON-LD généré est valide et que ses URL sont absolues.
- **Fait quand** : le [test des résultats enrichis](https://search.google.com/test/rich-results) passe sans erreur sur toutes les pages publiques.

### SEO-07 · Une page par actualité — **P1 · M**
- [ ] Route `/actualites/[id]-[slug]`, le slug venant de la première ligne du texte, avec une redirection 301 si le slug change.
- [ ] `generateMetadata` : titre tiré du texte, description = 155 premiers caractères, `og:image` = première photo.
- [ ] JSON-LD `BlogPosting` et fil d'Ariane, bouton « Partager » (Web Share API, sinon copie du lien).
- [ ] Les cartes du fil et de l'accueil mènent à la page de l'actualité.
- [ ] Une actualité masquée ou supprimée renvoie 404 (`notFound()`).
- **Fait quand** : partager une actualité sur WhatsApp affiche sa photo et son texte.

### SEO-08 · Pages par rayon (SEO local) — **P1 · L**
Le levier le plus fort : chaque page cible une recherche locale précise.
- [ ] `/rayons/[slug]` pour chaque rayon de `DepartmentsSection` : « Poulet frais halal à Calais », « Produits turcs et marocains à Calais », « Boissons en pack pas chères à Calais », « Pâtisserie orientale à Calais », « Surgelés Hunkar et Idéal Délices à Calais », « Fruits et légumes à Calais ».
- [ ] Les données des rayons quittent le composant pour une configuration centrale (`lib/store/departments.ts`), source unique pour l'accueil et les pages.
- [ ] Contenu unique de 300 mots ou plus par page (pas de texte dupliqué), photos avec un texte alternatif descriptif, 3 à 5 questions-réponses, liens vers les autres rayons et vers « Itinéraire ».
- [ ] Les cartes de l'accueil mènent à ces pages.
- **Fait quand** : chaque page a un H1 avec le mot-clé et « Calais », un JSON-LD, et figure dans le sitemap.

### SEO-09 · FAQ sur l'accueil — **P2 · S**
- [ ] 6 à 8 questions réelles : horaires du dimanche, viande halal, parking, moyens de paiement, relais Pickup, fonctionnement de la fidélité, livraison.
- [ ] Accordéon accessible (`<details>` / `<summary>`) et JSON-LD `FAQPage`.

### SEO-10 · Référencement local hors du site — **P1 · M** (hors code)
- [ ] **Fiche Google Business Profile** : catégories « Supermarché », « Épicerie orientale », « Boucherie halal » ; 10 photos ou plus ; horaires identiques au site ; lien vers le site ; publier les actualités aussi sur la fiche.
- [ ] **Coordonnées identiques partout** (nom, adresse, téléphone) : Facebook, Pages Jaunes, Apple Plans (Business Connect), Bing Places, Waze.
- [ ] **Avis Google** : un lien « Laisser un avis » dans l'espace fidélité et dans les e-mails ; répondre à chaque avis.

### SEO-11 · Search Console et Bing Webmaster Tools — **P1 · S**
- [ ] Champ `verification` des métadonnées, alimenté par des variables d'environnement (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`).
- [ ] Déclarer le sitemap ; suivre l'indexation et les Core Web Vitals chaque mois.

### SEO-12 · Icônes et manifest — **P1 · S** — ✅ fait le 21/10/2026
- [ ] Retirer `icons: /logo.jpeg` de `app/layout.tsx` pour que `app/icon.svg` et `app/apple-icon.png` soient utilisés.
- [ ] `app/manifest.ts` : nom, nom court, `theme_color` issue du thème, icônes 192 et 512.
- **Fait quand** : le favicon est net dans l'onglet et dans les résultats Google sur mobile.

### SEO-13 · Performance (Core Web Vitals) — **P2 · M**
- [ ] Photos des actualités passées par l'optimiseur de Next (`images.remotePatterns` pour le domaine Supabase) au lieu de `unoptimized`, pour servir des tailles adaptées.
- [ ] Mesurer avec Lighthouse sur mobile : objectif ≥ 95 en Performance, SEO, Accessibilité et Bonnes pratiques ; LCP < 2,5 s, CLS < 0,1.
- [ ] Vérifier que la carte Google Maps ne se charge qu'au défilement (`loading="lazy"`).

### SEO-14 · Contenu et sémantique de l'accueil — **P2 · S**
- [ ] Le H1 de l'accueil vient du « sous-titre » des paramètres : imposer « Calais » (ou le nom du magasin) dans ce champ, ou ajouter un H1 fixe et passer le sous-titre en paragraphe.
- [ ] Texte alternatif propre à chaque photo d'actualité (ACT-02).
- [ ] Pied de page : liens vers les rayons et les actualités (maillage interne).

### SEO-15 · Page 404 — **P1 · S** — ✅ fait le 21/10/2026
- [ ] `app/not-found.tsx` dans le style du site : message clair, recherche des rayons, liens vers l'accueil et les actualités. Next renvoie bien le code 404.

---

## Épic Actualités

| ID | Ticket | Prio | Effort |
|---|---|---|---|
| ACT-01 | **Point rouge intelligent** : affiché seulement s'il y a une actualité de moins de 7 jours non vue (mémorisé dans `localStorage`), au lieu d'un point permanent qu'on finit par ignorer | P2 | S |
| ACT-02 | **Texte alternatif par photo**, saisi dans l'éditeur (accessibilité et SEO) | P2 | S |
| ACT-03 | **Réordonner les photos** dans l'éditeur (choisir la photo principale de la grille) | P3 | S |
| ACT-04 | Option : **section actualités toujours visible** à l'accueil, même vide, avec le bouton Facebook | P3 | S |
| ACT-05 | **Programmer une publication** à une date et une heure (`publish_at`, filtrée à la lecture) | P3 | M |
| ACT-06 | **Prévenir les clients fidélité par e-mail** d'une nouvelle actualité, via le système d'envoi des campagnes | P3 | M |
| ACT-07 | **Publier automatiquement sur Facebook** (API Meta Graph, nécessite un accès développeur à la page) | P3 | L |

## Épic Dette technique

| ID | Ticket | Prio | Effort |
|---|---|---|---|
| TECH-01 | **Envoi d'images des campagnes** (`app/api/admin/deals/upload-image`) : appelle Supabase directement depuis la route (contraire à l'architecture), ne vérifie pas le vrai format des fichiers, écrit dans `public/` en secours, ce qui est perdu au redémarrage dans Docker. Réutiliser le système des actualités : `detectImageType`, sharp, port de stockage | P1 | M |
| TECH-02 | **Valeurs écrites en dur dans l'éditeur de campagne** (nom, adresse, téléphone, textes et image Unsplash par défaut) → paramètres admin et `lib/marketing/config.ts` | P2 | S |
| TECH-03 | **Lint** : 3 erreurs `react-hooks/set-state-in-effect` (`CampaignEditorPage.tsx`, `DealsManager.tsx`) et une quarantaine d'imports inutilisés | P2 | S |
| TECH-04 | **Images inutilisées dans `public/`** : environ 8 Mo, dont 7 photos de rayons en double (`categories/*.jpg` sans `-sample`), `logo.png` (580 Ko), les SVG du modèle Next (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`, `test-icon.svg`). Vérifier qu'aucun e-mail déjà envoyé ne pointe vers l'une d'elles avant de supprimer | P3 | S |
| TECH-05 | **Type obsolète** dans `.next/types/validator.ts` (route `deals/recipients-count` supprimée) : disparaît avec un `next build` propre ; vérifier la CI | P3 | S |
