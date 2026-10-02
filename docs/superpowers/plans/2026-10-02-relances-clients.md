# Relances clients (étape 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire revenir les clients déjà inscrits. Le propriétaire voit qui relancer et pourquoi, envoie un message WhatsApp prérempli en un clic, la relance est journalisée, la carte rappelle l'avantage d'anniversaire, et deux chiffres mesurent l'effet.

**Architecture:** La décision « faut-il relancer ce client, et pourquoi » est une fonction pure (`src/lib/reminders.ts`), testée sans base de données. Le serveur (`src/server/reminders.ts`) charge pour chaque client sa dernière visite et sa dernière relance, puis applique cette fonction. Une route réservée au propriétaire enregistre la relance comme un événement `reminder_sent`. L'envoi reste manuel, par un lien `wa.me`.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM + PostgreSQL (Neon), Vitest (projets `unit` et `integration`), Playwright, Tailwind 4.

**Spec:** `/home/kiwif/.claude/plans/ok-now-superpowers-using-superpowers-we-memoized-mist.md` (section « Étape 1 »)

## Global Constraints

- Aucune nouvelle dépendance npm.
- Textes en français. Aucun tiret cadratin (—) dans le code, les tests, les commits ou la PR.
- Toute date « du jour » passe par `businessDate()` de `src/lib/dates.ts` (fuseau `Africa/Tunis`).
- L'envoi n'est jamais automatique : on ouvre WhatsApp, une personne appuie sur Envoyer.
- La liste et la route d'enregistrement sont réservées au rôle `owner` (`getPageSession('owner')` pour la page, `requireStaff(req, 'owner')` pour la route).
- Commits signés `Nassim Kefi <nassim.kefi0014@gmail.com>`, sans mention de Claude. Une branche `feat/relances` et une PR, jamais de push sur `main`.
- Seuils exacts, en jours : récompense en attente 21, silence après une relance 14, client endormi 45, « à 1 tampon » seulement si la dernière visite date d'au moins 7 jours. Avantage d'anniversaire à partir du niveau 7, tampons doublés le jour J à partir du niveau 19.

## Review Focus

1. **Client inscrit qui n'est jamais venu** (aucun événement `stamp`) : on prend la date d'inscription comme dernière visite, il n'est pas exclu de la liste. → test dans la Task 2.
2. **Double clic sur « Relancer »** : la deuxième requête ne crée pas de deuxième événement si une relance date de moins de 14 jours. → test dans la Task 4.
3. **Changement de mois à minuit, heure de Tunis** : `isBirthdayMonth` utilise `businessDate`, donc le 31 à 23 h 30 UTC (déjà le 1er à Tunis) compte pour le mois suivant. → test dans la Task 1.
4. **Message avec accents, apostrophes et l'adresse de la carte** : le lien `wa.me` encode tout le texte et ne garde que les chiffres du numéro. → test dans la Task 1.
5. **Nouveau type d'événement dans les écrans existants** : le journal de l'admin et l'export CSV affichent `reminder_sent` sans planter. → test dans la Task 3.

---

### Task 1: Briques pures (liens WhatsApp, mois d'anniversaire)

**Files:**
- Create: `src/lib/whatsapp.ts`, `src/lib/whatsapp.test.ts`
- Modify: `src/lib/dates.ts`, `src/lib/dates.test.ts`
- Modify: `src/components/staff/CustomerPanel.tsx` (lignes 151 et 159 : utiliser les nouvelles fonctions)

**Interfaces:**
- Produces:
  - `waLink(phone: string, text: string): string`, qui renvoie `https://wa.me/<chiffres>?text=<texte encodé>`
  - `smsLink(phone: string, text: string): string`, qui renvoie `sms:<phone>?body=<texte encodé>`
  - `isBirthdayMonth(birthday: string | null, now?: Date): boolean`

- [ ] **Step 1: Write the failing tests**

