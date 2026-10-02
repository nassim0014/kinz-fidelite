# Écrans client en quatre langues : Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les écrans client (`/rejoindre`, la carte, « carte introuvable ») et les messages envoyés au client existent en français, tounsi (arabizi), anglais et arabe standard. La langue est enregistrée sur la carte, et l'arabe s'affiche de droite à gauche.

**Architecture:** Un module `src/lib/copy/` regroupe les codes de langue, la détection, les pluriels (via `Intl.PluralRules`) et quatre dictionnaires typés sur le modèle de `fr.ts`. Les composants serveur reçoivent la langue et appellent `getCopy`. Les composants client reçoivent seulement le code `locale` et appellent eux-mêmes `getCopy`, car on ne peut pas passer de fonctions d'un composant serveur à un composant client. La langue d'un visiteur vit dans un cookie, celle d'un client dans `customers.locale`.

**Tech Stack:** Next.js 16 (App Router, `cookies()` et `headers()` asynchrones, `cookies().set` seulement dans une route ou une Server Function), Drizzle + Postgres, Tailwind 4, Vitest, Playwright, `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-10-02-langues-client-design.md`

## Global Constraints

- Langues : `fr` (par défaut et référence), `tn` (arabizi : 3 = ع, 7 = ح, 9 = ق, 5 = خ, 8 = غ, 2 = ء), `en` et `ar` (arabe standard, `dir="rtl"`).
- Aucune nouvelle dépendance npm. La seule police ajoutée est Readex Pro, via `next/font/google`, sous-ensemble `arabic`.
- Les adresses ne changent pas (`/c/<token>`, `/rejoindre`). La console vendeur, l'admin, l'affiche QR et l'affiche A3 restent en français. Les intitulés français de `rules.ts` restent intacts.
- Toujours des chiffres occidentaux, y compris en arabe.
- Cookie `kinz_lang` : 1 an, `SameSite=Lax`, `path=/`.
- Toute traduction `tn`, `en` et `ar` est marquée « à relire ». Pas de fusion sans la validation de Nassim.
- Aucun tiret cadratin (U+2014) dans le code, les textes, les commits ou la PR. Commits au nom de `Nassim Kefi <nassim.kefi0014@gmail.com>`, sans mention de Claude. Jamais de push sur `main`.

## Review Focus

1. **Cookie `kinz_lang` invalide** (`xx`, vide, falsifié) : on l'ignore et on retombe sur la détection, sans plantage. → Task 1 (tests de `parseLocale` et `localeFromRequest`).
2. **Client qui a choisi une langue, puis ouvre sa carte sur un autre téléphone** (cookie absent ou différent) : la carte s'affiche dans `customers.locale`. → Task 6, test e2e.
3. **Clients inscrits avant la migration** : ils ont `locale = 'fr'` et rien ne change pour eux. → Task 2, test d'intégration.
4. **Code d'erreur inconnu renvoyé par l'API** : message générique dans la langue du client, jamais `undefined`. → Task 4, test de `errorText`.
5. **Numéros, montants et adresses au milieu d'un texte arabe** : ils restent lisibles de gauche à droite (`<bdi>` ou `dir="ltr"`). → Task 6, contrôle visuel de la liste RTL de `tarjmni`.

---

### Task 1: Langues, détection et pluriels

**Files:**
- Create: `src/lib/copy/locale.ts`, `src/lib/copy/plural.ts`, `src/lib/copy/locale.test.ts`, `src/lib/copy/plural.test.ts`

**Interfaces:**
- Produces:
  - `LOCALES = ['fr', 'tn', 'en', 'ar'] as const`
  - `type Locale = (typeof LOCALES)[number]`
  - `LOCALE_COOKIE = 'kinz_lang'`
  - `LOCALE_DIR: Record<Locale, 'ltr' | 'rtl'>`
  - `LOCALE_LABEL: Record<Locale, string>` = `{ fr: 'FR', tn: 'Tounsi', en: 'EN', ar: 'عربي' }`
  - `parseLocale(v: unknown): Locale | null`
  - `detectLocale(acceptLanguage: string | null): Locale`
  - `localeFromRequest(cookieValue: string | undefined, acceptLanguage: string | null): Locale`, qui renvoie le cookie s'il est valide, sinon `detectLocale`
  - `plural(locale: Locale, n: number, forms: { other: string } & Partial<Record<Intl.LDMLPluralRule, string>>): string`

