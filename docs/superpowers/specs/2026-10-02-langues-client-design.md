# Écrans client en quatre langues : design

Statut : design validé section par section avec Nassim le 2026-10-02 (brainstorming), spec en attente de sa relecture. Approche retenue : A, un dictionnaire typé et la langue enregistrée sur la carte.

## Contexte

Les clients de KINZ (Tunis) ne lisent pas tous le français. On veut leur parler dans leur langue sur les écrans qu'ils voient : l'inscription, la carte et la page « carte introuvable ». On veut aussi leur envoyer les messages WhatsApp dans cette langue. C'est l'étape 2 du plan approuvé (`~/.claude/plans/ok-now-superpowers-using-superpowers-we-memoized-mist.md`), élargie par Nassim à quatre langues.

| Code | Langue | Écriture | Sens |
|---|---|---|---|
| `fr` | Français (langue de référence, par défaut) | latine | gauche à droite |
| `tn` | Tounsi (derja tunisienne) | latine avec chiffres, arabizi : 3 = ع, 7 = ح, 9 = ق, 5 = خ, 8 = غ, 2 = ء | gauche à droite |
| `en` | Anglais | latine | gauche à droite |
| `ar` | Arabe standard (fos7a) | arabe | droite à gauche |

## Ce qui ne change pas

- Les adresses (`/c/<token>`, `/rejoindre`). Les QR codes déjà imprimés et les liens déjà envoyés restent valables.
- La console vendeur, l'admin, l'affiche QR et l'affiche A3 restent en français.
- Les intitulés français de `src/lib/rules.ts` (`CARD_STOPS`, `PERKS`, `title()`), qu'utilisent le comptoir et l'admin.
- Aucune nouvelle dépendance npm. On ajoute seulement une police Google, chargée par `next/font`.

## 1. La langue : où elle vit, comment on la choisit

- **Base de données** : nouvelle colonne `customers.locale`, de type enum `locale` (`'fr' | 'tn' | 'en' | 'ar'`), non nulle, valeur par défaut `'fr'`. Les clients existants restent donc en français. La migration est générée par `npm run db:generate` et appliquée au déploiement par `vercel.json`, comme `0001`.
- **Visiteur pas encore inscrit** (`/rejoindre`, page « carte introuvable ») : on prend le cookie `kinz_lang` s'il est valide. Sinon, on regarde l'en-tête `Accept-Language` : `ar*` donne `ar`, `en*` donne `en`, et tout le reste donne `fr`. On ne déduit jamais `tn` du navigateur, puisque aucun navigateur ne le déclare.
- **Sélecteur** `FR · Tounsi · EN · عربي`, en haut de `/rejoindre` et en haut de la carte. Chaque option est affichée dans sa propre langue.
  - Sur `/rejoindre`, le choix écrit le cookie (1 an, `SameSite=Lax`) et recharge la page.
  - À l'inscription, la langue courante est envoyée avec le formulaire (`POST /api/customers`, nouveau champ facultatif `locale`, validé par zod) et enregistrée sur la carte.
  - Sur la carte, le choix appelle `POST /api/customers/[token]/locale`, sur le modèle de la route `address` qui existe déjà : la langue est enregistrée sur la carte, le cookie mis à jour, et la page actualisée.
- **Carte** : sa langue est toujours `customers.locale`, pas le cookie. Elle suit le client sur tous ses téléphones.
- **Console vendeur** : un petit badge de langue (`FR`, `TN`, `EN`, `AR`) sur la fiche du client.
- **Messages envoyés au client dans sa langue** :
  - les quatre relances WhatsApp de `src/lib/reminders.ts` (`reminderMessage` reçoit la langue du client) ;
  - le message « Renvoyer la carte » du comptoir (`CustomerPanel`).

## 2. Les textes

- **Dictionnaires** : `src/lib/copy/fr.ts` est la référence. `tn.ts`, `en.ts` et `ar.ts` doivent avoir la même forme, ce que le typage impose (`satisfies Copy`, où `type Copy` est dérivé de `fr`). Les phrases avec un nombre sont des fonctions, par exemple `missingStamps(n)`.
- **Accès** : `getCopy(locale): Copy` dans `src/lib/copy/index.ts`, plus `parseLocale(value): Locale | null`, `detectLocale(acceptLanguage): Locale` et `LOCALE_DIR: Record<Locale, 'ltr' | 'rtl'>`.
- **Pluriels** : `plural(locale, n, forms)` dans `src/lib/copy/plural.ts`.
  - En français, en anglais et en tounsi, deux formes : 1 et le reste. Le français traite 0 comme un singulier.
  - En arabe, il y a six formes : 0 (`zero`), 1 (`one`), 2, le duel (`two`), de 3 à 10 (`few`), de 11 à 99 (`many`), puis 100 et plus (`other`).
  - Pour toutes les langues, c'est l'API `Intl.PluralRules` qui choisit la forme. Le tounsi utilise les règles du français.
- **Chiffres** : toujours des chiffres occidentaux (13, 40 TND), y compris en arabe.
- **Récompenses et avantages** : chaque dictionnaire contient `stops: Record<StopStamps, string>` (paliers 3, 5, 7, 11, 13) et `perks: Record<number, string>`, indexé par chaque niveau de `PERKS`. Un test vérifie qu'aucun palier ni aucun avantage ne manque dans aucune langue.
- **Noms des niveaux, traduits dans les quatre langues** :
  - `fr` : les noms actuels ;
  - `en` : Seed, Sprout, Pad, Flower, Fig, Fig Tree, Legend of the Golden Fig Tree ;
  - `ar` : بذرة، نبتة، لوح الصبار، زهرة، تينة، شجرة التين، أسطورة شجرة التين الذهبية ;
  - `tn` : une proposition en arabizi, à faire valider par Nassim.

  Ils sont rangés dans `titles`, avec le niveau de départ de chaque titre (1, 5, 8, 13, 21, 34, 50) comme clé.