```ts
// whatsapp.test.ts
it('keeps only digits of the phone and encodes the whole text', () => {
  expect(waLink('+216 22 123 456', "Bonjour Leïla, c'est KINZ : https://x.tn/c/abc"))
    .toBe('https://wa.me/21622123456?text=Bonjour%20Le%C3%AFla%2C%20c\'est%20KINZ%20%3A%20https%3A%2F%2Fx.tn%2Fc%2Fabc');
});
it('builds an sms link with the raw phone', () => {
  expect(smsLink('+21622123456', 'a b')).toBe('sms:+21622123456?body=a%20b');
});
// dates.test.ts
it('detects the birthday month in Tunis time', () => {
  expect(isBirthdayMonth('1990-03-14', new Date('2026-03-01T00:30:00+01:00'))).toBe(true);
  expect(isBirthdayMonth('1990-03-14', new Date('2026-02-28T23:30:00Z'))).toBe(true); // déjà le 1er mars à Tunis
  expect(isBirthdayMonth('1990-03-14', new Date('2026-04-01T10:00:00Z'))).toBe(false);
  expect(isBirthdayMonth(null)).toBe(false);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run --project unit src/lib/whatsapp.test.ts src/lib/dates.test.ts`
Expected: FAIL, `waLink` / `isBirthdayMonth` non définis.

- [ ] **Step 3: Implement**

`waLink` : `phone.replace(/\D/g, '')` puis `encodeURIComponent(text)`. Le `'` n'est pas encodé par `encodeURIComponent`, c'est attendu. `isBirthdayMonth` compare le mois de `businessDate(now)` avec celui de `birthday`. Dans `CustomerPanel.tsx`, remplacer les deux `href` construits à la main par `waLink(view.phone, text)` et `smsLink(view.phone, text)`, avec `text` = le message non encodé actuel.

- [ ] **Step 4: Run unit tests and e2e**

Run: `npm run -s test:unit && npm run -s test:e2e`
Expected: tout PASS. Le parcours e2e vérifie déjà les liens `wa.me/21622123456?text=…%2Fc%2F` et `sms:+21622123456?body=`.

- [ ] **Step 5: Commit**

`git commit -m "refactor: liens WhatsApp et SMS dans un module testé, mois d'anniversaire"`

---

### Task 2: Règle de relance (fonction pure)

**Files:**
- Create: `src/lib/reminders.ts`, `src/lib/reminders.test.ts`

**Interfaces:**
- Consumes: `cardHint(cardStamps)` de `src/lib/card-hint.ts`, `levelFromPepins` de `src/lib/rules.ts`, `isBirthdayMonth` (Task 1).
- Produces:
  - `type ReminderReason = 'reward_waiting' | 'one_stamp_away' | 'birthday_month' | 'dormant'`
  - `interface ReminderInput { cardStamps: number; lifetimePepins: number; birthday: string | null; createdAt: Date; lastVisitAt: Date | null; lastReminderAt: Date | null }`
  - `reminderReason(c: ReminderInput, now?: Date): ReminderReason | null`, avec une seule raison, la plus prioritaire, dans l'ordre du type ci-dessus
  - `reminderMessage(reason: ReminderReason, c: { firstName: string; cardStamps: number; cardUrl: string }): string`
  - `REMINDER_LABEL: Record<ReminderReason, string>`, soit `'Récompense à utiliser'`, `'À 1 tampon'`, `'Mois d’anniversaire'`, `'Pas venu depuis 45 jours'`

- [ ] **Step 1: Write the failing tests**

