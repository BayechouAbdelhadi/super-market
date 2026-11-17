# Registre des traitements et procédure de violation de données

Document interne (non publié). Obligatoire selon l'article 30 du RGPD. À relire à chaque changement de données collectées ou de prestataire.

Responsable du traitement : SUPER MARKET CALAIS, SAS, SIREN 885 125 666, 205 avenue Antoine de Saint-Exupéry, 62100 Calais.
Contact données personnelles : adresse e-mail du magasin (réglages admin).
Dernière mise à jour : 17/11/2026.

## 1. Registre des traitements

| Traitement | Finalité | Base légale | Données | Personnes | Durée de conservation | Destinataires |
|---|---|---|---|---|---|---|
| Compte client et programme de fidélité | Identifier le client en caisse, gérer les points et les statuts | Contrat (règlement du programme) | Nom, prénom, téléphone, e-mail, solde et historique de points, statut | Clients | Durée du compte. Suppression ou anonymisation après 3 ans sans activité | Hostinger (VPS, Allemagne), Supabase auto-hébergé |
| Historique des passages en caisse | Calcul des points, preuve en cas de réclamation | Contrat, intérêt légitime | Date, montant, points, nom de la caisse | Clients | Voir la politique de confidentialité | Équipe du magasin |
| Authentification | Connexion sécurisée, confirmation de compte, réinitialisation du mot de passe | Contrat, intérêt légitime (sécurité) | E-mail, mot de passe (haché), codes à usage unique, cookies de session | Clients, caissiers, administrateurs | Durée de la session et des codes | Hostinger, Brevo (envoi des e-mails) |
| Communications commerciales | Envoi des bons plans par e-mail | Consentement | Nom, e-mail, préférences | Clients ayant accepté | Jusqu'au retrait du consentement (lien de désinscription) | Brevo |
| Gestion du personnel de caisse | Droits d'accès (administrateur, caissier) | Intérêt légitime | Nom, e-mail, rôle | Caissiers, administrateurs | Durée de l'emploi | Hostinger |
| Limitation d'abus (tentatives de connexion, inscription, désinscription) | Sécurité du site | Intérêt légitime | Adresse IP, adresse e-mail, compteur de tentatives | Visiteurs | En mémoire du serveur uniquement, 1 h au plus (fenêtres de 1 à 60 min), jamais écrite en base | Aucun |
| Journaux d'accès techniques (Kong, Supabase Analytics) | Sécurité, diagnostic | Intérêt légitime | Adresse IP, URL, horodatage | Visiteurs | **À définir et à vérifier sur le serveur** (le dépôt ne fixe aucune durée) | Hostinger |

À compléter si ajoutés plus tard : connexion Facebook (Meta Login), outils de statistiques, pixel publicitaire. Chacun demande une nouvelle ligne et une mise à jour de la politique de confidentialité.

## 2. Sous-traitants

| Prestataire | Rôle | Localisation | Contrat de sous-traitance (art. 28) |
|---|---|---|---|
| Hostinger | Hébergement du VPS | Allemagne (UE) | Accord de traitement des données de Hostinger : à vérifier et à conserver |
| Brevo | Envoi d'e-mails transactionnels et de campagnes | France / UE | Accord de traitement de Brevo : à vérifier et à conserver |

## 3. Procédure en cas de violation de données

Une violation est une perte, un vol, un accès non autorisé ou une altération de données personnelles (fuite de base, compte administrateur piraté, e-mail envoyé à la mauvaise liste).

1. **Contenir.** Couper l'accès concerné : changer les mots de passe, révoquer les clés de l'API Supabase et de Brevo, bloquer le compte piraté. Ne pas supprimer les journaux.
2. **Consigner.** Noter dans le registre des violations (section 4) : date et heure de la découverte, nature de la violation, données et nombre de personnes concernées, cause probable.
3. **Évaluer le risque.** Se demander si la violation peut porter atteinte aux droits des personnes (usurpation d'identité, spam ciblé, atteinte à la vie privée).
   - Risque improbable : consigner seulement.
   - Risque probable : notifier la CNIL.
   - Risque élevé : notifier la CNIL et informer les personnes.
4. **Notifier la CNIL dans les 72 heures** après la découverte, sur `notifications.cnil.fr`. Si certaines informations manquent, envoyer une première notification, puis la compléter.
5. **Informer les personnes concernées** sans retard injustifié en cas de risque élevé : nature de la violation, conséquences probables, mesures prises, contact du responsable.
6. **Corriger et prévenir.** Appliquer le correctif, documenter la cause et ce qui change pour que cela ne se reproduise pas.

## 4. Registre des violations

| Date de découverte | Nature | Données et personnes concernées | Risque évalué | CNIL notifiée (date) | Personnes informées | Mesures prises |
|---|---|---|---|---|---|---|
| | | | | | | |

## 5. Analyse d'impact (AIPD)

Non requise à ce stade : pas de profilage, pas de données sensibles, pas de traitement à grande échelle. À réévaluer si le magasin ajoute de la géolocalisation, un suivi du comportement d'achat à des fins de ciblage, ou une base de plusieurs dizaines de milliers de clients.
