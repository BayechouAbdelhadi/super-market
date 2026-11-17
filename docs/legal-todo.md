# Conformité légale : à remplir et à confirmer

Dernière vérification des données du registre : 17/11/2026.
Les informations de la société sont dans `STORE_COMPANY`, fichier `lib/store/config.ts`. Une valeur vide affiche « À compléter » sur la page publique.

## À remplir (absent du registre public)

| Champ | Où le trouver | Pourquoi |
|---|---|---|
| `capital` | Kbis, ou statuts de la SAS | Mention obligatoire pour une société |
| `rcsCity` | Kbis (ville du greffe) | Mention obligatoire : « RCS <ville> 885 125 666 » |
| `mediator` | Choisir un médiateur de la consommation et adhérer (gratuit pour le client, payant pour le commerce) | Obligatoire pour toute vente à des consommateurs. Le nom et le site du médiateur doivent être affichés |

Tant qu'une valeur est vide, les pages affichent « À compléter » (constante `LEGAL_PLACEHOLDER`). Chercher ce texte avant la mise en ligne.

## À confirmer

- **Directeur de la publication** : `Aydogan Karaaslan`, directeur général d'après le registre. Confirmer que c'est la bonne personne.
- **Entité Hostinger** : `Hostinger International Ltd.` (Chypre) est l'entité par défaut pour l'UE, d'après les conditions d'utilisation de Hostinger. Vérifier sur la facture. Si c'est l'entité du Luxembourg, remplacer `host.name` par `HOSTINGER Global S.à r.l` et `host.address` par `6 Avenue Pasteur, L-2310 Luxembourg`.
- **Téléphone de l'hébergeur** : aucun trouvé, la page affiche « À compléter ». La LCEN demande le téléphone de l'hébergeur : le prendre sur le contrat ou la facture Hostinger.
- **Localisation des serveurs** : `Allemagne (Union européenne)`, choisie à la création du VPS. Déjà affichée sur les mentions légales et la politique de confidentialité.

## Fait

- **Règlement du programme de fidélité** : page `/reglement-fidelite`, chiffres lus dans `lib/loyalty/config.ts`. Lien dans le footer et dans le formulaire d'inscription. Point à confirmer : il indique que les points n'expirent pas (le code n'a pas d'expiration) et qu'un compte inactif 3 ans est supprimé (comme la politique de confidentialité). Modifier le texte si la règle change.
- **Cookies** : pas de bandeau. Le site ne dépose que des cookies techniques (session), donc le consentement n'est pas requis. À refaire si un outil de statistiques, un pixel ou un widget tiers est ajouté. La politique de confidentialité dit déjà la même chose.
- **Registre des traitements et procédure de violation** : `docs/gdpr-register.md`.
- **Connexion Facebook** : pas active, donc les paragraphes Meta / Facebook sont retirés de la politique de confidentialité. À remettre le jour où elle est ajoutée.

## À vérifier dans le registre

- Durée de conservation des journaux d'accès (adresses IP) de Kong et de Supabase Analytics, sur le serveur Coolify. Le dépôt ne la fixe pas. Choisir une durée (6 à 12 mois est courant), la configurer, puis l'écrire dans `docs/gdpr-register.md` et dans la section 4 de la politique de confidentialité. Les limites de tentatives du site ne gardent les adresses IP qu'en mémoire, 1 h au plus : rien à faire.
- Accords de traitement des données (art. 28) de Hostinger et de Brevo : les télécharger et les garder.

## Rappel

Un juriste ou l'expert-comptable doit relire les pages avant la mise en ligne définitive.