Un test par règle, avec une date fixe `now = new Date('2026-10-02T10:00:00Z')` et un client de base (`cardStamps: 0`, `lifetimePepins: 0`, `birthday: null`, `createdAt` à J-100, `lastVisitAt` à J-1, `lastReminderAt: null`). Pour une base non relançable, `reminderReason(base)` vaut `null`. Ensuite :
- `cardStamps: 3`, dernière visite à J-21, donne `'reward_waiting'` ; à J-20, `null`.
- `cardStamps: 4` (la prochaine récompense est à 5), dernière visite à J-7, donne `'one_stamp_away'` ; à J-6, `null`.
- `birthday: '1990-10-20'` avec `lifetimePepins: 21` (niveau 7) donne `'birthday_month'` ; avec `lifetimePepins: 15` (niveau 6), `null`.
- Dernière visite à J-45 donne `'dormant'`.
- `lastVisitAt: null` et `createdAt` à J-45 donne `'dormant'` (Review Focus 1).
- Priorité : `cardStamps: 4` avec une visite à J-45 donne `'reward_waiting'` (3 est atteint), et non `'dormant'`.
- Silence : n'importe quel cas ci-dessus avec `lastReminderAt` à J-13 donne `null` ; à J-14, la raison revient.
- `reminderMessage('reward_waiting', { firstName: 'Salma', cardStamps: 3, cardUrl: 'https://f.tn/c/x' })` contient `'Salma'`, `'−20 % sur 1 produit'` et `'https://f.tn/c/x'`, et ne contient pas `'—'`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run --project unit src/lib/reminders.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implement `reminderReason` and `reminderMessage`**

On compte les jours écoulés avec `Math.floor((now - date) / 86_400_000)`. La dernière visite est `lastVisitAt ?? createdAt`. Le texte exact des messages :
- `reward_waiting` : `Bonjour {prénom}, votre récompense KINZ vous attend : {libellé de cardHint(cardStamps).available}. Passez la récupérer en boutique. Votre carte : {cardUrl}`
- `one_stamp_away` : `Bonjour {prénom}, plus qu’un tampon avant {libellé de cardHint(cardStamps).next.stop} sur votre carte KINZ. À bientôt en boutique ! {cardUrl}`
- `birthday_month` : `Joyeux mois d’anniversaire {prénom} ! Profitez de −20 % chez KINZ tout ce mois-ci. Votre carte : {cardUrl}`
- `dormant` : `Bonjour {prénom}, ça fait un moment ! Vos pépins vous attendent chez KINZ. Votre carte : {cardUrl}`

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run --project unit src/lib/reminders.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

`git commit -m "feat: règle de relance des clients et messages WhatsApp"`

---

### Task 3: Type d'événement `reminder_sent` et liste côté serveur

**Files:**
- Modify: `src/db/schema.ts` (`eventType` : ajouter `'reminder_sent'` à la fin)
- Create: `drizzle/0001_*.sql` via `npm run db:generate`
- Create: `src/server/reminders.ts`
- Modify: `src/app/admin/page.tsx` (`TYPE_LABEL` : `reminder_sent: 'Relance'`)
- Test: `tests/integration/reminders.test.ts`

**Interfaces:**
- Consumes: `reminderReason`, `ReminderReason` (Task 2).
- Produces:
  - `interface ReminderCandidate { customerId: string; firstName: string; phone: string; token: string; cardStamps: number; reason: ReminderReason }`
  - `listReminderCandidates(db: Db, now?: Date): Promise<ReminderCandidate[]>`, trié par priorité de raison, puis par dernière visite (la plus ancienne en premier)
  - `recordReminder(db: Db, input: { customerId: string; reason: ReminderReason; staffId: string; now?: Date }): Promise<{ recorded: boolean }>`, où `recorded: false` signifie qu'une relance existe déjà dans les 14 derniers jours

- [ ] **Step 1: Write the failing integration tests**