- [ ] **Step 1: Write the failing tests**
  - `parseLocale` : `'tn'` donne `'tn'` ; `'xx'`, `''`, `undefined` et `42` donnent `null`.
  - `detectLocale` :
    - `'ar-TN,ar;q=0.9,fr;q=0.8'` donne `'ar'` ;
    - `'en-US,en;q=0.9'` donne `'en'` ;
    - `'fr-FR'` donne `'fr'` ;
    - `'de-DE'` donne `'fr'` ;
    - `null` et `''` donnent `'fr'`.

    C'est la première langue de la liste qui compte.
  - `plural('ar', n, forms)`, avec `forms` qui contient les six catégories nommées par leur nom, doit renvoyer `zero`, `one`, `two`, `few`, `few`, `many`, `many`, `other` pour `n` = 0, 1, 2, 3, 10, 11, 99, 100.
  - `plural('fr', 0, { one: 'a', other: 'b' })` donne `'a'` ; avec `n` = 2, `'b'`. Même résultat pour `'tn'`.
  - `plural('ar', 5, { other: 'x' })` donne `'x'` : quand la forme manque, on prend `other`.
  - `localeFromRequest('tn', 'ar')` donne `'tn'` ; `localeFromRequest('xx', 'en-US')` donne `'en'` ; `localeFromRequest(undefined, null)` donne `'fr'`.
- [ ] **Step 2: Run** `npx vitest run --project unit src/lib/copy`. Expected: FAIL, les modules sont introuvables.
- [ ] **Step 3: Implement.** `plural` utilise `new Intl.PluralRules(locale === 'tn' ? 'fr' : locale)`. `detectLocale` lit le premier code de l'en-tête, avant `,` puis avant `;`.
- [ ] **Step 4: Run** la même commande. Expected: PASS.
- [ ] **Step 5: Commit** `feat: codes de langue, détection du navigateur et pluriels`

---

### Task 2: Langue en base, inscription et routes

**Files:**
- Modify: `src/db/schema.ts` (`export const localeEnum = pgEnum('locale', LOCALES)` et `customers.locale: localeEnum('locale').notNull().default('fr')`)
- Create: `drizzle/0002_*.sql` via `npm run db:generate`
- Modify: `src/server/customers.ts` (`createCustomer` accepte `locale?: Locale` ; nouvelle fonction `setLocale`)
- Modify: `src/app/api/customers/route.ts` (champ zod `locale: z.enum(LOCALES).optional()`)
- Create: `src/app/api/customers/[token]/locale/route.ts`, `src/app/api/locale/route.ts`, `src/server/locale.ts`
- Test: `tests/integration/locale.test.ts`

**Interfaces:**
- Consumes: `LOCALES`, `Locale`, `parseLocale`, `detectLocale`, `LOCALE_COOKIE` (Task 1).
- Produces:
  - `setLocale(db: Db, token: string, locale: Locale): Promise<void>`, qui lève `AppError('NOT_FOUND')` si la carte n'existe pas
  - `POST /api/customers/[token]/locale` avec le corps `{ locale }`. Il renvoie `200 { ok: true }` et écrit le cookie. Il renvoie 400 si la valeur est inconnue, et 404 si la carte est inconnue.
  - `POST /api/locale` avec le corps `{ locale }`. Il renvoie `200 { ok: true }` et écrit seulement le cookie.
  - `visitorLocale(): Promise<Locale>` dans `src/server/locale.ts`, qui appelle seulement `localeFromRequest((await cookies()).get(LOCALE_COOKIE)?.value, (await headers()).get('accept-language'))`

- [ ] **Step 1: Write the failing integration tests** (sur le modèle de `tests/integration/routes.test.ts`) :
  - `makeCustomer()` donne `locale: 'fr'` (Review Focus 3) ;
  - `POST /api/customers` avec `locale: 'tn'` enregistre `'tn'` ;
  - la route `locale` avec `{ locale: 'ar' }` enregistre `'ar'`, et sa réponse contient `set-cookie` avec `kinz_lang=ar` ;
  - `{ locale: 'xx' }` renvoie 400 ;
  - un jeton inconnu de 22 caractères renvoie 404 ;
  - `POST /api/locale` avec `{ locale: 'en' }` renvoie un `set-cookie` contenant `kinz_lang=en`.