- **Erreurs vues par le client** : `JoinForm` et `AddressForm` affichent `copy.errors[code]` à partir du `code` renvoyé par l'API, et un message générique de la langue si le code est inconnu. Les codes traduits sont ceux qu'un client peut rencontrer : `INVALID_PHONE`, `PHONE_TAKEN`, `INVALID_ADDRESS`, `NOT_FOUND`, `BAD_REQUEST`, ainsi que l'erreur réseau.
- **Périmètre des textes traduits** :
  - `/rejoindre` (`page.tsx`, `JoinForm`, `RoadmapStrip`) ;
  - la carte (`page.tsx`, `LoyaltyCard`, `LevelPanel`, `PerkList`, `HowItWorks`, `AddressForm`, `BirthdayBanner`) ;
  - `not-found.tsx` ;
  - le titre de la page (`metadata`) de ces écrans.

## 3. L'arabe de droite à gauche, et les polices

- **Le conteneur de chaque écran client** porte `lang` et `dir` (`LOCALE_DIR`). La balise `<html>` reste en `lang="fr"`, car l'admin et le comptoir sont en français.
- **Composants client** : les marges et alignements passent en propriétés logiques Tailwind (`ps-`/`pe-`, `ms-`/`me-`, `text-start`/`text-end`, `start-`/`end-`).
- **La grille des 13 tampons** suit le sens de lecture. En arabe, le tampon 1 est à droite.
- **Ce qui ne s'inverse pas** : le logo KINZ, le QR code, les numéros de téléphone, les montants et l'adresse de la carte. Ils sont isolés avec `dir="ltr"` ou `<bdi>` au milieu du texte arabe.
- **Police arabe** : Readex Pro (`next/font/google`, sous-ensemble `arabic`) devient la première police de `--font-sans` et `--font-display` quand `lang="ar"`. Figtree et Marcellus restent pour les écritures latines, y compris le tounsi.
- **Contrôle visuel** : on suit la liste de vérification RTL de `tarjmni` (`~/.claude/skills/tarjmni/references/rtl-qa.md`), avec des captures mobiles (375 px) des trois écrans dans les quatre langues.

## 4. La compétence projet `kinz-langues`

- Elle est écrite avec `superpowers:writing-skills` dans `.claude/skills/kinz-langues/SKILL.md`, dans le dépôt, pour être partagée avec les associés.
- Elle couvre :
  - le ton par langue : vouvoiement chaleureux en `fr`, tutoiement en `tn`, `en` simple et chaleureux, `ar` standard simple et non administratif ;
  - le lexique de marque : KINZ, pépins, tampons, noms des niveaux ;
  - les conventions de l'arabizi ;
  - l'appui sur `lahja` (guide maghrébin, colonne tunisienne, en demandant explicitement l'arabizi) ;
  - la règle : toute traduction reste « à relire » tant que Nassim ne l'a pas validée.
- Limites connues :
  - le script `check_output.py` de `lahja` ne lit que l'écriture arabe, donc il ne contrôle pas l'arabizi ;
  - `lahja` ne couvre pas l'arabe standard. Le fos7a repose sur la relecture de Nassim.
- Test selon `writing-skills` : on écrit les mêmes textes avec et sans la compétence, puis on compare le respect du lexique et du ton.

## Tests et définition de « terminé »

- **Unitaires** :
  - les quatre dictionnaires ont les mêmes clés ;
  - chaque palier, chaque avantage et chaque titre existe dans chaque langue ;
  - `plural` en arabe pour 0, 1, 2, 3, 10, 11, 99 et 100, et en français pour 0, 1 et 2 ;
  - `detectLocale` : `ar-TN,ar;q=0.9` donne `ar`, `en-US` donne `en`, `fr-FR` donne `fr`, `de` donne `fr`, et un en-tête vide donne `fr` ;
  - `parseLocale` refuse une valeur inconnue ;
  - `reminderMessage` dans chaque langue contient le prénom et l'adresse de la carte.
- **Intégration** :
  - la route `locale` enregistre la langue, et renvoie 400 pour une valeur inconnue et 404 pour une carte inconnue ;
  - l'inscription avec `locale: 'tn'` l'enregistre ;
  - `listReminderCandidates` fournit la langue du client.
- **Bout en bout** :
  - sur `/rejoindre`, choisir « Tounsi », s'inscrire, et voir un texte tounsi sur la carte ;
  - choisir « عربي » et vérifier `dir="rtl"` sur le conteneur ;
  - les cinq parcours existants, en français, passent toujours.
- **Visuel** : captures mobiles des 3 écrans × 4 langues, et liste RTL de `tarjmni` cochée.
- **Livraison** : une branche `feat/langues` et une PR. La description de la PR contient le tableau complet FR / TN / EN / AR de toutes les chaînes, marquées « à relire ». **Pas de fusion sans validation de Nassim, ligne par ligne.**

## Règles du dépôt

- Commits au nom de `Nassim Kefi <nassim.kefi0014@gmail.com>`, sans mention de Claude.
- Aucun tiret cadratin (U+2014) dans le code, les textes, les commits ou la PR.
- Jamais de push sur `main`.