Avec `makeCustomer` et `makeStaff` (`tests/integration/helpers.ts`), plus des événements insérés directement avec un `createdAt` daté :
- un client à 3 tampons, dernière visite à J-30 : il apparaît avec `reason: 'reward_waiting'` ;
- un client venu hier : il n'apparaît pas ;
- `recordReminder` sur le premier renvoie `{ recorded: true }` et crée un événement `type: 'reminder_sent'`, `detail: 'reward_waiting'`, `stampsDelta: 0`, `pepinsDelta: 0`, avec `businessDate` égal à `businessDate(now)`. Le client disparaît alors de `listReminderCandidates` ;
- un second appel immédiat renvoie `{ recorded: false }`, et il reste exactement un événement (Review Focus 2) ;
- `listEvents` et `exportEventsCsv` contiennent la ligne `reminder_sent` (Review Focus 5).

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run --project integration tests/integration/reminders.test.ts`
Expected: FAIL, module `@/server/reminders` introuvable.

- [ ] **Step 3: Implement the schema change, the migration and `src/server/reminders.ts`**

Une seule requête : `customers` avec deux sous-requêtes agrégées sur `events` (`max(created_at)` filtré sur `type = 'stamp'`, puis sur `type = 'reminder_sent'`), groupées par client. Le filtrage passe ensuite par `reminderReason` en JS. Le volume est celui d'une boutique, une requête par client n'est pas nécessaire. Vérifier que la migration générée contient `ALTER TYPE "public"."event_type" ADD VALUE 'reminder_sent';` et rien d'autre.

- [ ] **Step 4: Run integration tests and typecheck**

Run: `npm run -s typecheck && npm run -s test:integration`
Expected: PASS. Le typage échoue si `TYPE_LABEL` oublie la nouvelle valeur, c'est voulu.

- [ ] **Step 5: Commit**

`git commit -m "feat: journaliser les relances et lister les clients à relancer"`

---

### Task 4: Route d'enregistrement et section « À relancer » dans l'admin

**Files:**
- Create: `src/app/api/admin/reminders/route.ts`
- Create: `src/components/admin/ReminderList.tsx` (`'use client'`)
- Modify: `src/app/admin/page.tsx` (nouvelle section avant « Figuiers et Légendes »)
- Test: `tests/integration/reminders.test.ts` (ajouts), `tests/e2e/parcours.spec.ts` (ajout)

**Interfaces:**
- Consumes: `listReminderCandidates`, `recordReminder` (Task 3), `waLink` (Task 1), `reminderMessage`, `REMINDER_LABEL` (Task 2), `env().APP_URL`.
- Produces:
  - `POST /api/admin/reminders` avec le corps `{ customerId: uuid, reason: ReminderReason }`. Réponses : `200 { ok: true, recorded: boolean }`, `403` pour un compte `staff`, `400` si le corps est invalide (via `jsonError`, sur le modèle de `src/app/api/staff/perk/route.ts`)
  - `<ReminderList appUrl={string} candidates={ReminderCandidate[]} />`

- [ ] **Step 1: Write the failing tests**

Intégration (sur le modèle de `tests/integration/admin.test.ts`) :
- la route renvoie 403 avec un cookie `staff` ;
- elle renvoie 200 `{ ok: true, recorded: true }` avec un cookie `owner` ;
- elle renvoie 200 `{ ok: true, recorded: false }` au second appel ;
- elle renvoie 400 avec `reason: 'autre'`.

E2E : on crée un client par `/rejoindre`, on met en base `cardStamps: 3` et un `createdAt` à J-30. Un owner se connecte et va sur `/admin`. On vérifie que `getByRole('link', { name: /Relancer .* par WhatsApp/ })` a un `href` qui commence par `https://wa.me/216`. On clique, puis on vérifie que la ligne disparaît.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run --project integration tests/integration/reminders.test.ts`
Expected: FAIL, route introuvable.

- [ ] **Step 3: Implement the route and the component**

Chaque ligne affiche le prénom, le numéro et `REMINDER_LABEL[reason]`, avec un lien `<a target="_blank" rel="noopener">` dont le libellé accessible est `Relancer {prénom} par WhatsApp` et le `href` est `waLink(phone, reminderMessage(reason, { firstName, cardStamps, cardUrl: `${appUrl}/c/${token}` }))`. Au clic, le lien s'ouvre normalement, et le composant envoie en parallèle le `POST` puis appelle `router.refresh()`. Si la liste est vide, afficher `Personne à relancer aujourd’hui.`

- [ ] **Step 4: Run all tests**

Run: `npm run -s typecheck && npm run -s lint && npm run -s test:unit && npm run -s test:integration && npm run -s test:e2e`
Expected: tout PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: section À relancer avec lien WhatsApp prérempli"`

---

### Task 5: Bandeau d'anniversaire sur la carte

**Files:**
- Create: `src/components/card/BirthdayBanner.tsx`
- Modify: `src/app/c/[token]/page.tsx` (afficher le bandeau entre le titre et `LoyaltyCard`)
- Modify: `src/lib/views.ts` (`CardView` : ajouter `birthdayPerk: 'month' | 'day' | null`), `src/lib/views.test.ts`