- [ ] **Step 2: Run** `npx vitest run --project integration tests/integration/locale.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Vérifier que la migration générée crée seulement le type `locale` et la colonne, avec sa valeur par défaut. Le cookie s'écrit avec `res.cookies.set(LOCALE_COOKIE, locale, { maxAge: 31536000, sameSite: 'lax', path: '/' })`.
- [ ] **Step 4: Run** `npm run -s typecheck && npm run -s test:integration`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: langue enregistrée sur la carte et routes de choix de langue`

---

### Task 3: Compétence projet `kinz-langues`

**Files:**
- Create: `.claude/skills/kinz-langues/SKILL.md`

- [ ] **Step 1: Load `superpowers:writing-skills`** et suivre sa méthode. D'abord le scénario de base sans la compétence : demander à un agent, `general-purpose` avec le modèle `sonnet`, de traduire en tounsi trois chaînes de `fr.ts` (le bandeau d'anniversaire, `missingStamps(1)` et le message de relance `dormant`). Noter les écarts : écriture arabe au lieu de l'arabizi, « KINZ » traduit, vouvoiement, termes de marque changés.
- [ ] **Step 2: Write `SKILL.md`.** Frontmatter `name: kinz-langues`, avec une `description` qui commence par « Use when writing or reviewing KINZ customer-facing text in fr, tn (Tunisian Arabizi), en or ar ». Le corps couvre :
  - le ton par langue (spec, section 4) ;
  - le lexique verrouillé : KINZ, TND, et les noms des niveaux tels que fixés à la Task 5 ;
  - la table de l'arabizi ;
  - la règle « charger `lahja` (Maghrebi, colonne tunisienne) et demander l'arabizi » ;
  - le marqueur « à relire » ;
  - les limites connues (`check_output.py` ne lit pas l'arabizi, `lahja` ne couvre pas le fos7a).
- [ ] **Step 3: Re-run the same scenario with the skill loaded.** Expected : arabizi, KINZ non traduit, tutoiement en tounsi.
- [ ] **Step 4: Commit** `docs: compétence kinz-langues pour les textes client`

---

### Task 4: Dictionnaire français et branchement des écrans (sans changement visible)

**Files:**
- Create: `src/lib/copy/fr.ts`, `src/lib/copy/index.ts`, `src/lib/copy/copy.test.ts`
- Modify: `src/app/rejoindre/page.tsx`, `src/components/card/{JoinForm,LoyaltyCard,LevelPanel,PerkList,HowItWorks,AddressForm,BirthdayBanner}.tsx`, `src/components/roadmap/RoadmapStrip.tsx`, `src/app/c/[token]/page.tsx`, `src/app/c/[token]/not-found.tsx`
- Modify: `src/lib/reminders.ts` (`reminderMessage` délègue au dictionnaire), `src/components/staff/CustomerPanel.tsx` (message de renvoi)

**Interfaces:**
- Consumes: `Locale`, `plural` (Task 1) ; `visitorLocale` (Task 2) ; `buildRoadmap().stages` (`src/lib/roadmap.ts`).
- Produces:
  - `type Copy` (dérivé de `fr`), avec au minimum `stops: Record<3 | 5 | 7 | 11 | 13, string>`, `perks: Record<number, string>`, `titles: Record<1 | 5 | 8 | 13 | 21 | 34 | 50, string>`, `errors: Record<'INVALID_PHONE' | 'PHONE_TAKEN' | 'INVALID_ADDRESS' | 'NOT_FOUND' | 'BAD_REQUEST' | 'NETWORK' | 'UNKNOWN', string>`, `reminders: Record<ReminderReason, (a: { firstName: string; reward?: string; next?: string; cardUrl: string }) => string>` et `resend: (cardUrl: string) => string`
  - `getCopy(locale: Locale): Copy`
  - `titleFor(copy: Copy, level: number): string`
  - `errorText(copy: Copy, code: unknown): string`
  - `reminderMessage(reason, c, locale: Locale = 'fr')`, avec la même signature qu'avant plus `locale`

- [ ] **Step 1: Write the failing tests** in `copy.test.ts` :
  - `titleFor(getCopy('fr'), 1)` donne `'Graine'`, pour 12 `'Raquette'` et pour 50 `'Légende du Figuier d’Or'`. Pour chaque niveau de 1 à 50, le résultat est égal à `title(level)` de `rules.ts` : le dictionnaire français ne doit pas s'écarter des règles.
  - Pour chaque `s` de `CARD_STOPS`, `getCopy('fr').stops[s.stamps]` est égal à `s.label`, et pour chaque `p` de `PERKS`, `perks[p.level]` est égal à `p.label`.
  - `errorText(fr, 'PHONE_TAKEN')` est égal à `MESSAGES.PHONE_TAKEN`, et `errorText(fr, 'XYZ')` et `errorText(fr, undefined)` donnent `fr.errors.UNKNOWN` (Review Focus 4).
- [ ] **Step 2: Run** `npx vitest run --project unit src/lib/copy`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Déplacer **mot pour mot** chaque texte des fichiers listés dans `fr.ts`.
  - Les pages serveur obtiennent la langue : la carte par `customer.locale`, `/rejoindre` et `not-found` par `visitorLocale()`. Elles passent `copy` aux composants serveur et `locale` aux composants client (`JoinForm`, `AddressForm`).
  - `JoinForm` et `AddressForm` affichent `errorText(copy, data.code)`.
  - `generateMetadata` des deux pages utilise le dictionnaire.
- [ ] **Step 4: Run** `npm run -s typecheck && npm run -s test:unit && npm run -s test:e2e`. Expected: PASS, les cinq parcours e2e restent inchangés en français.
- [ ] **Step 5: Commit** `refactor: textes client dans un dictionnaire français`

---

### Task 5: Dictionnaires tounsi, anglais et arabe

**Files:**
- Create: `src/lib/copy/{tn,en,ar}.ts`, `scripts/copy-table.ts`
- Modify: `src/lib/copy/index.ts`, `src/lib/copy/copy.test.ts`

**Interfaces:**
- Consumes: `type Copy`, `getCopy` (Task 4) ; la compétence `kinz-langues` (Task 3).
- Produces:
  - `getCopy` pour les quatre langues ;
  - `npx tsx scripts/copy-table.ts`, qui affiche un tableau Markdown `clé | FR | TN | EN | AR` de toutes les chaînes. Les fonctions sont appelées avec des exemples fixes : `n = 1` et `n = 2`, prénom `Salma`, adresse `https://fidelite.kinzoils.com/c/…`.

- [ ] **Step 1: Write the failing tests**
  - Pour chaque `l` de `['tn', 'en', 'ar']`, toutes les clés de `getCopy(l).stops`, `.perks` et `.titles` sont exactement celles de `fr`.
  - Pour chaque raison, `reminderMessage(reason, { firstName: 'Salma', cardStamps: 3, cardUrl: 'https://f.tn/c/x' }, l)` contient `'Salma'` et `'https://f.tn/c/x'`.
  - Aucune chaîne d'aucun dictionnaire ne contient de tiret cadratin (`'\u2014'`).
  - `getCopy('en').titles` vaut `{1:'Seed', 5:'Sprout', 8:'Pad', 13:'Flower', 21:'Fig', 34:'Fig Tree', 50:'Legend of the Golden Fig Tree'}`, et `getCopy('ar').titles` vaut `{1:'بذرة', 5:'نبتة', 8:'لوح الصبار', 13:'زهرة', 21:'تينة', 34:'شجرة التين', 50:'أسطورة شجرة التين الذهبية'}`.
- [ ] **Step 2: Run** `npx vitest run --project unit src/lib/copy`. Expected: FAIL.
- [ ] **Step 3: Write the three dictionaries.**
  - Charger d'abord `kinz-langues`, puis `lahja` pour `tn`.
  - `satisfies Copy` impose les mêmes clés.
  - Chaque fichier commence par le commentaire `// À relire par Nassim avant mise en ligne.`
  - L'arabe a des formes `zero`, `one`, `two`, `few`, `many` et `other` pour les tampons et les pépins.
- [ ] **Step 4: Run** `npm run -s typecheck && npx vitest run --project unit src/lib/copy && npx tsx scripts/copy-table.ts > /dev/null`. Expected: PASS, et le script se termine avec le code 0.
- [ ] **Step 5: Commit** `feat: textes client en tounsi, anglais et arabe (à relire)`

---

### Task 6: Sélecteur, droite à gauche et police arabe

**Files:**
- Create: `src/components/LocaleSwitcher.tsx` (`'use client'`)
- Modify: `src/app/layout.tsx` (Readex Pro, `variable: '--font-readex'`), `src/app/globals.css` (`[lang="ar"] { --font-sans: var(--font-readex), system-ui, sans-serif; --font-display: var(--font-readex), system-ui, sans-serif; }`)
- Modify: `src/app/rejoindre/page.tsx`, `src/app/c/[token]/page.tsx`, `src/app/c/[token]/not-found.tsx` (le conteneur `<main lang dir>` et le sélecteur), `src/components/roadmap/RoadmapStrip.tsx` (`left-*`/`right-*` deviennent `start-*`/`end-*`)
- Modify: `tests/e2e/parcours.spec.ts`

**Interfaces:**
- Consumes: `LOCALES`, `LOCALE_LABEL`, `LOCALE_DIR` (Task 1) ; les routes de la Task 2.
- Produces: `<LocaleSwitcher current={Locale} token?={string} />`.
  - Avec `token`, il appelle `/api/customers/[token]/locale`. Sans `token`, il appelle `/api/locale`. Ensuite il fait `router.refresh()`.
  - Les options sont des `button` avec `aria-pressed` et `lang` de leur langue. L'ensemble est enveloppé dans `<nav aria-label>` traduit.

- [ ] **Step 1: Write the failing e2e tests**
  - Sur `/rejoindre?nouveau=1`, cliquer `getByRole('button', { name: 'Tounsi' })`, s'inscrire, et la carte affiche un texte de `tn.ts` choisi comme marqueur.
  - Cliquer `عربي` sur la carte : `page.locator('main')` a `dir="rtl"` et `lang="ar"`.
  - Rouvrir la même carte dans un nouveau contexte de navigateur, sans cookie : elle est toujours en arabe (Review Focus 2).
  - Les sélecteurs existants (`getByLabel('Prénom')`, `'Créer ma carte'`…) restent ceux du français, la langue par défaut des tests.
- [ ] **Step 2: Run** `npm run -s test:e2e`. Expected: FAIL sur les nouveaux tests.
- [ ] **Step 3: Implement.**
  - Envelopper les numéros, montants et adresses visibles dans les textes arabes avec `<bdi>`. Le QR code et le logo restent dans des blocs `dir="ltr"`.
  - Le sélecteur va en haut à droite sur `/rejoindre`, et au-dessus du « Bonjour » sur la carte. Il passe automatiquement à gauche en arabe.
  - `JoinForm` envoie sa prop `locale` dans le corps du `POST /api/customers`. C'est ce qui enregistre la langue choisie avant l'inscription, et le premier test e2e le vérifie.
- [ ] **Step 4: Run** `npm run -s typecheck && npm run -s lint && npm run -s test:unit && npm run -s test:integration && npm run -s test:e2e`. Expected: tout PASS.
- [ ] **Step 5: Commit** `feat: sélecteur de langue, affichage de droite à gauche et police arabe`

---

### Task 7: Langue du client côté comptoir et relances

**Files:**
- Modify: `src/server/reminders.ts` (`ReminderCandidate.locale: Locale`), `src/components/admin/ReminderList.tsx` (`reminderMessage(…, c.locale)`), `src/lib/views.ts` (`StaffCustomerView.locale: Locale`), `src/server/perks.ts` (remplir `locale`), `src/components/staff/CustomerPanel.tsx` (badge `LOCALE_LABEL` en majuscules, et `getCopy(view.locale).resend(url)`)
- Test: `tests/integration/reminders.test.ts`, `tests/integration/perks.test.ts`

**Interfaces:**
- Consumes: `getCopy`, `reminderMessage(…, locale)` (Tasks 4 et 5), `LOCALE_LABEL` (Task 1).

- [ ] **Step 1: Write the failing tests.**
  - Un client avec `locale` mis à `'tn'` en base apparaît dans `listReminderCandidates` avec `locale: 'tn'`.
  - La vue vendeur du client (la fonction qui produit `StaffCustomerView` dans `src/server/perks.ts`) contient `locale: 'tn'`.
- [ ] **Step 2: Run** `npx vitest run --project integration tests/integration/reminders.test.ts tests/integration/perks.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** toute la batterie de la Task 6, Step 4. Expected: PASS.
- [ ] **Step 5: Commit** `feat: relances et renvoi de carte dans la langue du client`

---

## Livraison

1. `superpowers:verification-before-completion` :
   - toute la batterie de tests ;
   - les captures mobiles (375 px) de `/rejoindre`, de la carte (via une page d'aperçu temporaire, supprimée avant le commit) et de « carte introuvable », dans les 4 langues ;
   - la liste `~/.claude/skills/tarjmni/references/rtl-qa.md`, cochée pour l'arabe.
2. Relecture finale de la branche, par un agent indépendant (modèle `opus`).
3. PR `feat/langues` vers `main`. La description contient la sortie de `npx tsx scripts/copy-table.ts`, sous le titre « Traductions à relire », avec les captures. Fusion seulement après la validation de Nassim.