**Interfaces:**
- Consumes: `isBirthday`, `isBirthdayMonth` (Task 1).
- Produces: `buildCardView(c: Customer, now?: Date)` remplit `birthdayPerk` :
  - `'day'` si c'est le jour même et niveau ≥ 19 ;
  - sinon `'month'` si c'est le mois et niveau ≥ 7 ;
  - sinon `null`.

- [ ] **Step 1: Write the failing tests** in `views.test.ts`, avec un client né le `'1990-10-02'` :
  - à `now = 2026-10-02` avec `lifetimePepins: 171` (niveau 19), on obtient `'day'` ;
  - à `2026-10-05`, même niveau, on obtient `'month'` ;
  - avec `lifetimePepins: 15` (niveau 6), on obtient `null` ;
  - sans date d'anniversaire, on obtient `null`.
- [ ] **Step 2: Run** `npx vitest run --project unit src/lib/views.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Les textes du bandeau :
  - `'month'` : `Joyeux mois d’anniversaire ! −20 % sur vos achats chez KINZ jusqu’à la fin du mois.`
  - `'day'` : `Joyeux anniversaire ! Aujourd’hui, vos tampons sont doublés, et −20 % sur vos achats.`

  Style : `rounded-3xl bg-lime px-5 py-4 text-forest`, avec la feuille `rounded-tl-full rounded-br-full` comme pastille, comme sur `/rejoindre`. Ce n'est pas un `role="alert"`.
- [ ] **Step 4: Run** `npm run -s test:unit && npm run -s test:e2e`. Expected: PASS. L'e2e « Niveau 2 » reste unique, puisque le bandeau ne contient pas « niveau ».
- [ ] **Step 5: Commit** `git commit -m "feat: bandeau d'anniversaire sur la carte client"`

---

### Task 6: Deux chiffres de mesure dans l'admin

**Files:**
- Modify: `src/server/reminders.ts` (ajout), `src/app/admin/page.tsx`
- Test: `tests/integration/reminders.test.ts` (ajout)

**Interfaces:**
- Produces: `returnStats(db: Db, now?: Date): Promise<{ customers: number; returning: number; reminders90d: number; remindersFollowed: number }>`
  - `returning` : les clients avec au moins 2 événements `stamp` ;
  - `remindersFollowed` : les relances des 90 derniers jours suivies d'un `stamp` du même client dans les 14 jours.

- [ ] **Step 1: Write the failing test.** On prend 3 clients : A avec 2 tampons sur deux jours, B avec 1 tampon, C avec 0. On ajoute une relance à C à J-10, suivie d'un tampon à J-5. On attend `{ customers: 3, returning: 1, reminders90d: 1, remindersFollowed: 1 }`.
- [ ] **Step 2: Run** `npx vitest run --project integration tests/integration/reminders.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Deux requêtes SQL agrégées. Affichage en haut de l'admin, deux phrases :
  - `{returning} clients sur {customers} sont revenus au moins une fois ({pourcentage arrondi} %).` ;
  - `{remindersFollowed} relances sur {reminders90d} ont été suivies d’une visite dans les 14 jours (90 derniers jours).`

  Si les dénominateurs valent 0, afficher `0 %` sans diviser.
- [ ] **Step 4: Run all checks** (même commande que la Task 4, Step 4). Expected: tout PASS.
- [ ] **Step 5: Commit** `git commit -m "feat: taux de retour et efficacité des relances dans l'admin"`

---

## Livraison

1. `superpowers:verification-before-completion` : relancer toute la batterie de la Task 4, Step 4, et faire des captures mobiles de `/admin` et de la carte avec le bandeau. Le dev local se lance par `preview_start kinz-dev`.
2. PR `feat/relances` vers `main`. Sa description liste ce qui change, la migration (un `ALTER TYPE … ADD VALUE`, appliqué automatiquement par `vercel.json` au déploiement) et le résultat des tests.
3. Fusion seulement après l'accord de Nassim.
