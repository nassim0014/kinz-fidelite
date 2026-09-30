# KINZ Fidélité (« Le Code KINZ ») Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready loyalty web app for the KINZ boutique. Customers keep a stamp card on their phone, staff stamp it by scanning a QR code, and a prime/Fibonacci level game runs up to level 50.

**Architecture:**
- One Next.js App Router app with three surfaces: customer (`/rejoindre`, `/c/[token]`), staff (`/staff`) and owner (`/admin`).
- All game maths lives in one pure module (`src/lib/rules.ts`).
- Database writes go through small server services (`src/server/*`). Each takes a Drizzle `db` handle, runs stamps and redeems inside row-locked transactions, and relies on a partial unique index that enforces one stamp per customer per Tunis day.
- API route handlers are thin layers: Zod validation → service → JSON, with a single error mapper.

**Tech Stack:**
- Next.js (latest, App Router, TypeScript strict), React, Tailwind CSS v4.
- Drizzle ORM + drizzle-kit migrations, `postgres` (postgres.js) driver, Neon Postgres in prod, Docker Postgres 16 locally.
- Zod, jose (JWT sessions), bcryptjs, qrcode, html5-qrcode.
- Vitest (unit + integration), Playwright (e2e), GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-30-kinz-fidelite-design.md`

## Global Constraints

- Node 20.20 is installed locally and CI uses Node 20. Use **npm**, not pnpm (current pnpm needs Node ≥ 22.13). This is a deliberate change from the spec.
- All customer- and staff-facing text is in **French**.
- Stamp amounts: `< 40 TND` → refused (no pépins); `≥ 40` → 1 tampon; `≥ 120` → 2; `≥ 300` → 3. A receipt `> 5000 TND` is refused as a typing error (`MAX_AMOUNT_TND = 5000`).
- One stamp scan per customer per **Africa/Tunis** calendar day, enforced by the database.
- Pépins = `floor(total / 40) × multiplier`, using the multiplier of the level **before** the purchase.
- Card stops (primes): 3, 5, 7, 11, 13. The card is capped at 13. Stops 11 and 13 give +11 / +13 bonus pépins (not multiplied).
- Levels: reaching level L takes `L(L−1)/2` pépins in total; the maximum level is 50 (1,225 pépins).
- Multipliers: ×1 for levels 1–12, ×2 for 13–20, ×3 for 21–33, ×5 for 34–50.
- Titles: Graine 1–4, Pousse 5–7, Raquette 8–12, Fleur 13–20, Figue 21–33, Figuier 34–49, "Légende — Le Figuier d'Or" 50.
- After a redeem, the card resets to 0, or to 1 at level 17+, or to 2 at level 23+. Level 19+: tampons are doubled on the customer's birthday.
- Rewards apply to single products only (no packs, trios, duos, collections or coffrets); a free product is capped at 49 TND. This is shown in the UI; staff apply it at the till.
- Brand tokens:
  - olive `#4A5530`, olive-mid `#6A7B4D`, sand `#F5F0E6`, ink `#1A1A1A`
  - gold `#C9A961` (decorative only), gold-pale `#F0E3C0` (text on green), bronze `#7A6320` (gold text on light), muted `#4A4A4A`
  - Fonts: Playfair Display (display), Lato (text).
- Secrets live only in `.env.local` (git-ignored) and Vercel. `.env.example` and `.env.test` (local Docker credentials only) are committed.
- Staff PINs are exactly 6 digits, bcrypt-hashed. Session cookie `kinz_session`: httpOnly, `SameSite=Strict`, `Secure` in production, 12 h lifetime. Login locks for 10 minutes after 5 failed attempts.
- Card tokens are 16 random bytes in base64url (22 characters).
- Work on branch `feat/loyalty-app`, commit after every task, and open a PR to `main` at the end.
- Every commit message ends with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7
  ```

**Deliberate changes from the spec:**
- npm instead of pnpm (see above).
- No `GET /api/customer/[token]`: the card page is server-rendered and refreshes itself every 15 s.
- The `bonus` event type records the stop-11/13 bonus pépins, written in the same transaction as the `redeem` event.

## Review Focus

1. **Someone joins with a phone number that already has a card.** They must NOT receive the existing card's link, which would let anyone take over a card by typing a phone number. Expected: 409 "Ce numéro a déjà une carte — demandez au comptoir…". Tests: Task 5 (service) and Task 8 (route response has no `token`).
2. **Staff type the amount the French/Tunisian way** ("85,500", "1 250", "85.5 TND"). Expected: "85,500" → 85.5 and "1 250" → 1250; anything else is rejected with "Montant invalide", never silently mis-parsed. Test: Task 3 `parseAmount`.
3. **A typo inflates the amount** ("8550" instead of "85,50"). Expected: amounts over 5000 TND are refused, and the staff UI asks for a second confirmation at ≥ 300 TND. Tests: Task 6 (`AMOUNT_TOO_HIGH`) and Task 8 (route 400).
4. **Double tap or two staff phones scanning the same customer at once.** Expected: exactly one stamp is recorded and the other request gets "Déjà tamponné aujourd'hui". Test: Task 6 concurrent `Promise.allSettled`.
5. **Stamping around midnight.** The server runs in UTC but the shop is in Tunis (UTC+1). Expected: a visit at 00:30 Tunis time counts for the new Tunis day. Test: Task 3 `businessDate` at 23:30Z.

---

## File Map

```
kinz-fidelite/
├── .github/workflows/ci.yml            CI: lint, format, typecheck, unit, integration, e2e
├── docker-compose.yml, docker/init.sql Local Postgres 16 (kinz_dev + kinz_test) on :5433
├── .env.example, .env.test             Env templates (test = local Docker only)
├── drizzle.config.ts, drizzle/         Migration config + generated SQL
├── vitest.config.ts, playwright.config.ts
├── vercel.json                         Build = migrate + next build
├── scripts/migrate.ts, seed-owner.ts, make-icons.mjs
├── assets/logo.png                     Source for PWA icons
├── src/lib/          (pure, no I/O — unit tested next to each file)
│   ├── env.ts        typed env (zod), lazy
│   ├── rules.ts      ALL game rules
│   ├── phone.ts      Tunisian phone normalisation
│   ├── amount.ts     receipt amount parsing
│   ├── dates.ts      Tunis business date, birthday, formatting
│   ├── token.ts      card token format + extraction from scanned QR
│   ├── views.ts      CardView / StaffCustomerView / result types + buildCardView
│   ├── messages.ts   staff feedback strings
│   ├── csv.ts        CSV export (injection-safe)
│   └── card-storage.ts  localStorage helpers (client)
├── src/db/  schema.ts, index.ts (makeDb, Db, Tx), client.ts (getDb singleton)
├── src/server/  (I/O — integration tested in tests/integration)
│   ├── errors.ts     AppError + French messages + HTTP status
│   ├── customers.ts  create / lookup / address
│   ├── stamping.ts   stamp / redeem
│   ├── perks.ts      manual perks + staff view
│   ├── auth.ts       PIN, JWT session, login + rate limit
│   ├── session.ts    requireStaff(req) for route handlers
│   ├── page-session.ts getPageSession() for server components
│   ├── staff.ts      staff CRUD
│   ├── admin.ts      event log, Figuiers list, CSV exports
│   └── http.ts       jsonError mapper
├── src/app/          pages + API routes (see tasks)
├── src/components/card|staff|admin/
└── tests/  support/db.ts, integration/*, e2e/*
```

---

### Task 1: Scaffold, tooling, env module, CI skeleton

**Files:**
- Create: Next.js scaffold (copied into the repo), `.prettierrc`, `.prettierignore`, `vitest.config.ts`, `docker-compose.yml`, `docker/init.sql`, `.env.example`, `.env.test`, `src/lib/env.ts`, `src/lib/env.test.ts`, `.github/workflows/ci.yml`
- Modify: `.gitignore`, `package.json` (scripts), `eslint.config.mjs`

**Interfaces:**
- Produces: `parseEnv(source: Record<string, string | undefined>): Env`, `env(): Env` where `Env = { DATABASE_URL: string; SESSION_SECRET: string; APP_URL: string; NODE_ENV: 'development' | 'test' | 'production' }` (`APP_URL` has no trailing slash).

- [ ] **Step 1: Create the feature branch**

```bash
cd /home/kiwif/Desktop/Claude/kinz-fidelite
git checkout -b feat/loyalty-app
```

- [ ] **Step 2: Scaffold Next.js in the scratchpad and copy it in (the repo already has files)**

```bash
S=/tmp/claude-1000/-home-kiwif-Desktop-Claude/c721527a-67d4-4277-bac0-79459c996554/scratchpad
cd "$S" && rm -rf kinz-scaffold
npx --yes create-next-app@latest kinz-scaffold --ts --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --turbopack --yes
rsync -a --exclude .git --exclude README.md --exclude .gitignore kinz-scaffold/ \
  /home/kiwif/Desktop/Claude/kinz-fidelite/
cd /home/kiwif/Desktop/Claude/kinz-fidelite && ls
```
Expected: `package.json`, `src/app`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json` present.

- [ ] **Step 3: Install dependencies**

```bash
npm i drizzle-orm postgres zod jose bcryptjs qrcode html5-qrcode
npm i -D drizzle-kit vitest tsx dotenv prettier eslint-config-prettier @playwright/test @types/qrcode sharp
```

- [ ] **Step 4: Replace `.gitignore`**

```gitignore
node_modules/
.next/
out/
next-env.d.ts
*.tsbuildinfo
.env*
!.env.example
!.env.test
coverage/
playwright-report/
test-results/
.vercel
```

- [ ] **Step 5: Add Prettier config and wire it into ESLint**

`.prettierrc`:
```json
{ "singleQuote": true, "printWidth": 100, "trailingComma": "all" }
```
`.prettierignore`:
```
.next
drizzle
docs
public
package-lock.json
playwright-report
test-results
```
In `eslint.config.mjs`, add `import prettier from 'eslint-config-prettier/flat';` at the top. Append `prettier` as the last element of the exported config array. Add a `{ ignores: ['drizzle/**', 'playwright-report/**', 'test-results/**'] }` entry.

- [ ] **Step 6: Set `package.json` scripts** (merge into the existing `scripts` object)

```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "format": "prettier --check .",
  "format:write": "prettier --write .",
  "typecheck": "tsc --noEmit",
  "test:unit": "vitest run --project unit",
  "test:integration": "vitest run --project integration",
  "test:e2e": "playwright test",
  "db:up": "docker compose up -d --wait",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx scripts/migrate.ts",
  "db:seed-owner": "tsx scripts/seed-owner.ts",
  "icons": "node scripts/make-icons.mjs"
}
```

- [ ] **Step 7: Local Postgres**

`docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: kinz
      POSTGRES_PASSWORD: kinz
      POSTGRES_DB: kinz_dev
    ports: ['5433:5432']
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U kinz']
      interval: 2s
      retries: 20
volumes:
  pgdata:
```
`docker/init.sql`:
```sql
CREATE DATABASE kinz_test;
```
`.env.example`:
```
DATABASE_URL=postgres://kinz:kinz@localhost:5433/kinz_dev
SESSION_SECRET=change-me-to-a-random-string-of-at-least-32-chars
APP_URL=http://localhost:3000
```
`.env.test`:
```
DATABASE_URL=postgres://kinz:kinz@localhost:5433/kinz_test
SESSION_SECRET=test-secret-test-secret-test-secret-123
APP_URL=http://localhost:3100
```
Then run:
```bash
cp .env.example .env.local && npm run db:up
```
Expected: container healthy.

- [ ] **Step 8: Vitest config (unit project only for now)**

`vitest.config.ts`:
```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    projects: [
      { extends: true, test: { name: 'unit', include: ['src/**/*.test.ts'], environment: 'node' } },
    ],
  },
});
```

- [ ] **Step 9: Write the failing env test**

`src/lib/env.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const valid = {
  DATABASE_URL: 'postgres://kinz:kinz@localhost:5433/kinz_dev',
  SESSION_SECRET: 'x'.repeat(32),
  APP_URL: 'http://localhost:3000/',
};

describe('parseEnv', () => {
  it('accepts a complete environment and strips the trailing slash of APP_URL', () => {
    expect(parseEnv(valid).APP_URL).toBe('http://localhost:3000');
  });
  it('rejects a short session secret', () => {
    expect(() => parseEnv({ ...valid, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
  });
  it('rejects a missing database url', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });
});
```

- [ ] **Step 10: Run it and confirm it fails**

Run: `npm run test:unit`
Expected: FAIL, "Cannot find module './env'" (or equivalent).

- [ ] **Step 11: Implement `src/lib/env.ts`**

```ts
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  APP_URL: z
    .string()
    .url()
    .transform((u) => u.replace(/\/+$/, '')),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const keys = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Variables d'environnement invalides : ${keys}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Validated lazily on first use so `next build` works without runtime secrets. */
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
```

- [ ] **Step 12: Run the tests and confirm they pass**

Run: `npm run test:unit`
Expected: 3 passed.

- [ ] **Step 13: CI skeleton** — `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format
      - run: npm run typecheck
      - run: npm run test:unit
```

- [ ] **Step 14: Format, verify everything is green, commit**

```bash
npm run format:write && npm run lint && npm run typecheck && npm run test:unit && npm run build
git add -A
git commit -m "chore: scaffold Next.js app with tooling, env validation and CI

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 2: Game rules (`src/lib/rules.ts`)

**Files:**
- Create: `src/lib/rules.ts`, `src/lib/rules.test.ts`

**Interfaces:**
- Produces (all exported from `@/lib/rules`):
  - `MIN_AMOUNT_TND = 40`, `MAX_AMOUNT_TND = 5000`, `CARD_MAX = 13`, `MAX_LEVEL = 50`
  - `isPrime(n: number): boolean`, `isFibonacci(n: number): boolean`, `isGolden(n: number): boolean`
  - `stampsFor(amountTnd: number): 0 | 1 | 2 | 3`
  - `stampsForVisit(amountTnd: number, level: number, isBirthday: boolean): number`
  - `multiplier(level: number): 1 | 2 | 3 | 5`
  - `pepinsFor(amountTnd: number, level: number): number`
  - `pepinsToReach(level: number): number`, `levelFromPepins(pepins: number): number`
  - `levelProgress(pepins: number): { level: number; intoLevel: number; levelCost: number | null }`
  - `title(level: number): string`
  - `type StopStamps = 3 | 5 | 7 | 11 | 13`
  - `interface CardStop { stamps: StopStamps; label: string; bonusPepins: number }`
  - `CARD_STOPS: readonly CardStop[]`
  - `availableStops(cardStamps: number): CardStop[]`
  - `addStamps(card: number, added: number): number`
  - `resetValue(level: number): 0 | 1 | 2`
  - `type PerkKind = 'auto' | 'once' | 'yearly' | 'ongoing'`
  - `interface Perk { level: number; label: string; kind: PerkKind }`
  - `PERKS: readonly Perk[]`
  - `perksUnlocked(level: number): Perk[]`, `nextPerk(level: number): Perk | null`

- [ ] **Step 1: Write the failing tests** — `src/lib/rules.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  CARD_STOPS, PERKS, addStamps, availableStops, isFibonacci, isGolden, isPrime, levelFromPepins,
  levelProgress, multiplier, nextPerk, pepinsFor, pepinsToReach, perksUnlocked, resetValue,
  stampsFor, stampsForVisit, title,
} from './rules';

describe('number helpers', () => {
  it('detects primes', () => {
    expect([1, 2, 3, 4, 9, 13, 47, 49].map(isPrime)).toEqual([false, true, true, false, false, true, true, false]);
  });
  it('detects Fibonacci numbers', () => {
    expect([1, 2, 3, 4, 5, 8, 13, 21, 34, 50].map(isFibonacci)).toEqual([true, true, true, false, true, true, true, true, true, false]);
  });
  it('golden = prime AND Fibonacci: exactly 2, 3, 5, 13 up to 50', () => {
    const golden = Array.from({ length: 50 }, (_, i) => i + 1).filter(isGolden);
    expect(golden).toEqual([2, 3, 5, 13]);
  });
});

describe('stamps per receipt', () => {
  it.each([
    [39.999, 0], [40, 1], [119.999, 1], [120, 2], [299.999, 2], [300, 3], [5000, 3],
  ])('%s TND → %s tampon(s)', (amount, expected) => {
    expect(stampsFor(amount)).toBe(expected);
  });
  it('doubles tampons on birthday from level 19', () => {
    expect(stampsForVisit(130, 19, true)).toBe(4);
    expect(stampsForVisit(130, 18, true)).toBe(2);
    expect(stampsForVisit(130, 19, false)).toBe(2);
  });
});

describe('pépins and levels', () => {
  it('uses Fibonacci multipliers switching at levels 13, 21 and 34', () => {
    expect([1, 12, 13, 20, 21, 33, 34, 50].map(multiplier)).toEqual([1, 1, 2, 2, 3, 3, 5, 5]);
  });
  it('earns floor(total/40) × multiplier', () => {
    expect(pepinsFor(39, 1)).toBe(0);
    expect(pepinsFor(85.5, 1)).toBe(2);
    expect(pepinsFor(85.5, 13)).toBe(4);
    expect(pepinsFor(400, 34)).toBe(50);
  });
  it('level L costs L(L−1)/2 pépins in total', () => {
    expect([1, 2, 13, 50].map(pepinsToReach)).toEqual([0, 1, 78, 1225]);
  });
  it('derives the level from lifetime pépins, capped at 50', () => {
    expect([0, 1, 2, 3, 77, 78, 1224, 1225, 99999].map(levelFromPepins)).toEqual([1, 2, 2, 3, 12, 13, 49, 50, 50]);
  });
  it('reports progress inside the current level', () => {
    expect(levelProgress(80)).toEqual({ level: 13, intoLevel: 2, levelCost: 13 });
    expect(levelProgress(1300)).toEqual({ level: 50, intoLevel: 75, levelCost: null });
  });
  it('names each level band', () => {
    expect([1, 4, 5, 7, 8, 12, 13, 20, 21, 33, 34, 49, 50].map(title)).toEqual([
      'Graine', 'Graine', 'Pousse', 'Pousse', 'Raquette', 'Raquette', 'Fleur', 'Fleur',
      'Figue', 'Figue', 'Figuier', 'Figuier', "Légende — Le Figuier d'Or",
    ]);
  });
});

describe('card', () => {
  it('places every stop on a prime number', () => {
    expect(CARD_STOPS.map((s) => s.stamps)).toEqual([3, 5, 7, 11, 13]);
    expect(CARD_STOPS.every((s) => isPrime(s.stamps))).toBe(true);
  });
  it('gives bonus pépins only at 11 and 13', () => {
    expect(CARD_STOPS.map((s) => s.bonusPepins)).toEqual([0, 0, 0, 11, 13]);
  });
  it('lists the stops the customer can use', () => {
    expect(availableStops(0)).toEqual([]);
    expect(availableStops(6).map((s) => s.stamps)).toEqual([3, 5]);
    expect(availableStops(13)).toHaveLength(5);
  });
  it('caps the card at 13', () => {
    expect(addStamps(12, 3)).toBe(13);
    expect(addStamps(13, 1)).toBe(13);
    expect(addStamps(4, 2)).toBe(6);
  });
  it('restarts the card at 1 from level 17 and at 2 from level 23', () => {
    expect([16, 17, 22, 23, 50].map(resetValue)).toEqual([0, 1, 1, 2, 2]);
  });
});

describe('perks', () => {
  it('sits every perk on a prime or Fibonacci level, or on 50', () => {
    expect(PERKS.every((p) => isPrime(p.level) || isFibonacci(p.level) || p.level === 50)).toBe(true);
  });
  it('unlocks perks cumulatively and names the next one', () => {
    expect(perksUnlocked(4).map((p) => p.level)).toEqual([2, 3]);
    expect(nextPerk(4)?.level).toBe(5);
    expect(nextPerk(50)).toBeNull();
  });
  it('flags the automatic perks', () => {
    expect(PERKS.filter((p) => p.kind === 'auto').map((p) => p.level)).toEqual([13, 17, 19, 23]);
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npm run test:unit -- src/lib/rules.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/rules.ts`**

```ts
/** Le Code KINZ — every game rule lives here. Pure functions only. */

export const MIN_AMOUNT_TND = 40;
export const MAX_AMOUNT_TND = 5000;
export const CARD_MAX = 13;
export const MAX_LEVEL = 50;

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

export function isFibonacci(n: number): boolean {
  if (!Number.isInteger(n) || n < 1) return false;
  let [a, b] = [1, 2];
  while (a < n) [a, b] = [b, a + b];
  return a === n;
}

export const isGolden = (n: number): boolean => isPrime(n) && isFibonacci(n);

export function stampsFor(amountTnd: number): 0 | 1 | 2 | 3 {
  if (amountTnd >= 300) return 3;
  if (amountTnd >= 120) return 2;
  if (amountTnd >= MIN_AMOUNT_TND) return 1;
  return 0;
}

export function stampsForVisit(amountTnd: number, level: number, isBirthday: boolean): number {
  const base = stampsFor(amountTnd);
  return level >= 19 && isBirthday ? base * 2 : base;
}

export function multiplier(level: number): 1 | 2 | 3 | 5 {
  if (level >= 34) return 5;
  if (level >= 21) return 3;
  if (level >= 13) return 2;
  return 1;
}

export function pepinsFor(amountTnd: number, level: number): number {
  return Math.floor(amountTnd / MIN_AMOUNT_TND) * multiplier(level);
}

/** Going from level n to n+1 costs n pépins, so level L needs L(L−1)/2 in total. */
export function pepinsToReach(level: number): number {
  return (level * (level - 1)) / 2;
}

export function levelFromPepins(pepins: number): number {
  let level = 1;
  while (level < MAX_LEVEL && pepinsToReach(level + 1) <= pepins) level++;
  return level;
}

export function levelProgress(pepins: number): {
  level: number;
  intoLevel: number;
  levelCost: number | null;
} {
  const level = levelFromPepins(pepins);
  return {
    level,
    intoLevel: pepins - pepinsToReach(level),
    levelCost: level < MAX_LEVEL ? level : null,
  };
}

export function title(level: number): string {
  if (level >= 50) return "Légende — Le Figuier d'Or";
  if (level >= 34) return 'Figuier';
  if (level >= 21) return 'Figue';
  if (level >= 13) return 'Fleur';
  if (level >= 8) return 'Raquette';
  if (level >= 5) return 'Pousse';
  return 'Graine';
}

export type StopStamps = 3 | 5 | 7 | 11 | 13;

export interface CardStop {
  stamps: StopStamps;
  label: string;
  bonusPepins: number;
}

export const CARD_STOPS: readonly CardStop[] = [
  { stamps: 3, label: '−20 % sur 1 produit', bonusPepins: 0 },
  { stamps: 5, label: '−50 % sur 1 produit', bonusPepins: 0 },
  { stamps: 7, label: '−50 % sur 2 produits', bonusPepins: 0 },
  { stamps: 11, label: '1 produit offert (≤ 49 TND) + 11 pépins', bonusPepins: 11 },
  {
    stamps: 13,
    label: '1 produit offert (≤ 49 TND) + −50 % sur un 2e + 13 pépins',
    bonusPepins: 13,
  },
];

export function availableStops(cardStamps: number): CardStop[] {
  return CARD_STOPS.filter((s) => s.stamps <= cardStamps);
}

export function addStamps(card: number, added: number): number {
  return Math.min(CARD_MAX, card + added);
}

export function resetValue(level: number): 0 | 1 | 2 {
  if (level >= 23) return 2;
  if (level >= 17) return 1;
  return 0;
}

export type PerkKind = 'auto' | 'once' | 'yearly' | 'ongoing';

export interface Perk {
  level: number;
  label: string;
  kind: PerkKind;
}

export const PERKS: readonly Perk[] = [
  { level: 2, label: 'Échantillon de bienvenue', kind: 'once' },
  { level: 3, label: 'Un échantillon offert', kind: 'once' },
  { level: 5, label: 'Huile de figue de barbarie 10 ml offerte', kind: 'once' },
  { level: 7, label: '−20 % pendant le mois de votre anniversaire', kind: 'ongoing' },
  { level: 11, label: 'Emballage cadeau offert', kind: 'ongoing' },
  { level: 13, label: 'Pépins ×2 — vous devenez Fleur', kind: 'auto' },
  { level: 17, label: 'Votre carte redémarre à 1 tampon', kind: 'auto' },
  { level: 19, label: 'Tampons doublés le jour de votre anniversaire', kind: 'auto' },
  { level: 23, label: 'Votre carte redémarre à 2 tampons', kind: 'auto' },
  { level: 29, label: 'Livraison offerte sur kinzoils.com', kind: 'ongoing' },
  { level: 31, label: 'Votez pour le prochain produit', kind: 'ongoing' },
  { level: 34, label: 'Chaque nouveauté livrée gratuitement avant sa sortie', kind: 'ongoing' },
  { level: 37, label: 'Une carte cadeau à offrir à un proche', kind: 'once' },
  { level: 41, label: 'Un coffret offert chaque année', kind: 'yearly' },
  { level: 43, label: "Visite de l'atelier et rencontre avec les fondateurs", kind: 'once' },
  { level: 47, label: '−10 % permanent', kind: 'ongoing' },
  { level: 50, label: 'Votre nom sur le Mur des Légendes + une édition limitée co-créée', kind: 'once' },
];

export function perksUnlocked(level: number): Perk[] {
  return PERKS.filter((p) => p.level <= level);
}

export function nextPerk(level: number): Perk | null {
  return PERKS.find((p) => p.level > level) ?? null;
}
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npm run test:unit -- src/lib/rules.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
npm run format:write
git add src/lib/rules.ts src/lib/rules.test.ts
git commit -m "feat: implement Le Code KINZ game rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 3: Input and time helpers

**Files:**
- Create: `src/lib/phone.ts`, `src/lib/amount.ts`, `src/lib/dates.ts`, `src/lib/token.ts`, and a `*.test.ts` next to each

**Interfaces:**
- Produces:
  - `normalizeTunisianPhone(input: string): string | null`, returning `+216XXXXXXXX`
  - `parseAmount(input: string): number | null`
  - `businessDate(now?: Date): string` (`YYYY-MM-DD` in Africa/Tunis)
  - `isBirthday(birthday: string | null, now?: Date): boolean`
  - `isValidBirthday(value: string, now?: Date): boolean`
  - `formatDateTime(d: Date): string`
  - `isCardToken(value: string): boolean`
  - `extractToken(scanned: string): string | null`

- [ ] **Step 1: Write the failing tests**

`src/lib/phone.test.ts`:
```ts
import { expect, it } from 'vitest';
import { normalizeTunisianPhone } from './phone';

it.each([
  ['22 123 456', '+21622123456'],
  ['+216 22 123 456', '+21622123456'],
  ['0021698765432', '+21698765432'],
  ['71.234.567', '+21671234567'],
])('normalises %s', (input, expected) => {
  expect(normalizeTunisianPhone(input)).toBe(expected);
});

it.each(['1234567', '123456789', '12345678', 'abc', '+33612345678', ''])('rejects %s', (input) => {
  expect(normalizeTunisianPhone(input)).toBeNull();
});
```
`src/lib/amount.test.ts`:
```ts
import { expect, it } from 'vitest';
import { parseAmount } from './amount';

it.each([
  ['85', 85], ['85,500', 85.5], ['85.5', 85.5], [' 1 250 ', 1250], ['1 250,000', 1250], ['40', 40],
])('parses %j', (input, expected) => {
  expect(parseAmount(input)).toBe(expected);
});

it.each(['', 'abc', '85.5 TND', '1.250,000', '-40', '85,5555', '1e3'])('rejects %j', (input) => {
  expect(parseAmount(input)).toBeNull();
});
```
`src/lib/dates.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { businessDate, isBirthday, isValidBirthday } from './dates';

describe('businessDate (Africa/Tunis, UTC+1)', () => {
  it('rolls over at Tunis midnight, not UTC midnight', () => {
    expect(businessDate(new Date('2026-09-30T22:59:00Z'))).toBe('2026-09-30');
    expect(businessDate(new Date('2026-09-30T23:30:00Z'))).toBe('2026-10-01');
  });
});

describe('isBirthday', () => {
  const at = (iso: string) => new Date(iso);
  it('matches month and day in Tunis time', () => {
    expect(isBirthday('1990-10-01', at('2026-09-30T23:30:00Z'))).toBe(true);
    expect(isBirthday('1990-10-01', at('2026-10-02T10:00:00Z'))).toBe(false);
    expect(isBirthday(null, at('2026-10-01T10:00:00Z'))).toBe(false);
  });
  it('celebrates 29 February on 28 February in non-leap years', () => {
    expect(isBirthday('2000-02-29', at('2027-02-28T10:00:00Z'))).toBe(true);
    expect(isBirthday('2000-02-29', at('2028-02-28T10:00:00Z'))).toBe(false);
    expect(isBirthday('2000-02-29', at('2028-02-29T10:00:00Z'))).toBe(true);
  });
});

describe('isValidBirthday', () => {
  const now = new Date('2026-09-30T10:00:00Z');
  it.each([
    ['1990-10-01', true], ['2026-02-31', false], ['1899-12-31', false], ['2027-01-01', false], ['01/10/1990', false],
  ])('%s → %s', (value, expected) => {
    expect(isValidBirthday(value, now)).toBe(expected);
  });
});
```
`src/lib/token.test.ts`:
```ts
import { expect, it } from 'vitest';
import { extractToken, isCardToken } from './token';

const token = 'AbCdEfGhIjKlMnOpQrSt_-';

it('recognises a 22-character base64url token', () => {
  expect(isCardToken(token)).toBe(true);
  expect(isCardToken('short')).toBe(false);
  expect(isCardToken(`${token}x`)).toBe(false);
});

it('extracts the token from a scanned card URL or a raw token', () => {
  expect(extractToken(`https://fidelite.kinzoils.com/c/${token}`)).toBe(token);
  expect(extractToken(`http://localhost:3000/c/${token}?x=1`)).toBe(token);
  expect(extractToken(token)).toBe(token);
  expect(extractToken('https://example.com/other')).toBeNull();
  expect(extractToken('')).toBeNull();
});
```

- [ ] **Step 2: Run and confirm they fail**

Run: `npm run test:unit`
Expected: FAIL for the 4 new files (modules missing).

- [ ] **Step 3: Implement**

`src/lib/phone.ts`:
```ts
/** Accepts 8-digit Tunisian numbers with optional +216 / 00216 / 216 prefix. */
export function normalizeTunisianPhone(input: string): string | null {
  const compact = input.replace(/[\s.\-()]/g, '');
  const match = compact.match(/^(?:\+216|00216|216)?([2-9]\d{7})$/);
  return match ? `+216${match[1]}` : null;
}
```
`src/lib/amount.ts`:
```ts
/** Parses a receipt total typed by staff: "85,500", "85.5", "1 250". Up to 3 decimals (millimes). */
export function parseAmount(input: string): number | null {
  const compact = input.replace(/[\s  ]/g, '').replace(',', '.');
  if (!/^\d{1,6}(\.\d{1,3})?$/.test(compact)) return null;
  return Number(compact);
}
```
`src/lib/dates.ts`:
```ts
const TZ = 'Africa/Tunis';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar day in Tunis as YYYY-MM-DD. */
export function businessDate(now: Date = new Date()): string {
  return dayFormatter.format(now);
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export function isBirthday(birthday: string | null, now: Date = new Date()): boolean {
  if (!birthday) return false;
  const [y, m, d] = businessDate(now).split('-').map(Number);
  const [, bm, bd] = birthday.split('-').map(Number);
  if (bm === m && bd === d) return true;
  return bm === 2 && bd === 29 && !isLeap(y!) && m === 2 && d === 28;
}

export function isValidBirthday(value: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  return value >= '1900-01-01' && value <= businessDate(now);
}

const dateTimeFormatter = new Intl.DateTimeFormat('fr-TN', {
  timeZone: TZ,
  dateStyle: 'short',
  timeStyle: 'short',
});

export const formatDateTime = (d: Date): string => dateTimeFormatter.format(d);
```
`src/lib/token.ts`:
```ts
const TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;

export const isCardToken = (value: string): boolean => TOKEN_RE.test(value);

/** Staff scanner reads either the full card URL (…/c/<token>) or a bare token. */
export function extractToken(scanned: string): string | null {
  const text = scanned.trim();
  if (isCardToken(text)) return text;
  const match = text.match(/\/c\/([A-Za-z0-9_-]{22})(?:[/?#]|$)/);
  return match ? match[1]! : null;
}
```

- [ ] **Step 4: Run and confirm they pass**

Run: `npm run test:unit`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
npm run format:write
git add src/lib
git commit -m "feat: add phone, amount, Tunis date and card token helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 4: Database schema, migrations, client, test harness

**Files:**
- Create: `src/db/schema.ts`, `src/db/index.ts`, `src/db/client.ts`, `drizzle.config.ts`, `scripts/migrate.ts`, `drizzle/*` (generated), `tests/support/db.ts`, `tests/integration/global-setup.ts`, `tests/integration/setup.ts`, `tests/integration/helpers.ts`, `tests/integration/schema.test.ts`
- Modify: `vitest.config.ts`

**Interfaces:**
- Produces:
  - Tables `staff`, `customers`, `events`, `pin_attempts` (Drizzle objects of the same names), enums `staffRole`, `eventType`.
  - `makeDb(url: string, opts?: { max?: number }): Db`, `type Db`, `type Tx`, `type DbOrTx = Db | Tx`, `getDb(): Db`
  - `type Customer = typeof customers.$inferSelect`, `type StaffMember = typeof staff.$inferSelect`
  - Test support: `migrateDb(url)`, `resetDb(db)`, `testDb`

- [ ] **Step 1: Schema** — `src/db/schema.ts`

```ts
import { sql } from 'drizzle-orm';
import {
  boolean, date, index, integer, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid,
} from 'drizzle-orm/pg-core';

export const staffRole = pgEnum('staff_role', ['staff', 'owner']);
export const eventType = pgEnum('event_type', ['stamp', 'redeem', 'bonus', 'perk_given']);

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  pinHash: text('pin_hash').notNull(),
  role: staffRole('role').notNull().default('staff'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull().unique(),
  firstName: text('first_name').notNull(),
  phone: text('phone').notNull().unique(),
  birthday: date('birthday', { mode: 'string' }),
  address: text('address'),
  cardStamps: integer('card_stamps').notNull().default(0),
  lifetimePepins: integer('lifetime_pepins').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').notNull().references(() => customers.id),
    type: eventType('type').notNull(),
    amountTnd: numeric('amount_tnd', { precision: 10, scale: 3 }),
    stampsDelta: integer('stamps_delta').notNull().default(0),
    pepinsDelta: integer('pepins_delta').notNull().default(0),
    detail: text('detail'),
    staffId: uuid('staff_id').notNull().references(() => staff.id),
    businessDate: date('business_date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('events_one_stamp_per_day')
      .on(t.customerId, t.businessDate)
      .where(sql`type = 'stamp'`),
    index('events_customer_idx').on(t.customerId),
    index('events_created_idx').on(t.createdAt),
  ],
);

export const pinAttempts = pgTable('pin_attempts', {
  key: text('key').primaryKey(),
  failures: integer('failures').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
});

export type Customer = typeof customers.$inferSelect;
export type StaffMember = typeof staff.$inferSelect;
```

- [ ] **Step 2: DB factory and singleton**

`src/db/index.ts`:
```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function makeDb(url: string, opts: { max?: number } = {}) {
  const client = postgres(url, { max: opts.max ?? 5, prepare: false, onnotice: () => {} });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof makeDb>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbOrTx = Db | Tx;
```
`src/db/client.ts`:
```ts
import { env } from '@/lib/env';
import { makeDb, type Db } from './index';

const globalForDb = globalThis as unknown as { kinzDb?: Db };

/** One pool per server instance (survives dev hot reloads). */
export function getDb(): Db {
  globalForDb.kinzDb ??= makeDb(env().DATABASE_URL);
  return globalForDb.kinzDb;
}
```

- [ ] **Step 3: Migration config and runner**

`drizzle.config.ts`:
```ts
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
```
`scripts/migrate.ts`:
```ts
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  config({ path: process.env.ENV_FILE ?? '.env.local' });
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL manquant');
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
    console.log('Migrations appliquées');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```
Run:
```bash
npm run db:generate && npm run db:migrate
grep -n "events_one_stamp_per_day" drizzle/*.sql
```
Expected: one migration SQL file containing `CREATE UNIQUE INDEX "events_one_stamp_per_day" ... WHERE type = 'stamp'`, and "Migrations appliquées".

- [ ] **Step 4: Test harness**

`tests/support/db.ts`:
```ts
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { Db } from '../../src/db';

export async function migrateDb(url: string): Promise<void> {
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
  } finally {
    await client.end();
  }
}

export async function resetDb(db: Db): Promise<void> {
  await db.execute(sql`TRUNCATE events, customers, staff, pin_attempts RESTART IDENTITY CASCADE`);
}
```
`tests/integration/global-setup.ts`:
```ts
import { config } from 'dotenv';
import { migrateDb } from '../support/db';

export default async function setup() {
  config({ path: '.env.test' });
  await migrateDb(process.env.DATABASE_URL!);
}
```
`tests/integration/helpers.ts`:
```ts
import { makeDb } from '@/db';

export const testDb = makeDb(process.env.DATABASE_URL!, { max: 4 });
```
`tests/integration/setup.ts`:
```ts
import { afterAll, beforeEach } from 'vitest';
import { resetDb } from '../support/db';
import { testDb } from './helpers';

beforeEach(async () => {
  await resetDb(testDb);
});

afterAll(async () => {
  await testDb.$client.end();
});
```
`vitest.config.ts` (full replacement):
```ts
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const testEnv = config({ path: '.env.test', processEnv: {} }).parsed ?? {};

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    projects: [
      { extends: true, test: { name: 'unit', include: ['src/**/*.test.ts'], environment: 'node' } },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          env: testEnv,
          globalSetup: ['tests/integration/global-setup.ts'],
          setupFiles: ['tests/integration/setup.ts'],
          fileParallelism: false,
          testTimeout: 15000,
        },
      },
    ],
  },
});
```

- [ ] **Step 5: Write the schema test** — `tests/integration/schema.test.ts`

```ts
import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { customers, events, staff } from '@/db/schema';
import { testDb } from './helpers';

async function seed() {
  const [s] = await testDb.insert(staff).values({ name: 'Amel', pinHash: await bcrypt.hash('123456', 4) }).returning();
  const [c] = await testDb
    .insert(customers)
    .values({ token: 'AbCdEfGhIjKlMnOpQrSt_-', firstName: 'Salma', phone: '+21622123456' })
    .returning();
  return { staffId: s!.id, customerId: c!.id };
}

describe('events_one_stamp_per_day', () => {
  it('rejects a second stamp for the same customer on the same business day', async () => {
    const { staffId, customerId } = await seed();
    const row = { customerId, staffId, type: 'stamp' as const, businessDate: '2026-10-01' };
    await testDb.insert(events).values(row);
    await expect(testDb.insert(events).values(row)).rejects.toThrow();
  });

  it('allows a redeem on the same day and a stamp on the next day', async () => {
    const { staffId, customerId } = await seed();
    await testDb.insert(events).values({ customerId, staffId, type: 'stamp', businessDate: '2026-10-01' });
    await testDb.insert(events).values({ customerId, staffId, type: 'redeem', businessDate: '2026-10-01' });
    await testDb.insert(events).values({ customerId, staffId, type: 'stamp', businessDate: '2026-10-02' });
    expect(await testDb.$count(events)).toBe(3);
  });
});
```

- [ ] **Step 6: Run the integration tests**

Run: `npm run test:integration`
Expected: 2 passed. If "connection refused", run `npm run db:up` first.

- [ ] **Step 7: Commit**

```bash
npm run format:write && npm run typecheck
git add -A
git commit -m "feat: add database schema, migrations and integration test harness

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 5: Errors, customers service, card view

**Files:**
- Create: `src/server/errors.ts`, `src/server/customers.ts`, `src/lib/views.ts`, `src/lib/views.test.ts`, `tests/integration/customers.test.ts`
- Modify: `tests/integration/helpers.ts`

**Interfaces:**
- Consumes: rules (Task 2), phone/token (Task 3), `Db`, `DbOrTx`, `Customer`, `customers` (Task 4).
- Produces:
  - `class AppError extends Error { code: AppErrorCode }`, `MESSAGES`, `ERROR_STATUS: Record<AppErrorCode, number>`, `isUniqueViolation(e: unknown): boolean`
  - `createCustomer(db: Db, input: { firstName: string; phone: string; birthday?: string | null }): Promise<{ token: string }>`
  - `getCustomerByToken(db: DbOrTx, token: string): Promise<Customer | null>`
  - `findCustomerByPhone(db: Db, phone: string): Promise<Customer | null>`
  - `setAddress(db: Db, token: string, address: string): Promise<void>`
  - `interface CardView`, `interface StaffCustomerView`, `interface StampResult`, `interface RedeemResult`, `buildCardView(c: Customer): CardView`
  - Test helper `makeCustomer(state?)`

- [ ] **Step 1: Write the failing unit test** — `src/lib/views.test.ts`

```ts
import { expect, it } from 'vitest';
import type { Customer } from '@/db/schema';
import { buildCardView } from './views';

const base: Customer = {
  id: '00000000-0000-0000-0000-000000000001',
  token: 'AbCdEfGhIjKlMnOpQrSt_-',
  firstName: 'Salma',
  phone: '+21622123456',
  birthday: null,
  address: null,
  cardStamps: 6,
  lifetimePepins: 80,
  createdAt: new Date('2026-09-30T10:00:00Z'),
};

it('builds the card view from a customer row', () => {
  const v = buildCardView(base);
  expect(v.cardStamps).toBe(6);
  expect(v.cardMax).toBe(13);
  expect(v.stops.filter((s) => s.reached).map((s) => s.stamps)).toEqual([3, 5]);
  expect(v).toMatchObject({ level: 13, title: 'Fleur', multiplier: 2, progress: { intoLevel: 2, levelCost: 13 } });
  expect(v.nextPerk?.level).toBe(17);
  expect(v.needsAddress).toBe(false);
});

it('asks Figuiers (level 34+) for a delivery address until they give one', () => {
  expect(buildCardView({ ...base, lifetimePepins: 561 }).needsAddress).toBe(true);
  expect(buildCardView({ ...base, lifetimePepins: 561, address: 'Tunis' }).needsAddress).toBe(false);
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npm run test:unit -- src/lib/views.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/views.ts`**

```ts
import type { Customer } from '@/db/schema';
import {
  CARD_MAX, CARD_STOPS, type CardStop, levelProgress, multiplier, nextPerk, type Perk,
  perksUnlocked, title,
} from './rules';

export interface CardView {
  token: string;
  firstName: string;
  cardStamps: number;
  cardMax: number;
  stops: Array<CardStop & { reached: boolean }>;
  level: number;
  title: string;
  multiplier: number;
  lifetimePepins: number;
  progress: { intoLevel: number; levelCost: number | null };
  perks: Perk[];
  nextPerk: Perk | null;
  needsAddress: boolean;
}

export interface StaffCustomerView {
  customerId: string;
  phone: string;
  card: CardView;
  stampedToday: boolean;
  givablePerks: Perk[];
}

export interface StampResult {
  stampsAdded: number;
  pepinsAdded: number;
  cardStamps: number;
  lifetimePepins: number;
  levelBefore: number;
  levelAfter: number;
  cardFull: boolean;
}

export interface RedeemResult {
  stop: number;
  label: string;
  bonusPepins: number;
  cardStamps: number;
  lifetimePepins: number;
  levelAfter: number;
}

export function buildCardView(c: Customer): CardView {
  const { level, intoLevel, levelCost } = levelProgress(c.lifetimePepins);
  return {
    token: c.token,
    firstName: c.firstName,
    cardStamps: c.cardStamps,
    cardMax: CARD_MAX,
    stops: CARD_STOPS.map((s) => ({ ...s, reached: s.stamps <= c.cardStamps })),
    level,
    title: title(level),
    multiplier: multiplier(level),
    lifetimePepins: c.lifetimePepins,
    progress: { intoLevel, levelCost },
    perks: perksUnlocked(level),
    nextPerk: nextPerk(level),
    needsAddress: level >= 34 && !c.address,
  };
}
```
Run: `npm run test:unit -- src/lib/views.test.ts`
Expected: PASS.

- [ ] **Step 4: Errors module** — `src/server/errors.ts`

```ts
export const MESSAGES = {
  NOT_FOUND: 'Client introuvable',
  INVALID_PHONE: 'Numéro de téléphone invalide (8 chiffres tunisiens)',
  PHONE_TAKEN: 'Ce numéro a déjà une carte — demandez au comptoir de vous la renvoyer',
  INVALID_AMOUNT: 'Montant invalide',
  AMOUNT_TOO_LOW: 'Montant < 40 TND',
  AMOUNT_TOO_HIGH: 'Montant anormalement élevé — vérifiez le ticket',
  ALREADY_STAMPED: "Déjà tamponné aujourd'hui",
  STOP_NOT_REACHED: 'Palier non atteint',
  PERK_LOCKED: 'Avantage pas encore débloqué',
  PERK_NOT_GIVABLE: 'Cet avantage ne se remet pas au comptoir',
  PERK_ALREADY_GIVEN: 'Avantage déjà remis',
  INVALID_ADDRESS: 'Adresse invalide',
  INVALID_CREDENTIALS: 'Nom ou PIN incorrect',
  LOCKED: "Trop d'essais — réessayez dans 10 minutes",
  UNAUTHENTICATED: 'Connexion requise',
  FORBIDDEN: 'Accès réservé au propriétaire',
  NAME_TAKEN: 'Ce nom est déjà utilisé',
  INVALID_PIN: 'Le PIN doit contenir exactement 6 chiffres',
  CANNOT_DEACTIVATE_SELF: 'Vous ne pouvez pas désactiver votre propre compte',
} as const;

export type AppErrorCode = keyof typeof MESSAGES;

export const ERROR_STATUS: Record<AppErrorCode, number> = {
  NOT_FOUND: 404,
  INVALID_PHONE: 400,
  PHONE_TAKEN: 409,
  INVALID_AMOUNT: 400,
  AMOUNT_TOO_LOW: 400,
  AMOUNT_TOO_HIGH: 400,
  ALREADY_STAMPED: 409,
  STOP_NOT_REACHED: 400,
  PERK_LOCKED: 400,
  PERK_NOT_GIVABLE: 400,
  PERK_ALREADY_GIVEN: 409,
  INVALID_ADDRESS: 400,
  INVALID_CREDENTIALS: 401,
  LOCKED: 429,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NAME_TAKEN: 409,
  INVALID_PIN: 400,
  CANNOT_DEACTIVATE_SELF: 400,
};

export class AppError extends Error {
  constructor(public readonly code: AppErrorCode) {
    super(MESSAGES[code]);
    this.name = 'AppError';
  }
}

/** Postgres unique_violation, whether raw (postgres.js) or wrapped by Drizzle. */
export function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } } | null;
  return (err?.code ?? err?.cause?.code) === '23505';
}
```

- [ ] **Step 5: Write the failing integration tests** — `tests/integration/customers.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { AppError } from '@/server/errors';
import { createCustomer, findCustomerByPhone, getCustomerByToken, setAddress } from '@/server/customers';
import { makeCustomer, testDb } from './helpers';

describe('createCustomer', () => {
  it('creates a customer with a normalised phone and a 22-char token', async () => {
    const { token } = await createCustomer(testDb, { firstName: '  Salma ', phone: '22 123 456' });
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const c = await getCustomerByToken(testDb, token);
    expect(c).toMatchObject({ firstName: 'Salma', phone: '+21622123456', cardStamps: 0, lifetimePepins: 0 });
  });

  it('refuses an invalid phone', async () => {
    await expect(createCustomer(testDb, { firstName: 'A', phone: '123' })).rejects.toMatchObject({ code: 'INVALID_PHONE' });
  });

  it('refuses a phone that already has a card, without revealing that card', async () => {
    await createCustomer(testDb, { firstName: 'Salma', phone: '22123456' });
    const err = await createCustomer(testDb, { firstName: 'Intrus', phone: '+216 22 123 456' }).catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('PHONE_TAKEN');
    expect(JSON.stringify(err)).not.toMatch(/[A-Za-z0-9_-]{22}/);
  });
});

describe('lookups', () => {
  it('finds by phone in any accepted format and ignores malformed tokens', async () => {
    const c = await makeCustomer();
    expect((await findCustomerByPhone(testDb, c.phone.replace('+216', '')))?.id).toBe(c.id);
    expect(await findCustomerByPhone(testDb, 'garbage')).toBeNull();
    expect(await getCustomerByToken(testDb, "' OR 1=1 --")).toBeNull();
  });
});

describe('setAddress', () => {
  it('is reserved to level 34+', async () => {
    const c = await makeCustomer({ lifetimePepins: 560 });
    await expect(setAddress(testDb, c.token, '12 rue de Marseille, Tunis')).rejects.toMatchObject({ code: 'PERK_LOCKED' });
  });
  it('stores a trimmed address for a Figuier and rejects nonsense', async () => {
    const c = await makeCustomer({ lifetimePepins: 561 });
    await expect(setAddress(testDb, c.token, 'ab')).rejects.toMatchObject({ code: 'INVALID_ADDRESS' });
    await setAddress(testDb, c.token, '  12 rue de Marseille, Tunis  ');
    expect((await getCustomerByToken(testDb, c.token))?.address).toBe('12 rue de Marseille, Tunis');
  });
});
```
Replace `tests/integration/helpers.ts` with:
```ts
import { eq } from 'drizzle-orm';
import { makeDb } from '@/db';
import { customers, type Customer } from '@/db/schema';
import { createCustomer, getCustomerByToken } from '@/server/customers';

export const testDb = makeDb(process.env.DATABASE_URL!, { max: 4 });

let phoneSeq = 0;

export async function makeCustomer(
  state: Partial<Pick<Customer, 'cardStamps' | 'lifetimePepins' | 'birthday' | 'address' | 'firstName'>> = {},
): Promise<Customer> {
  phoneSeq += 1;
  const { token } = await createCustomer(testDb, {
    firstName: state.firstName ?? 'Salma',
    phone: `22${String(phoneSeq).padStart(6, '0')}`,
  });
  if (Object.keys(state).length > 0) {
    await testDb.update(customers).set(state).where(eq(customers.token, token));
  }
  return (await getCustomerByToken(testDb, token))!;
}
```

- [ ] **Step 6: Run and confirm it fails**

Run: `npm run test:integration -- tests/integration/customers.test.ts`
Expected: FAIL, `@/server/customers` not found.

- [ ] **Step 7: Implement** `src/server/customers.ts`

```ts
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Db, DbOrTx } from '@/db';
import { customers, type Customer } from '@/db/schema';
import { normalizeTunisianPhone } from '@/lib/phone';
import { levelFromPepins } from '@/lib/rules';
import { isCardToken } from '@/lib/token';
import { AppError, isUniqueViolation } from './errors';

export const newCardToken = (): string => randomBytes(16).toString('base64url');

export async function createCustomer(
  db: Db,
  input: { firstName: string; phone: string; birthday?: string | null },
): Promise<{ token: string }> {
  const phone = normalizeTunisianPhone(input.phone);
  if (!phone) throw new AppError('INVALID_PHONE');
  const token = newCardToken();
  try {
    await db.insert(customers).values({
      token,
      firstName: input.firstName.trim(),
      phone,
      birthday: input.birthday ?? null,
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new AppError('PHONE_TAKEN');
    throw e;
  }
  return { token };
}

export async function getCustomerByToken(db: DbOrTx, token: string): Promise<Customer | null> {
  if (!isCardToken(token)) return null;
  const [row] = await db.select().from(customers).where(eq(customers.token, token));
  return row ?? null;
}

export async function findCustomerByPhone(db: Db, input: string): Promise<Customer | null> {
  const phone = normalizeTunisianPhone(input);
  if (!phone) return null;
  const [row] = await db.select().from(customers).where(eq(customers.phone, phone));
  return row ?? null;
}

export async function setAddress(db: Db, token: string, address: string): Promise<void> {
  const customer = await getCustomerByToken(db, token);
  if (!customer) throw new AppError('NOT_FOUND');
  if (levelFromPepins(customer.lifetimePepins) < 34) throw new AppError('PERK_LOCKED');
  const clean = address.trim();
  if (clean.length < 5 || clean.length > 300) throw new AppError('INVALID_ADDRESS');
  await db.update(customers).set({ address: clean }).where(eq(customers.id, customer.id));
}
```

- [ ] **Step 8: Run and confirm it passes**

Run: `npm run test:integration && npm run test:unit`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
npm run format:write && npm run typecheck
git add -A
git commit -m "feat: add customers service, app errors and card view

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 6: Stamping, redeeming, perks

**Files:**
- Create: `src/server/stamping.ts`, `src/server/perks.ts`, `tests/integration/stamping.test.ts`, `tests/integration/perks.test.ts`
- Modify: `tests/integration/helpers.ts` (add `makeStaff`)

**Interfaces:**
- Consumes: `AppError`, `isUniqueViolation`, `buildCardView`, `StampResult`, `RedeemResult`, `StaffCustomerView`, rules, `businessDate`, `isBirthday`.
- Produces:
  - `stamp(db: Db, input: { customerId: string; amountTnd: number; staffId: string; now?: Date }): Promise<StampResult>`
  - `redeem(db: Db, input: { customerId: string; stop: number; staffId: string; now?: Date }): Promise<RedeemResult>`
  - `givablePerks(db: DbOrTx, c: Customer, now?: Date): Promise<Perk[]>`
  - `givePerk(db: Db, input: { customerId: string; perkLevel: number; staffId: string; now?: Date }): Promise<void>`
  - `getStaffView(db: Db, c: Customer, now?: Date): Promise<StaffCustomerView>`
  - Test helper `makeStaff(name?, role?, pin?)`

- [ ] **Step 1: Add `makeStaff` to `tests/integration/helpers.ts`** (append; add `import bcrypt from 'bcryptjs';` and `staff` to the schema import)

```ts
export async function makeStaff(name = 'Amel', role: 'staff' | 'owner' = 'staff', pin = '123456') {
  const [row] = await testDb
    .insert(staff)
    .values({ name, role, pinHash: await bcrypt.hash(pin, 4) })
    .returning();
  return row!;
}
```

- [ ] **Step 2: Write the failing tests** — `tests/integration/stamping.test.ts`

```ts
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { customers, events } from '@/db/schema';
import { redeem, stamp } from '@/server/stamping';
import { makeCustomer, makeStaff, testDb } from './helpers';

const DAY1 = new Date('2026-10-01T10:00:00Z');
const DAY2 = new Date('2026-10-02T10:00:00Z');

describe('stamp', () => {
  it('adds tampons and pépins and records the event', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const r = await stamp(testDb, { customerId: c.id, amountTnd: 85.5, staffId: s.id, now: DAY1 });
    expect(r).toEqual({ stampsAdded: 1, pepinsAdded: 2, cardStamps: 1, lifetimePepins: 2, levelBefore: 1, levelAfter: 2, cardFull: false });
    const [e] = await testDb.select().from(events).where(eq(events.customerId, c.id));
    expect(e).toMatchObject({ type: 'stamp', amountTnd: '85.500', stampsDelta: 1, pepinsDelta: 2, businessDate: '2026-10-01' });
  });

  it('gives 2 tampons from 120 TND and 3 from 300 TND', async () => {
    const s = await makeStaff();
    const a = await makeCustomer();
    const b = await makeCustomer();
    expect((await stamp(testDb, { customerId: a.id, amountTnd: 120, staffId: s.id, now: DAY1 })).stampsAdded).toBe(2);
    expect((await stamp(testDb, { customerId: b.id, amountTnd: 300, staffId: s.id, now: DAY1 })).stampsAdded).toBe(3);
  });

  it('refuses amounts under 40 TND and over 5000 TND', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    await expect(stamp(testDb, { customerId: c.id, amountTnd: 39.9, staffId: s.id, now: DAY1 })).rejects.toMatchObject({ code: 'AMOUNT_TOO_LOW' });
    await expect(stamp(testDb, { customerId: c.id, amountTnd: 8550, staffId: s.id, now: DAY1 })).rejects.toMatchObject({ code: 'AMOUNT_TOO_HIGH' });
  });

  it('refuses a second stamp the same Tunis day but accepts the next day', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    await stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: DAY1 });
    await expect(stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: DAY1 })).rejects.toMatchObject({ code: 'ALREADY_STAMPED' });
    expect((await stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: DAY2 })).cardStamps).toBe(2);
  });

  it('records exactly one stamp when two scans race', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const results = await Promise.allSettled([
      stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: DAY1 }),
      stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: DAY1 }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason.code).toBe('ALREADY_STAMPED');
    const [row] = await testDb.select().from(customers).where(eq(customers.id, c.id));
    expect(row!.cardStamps).toBe(1);
  });

  it('uses the multiplier of the level before the purchase', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ lifetimePepins: 77 }); // level 12, ×1
    const r = await stamp(testDb, { customerId: c.id, amountTnd: 80, staffId: s.id, now: DAY1 });
    expect(r).toMatchObject({ pepinsAdded: 2, levelBefore: 12, levelAfter: 13 });
  });

  it('caps the card at 13 and flags it full', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ cardStamps: 12 });
    const r = await stamp(testDb, { customerId: c.id, amountTnd: 300, staffId: s.id, now: DAY1 });
    expect(r).toMatchObject({ stampsAdded: 1, cardStamps: 13, cardFull: true });
  });

  it('doubles tampons on the birthday from level 19', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ lifetimePepins: 171, birthday: '1990-10-01' }); // level 19
    const r = await stamp(testDb, { customerId: c.id, amountTnd: 40, staffId: s.id, now: DAY1 });
    expect(r).toMatchObject({ stampsAdded: 2, pepinsAdded: 2 });
  });

  it('reports an unknown customer', async () => {
    const s = await makeStaff();
    await expect(
      stamp(testDb, { customerId: '00000000-0000-0000-0000-000000000000', amountTnd: 50, staffId: s.id, now: DAY1 }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('redeem', () => {
  it('uses a reached stop and resets the card to 0', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ cardStamps: 6 });
    const r = await redeem(testDb, { customerId: c.id, stop: 5, staffId: s.id, now: DAY1 });
    expect(r).toMatchObject({ stop: 5, bonusPepins: 0, cardStamps: 0 });
  });

  it('refuses a stop that is not reached or does not exist', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ cardStamps: 6 });
    await expect(redeem(testDb, { customerId: c.id, stop: 7, staffId: s.id })).rejects.toMatchObject({ code: 'STOP_NOT_REACHED' });
    await expect(redeem(testDb, { customerId: c.id, stop: 4, staffId: s.id })).rejects.toMatchObject({ code: 'STOP_NOT_REACHED' });
  });

  it('adds bonus pépins at 13, records a bonus event, and restarts at 2 from level 23', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ cardStamps: 13, lifetimePepins: 253 }); // level 23
    const r = await redeem(testDb, { customerId: c.id, stop: 13, staffId: s.id, now: DAY1 });
    expect(r).toMatchObject({ bonusPepins: 13, lifetimePepins: 266, cardStamps: 2 });
    const types = (await testDb.select().from(events).where(eq(events.customerId, c.id))).map((e) => e.type).sort();
    expect(types).toEqual(['bonus', 'redeem']);
  });
});
```
`tests/integration/perks.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { getStaffView, givablePerks, givePerk } from '@/server/perks';
import { stamp } from '@/server/stamping';
import { makeCustomer, makeStaff, testDb } from './helpers';

const NOW = new Date('2026-10-01T10:00:00Z');
const NEXT_YEAR = new Date('2027-10-01T10:00:00Z');

describe('manual perks', () => {
  it('lists unlocked once/yearly perks not yet given', async () => {
    const c = await makeCustomer({ lifetimePepins: 10 }); // level 5
    expect((await givablePerks(testDb, c, NOW)).map((p) => p.level)).toEqual([2, 3, 5]);
  });

  it('gives a once perk only once', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ lifetimePepins: 10 });
    await givePerk(testDb, { customerId: c.id, perkLevel: 5, staffId: s.id, now: NOW });
    await expect(givePerk(testDb, { customerId: c.id, perkLevel: 5, staffId: s.id, now: NOW })).rejects.toMatchObject({ code: 'PERK_ALREADY_GIVEN' });
    expect((await givablePerks(testDb, c, NOW)).map((p) => p.level)).toEqual([2, 3]);
  });

  it('gives the yearly perk again the next year', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ lifetimePepins: 820 }); // level 41
    await givePerk(testDb, { customerId: c.id, perkLevel: 41, staffId: s.id, now: NOW });
    expect((await givablePerks(testDb, c, NOW)).some((p) => p.level === 41)).toBe(false);
    expect((await givablePerks(testDb, c, NEXT_YEAR)).some((p) => p.level === 41)).toBe(true);
  });

  it('refuses locked, automatic, ongoing and unknown perks', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ lifetimePepins: 10 });
    await expect(givePerk(testDb, { customerId: c.id, perkLevel: 37, staffId: s.id })).rejects.toMatchObject({ code: 'PERK_LOCKED' });
    const rich = await makeCustomer({ lifetimePepins: 1225 });
    for (const perkLevel of [13, 11, 4]) {
      await expect(givePerk(testDb, { customerId: rich.id, perkLevel, staffId: s.id })).rejects.toMatchObject({ code: 'PERK_NOT_GIVABLE' });
    }
  });
});

describe('getStaffView', () => {
  it('reports whether the customer was already stamped today', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    expect((await getStaffView(testDb, c, NOW)).stampedToday).toBe(false);
    await stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: NOW });
    const v = await getStaffView(testDb, c, NOW);
    expect(v).toMatchObject({ customerId: c.id, phone: c.phone, stampedToday: true });
  });
});
```

- [ ] **Step 3: Run and confirm they fail**

Run: `npm run test:integration`
Expected: FAIL, modules `@/server/stamping` and `@/server/perks` not found.

- [ ] **Step 4: Implement** `src/server/stamping.ts`

```ts
import { and, eq } from 'drizzle-orm';
import type { Db } from '@/db';
import { customers, events } from '@/db/schema';
import { businessDate, isBirthday } from '@/lib/dates';
import {
  addStamps, CARD_MAX, CARD_STOPS, levelFromPepins, MAX_AMOUNT_TND, MIN_AMOUNT_TND, pepinsFor,
  resetValue, stampsForVisit,
} from '@/lib/rules';
import type { RedeemResult, StampResult } from '@/lib/views';
import { AppError, isUniqueViolation } from './errors';

export async function stamp(
  db: Db,
  input: { customerId: string; amountTnd: number; staffId: string; now?: Date },
): Promise<StampResult> {
  const now = input.now ?? new Date();
  const amount = input.amountTnd;
  if (!Number.isFinite(amount)) throw new AppError('INVALID_AMOUNT');
  if (amount < MIN_AMOUNT_TND) throw new AppError('AMOUNT_TOO_LOW');
  if (amount > MAX_AMOUNT_TND) throw new AppError('AMOUNT_TOO_HIGH');
  const day = businessDate(now);

  try {
    return await db.transaction(async (tx) => {
      // Row lock serialises concurrent scans of the same customer.
      const [c] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, input.customerId))
        .for('update');
      if (!c) throw new AppError('NOT_FOUND');

      const [already] = await tx
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.customerId, c.id), eq(events.type, 'stamp'), eq(events.businessDate, day)))
        .limit(1);
      if (already) throw new AppError('ALREADY_STAMPED');

      const levelBefore = levelFromPepins(c.lifetimePepins);
      const cardStamps = addStamps(
        c.cardStamps,
        stampsForVisit(amount, levelBefore, isBirthday(c.birthday, now)),
      );
      const pepinsAdded = pepinsFor(amount, levelBefore);
      const lifetimePepins = c.lifetimePepins + pepinsAdded;

      await tx.insert(events).values({
        customerId: c.id,
        type: 'stamp',
        amountTnd: amount.toFixed(3),
        stampsDelta: cardStamps - c.cardStamps,
        pepinsDelta: pepinsAdded,
        staffId: input.staffId,
        businessDate: day,
      });
      await tx.update(customers).set({ cardStamps, lifetimePepins }).where(eq(customers.id, c.id));

      return {
        stampsAdded: cardStamps - c.cardStamps,
        pepinsAdded,
        cardStamps,
        lifetimePepins,
        levelBefore,
        levelAfter: levelFromPepins(lifetimePepins),
        cardFull: cardStamps === CARD_MAX,
      };
    });
  } catch (e) {
    // Last line of defence: the partial unique index.
    if (isUniqueViolation(e)) throw new AppError('ALREADY_STAMPED');
    throw e;
  }
}

export async function redeem(
  db: Db,
  input: { customerId: string; stop: number; staffId: string; now?: Date },
): Promise<RedeemResult> {
  const now = input.now ?? new Date();
  const stop = CARD_STOPS.find((s) => s.stamps === input.stop);
  if (!stop) throw new AppError('STOP_NOT_REACHED');
  const day = businessDate(now);

  return db.transaction(async (tx) => {
    const [c] = await tx
      .select()
      .from(customers)
      .where(eq(customers.id, input.customerId))
      .for('update');
    if (!c) throw new AppError('NOT_FOUND');
    if (c.cardStamps < stop.stamps) throw new AppError('STOP_NOT_REACHED');

    const lifetimePepins = c.lifetimePepins + stop.bonusPepins;
    const levelAfter = levelFromPepins(lifetimePepins);
    const cardStamps = resetValue(levelAfter);

    await tx.insert(events).values({
      customerId: c.id,
      type: 'redeem',
      stampsDelta: cardStamps - c.cardStamps,
      detail: `${stop.stamps} : ${stop.label}`,
      staffId: input.staffId,
      businessDate: day,
    });
    if (stop.bonusPepins > 0) {
      await tx.insert(events).values({
        customerId: c.id,
        type: 'bonus',
        pepinsDelta: stop.bonusPepins,
        detail: `Bonus palier ${stop.stamps}`,
        staffId: input.staffId,
        businessDate: day,
      });
    }
    await tx.update(customers).set({ cardStamps, lifetimePepins }).where(eq(customers.id, c.id));

    return {
      stop: stop.stamps,
      label: stop.label,
      bonusPepins: stop.bonusPepins,
      cardStamps,
      lifetimePepins,
      levelAfter,
    };
  });
}
```

- [ ] **Step 5: Implement** `src/server/perks.ts`

```ts
import { and, eq } from 'drizzle-orm';
import type { Db, DbOrTx } from '@/db';
import { customers, events, type Customer } from '@/db/schema';
import { businessDate } from '@/lib/dates';
import { levelFromPepins, type Perk, PERKS, perksUnlocked } from '@/lib/rules';
import { buildCardView, type StaffCustomerView } from '@/lib/views';
import { AppError } from './errors';

const isHandedOver = (p: Perk) => p.kind === 'once' || p.kind === 'yearly';

/** Perk levels already handed over: ever for "once", this Tunis year for "yearly". */
async function givenPerkLevels(db: DbOrTx, customerId: string, now: Date): Promise<Set<number>> {
  const year = businessDate(now).slice(0, 4);
  const rows = await db
    .select({ detail: events.detail, day: events.businessDate })
    .from(events)
    .where(and(eq(events.customerId, customerId), eq(events.type, 'perk_given')));
  const given = new Set<number>();
  for (const row of rows) {
    const perk = PERKS.find((p) => String(p.level) === row.detail);
    if (!perk) continue;
    if (perk.kind === 'once' || row.day.startsWith(year)) given.add(perk.level);
  }
  return given;
}

export async function givablePerks(db: DbOrTx, c: Customer, now: Date = new Date()): Promise<Perk[]> {
  const given = await givenPerkLevels(db, c.id, now);
  return perksUnlocked(levelFromPepins(c.lifetimePepins)).filter(
    (p) => isHandedOver(p) && !given.has(p.level),
  );
}

export async function givePerk(
  db: Db,
  input: { customerId: string; perkLevel: number; staffId: string; now?: Date },
): Promise<void> {
  const now = input.now ?? new Date();
  const perk = PERKS.find((p) => p.level === input.perkLevel);
  if (!perk || !isHandedOver(perk)) throw new AppError('PERK_NOT_GIVABLE');

  await db.transaction(async (tx) => {
    const [c] = await tx
      .select()
      .from(customers)
      .where(eq(customers.id, input.customerId))
      .for('update');
    if (!c) throw new AppError('NOT_FOUND');
    if (levelFromPepins(c.lifetimePepins) < perk.level) throw new AppError('PERK_LOCKED');
    if ((await givenPerkLevels(tx, c.id, now)).has(perk.level)) {
      throw new AppError('PERK_ALREADY_GIVEN');
    }
    await tx.insert(events).values({
      customerId: c.id,
      type: 'perk_given',
      detail: String(perk.level),
      staffId: input.staffId,
      businessDate: businessDate(now),
    });
  });
}

export async function getStaffView(
  db: Db,
  c: Customer,
  now: Date = new Date(),
): Promise<StaffCustomerView> {
  const [stampedToday] = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.customerId, c.id),
        eq(events.type, 'stamp'),
        eq(events.businessDate, businessDate(now)),
      ),
    )
    .limit(1);
  return {
    customerId: c.id,
    phone: c.phone,
    card: buildCardView(c),
    stampedToday: Boolean(stampedToday),
    givablePerks: await givablePerks(db, c, now),
  };
}
```

- [ ] **Step 6: Run and confirm they pass**

Run: `npm run test:integration`
Expected: all pass (including the race test).

- [ ] **Step 7: Commit**

```bash
npm run format:write && npm run typecheck
git add -A
git commit -m "feat: add stamping, redeeming and perk services with row locking

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 7: Authentication, staff service, owner seed

**Files:**
- Create: `src/server/auth.ts`, `src/server/staff.ts`, `src/server/session.ts`, `src/server/page-session.ts`, `scripts/seed-owner.ts`, `tests/integration/auth.test.ts`

**Interfaces:**
- Consumes: `AppError`, `staff`, `pinAttempts`, `Db`, `env()`, `getDb()`.
- Produces:
  - `interface Session { staffId: string; name: string; role: 'staff' | 'owner' }`
  - `SESSION_COOKIE = 'kinz_session'`, `SESSION_TTL_SECONDS = 43200`
  - `isValidPin(pin: string): boolean`, `hashPin(pin: string): Promise<string>`
  - `createSessionToken(s: Session, secret: string): Promise<string>`, `readSessionToken(token: string | undefined, secret: string): Promise<Session | null>`
  - `login(db: Db, input: { name: string; pin: string; now?: Date }): Promise<Session>`
  - `interface StaffRow { id: string; name: string; role: 'staff' | 'owner'; active: boolean; createdAt: Date }`
  - `listStaff(db): Promise<StaffRow[]>`, `createStaff(db, { name, pin, role }): Promise<StaffRow>`, `updateStaff(db, { id, actorId, active?, pin? }): Promise<void>`
  - `requireStaff(req: NextRequest, role?: 'owner'): Promise<Session>`
  - `getPageSession(role?: 'owner'): Promise<Session | null>`

- [ ] **Step 1: Write the failing tests** — `tests/integration/auth.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { createSessionToken, login, readSessionToken } from '@/server/auth';
import { createStaff, listStaff, updateStaff } from '@/server/staff';
import { testDb } from './helpers';

const SECRET = 'test-secret-test-secret-test-secret-123';
const T0 = new Date('2026-10-01T10:00:00Z');
const minutes = (m: number) => new Date(T0.getTime() + m * 60_000);

describe('staff accounts', () => {
  it('creates staff with a 6-digit PIN and refuses duplicates (case-insensitive)', async () => {
    const s = await createStaff(testDb, { name: 'Amel', pin: '123456', role: 'staff' });
    expect(s).toMatchObject({ name: 'Amel', role: 'staff', active: true });
    await expect(createStaff(testDb, { name: 'amel', pin: '654321', role: 'staff' })).rejects.toMatchObject({ code: 'NAME_TAKEN' });
    await expect(createStaff(testDb, { name: 'Sami', pin: '1234', role: 'staff' })).rejects.toMatchObject({ code: 'INVALID_PIN' });
    expect((await listStaff(testDb)).map((r) => r.name)).toEqual(['Amel']);
  });

  it('never lets an owner deactivate themself', async () => {
    const o = await createStaff(testDb, { name: 'Nassim', pin: '123456', role: 'owner' });
    await expect(updateStaff(testDb, { id: o.id, actorId: o.id, active: false })).rejects.toMatchObject({ code: 'CANNOT_DEACTIVATE_SELF' });
  });
});

describe('login', () => {
  it('logs in with the right PIN, case-insensitive name', async () => {
    await createStaff(testDb, { name: 'Amel', pin: '123456', role: 'staff' });
    const session = await login(testDb, { name: ' amel ', pin: '123456', now: T0 });
    expect(session).toMatchObject({ name: 'Amel', role: 'staff' });
  });

  it('locks for 10 minutes after 5 failures, even for the right PIN', async () => {
    await createStaff(testDb, { name: 'Amel', pin: '123456', role: 'staff' });
    for (let i = 0; i < 4; i++) {
      await expect(login(testDb, { name: 'Amel', pin: '000000', now: T0 })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    }
    await expect(login(testDb, { name: 'Amel', pin: '000000', now: T0 })).rejects.toMatchObject({ code: 'LOCKED' });
    await expect(login(testDb, { name: 'Amel', pin: '123456', now: minutes(9) })).rejects.toMatchObject({ code: 'LOCKED' });
    await expect(login(testDb, { name: 'Amel', pin: '123456', now: minutes(11) })).resolves.toMatchObject({ name: 'Amel' });
  });

  it('gives the same error for an unknown name and refuses deactivated staff', async () => {
    const s = await createStaff(testDb, { name: 'Amel', pin: '123456', role: 'staff' });
    const o = await createStaff(testDb, { name: 'Nassim', pin: '123456', role: 'owner' });
    await expect(login(testDb, { name: 'Personne', pin: '123456', now: T0 })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await updateStaff(testDb, { id: s.id, actorId: o.id, active: false });
    await expect(login(testDb, { name: 'Amel', pin: '123456', now: T0 })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('accepts a new PIN after a reset', async () => {
    const s = await createStaff(testDb, { name: 'Amel', pin: '123456', role: 'staff' });
    const o = await createStaff(testDb, { name: 'Nassim', pin: '123456', role: 'owner' });
    await updateStaff(testDb, { id: s.id, actorId: o.id, pin: '999999' });
    await expect(login(testDb, { name: 'Amel', pin: '999999', now: T0 })).resolves.toMatchObject({ name: 'Amel' });
  });
});

describe('session tokens', () => {
  it('round-trips a signed session and rejects tampering', async () => {
    const token = await createSessionToken({ staffId: 'abc', name: 'Amel', role: 'staff' }, SECRET);
    expect(await readSessionToken(token, SECRET)).toEqual({ staffId: 'abc', name: 'Amel', role: 'staff' });
    expect(await readSessionToken(token, 'another-secret-another-secret-123456')).toBeNull();
    expect(await readSessionToken(`${token}x`, SECRET)).toBeNull();
    expect(await readSessionToken(undefined, SECRET)).toBeNull();
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npm run test:integration -- tests/integration/auth.test.ts`
Expected: FAIL, modules missing.

- [ ] **Step 3: Implement** `src/server/auth.ts`

```ts
import bcrypt from 'bcryptjs';
import { and, eq, sql } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import type { Db } from '@/db';
import { pinAttempts, staff } from '@/db/schema';
import { AppError } from './errors';

export interface Session {
  staffId: string;
  name: string;
  role: 'staff' | 'owner';
}

export const SESSION_COOKIE = 'kinz_session';
export const SESSION_TTL_SECONDS = 12 * 60 * 60;
const MAX_FAILURES = 5;
const LOCK_MS = 10 * 60 * 1000;
// Compared against when the name is unknown, so timing doesn't reveal which names exist.
const DUMMY_HASH = bcrypt.hashSync('000000', 10);

export const isValidPin = (pin: string): boolean => /^\d{6}$/.test(pin);
export const hashPin = (pin: string): Promise<string> => bcrypt.hash(pin, 10);

const keyOf = (secret: string) => new TextEncoder().encode(secret);

export async function createSessionToken(s: Session, secret: string): Promise<string> {
  return new SignJWT({ name: s.name, role: s.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(s.staffId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(keyOf(secret));
}

export async function readSessionToken(
  token: string | undefined,
  secret: string,
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, keyOf(secret), { algorithms: ['HS256'] });
    const { sub, name, role } = payload;
    if (typeof sub !== 'string' || typeof name !== 'string') return null;
    if (role !== 'staff' && role !== 'owner') return null;
    return { staffId: sub, name, role };
  } catch {
    return null;
  }
}

export async function login(
  db: Db,
  input: { name: string; pin: string; now?: Date },
): Promise<Session> {
  const now = input.now ?? new Date();
  const name = input.name.trim().toLowerCase();
  const key = `staff:${name}`;

  const [attempt] = await db.select().from(pinAttempts).where(eq(pinAttempts.key, key));
  if (attempt?.lockedUntil && attempt.lockedUntil > now) throw new AppError('LOCKED');

  const [member] = await db
    .select()
    .from(staff)
    .where(and(sql`lower(${staff.name}) = ${name}`, eq(staff.active, true)));
  const ok = await bcrypt.compare(input.pin, member?.pinHash ?? DUMMY_HASH);

  if (!member || !ok) {
    const failures = (attempt?.failures ?? 0) + 1;
    const locked = failures >= MAX_FAILURES;
    const values = {
      failures: locked ? 0 : failures,
      lockedUntil: locked ? new Date(now.getTime() + LOCK_MS) : null,
    };
    await db
      .insert(pinAttempts)
      .values({ key, ...values })
      .onConflictDoUpdate({ target: pinAttempts.key, set: values });
    throw new AppError(locked ? 'LOCKED' : 'INVALID_CREDENTIALS');
  }

  await db.delete(pinAttempts).where(eq(pinAttempts.key, key));
  return { staffId: member.id, name: member.name, role: member.role };
}
```

- [ ] **Step 4: Implement** `src/server/staff.ts`

```ts
import { eq, sql } from 'drizzle-orm';
import type { Db } from '@/db';
import { staff } from '@/db/schema';
import { hashPin, isValidPin } from './auth';
import { AppError } from './errors';

export interface StaffRow {
  id: string;
  name: string;
  role: 'staff' | 'owner';
  active: boolean;
  createdAt: Date;
}

const columns = {
  id: staff.id,
  name: staff.name,
  role: staff.role,
  active: staff.active,
  createdAt: staff.createdAt,
};

export function listStaff(db: Db): Promise<StaffRow[]> {
  return db.select(columns).from(staff).orderBy(staff.createdAt);
}

export async function createStaff(
  db: Db,
  input: { name: string; pin: string; role: 'staff' | 'owner' },
): Promise<StaffRow> {
  const name = input.name.trim();
  if (!isValidPin(input.pin)) throw new AppError('INVALID_PIN');
  const [clash] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(sql`lower(${staff.name}) = ${name.toLowerCase()}`);
  if (clash) throw new AppError('NAME_TAKEN');
  const [row] = await db
    .insert(staff)
    .values({ name, role: input.role, pinHash: await hashPin(input.pin) })
    .returning(columns);
  return row!;
}

export async function updateStaff(
  db: Db,
  input: { id: string; actorId: string; active?: boolean; pin?: string },
): Promise<void> {
  if (input.active === false && input.id === input.actorId) {
    throw new AppError('CANNOT_DEACTIVATE_SELF');
  }
  const patch: { active?: boolean; pinHash?: string } = {};
  if (input.active !== undefined) patch.active = input.active;
  if (input.pin !== undefined) {
    if (!isValidPin(input.pin)) throw new AppError('INVALID_PIN');
    patch.pinHash = await hashPin(input.pin);
  }
  const [exists] = await db.select({ id: staff.id }).from(staff).where(eq(staff.id, input.id));
  if (!exists) throw new AppError('NOT_FOUND');
  if (Object.keys(patch).length > 0) {
    await db.update(staff).set(patch).where(eq(staff.id, input.id));
  }
}
```

- [ ] **Step 5: Implement the session guards**

`src/server/session.ts`:
```ts
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db/client';
import { staff } from '@/db/schema';
import { env } from '@/lib/env';
import { readSessionToken, SESSION_COOKIE, type Session } from './auth';
import { AppError } from './errors';

/** Re-checks the database so deactivation and role changes apply immediately. */
export async function verifySession(session: Session | null, role?: 'owner'): Promise<Session> {
  if (!session) throw new AppError('UNAUTHENTICATED');
  const [member] = await getDb()
    .select({ name: staff.name, role: staff.role, active: staff.active })
    .from(staff)
    .where(eq(staff.id, session.staffId));
  if (!member?.active) throw new AppError('UNAUTHENTICATED');
  if (role === 'owner' && member.role !== 'owner') throw new AppError('FORBIDDEN');
  return { staffId: session.staffId, name: member.name, role: member.role };
}

export async function requireStaff(req: NextRequest, role?: 'owner'): Promise<Session> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return verifySession(await readSessionToken(token, env().SESSION_SECRET), role);
}
```
`src/server/page-session.ts`:
```ts
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { readSessionToken, SESSION_COOKIE, type Session } from './auth';
import { verifySession } from './session';

export async function getPageSession(role?: 'owner'): Promise<Session | null> {
  const store = await cookies();
  const session = await readSessionToken(store.get(SESSION_COOKIE)?.value, env().SESSION_SECRET);
  try {
    return await verifySession(session, role);
  } catch {
    return null;
  }
}
```

- [ ] **Step 6: Owner seed script** — `scripts/seed-owner.ts`

```ts
import { config } from 'dotenv';
import { makeDb } from '../src/db';
import { createStaff } from '../src/server/staff';

async function main() {
  config({ path: process.env.ENV_FILE ?? '.env.local' });
  const [name, pin] = process.argv.slice(2);
  if (!name || !pin) {
    console.error('Usage : npm run db:seed-owner -- "<Nom>" <PIN à 6 chiffres>');
    process.exit(1);
  }
  const db = makeDb(process.env.DATABASE_URL!, { max: 1 });
  try {
    const owner = await createStaff(db, { name, pin, role: 'owner' });
    console.log(`Compte propriétaire créé : ${owner.name}`);
  } finally {
    await db.$client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
```

- [ ] **Step 7: Run the tests and the script**

Run: `npm run test:integration && npm run db:seed-owner -- "Test" 123456`
Expected: all tests pass; the script prints "Compte propriétaire créé : Test" (dev DB).

- [ ] **Step 8: Commit**

```bash
npm run format:write && npm run typecheck
git add -A
git commit -m "feat: add PIN login with lockout, JWT sessions and staff management

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 8: API routes (customer, auth, staff)

**Files:**
- Create: `src/server/http.ts`
- Create routes:
  - `src/app/api/customers/route.ts`
  - `src/app/api/customers/[token]/address/route.ts`
  - `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`
  - `src/app/api/staff/customer/route.ts`, `src/app/api/staff/stamp/route.ts`, `src/app/api/staff/redeem/route.ts`, `src/app/api/staff/perk/route.ts`
- Test: `tests/integration/http.ts`, `tests/integration/routes.test.ts`

**Interfaces:**
- Consumes: every service from Tasks 5–7, `parseAmount`, `isValidBirthday`.
- Produces:
  - `jsonError(e: unknown): NextResponse`
  - HTTP contracts, all returning JSON `{ error, code }` on failure:
    - `POST /api/customers {firstName, phone, birthday?}` → `201 {token}`
    - `POST /api/customers/:token/address {address}` → `200 {ok:true}`
    - `POST /api/auth/login {name, pin}` → `200 {name, role}` plus cookie
    - `POST /api/auth/logout` → `200 {ok:true}`
    - `GET /api/staff/customer?token=|?phone=` → `StaffCustomerView`
    - `POST /api/staff/stamp {customerId, amount: string}` → `StampResult`
    - `POST /api/staff/redeem {customerId, stop}` → `RedeemResult`
    - `POST /api/staff/perk {customerId, perkLevel}` → `{ok:true}`

- [ ] **Step 1: Test request helpers** — `tests/integration/http.ts`

```ts
import { NextRequest } from 'next/server';
import { createSessionToken } from '@/server/auth';

export async function cookieFor(member: { id: string; name: string; role: 'staff' | 'owner' }) {
  const token = await createSessionToken(
    { staffId: member.id, name: member.name, role: member.role },
    process.env.SESSION_SECRET!,
  );
  return `kinz_session=${token}`;
}

export function req(url: string, init: { method?: string; body?: unknown; cookie?: string } = {}) {
  return new NextRequest(new URL(url, 'http://localhost'), {
    method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    headers: { 'content-type': 'application/json', ...(init.cookie ? { cookie: init.cookie } : {}) },
  });
}
```

- [ ] **Step 2: Write the failing route tests** — `tests/integration/routes.test.ts`

```ts
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { staff } from '@/db/schema';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as createCustomer } from '@/app/api/customers/route';
import { POST as setAddress } from '@/app/api/customers/[token]/address/route';
import { GET as lookup } from '@/app/api/staff/customer/route';
import { POST as perk } from '@/app/api/staff/perk/route';
import { POST as redeem } from '@/app/api/staff/redeem/route';
import { POST as stampRoute } from '@/app/api/staff/stamp/route';
import { makeCustomer, makeStaff, testDb } from './helpers';
import { cookieFor, req } from './http';

describe('POST /api/customers', () => {
  it('creates a card (201) and refuses the same phone without leaking the token (409)', async () => {
    const first = await createCustomer(req('/api/customers', { body: { firstName: 'Salma', phone: '22 123 456', birthday: '1990-10-01' } }));
    expect(first.status).toBe(201);
    expect((await first.json()).token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const second = await createCustomer(req('/api/customers', { body: { firstName: 'X', phone: '22123456' } }));
    expect(second.status).toBe(409);
    const body = await second.json();
    expect(body).toEqual({ error: expect.stringContaining('déjà une carte'), code: 'PHONE_TAKEN' });
  });

  it('rejects an impossible birthday and an empty first name (400)', async () => {
    const bad = await createCustomer(req('/api/customers', { body: { firstName: 'Salma', phone: '22123457', birthday: '2026-02-31' } }));
    expect(bad.status).toBe(400);
    const empty = await createCustomer(req('/api/customers', { body: { firstName: '  ', phone: '22123458' } }));
    expect(empty.status).toBe(400);
  });
});

describe('staff routes', () => {
  it('require a session (401)', async () => {
    const c = await makeCustomer();
    const res = await stampRoute(req('/api/staff/stamp', { body: { customerId: c.id, amount: '85' } }));
    expect(res.status).toBe(401);
  });

  it('stamp with a French decimal amount, then refuse the second stamp (409)', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const cookie = await cookieFor(s);
    const ok = await stampRoute(req('/api/staff/stamp', { body: { customerId: c.id, amount: '85,500' }, cookie }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ stampsAdded: 1, pepinsAdded: 2 });
    const again = await stampRoute(req('/api/staff/stamp', { body: { customerId: c.id, amount: '85' }, cookie }));
    expect(again.status).toBe(409);
    expect((await again.json()).error).toBe("Déjà tamponné aujourd'hui");
  });

  it('reject garbage and absurd amounts (400)', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const cookie = await cookieFor(s);
    for (const amount of ['abc', '8550']) {
      const res = await stampRoute(req('/api/staff/stamp', { body: { customerId: c.id, amount }, cookie }));
      expect(res.status).toBe(400);
    }
  });

  it('look a customer up by phone or token, 404 otherwise', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const cookie = await cookieFor(s);
    const spaced = `${c.phone.slice(4, 6)} ${c.phone.slice(6, 9)} ${c.phone.slice(9)}`; // "22 000 001" style
    const byPhone = await lookup(req(`/api/staff/customer?phone=${encodeURIComponent(spaced)}`, { cookie }));
    expect(byPhone.status).toBe(200);
    expect((await byPhone.json()).customerId).toBe(c.id);
    const byToken = await lookup(req(`/api/staff/customer?token=${c.token}`, { cookie }));
    expect((await byToken.json()).card.firstName).toBe('Salma');
    const missing = await lookup(req('/api/staff/customer?phone=99999999', { cookie }));
    expect(missing.status).toBe(404);
  });

  it('redeem and give perks', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ cardStamps: 3, lifetimePepins: 1 });
    const cookie = await cookieFor(s);
    const r = await redeem(req('/api/staff/redeem', { body: { customerId: c.id, stop: 3 }, cookie }));
    expect(await r.json()).toMatchObject({ stop: 3, cardStamps: 0 });
    const p = await perk(req('/api/staff/perk', { body: { customerId: c.id, perkLevel: 2 }, cookie }));
    expect(p.status).toBe(200);
  });

  it('locks out a deactivated staff member immediately', async () => {
    const s = await makeStaff();
    const cookie = await cookieFor(s);
    await testDb.update(staff).set({ active: false }).where(eq(staff.id, s.id));
    const c = await makeCustomer();
    const res = await lookup(req(`/api/staff/customer?token=${c.token}`, { cookie }));
    expect(res.status).toBe(401);
  });
});

describe('auth + address routes', () => {
  it('sets an httpOnly strict session cookie on login', async () => {
    await makeStaff('Amel', 'staff', '123456');
    const res = await login(req('/api/auth/login', { body: { name: 'Amel', pin: '123456' } }));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/kinz_session=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=strict/i);
    const bad = await login(req('/api/auth/login', { body: { name: 'Amel', pin: '000000' } }));
    expect(bad.status).toBe(401);
  });

  it('saves the address of a Figuier', async () => {
    const c = await makeCustomer({ lifetimePepins: 561 });
    const res = await setAddress(
      req(`/api/customers/${c.token}/address`, { body: { address: '12 rue de Marseille, Tunis' } }),
      { params: Promise.resolve({ token: c.token }) },
    );
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 3: Run and confirm it fails**

Run: `npm run test:integration -- tests/integration/routes.test.ts`
Expected: FAIL, route modules missing.

- [ ] **Step 4: Implement** `src/server/http.ts`

```ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, ERROR_STATUS } from './errors';

export function jsonError(e: unknown): NextResponse {
  if (e instanceof AppError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: ERROR_STATUS[e.code] });
  }
  if (e instanceof ZodError || e instanceof SyntaxError) {
    return NextResponse.json({ error: 'Données invalides', code: 'BAD_REQUEST' }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json({ error: 'Erreur serveur', code: 'INTERNAL' }, { status: 500 });
}
```

- [ ] **Step 5: Implement the customer routes**

`src/app/api/customers/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { isValidBirthday } from '@/lib/dates';
import { createCustomer } from '@/server/customers';
import { jsonError } from '@/server/http';

const Body = z.object({
  firstName: z.string().trim().min(1).max(40),
  phone: z.string().max(30),
  birthday: z
    .string()
    .refine((v) => isValidBirthday(v))
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const result = await createCustomer(getDb(), body);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
```
`src/app/api/customers/[token]/address/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { setAddress } from '@/server/customers';
import { jsonError } from '@/server/http';

const Body = z.object({ address: z.string().max(300) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { address } = Body.parse(await req.json());
    await setAddress(getDb(), token, address);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
```

- [ ] **Step 6: Implement the auth routes**

`src/app/api/auth/login/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { env } from '@/lib/env';
import { createSessionToken, login, SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/server/auth';
import { jsonError } from '@/server/http';

const Body = z.object({ name: z.string().trim().min(1).max(60), pin: z.string().max(12) });

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const session = await login(getDb(), body);
    const res = NextResponse.json({ name: session.name, role: session.role });
    res.cookies.set(SESSION_COOKIE, await createSessionToken(session, env().SESSION_SECRET), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch (e) {
    return jsonError(e);
  }
}
```
`src/app/api/auth/logout/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/server/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
```

- [ ] **Step 7: Implement the staff routes**

`src/app/api/staff/customer/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/db/client';
import { findCustomerByPhone, getCustomerByToken } from '@/server/customers';
import { AppError } from '@/server/errors';
import { jsonError } from '@/server/http';
import { getStaffView } from '@/server/perks';
import { requireStaff } from '@/server/session';

export async function GET(req: NextRequest) {
  try {
    await requireStaff(req);
    const db = getDb();
    const token = req.nextUrl.searchParams.get('token');
    const phone = req.nextUrl.searchParams.get('phone');
    const customer = token
      ? await getCustomerByToken(db, token)
      : phone
        ? await findCustomerByPhone(db, phone)
        : null;
    if (!customer) throw new AppError('NOT_FOUND');
    return NextResponse.json(await getStaffView(db, customer));
  } catch (e) {
    return jsonError(e);
  }
}
```
`src/app/api/staff/stamp/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { parseAmount } from '@/lib/amount';
import { AppError } from '@/server/errors';
import { jsonError } from '@/server/http';
import { requireStaff } from '@/server/session';
import { stamp } from '@/server/stamping';

const Body = z.object({ customerId: z.string().uuid(), amount: z.string().max(20) });

export async function POST(req: NextRequest) {
  try {
    const session = await requireStaff(req);
    const body = Body.parse(await req.json());
    const amountTnd = parseAmount(body.amount);
    if (amountTnd === null) throw new AppError('INVALID_AMOUNT');
    const result = await stamp(getDb(), {
      customerId: body.customerId,
      amountTnd,
      staffId: session.staffId,
    });
    return NextResponse.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
```
`src/app/api/staff/redeem/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { jsonError } from '@/server/http';
import { requireStaff } from '@/server/session';
import { redeem } from '@/server/stamping';

const Body = z.object({ customerId: z.string().uuid(), stop: z.number().int() });

export async function POST(req: NextRequest) {
  try {
    const session = await requireStaff(req);
    const body = Body.parse(await req.json());
    return NextResponse.json(await redeem(getDb(), { ...body, staffId: session.staffId }));
  } catch (e) {
    return jsonError(e);
  }
}
```
`src/app/api/staff/perk/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { jsonError } from '@/server/http';
import { givePerk } from '@/server/perks';
import { requireStaff } from '@/server/session';

const Body = z.object({ customerId: z.string().uuid(), perkLevel: z.number().int() });

export async function POST(req: NextRequest) {
  try {
    const session = await requireStaff(req);
    const body = Body.parse(await req.json());
    await givePerk(getDb(), { ...body, staffId: session.staffId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
```

- [ ] **Step 8: Run and confirm it passes**

Run: `npm run test:integration`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
npm run format:write && npm run typecheck && npm run lint
git add -A
git commit -m "feat: add customer, auth and staff API routes with error mapping

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 9: Customer UI (join page, card page, PWA, brand, security headers)

**Files:**
- Create:
  - `src/app/globals.css` (replace), `src/app/layout.tsx` (replace), `src/app/page.tsx` (replace)
  - `src/app/rejoindre/page.tsx`, `src/app/c/[token]/page.tsx`, `src/app/c/[token]/not-found.tsx`, `src/app/manifest.ts`
  - `src/components/card/JoinForm.tsx`, `StampTrack.tsx`, `LevelPanel.tsx`, `PerkList.tsx`, `AddressForm.tsx`, `AutoRefresh.tsx`, `RememberCard.tsx`
  - `src/lib/card-storage.ts`, `src/lib/qr.ts`
  - `scripts/make-icons.mjs`, `assets/logo.png`
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: `buildCardView`, `CardView`, `CARD_STOPS`, `CARD_MAX`, `isGolden`, `getCustomerByToken`, `getDb`, `env`.
- Produces:
  - `StampTrack({ cardStamps }: { cardStamps: number })`, reused by the staff console
  - `qrSvg(url: string): Promise<string>`, reused by the poster
  - `storeToken(t)`, `readStoredToken()`

- [ ] **Step 1: Brand theme** — replace `src/app/globals.css`

```css
@import 'tailwindcss';

@theme {
  --color-olive-900: #4a5530;
  --color-olive-700: #6a7b4d;
  --color-sand: #f5f0e6;
  --color-ink: #1a1a1a;
  --color-gold: #c9a961;
  --color-gold-pale: #f0e3c0;
  --color-bronze: #7a6320;
  --color-muted: #4a4a4a;
  --font-display: var(--font-playfair), Georgia, serif;
  --font-sans: var(--font-lato), system-ui, sans-serif;
}

@media print {
  .no-print {
    display: none !important;
  }
}
```
Contrast rule: gold is only used for borders, rings and bars. Text on olive uses `text-white` or `text-gold-pale`; gold-toned text on light backgrounds uses `text-bronze`.

- [ ] **Step 2: Layout, root redirect, manifest**

`src/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from 'next';
import { Lato, Playfair_Display } from 'next/font/google';
import './globals.css';

const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: { default: 'KINZ Fidélité', template: '%s · KINZ Fidélité' },
  description: 'La carte de fidélité de la boutique KINZ',
  robots: { index: false, follow: false },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#4A5530', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${lato.variable} ${playfair.variable}`}>
      <body className="min-h-dvh bg-sand font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
```
`src/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/rejoindre');
}
```
`src/app/manifest.ts`:
```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KINZ Fidélité',
    short_name: 'KINZ',
    description: 'Votre carte de fidélité KINZ',
    start_url: '/rejoindre',
    display: 'standalone',
    background_color: '#F5F0E6',
    theme_color: '#4A5530',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

- [ ] **Step 3: Icons**

```bash
mkdir -p assets && cp "/home/kiwif/Desktop/Claude/Ressources de travail KINZ/brand-assets/logos/Logo Kinz nouveau.png" assets/logo.png
```
`scripts/make-icons.mjs`:
```js
import sharp from 'sharp';

const src = 'assets/logo.png';
const bg = '#F5F0E6';
for (const [size, out] of [
  [192, 'public/icon-192.png'],
  [512, 'public/icon-512.png'],
  [180, 'public/apple-touch-icon.png'],
]) {
  await sharp(src).resize(size, size, { fit: 'contain', background: bg }).png().toFile(out);
}
console.log('Icônes générées');
```
Run: `npm run icons && ls public/*.png`
Expected: 3 PNGs.

- [ ] **Step 4: Small client helpers and the QR code**

`src/lib/card-storage.ts`:
```ts
const KEY = 'kinz_card_token';

export function storeToken(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* private mode: the card link still works */
  }
}

export function readStoredToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
```
`src/lib/qr.ts`:
```ts
import QRCode from 'qrcode';

export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#1A1A1A', light: '#FFFFFF' },
  });
}
```

- [ ] **Step 5: Card components**

`src/components/card/StampTrack.tsx`:
```tsx
import { CARD_MAX, CARD_STOPS, type CardStop } from '@/lib/rules';

const stopAt = new Map<number, CardStop>(CARD_STOPS.map((s) => [s.stamps, s]));

export function StampTrack({ cardStamps }: { cardStamps: number }) {
  return (
    <section aria-label="Carte à tampons" className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl">Ma carte</h2>
        <p className="font-bold">
          {cardStamps} / {CARD_MAX}
        </p>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-2">
        {Array.from({ length: CARD_MAX }, (_, i) => i + 1).map((n) => {
          const filled = n <= cardStamps;
          const stop = stopAt.get(n);
          return (
            <li
              key={n}
              title={stop?.label}
              className={[
                'flex aspect-square items-center justify-center rounded-full border-2 text-sm font-bold',
                filled ? 'border-olive-900 bg-olive-900 text-white' : 'border-olive-700/40 text-muted',
                stop ? 'ring-2 ring-gold ring-offset-2' : '',
              ].join(' ')}
            >
              {n}
            </li>
          );
        })}
      </ol>
      <ul className="mt-4 space-y-1 text-sm">
        {CARD_STOPS.map((s) => {
          const reached = s.stamps <= cardStamps;
          return (
            <li key={s.stamps} className={reached ? 'font-bold text-olive-900' : 'text-muted'}>
              <span className="inline-block w-8 font-display">{s.stamps}</span>
              {s.label}
              {reached ? ' — disponible' : ''}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Produits à l’unité uniquement (hors packs, trios, duos, collections et coffrets). Produit
        offert d’une valeur maximale de 49 TND.
      </p>
    </section>
  );
}
```
`src/components/card/LevelPanel.tsx`:
```tsx
import { isGolden } from '@/lib/rules';
import type { CardView } from '@/lib/views';

export function LevelPanel({ view }: { view: CardView }) {
  const { level, title, multiplier, lifetimePepins, progress } = view;
  const pct = progress.levelCost ? Math.round((progress.intoLevel / progress.levelCost) * 100) : 100;
  return (
    <section className="rounded-2xl bg-olive-900 p-4 text-white">
      <p className="text-sm text-gold-pale">
        Niveau {level}
        {isGolden(level) ? ' ✦ niveau d’or (premier et Fibonacci)' : ''}
      </p>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-1 text-sm">
        {lifetimePepins} pépins · multiplicateur ×{multiplier}
      </p>
      {progress.levelCost ? (
        <>
          <div
            className="mt-3 h-2 rounded-full bg-white/20"
            role="progressbar"
            aria-label="Progression vers le niveau suivant"
            aria-valuemin={0}
            aria-valuemax={progress.levelCost}
            aria-valuenow={progress.intoLevel}
          >
            <div className="h-2 rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-gold-pale">
            Encore {progress.levelCost - progress.intoLevel} pépins avant le niveau {level + 1}
          </p>
        </>
      ) : (
        <p className="mt-2 text-gold-pale">Niveau maximal atteint. Vous êtes une Légende.</p>
      )}
    </section>
  );
}
```
`src/components/card/PerkList.tsx`:
```tsx
import type { CardView } from '@/lib/views';

export function PerkList({ view }: { view: CardView }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-display text-xl">Mes avantages</h2>
      {view.perks.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Votre premier avantage arrive au niveau 2.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {view.perks.map((p) => (
            <li key={p.level}>
              <span className="inline-block w-10 font-bold text-bronze">N{p.level}</span>
              {p.label}
            </li>
          ))}
        </ul>
      )}
      {view.nextPerk && (
        <p className="mt-3 border-t border-sand pt-3 text-sm">
          Prochain : <strong>niveau {view.nextPerk.level}</strong> — {view.nextPerk.label}
        </p>
      )}
    </section>
  );
}
```
`src/components/card/AddressForm.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

export function AddressForm({ token }: { token: string }) {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${token}/address`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) {
        setError((await res.json()).error ?? 'Erreur');
        return;
      }
      router.refresh();
    } catch {
      setError('Connexion impossible');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl border-2 border-gold bg-white p-4">
      <h2 className="font-display text-xl">Vous êtes Figuier</h2>
      <p className="text-sm">Où devons-nous livrer vos nouveautés en avant-première ?</p>
      <label htmlFor="address" className="block text-sm font-bold">Adresse de livraison</label>
      <textarea
        id="address"
        required
        minLength={5}
        maxLength={300}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full rounded-lg border border-olive-700/40 p-2"
      />
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <button disabled={busy} className="rounded-full bg-olive-900 px-5 py-2 font-bold text-white disabled:opacity-50">
        Enregistrer
      </button>
    </form>
  );
}
```
`src/components/card/AutoRefresh.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Keeps the card in sync after staff stamp it at the till. */
export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [router, intervalMs]);
  return null;
}
```
`src/components/card/RememberCard.tsx`:
```tsx
'use client';

import { useEffect } from 'react';
import { storeToken } from '@/lib/card-storage';

export function RememberCard({ token }: { token: string }) {
  useEffect(() => storeToken(token), [token]);
  return null;
}
```

- [ ] **Step 6: Card page**

`src/app/c/[token]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { AddressForm } from '@/components/card/AddressForm';
import { AutoRefresh } from '@/components/card/AutoRefresh';
import { LevelPanel } from '@/components/card/LevelPanel';
import { PerkList } from '@/components/card/PerkList';
import { RememberCard } from '@/components/card/RememberCard';
import { StampTrack } from '@/components/card/StampTrack';
import { getDb } from '@/db/client';
import { env } from '@/lib/env';
import { qrSvg } from '@/lib/qr';
import { buildCardView } from '@/lib/views';
import { getCustomerByToken } from '@/server/customers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ma carte' };

export default async function CardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const customer = await getCustomerByToken(getDb(), token);
  if (!customer) notFound();
  const view = buildCardView(customer);
  const svg = await qrSvg(`${env().APP_URL}/c/${token}`);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-6">
      <header className="text-center">
        <p className="font-display text-3xl tracking-widest">KINZ</p>
        <h1 className="mt-1 text-lg">Bonjour {view.firstName}</h1>
      </header>
      <section className="rounded-2xl bg-white p-4 text-center shadow-sm">
        <div className="mx-auto w-56" aria-label="QR code de votre carte" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-2 text-sm text-muted">Présentez ce code au comptoir après un achat d’au moins 40 TND.</p>
      </section>
      <StampTrack cardStamps={view.cardStamps} />
      <LevelPanel view={view} />
      {view.needsAddress && <AddressForm token={token} />}
      <PerkList view={view} />
      <p className="text-center text-xs text-muted">
        Astuce : ajoutez cette page à votre écran d’accueil pour retrouver votre carte.
      </p>
      <RememberCard token={token} />
      <AutoRefresh />
    </main>
  );
}
```
`src/app/c/[token]/not-found.tsx`:
```tsx
import Link from 'next/link';

export default function CardNotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-2xl">Carte introuvable</h1>
      <p className="mt-2">Ce lien n’est pas valide. Demandez au comptoir de vous renvoyer votre carte.</p>
      <Link href="/rejoindre?nouveau=1" className="mt-6 inline-block underline">Créer une carte</Link>
    </main>
  );
}
```

- [ ] **Step 7: Join page**

`src/components/card/JoinForm.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { readStoredToken, storeToken } from '@/lib/card-storage';

export function JoinForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = readStoredToken();
    if (stored && !window.location.search.includes('nouveau')) router.replace(`/c/${stored}`);
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ firstName, phone, birthday: birthday || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erreur');
        return;
      }
      storeToken(data.token);
      router.push(`/c/${data.token}`);
    } catch {
      setError('Connexion impossible — réessayez');
    } finally {
      setBusy(false);
    }
  }

  const input = 'w-full rounded-lg border border-olive-700/40 bg-white p-3';
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="firstName" className="block text-sm font-bold">Prénom</label>
        <input id="firstName" required maxLength={40} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-bold">Téléphone</label>
        <input id="phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="22 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor="birthday" className="block text-sm font-bold">Date d’anniversaire (facultatif)</label>
        <input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={input} />
        <p className="mt-1 text-xs text-muted">Votre anniversaire débloque des cadeaux. Vos données restent chez KINZ.</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <button disabled={busy} className="w-full rounded-full bg-olive-900 py-3 font-bold text-white disabled:opacity-50">
        Créer ma carte
      </button>
    </form>
  );
}
```
`src/app/rejoindre/page.tsx`:
```tsx
import { JoinForm } from '@/components/card/JoinForm';

export const metadata = { title: 'Rejoindre' };

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <p className="text-center font-display text-4xl tracking-widest">KINZ</p>
      <h1 className="mt-4 text-center font-display text-2xl">Le Code KINZ</h1>
      <p className="mt-2 text-center text-sm">
        Un tampon par visite dès 40 TND, des récompenses aux nombres premiers, et 50 niveaux à gravir.
      </p>
      <div className="mt-6">
        <JoinForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Security headers** — replace `next.config.ts`

```ts
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Card URLs carry the customer's secret token: never leak them to other sites.
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
```

- [ ] **Step 9: Manual check**

```bash
npm run build && npm run dev
```
Open `http://localhost:3000` on desktop at phone width (DevTools, 390 px):
- Create a card → you are redirected to `/c/<token>`.
- The QR code shows, `0 / 13` shows, and the level is "Graine".
- Going back to `/rejoindre` redirects to the card; `/rejoindre?nouveau=1` shows the form.

Then run `curl -sI http://localhost:3000/rejoindre | grep -i referrer`.
Expected: `referrer-policy: no-referrer`.

- [ ] **Step 10: Commit**

```bash
npm run format:write && npm run lint && npm run typecheck
git add -A
git commit -m "feat: add customer join and card pages with PWA manifest and brand theme

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 10: Staff console (login, scanner, stamp, redeem, perks)

**Files:**
- Create:
  - `src/lib/messages.ts`, `src/lib/messages.test.ts`
  - `src/app/staff/login/page.tsx`, `src/app/staff/page.tsx`
  - `src/components/staff/LoginForm.tsx`, `StaffConsole.tsx`, `QrScanner.tsx`, `CustomerPanel.tsx`

**Interfaces:**
- Consumes:
  - HTTP contracts from Task 8
  - `StampTrack`, `extractToken`, `parseAmount`
  - Types `StaffCustomerView`, `StampResult`, `RedeemResult`
  - `getPageSession`
- Produces:
  - `stampMessage(r: StampResult): string`, `redeemMessage(r: RedeemResult): string`
  - Stable UI labels (used by the e2e test): "Nom", "PIN", "Se connecter", "Téléphone du client", "Rechercher", "Montant du ticket (TND)", "Tamponner", "Utiliser — palier N", "Confirmer", "Client suivant", "Marquer comme remis", "Déconnexion"

- [ ] **Step 1: Write the failing test** — `src/lib/messages.test.ts`

```ts
import { expect, it } from 'vitest';
import { redeemMessage, stampMessage } from './messages';

it('summarises a stamp', () => {
  expect(stampMessage({ stampsAdded: 1, pepinsAdded: 2, cardStamps: 1, lifetimePepins: 2, levelBefore: 1, levelAfter: 2, cardFull: false }))
    .toBe('+1 tampon · +2 pépins · Niveau 2 atteint !');
  expect(stampMessage({ stampsAdded: 2, pepinsAdded: 3, cardStamps: 13, lifetimePepins: 10, levelBefore: 5, levelAfter: 5, cardFull: true }))
    .toBe('+2 tampons · +3 pépins · Carte pleine — utilisez la récompense');
});

it('summarises a redeem', () => {
  expect(redeemMessage({ stop: 11, label: '1 produit offert (≤ 49 TND) + 11 pépins', bonusPepins: 11, cardStamps: 0, lifetimePepins: 40, levelAfter: 9 }))
    .toBe('Récompense appliquée : 1 produit offert (≤ 49 TND) + 11 pépins. Carte remise à 0.');
});
```
Run: `npm run test:unit -- src/lib/messages.test.ts`
Expected: FAIL, module missing.

- [ ] **Step 2: Implement** `src/lib/messages.ts`

```ts
import type { RedeemResult, StampResult } from './views';

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

export function stampMessage(r: StampResult): string {
  const parts = [`+${plural(r.stampsAdded, 'tampon')}`, `+${r.pepinsAdded} pépins`];
  if (r.levelAfter > r.levelBefore) parts.push(`Niveau ${r.levelAfter} atteint !`);
  if (r.cardFull) parts.push('Carte pleine — utilisez la récompense');
  return parts.join(' · ');
}

export function redeemMessage(r: RedeemResult): string {
  return `Récompense appliquée : ${r.label}. Carte remise à ${r.cardStamps}.`;
}
```
Run: `npm run test:unit -- src/lib/messages.test.ts`
Expected: PASS.

- [ ] **Step 3: Login page**

`src/components/staff/LoginForm.tsx`:
```tsx
'use client';

import { type FormEvent, useState } from 'react';

export function LoginForm() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, pin }),
      });
      if (!res.ok) {
        setError((await res.json()).error ?? 'Erreur');
        setPin('');
        return;
      }
      window.location.href = '/staff';
    } catch {
      setError('Connexion impossible');
    } finally {
      setBusy(false);
    }
  }

  const input = 'w-full rounded-lg border border-olive-700/40 bg-white p-3';
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-bold">Nom</label>
        <input id="name" required autoComplete="username" value={name} onChange={(e) => setName(e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor="pin" className="block text-sm font-bold">PIN</label>
        <input id="pin" required type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value)} className={input} />
      </div>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <button disabled={busy} className="w-full rounded-full bg-olive-900 py-3 font-bold text-white disabled:opacity-50">
        Se connecter
      </button>
    </form>
  );
}
```
`src/app/staff/login/page.tsx`:
```tsx
import { LoginForm } from '@/components/staff/LoginForm';

export const metadata = { title: 'Connexion équipe' };

export default function StaffLoginPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-center font-display text-2xl">Espace équipe KINZ</h1>
      <div className="mt-6">
        <LoginForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: QR scanner** — `src/components/staff/QrScanner.tsx`

```tsx
'use client';

import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { extractToken } from '@/lib/token';

export function QrScanner({ onToken }: { onToken: (token: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    handled.current = false;
    const scanner = new Html5Qrcode('qr-reader', {
      verbose: false,
      useBarCodeDetectorIfSupported: true,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });
    const started = scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 240 },
      (text) => {
        if (handled.current) return;
        const token = extractToken(text);
        if (!token) {
          setError('QR code non reconnu — ce n’est pas une carte KINZ');
          return;
        }
        handled.current = true;
        onToken(token);
      },
      () => {},
    );
    started.catch(() => setError('Caméra indisponible — utilisez la recherche par téléphone'));
    return () => {
      started
        .then(() => scanner.stop())
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [onToken]);

  return (
    <div>
      <div id="qr-reader" className="overflow-hidden rounded-xl bg-black/5" />
      {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Customer panel** — `src/components/staff/CustomerPanel.tsx`

```tsx
'use client';

import { type FormEvent, useState } from 'react';
import { StampTrack } from '@/components/card/StampTrack';
import { parseAmount } from '@/lib/amount';
import type { StaffCustomerView } from '@/lib/views';

interface Props {
  view: StaffCustomerView;
  busy: boolean;
  onStamp: (amount: string) => Promise<boolean>;
  onRedeem: (stop: number) => Promise<void>;
  onPerk: (level: number) => Promise<void>;
  onNext: () => void;
}

export function CustomerPanel({ view, busy, onStamp, onRedeem, onPerk, onNext }: Props) {
  const [amount, setAmount] = useState('');
  const [confirmBig, setConfirmBig] = useState(false);
  const [pendingStop, setPendingStop] = useState<number | null>(null);
  const parsed = parseAmount(amount);
  const { card } = view;
  const reached = card.stops.filter((s) => s.reached);

  async function submitStamp(e: FormEvent) {
    e.preventDefault();
    if (parsed === null) return;
    if (parsed >= 300 && !confirmBig) {
      setConfirmBig(true);
      return;
    }
    setConfirmBig(false);
    if (await onStamp(amount)) setAmount('');
  }

  const btn = 'rounded-full px-5 py-3 font-bold disabled:opacity-50';
  return (
    <div className="space-y-4">
      <header className="rounded-2xl bg-olive-900 p-4 text-white">
        <h2 className="font-display text-2xl">{card.firstName}</h2>
        <p className="text-sm text-gold-pale">
          {view.phone} · Niveau {card.level} — {card.title} · ×{card.multiplier}
        </p>
      </header>

      <StampTrack cardStamps={card.cardStamps} />

      {view.stampedToday ? (
        <p className="rounded-xl bg-white p-4 font-bold">Déjà tamponné aujourd'hui</p>
      ) : (
        <form onSubmit={submitStamp} className="space-y-2 rounded-2xl bg-white p-4">
          <label htmlFor="amount" className="block text-sm font-bold">Montant du ticket (TND)</label>
          <input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="85,500"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setConfirmBig(false);
            }}
            className="w-full rounded-lg border border-olive-700/40 p-3 text-lg"
          />
          {amount && parsed === null && <p role="alert" className="text-sm text-red-800">Montant invalide</p>}
          <button disabled={busy || parsed === null} className={`${btn} w-full bg-olive-900 text-white`}>
            {confirmBig ? `Confirmer ${parsed} TND` : 'Tamponner'}
          </button>
          {confirmBig && <p className="text-sm">Montant élevé : vérifiez le ticket puis confirmez.</p>}
        </form>
      )}

      <section className="space-y-2 rounded-2xl bg-white p-4">
        <h3 className="font-display text-lg">Récompenses</h3>
        {reached.length === 0 && <p className="text-sm text-muted">Aucune récompense disponible.</p>}
        {reached.map((s) =>
          pendingStop === s.stamps ? (
            <div key={s.stamps} className="space-y-2 rounded-xl border-2 border-gold p-3">
              <p className="text-sm">
                Appliquez « {s.label} » en caisse, puis confirmez. La carte sera remise à zéro.
              </p>
              <div className="flex gap-2">
                <button disabled={busy} onClick={() => onRedeem(s.stamps).then(() => setPendingStop(null))} className={`${btn} bg-olive-900 text-white`}>
                  Confirmer
                </button>
                <button onClick={() => setPendingStop(null)} className={`${btn} bg-sand`}>Annuler</button>
              </div>
            </div>
          ) : (
            <button key={s.stamps} disabled={busy} onClick={() => setPendingStop(s.stamps)} className={`${btn} block w-full border-2 border-olive-900 text-left`}>
              Utiliser — palier {s.stamps} <span className="font-normal">({s.label})</span>
            </button>
          ),
        )}
      </section>

      {view.givablePerks.length > 0 && (
        <section className="space-y-2 rounded-2xl bg-white p-4">
          <h3 className="font-display text-lg">Avantages à remettre</h3>
          {view.givablePerks.map((p) => (
            <div key={p.level} className="flex items-center justify-between gap-2 text-sm">
              <span>N{p.level} — {p.label}</span>
              <button disabled={busy} onClick={() => onPerk(p.level)} className="rounded-full border border-olive-900 px-3 py-1">
                Marquer comme remis
              </button>
            </div>
          ))}
        </section>
      )}

      <button onClick={onNext} className={`${btn} w-full bg-sand`}>Client suivant</button>
    </div>
  );
}
```

- [ ] **Step 6: Console** — `src/components/staff/StaffConsole.tsx`

```tsx
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { type FormEvent, useCallback, useState } from 'react';
import { redeemMessage, stampMessage } from '@/lib/messages';
import type { RedeemResult, StaffCustomerView, StampResult } from '@/lib/views';
import { CustomerPanel } from './CustomerPanel';

const QrScanner = dynamic(() => import('./QrScanner').then((m) => m.QrScanner), { ssr: false });

type Msg = { kind: 'ok' | 'warn' | 'error'; text: string } | null;

export function StaffConsole({ staffName, isOwner }: { staffName: string; isOwner: boolean }) {
  const [view, setView] = useState<StaffCustomerView | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');

  const call = useCallback(async <T,>(url: string, body?: unknown): Promise<T | null> => {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = '/staff/login';
        return null;
      }
      if (!res.ok) {
        setMsg({ kind: 'error', text: data.error ?? 'Erreur' });
        return null;
      }
      return data as T;
    } catch {
      setMsg({ kind: 'error', text: 'Connexion impossible — vérifiez le réseau' });
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const load = useCallback(
    async (query: string) => {
      const v = await call<StaffCustomerView>(`/api/staff/customer?${query}`);
      if (v) setView(v);
    },
    [call],
  );

  const onToken = useCallback(
    (token: string) => {
      setMsg(null);
      void load(`token=${encodeURIComponent(token)}`);
    },
    [load],
  );

  function search(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    void load(`phone=${encodeURIComponent(phone)}`);
  }

  async function onStamp(amount: string): Promise<boolean> {
    if (!view) return false;
    setMsg(null);
    const r = await call<StampResult>('/api/staff/stamp', { customerId: view.customerId, amount });
    if (!r) return false;
    setMsg({ kind: r.cardFull ? 'warn' : 'ok', text: stampMessage(r) });
    await load(`token=${view.card.token}`);
    return true;
  }

  async function onRedeem(stop: number) {
    if (!view) return;
    setMsg(null);
    const r = await call<RedeemResult>('/api/staff/redeem', { customerId: view.customerId, stop });
    if (!r) return;
    setMsg({ kind: 'ok', text: redeemMessage(r) });
    await load(`token=${view.card.token}`);
  }

  async function onPerk(perkLevel: number) {
    if (!view) return;
    setMsg(null);
    if (await call('/api/staff/perk', { customerId: view.customerId, perkLevel })) {
      setMsg({ kind: 'ok', text: 'Avantage marqué comme remis' });
      await load(`token=${view.card.token}`);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/staff/login';
  }

  const tone = { ok: 'bg-olive-700 text-white', warn: 'bg-gold-pale text-ink', error: 'bg-red-100 text-red-900' };
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-4">
      <header className="flex items-center justify-between text-sm">
        <span>Équipe : <strong>{staffName}</strong></span>
        <span className="flex gap-3">
          {isOwner && <Link href="/admin" className="underline">Admin</Link>}
          <button onClick={logout} className="underline">Déconnexion</button>
        </span>
      </header>

      {msg && <p role="status" className={`rounded-xl p-3 font-bold ${tone[msg.kind]}`}>{msg.text}</p>}

      {view ? (
        <CustomerPanel
          view={view}
          busy={busy}
          onStamp={onStamp}
          onRedeem={onRedeem}
          onPerk={onPerk}
          onNext={() => {
            setView(null);
            setMsg(null);
            setPhone('');
          }}
        />
      ) : (
        <>
          <QrScanner onToken={onToken} />
          <form onSubmit={search} className="space-y-2 rounded-2xl bg-white p-4">
            <label htmlFor="phone" className="block text-sm font-bold">Téléphone du client</label>
            <input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-olive-700/40 p-3" />
            <button disabled={busy || !phone} className="w-full rounded-full bg-olive-900 py-3 font-bold text-white disabled:opacity-50">
              Rechercher
            </button>
          </form>
        </>
      )}
    </main>
  );
}
```
`src/app/staff/page.tsx`:
```tsx
import { redirect } from 'next/navigation';
import { StaffConsole } from '@/components/staff/StaffConsole';
import { getPageSession } from '@/server/page-session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Comptoir' };

export default async function StaffPage() {
  const session = await getPageSession();
  if (!session) redirect('/staff/login');
  return <StaffConsole staffName={session.name} isOwner={session.role === 'owner'} />;
}
```

- [ ] **Step 7: Manual check on a real phone**

```bash
npm run dev -- -H 0.0.0.0
```
Camera access requires HTTPS on phones (localhost is exempt). For a quick LAN test, open `/staff` on the laptop, and use the phone-search path from the phone. Full camera testing happens on the Vercel preview in Task 13.
- Log in as the seeded "Test" owner.
- Search the phone from Task 9 → stamp "85,500" → the message "+1 tampon · +2 pépins · Niveau 2 atteint !" appears.
- "Client suivant", search again → the panel shows "Déjà tamponné aujourd'hui".
- Stop the server.

- [ ] **Step 8: Commit**

```bash
npm run format:write && npm run lint && npm run typecheck && npm run test:unit
git add -A
git commit -m "feat: add staff console with QR scanner, stamping, rewards and perks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 11: Owner admin (staff management, log, Figuiers, CSV, poster)

**Files:**
- Create:
  - `src/lib/csv.ts`, `src/lib/csv.test.ts`, `src/server/admin.ts`
  - `src/app/api/admin/staff/route.ts`, `src/app/api/admin/staff/[id]/route.ts`, `src/app/api/admin/export/route.ts`
  - `src/app/admin/page.tsx`, `src/app/admin/affiche/page.tsx`, `src/components/admin/StaffManager.tsx`
  - `tests/integration/admin.test.ts`

**Interfaces:**
- Consumes: `listStaff`, `createStaff`, `updateStaff`, `requireStaff(req, 'owner')`, `getPageSession`, `qrSvg`, `formatDateTime`, `levelFromPepins`, `pepinsToReach`, `title`.
- Produces:
  - `toCsv(rows: Record<string, string | number | null>[]): string`
  - `listEvents(db, limit?)`, `listFiguiers(db)`, `exportCustomersCsv(db)`, `exportEventsCsv(db)`
  - `GET/POST /api/admin/staff`, `PATCH /api/admin/staff/:id`, `GET /api/admin/export?type=customers|events`

- [ ] **Step 1: Write the failing CSV test** — `src/lib/csv.test.ts`

```ts
import { expect, it } from 'vitest';
import { toCsv } from './csv';

it('writes a semicolon CSV with BOM for French Excel', () => {
  expect(toCsv([{ prenom: 'Salma', pepins: 12 }])).toBe('﻿prenom;pepins\r\nSalma;12\r\n');
});

it('quotes separators, quotes and line breaks', () => {
  expect(toCsv([{ adresse: '12 rue "X"; Tunis\nBis' }])).toBe('﻿adresse\r\n"12 rue ""X""; Tunis\nBis"\r\n');
});

it('neutralises spreadsheet formulas in text but not in numbers', () => {
  const csv = toCsv([{ prenom: '=HYPERLINK("x")', delta: -7 }]);
  expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  expect(csv).toContain(';-7');
});

it('returns an empty string for no rows', () => {
  expect(toCsv([])).toBe('');
});
```
Run: `npm run test:unit -- src/lib/csv.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement** `src/lib/csv.ts`

```ts
type Cell = string | number | null | undefined;

function cell(value: Cell): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Semicolon-separated with BOM so French Excel opens it directly. */
export function toCsv(rows: Record<string, Cell>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(';'), ...rows.map((r) => headers.map((h) => cell(r[h])).join(';'))];
  return `﻿${lines.join('\r\n')}\r\n`;
}
```
Run: `npm run test:unit -- src/lib/csv.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the failing admin integration tests** — `tests/integration/admin.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { GET as exportRoute } from '@/app/api/admin/export/route';
import { GET as listStaffRoute, POST as createStaffRoute } from '@/app/api/admin/staff/route';
import { PATCH as patchStaff } from '@/app/api/admin/staff/[id]/route';
import { exportCustomersCsv, listEvents, listFiguiers } from '@/server/admin';
import { stamp } from '@/server/stamping';
import { makeCustomer, makeStaff, testDb } from './helpers';
import { cookieFor, req } from './http';

describe('admin queries', () => {
  it('lists recent events with names and the Figuiers', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ firstName: 'Salma' });
    const leila = await makeCustomer({ firstName: 'Leila', lifetimePepins: 600, address: 'Sousse' });
    await stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id });
    const [e] = await listEvents(testDb);
    expect(e).toMatchObject({ type: 'stamp', customerName: 'Salma', staffName: 'Amel' });
    expect((await listFiguiers(testDb)).map((f) => f.firstName)).toEqual(['Leila']);
    const csv = await exportCustomersCsv(testDb);
    expect(csv).toContain('prenom;telephone');
    expect(csv).toContain(`Leila;${leila.phone.slice(1)};`);
  });
});

describe('admin routes', () => {
  it('are reserved to owners (403 for staff)', async () => {
    const s = await makeStaff('Amel', 'staff');
    const res = await listStaffRoute(req('/api/admin/staff', { cookie: await cookieFor(s) }));
    expect(res.status).toBe(403);
  });

  it('create, deactivate and export as owner', async () => {
    const o = await makeStaff('Nassim', 'owner');
    const cookie = await cookieFor(o);
    const created = await createStaffRoute(req('/api/admin/staff', { body: { name: 'Sami', pin: '111111', role: 'staff' }, cookie }));
    expect(created.status).toBe(201);
    const { id } = await created.json();
    const off = await patchStaff(req(`/api/admin/staff/${id}`, { method: 'PATCH', body: { active: false }, cookie }), { params: Promise.resolve({ id }) });
    expect(off.status).toBe(200);
    const csv = await exportRoute(req('/api/admin/export?type=customers', { cookie }));
    expect(csv.headers.get('content-type')).toMatch(/text\/csv/);
    expect(csv.headers.get('content-disposition')).toMatch(/attachment; filename="kinz-customers-/);
  });
});
```
Run: `npm run test:integration -- tests/integration/admin.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement** `src/server/admin.ts`

```ts
import { desc, eq, gte } from 'drizzle-orm';
import type { Db } from '@/db';
import { customers, events, staff } from '@/db/schema';
import { toCsv } from '@/lib/csv';
import { levelFromPepins, pepinsToReach } from '@/lib/rules';

export function listEvents(db: Db, limit = 200) {
  return db
    .select({
      id: events.id,
      createdAt: events.createdAt,
      type: events.type,
      amountTnd: events.amountTnd,
      stampsDelta: events.stampsDelta,
      pepinsDelta: events.pepinsDelta,
      detail: events.detail,
      customerName: customers.firstName,
      customerPhone: customers.phone,
      staffName: staff.name,
    })
    .from(events)
    .innerJoin(customers, eq(events.customerId, customers.id))
    .innerJoin(staff, eq(events.staffId, staff.id))
    .orderBy(desc(events.createdAt))
    .limit(limit);
}

export function listFiguiers(db: Db) {
  return db
    .select()
    .from(customers)
    .where(gte(customers.lifetimePepins, pepinsToReach(34)))
    .orderBy(desc(customers.lifetimePepins));
}

// Phones exported without "+" so spreadsheets don't read them as formulas.
const phoneForCsv = (p: string) => p.replace(/^\+/, '');

export async function exportCustomersCsv(db: Db): Promise<string> {
  const rows = await db.select().from(customers).orderBy(customers.createdAt);
  return toCsv(
    rows.map((c) => ({
      prenom: c.firstName,
      telephone: phoneForCsv(c.phone),
      anniversaire: c.birthday,
      adresse: c.address,
      tampons: c.cardStamps,
      pepins: c.lifetimePepins,
      niveau: levelFromPepins(c.lifetimePepins),
      inscrit_le: c.createdAt.toISOString(),
    })),
  );
}

export async function exportEventsCsv(db: Db): Promise<string> {
  const rows = await listEvents(db, 1_000_000);
  return toCsv(
    rows.map((e) => ({
      date: e.createdAt.toISOString(),
      type: e.type,
      client: e.customerName,
      telephone: phoneForCsv(e.customerPhone),
      montant_tnd: e.amountTnd,
      tampons: e.stampsDelta,
      pepins: e.pepinsDelta,
      detail: e.detail,
      equipe: e.staffName,
    })),
  );
}
```

- [ ] **Step 5: Implement the admin routes**

`src/app/api/admin/staff/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { jsonError } from '@/server/http';
import { requireStaff } from '@/server/session';
import { createStaff, listStaff } from '@/server/staff';

const Body = z.object({
  name: z.string().trim().min(1).max(60),
  pin: z.string().max(12),
  role: z.enum(['staff', 'owner']),
});

export async function GET(req: NextRequest) {
  try {
    await requireStaff(req, 'owner');
    return NextResponse.json(await listStaff(getDb()));
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireStaff(req, 'owner');
    const row = await createStaff(getDb(), Body.parse(await req.json()));
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
```
`src/app/api/admin/staff/[id]/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { jsonError } from '@/server/http';
import { requireStaff } from '@/server/session';
import { updateStaff } from '@/server/staff';

const Body = z.object({ active: z.boolean().optional(), pin: z.string().max(12).optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff(req, 'owner');
    const { id } = await params;
    const body = Body.parse(await req.json());
    await updateStaff(getDb(), { id: z.string().uuid().parse(id), actorId: session.staffId, ...body });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
```
`src/app/api/admin/export/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { businessDate } from '@/lib/dates';
import { exportCustomersCsv, exportEventsCsv } from '@/server/admin';
import { jsonError } from '@/server/http';
import { requireStaff } from '@/server/session';

export async function GET(req: NextRequest) {
  try {
    await requireStaff(req, 'owner');
    const type = z.enum(['customers', 'events']).parse(req.nextUrl.searchParams.get('type'));
    const csv = type === 'customers' ? await exportCustomersCsv(getDb()) : await exportEventsCsv(getDb());
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="kinz-${type}-${businessDate()}.csv"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
```
Run: `npm run test:integration`
Expected: all pass.

- [ ] **Step 6: Staff manager UI** — `src/components/admin/StaffManager.tsx`

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

export interface StaffItem {
  id: string;
  name: string;
  role: 'staff' | 'owner';
  active: boolean;
}

export function StaffManager({ staff, selfId }: { staff: StaffItem[]; selfId: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'staff' | 'owner'>('staff');
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function send(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<boolean> {
    const res = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? 'Erreur');
      return false;
    }
    setMsg(null);
    router.refresh();
    return true;
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (await send('/api/admin/staff', 'POST', { name, pin, role })) {
      setName('');
      setPin('');
    }
  }

  const input = 'rounded-lg border border-olive-700/40 bg-white p-2';
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl">Équipe</h2>
      {msg && <p role="alert" className="text-sm text-red-800">{msg}</p>}
      <ul className="divide-y divide-sand rounded-2xl bg-white">
        {staff.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <span>
              <strong>{s.name}</strong> · {s.role === 'owner' ? 'propriétaire' : 'équipe'}
              {!s.active && ' · désactivé'}
            </span>
            <span className="flex flex-wrap gap-2">
              {resetFor === s.id ? (
                <>
                  <input aria-label={`Nouveau PIN pour ${s.name}`} inputMode="numeric" maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value)} className={`${input} w-24`} />
                  <button onClick={() => send(`/api/admin/staff/${s.id}`, 'PATCH', { pin: newPin }).then((ok) => ok && (setResetFor(null), setNewPin('')))} className="underline">OK</button>
                </>
              ) : (
                <button onClick={() => setResetFor(s.id)} className="underline">Nouveau PIN</button>
              )}
              {s.id !== selfId && (
                <button onClick={() => send(`/api/admin/staff/${s.id}`, 'PATCH', { active: !s.active })} className="underline">
                  {s.active ? 'Désactiver' : 'Réactiver'}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={create} className="flex flex-wrap items-end gap-2 rounded-2xl bg-white p-3 text-sm">
        <label className="flex flex-col">Nom<input required value={name} onChange={(e) => setName(e.target.value)} className={input} /></label>
        <label className="flex flex-col">PIN (6 chiffres)<input required inputMode="numeric" pattern="\d{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} className={input} /></label>
        <label className="flex flex-col">Rôle
          <select value={role} onChange={(e) => setRole(e.target.value as 'staff' | 'owner')} className={input}>
            <option value="staff">Équipe</option>
            <option value="owner">Propriétaire</option>
          </select>
        </label>
        <button className="rounded-full bg-olive-900 px-4 py-2 font-bold text-white">Ajouter</button>
      </form>
    </section>
  );
}
```

- [ ] **Step 7: Admin page and poster**

`src/app/admin/page.tsx`:
```tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StaffManager } from '@/components/admin/StaffManager';
import { getDb } from '@/db/client';
import { formatDateTime } from '@/lib/dates';
import { levelFromPepins, title } from '@/lib/rules';
import { listEvents, listFiguiers } from '@/server/admin';
import { getPageSession } from '@/server/page-session';
import { listStaff } from '@/server/staff';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administration' };

const TYPE_LABEL = { stamp: 'Tampon', redeem: 'Récompense', bonus: 'Bonus pépins', perk_given: 'Avantage remis' } as const;

export default async function AdminPage() {
  const session = await getPageSession('owner');
  if (!session) redirect('/staff/login');
  const db = getDb();
  const [staffRows, figuiers, recent] = await Promise.all([listStaff(db), listFiguiers(db), listEvents(db, 200)]);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl">Administration KINZ Fidélité</h1>
        <nav className="flex flex-wrap gap-4 text-sm underline">
          <Link href="/staff">Comptoir</Link>
          <Link href="/admin/affiche">Affiche QR</Link>
          <a href="/api/admin/export?type=customers">Export clients (CSV)</a>
          <a href="/api/admin/export?type=events">Export journal (CSV)</a>
        </nav>
      </header>

      <StaffManager staff={staffRows.map(({ id, name, role, active }) => ({ id, name, role, active }))} selfId={session.staffId} />

      <section className="space-y-3">
        <h2 className="font-display text-xl">Figuiers et Légendes (niveau 34+) — livraisons avant-première</h2>
        <div className="overflow-x-auto rounded-2xl bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-sand"><th className="p-2">Client</th><th className="p-2">Téléphone</th><th className="p-2">Niveau</th><th className="p-2">Adresse</th></tr></thead>
            <tbody>
              {figuiers.length === 0 && <tr><td className="p-2 text-muted" colSpan={4}>Personne pour l’instant.</td></tr>}
              {figuiers.map((c) => {
                const level = levelFromPepins(c.lifetimePepins);
                return (
                  <tr key={c.id} className="border-b border-sand">
                    <td className="p-2">{c.firstName}</td><td className="p-2">{c.phone}</td>
                    <td className="p-2">{level} — {title(level)}</td><td className="p-2">{c.address ?? <em>en attente</em>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Journal (200 dernières actions)</h2>
        <div className="overflow-x-auto rounded-2xl bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-sand"><th className="p-2">Date</th><th className="p-2">Action</th><th className="p-2">Client</th><th className="p-2">Montant</th><th className="p-2">Tampons</th><th className="p-2">Pépins</th><th className="p-2">Détail</th><th className="p-2">Équipe</th></tr></thead>
            <tbody>
              {recent.map((e) => (
                <tr key={e.id} className="border-b border-sand">
                  <td className="p-2 whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                  <td className="p-2">{TYPE_LABEL[e.type]}</td>
                  <td className="p-2">{e.customerName}</td>
                  <td className="p-2">{e.amountTnd ? `${Number(e.amountTnd).toFixed(3)} TND` : ''}</td>
                  <td className="p-2">{e.stampsDelta}</td><td className="p-2">{e.pepinsDelta}</td>
                  <td className="p-2">{e.detail}</td><td className="p-2">{e.staffName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
```
`src/app/admin/affiche/page.tsx`:
```tsx
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { qrSvg } from '@/lib/qr';
import { getPageSession } from '@/server/page-session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Affiche' };

export default async function PosterPage() {
  if (!(await getPageSession())) redirect('/staff/login');
  const svg = await qrSvg(`${env().APP_URL}/rejoindre`);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 bg-white p-8 text-center">
      <p className="font-display text-5xl tracking-widest">KINZ</p>
      <h1 className="font-display text-3xl">Votre carte de fidélité</h1>
      <div className="w-72" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="text-lg">Scannez, créez votre carte en 30 secondes.</p>
      <ul className="text-sm">
        <li>1 tampon par visite dès 40 TND · 2 dès 120 TND · 3 dès 300 TND</li>
        <li>Récompenses aux paliers 3 · 5 · 7 · 11 · 13</li>
        <li>50 niveaux à gravir — la suite de Fibonacci multiplie vos pépins</li>
      </ul>
      <p className="no-print mt-4 text-sm text-muted">Pour imprimer : Ctrl/Cmd + P</p>
    </main>
  );
}
```

- [ ] **Step 8: Verify and commit**

```bash
npm run format:write && npm run lint && npm run typecheck && npm run test:unit && npm run test:integration
git add -A
git commit -m "feat: add owner admin with staff management, activity log, exports and QR poster

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 12: End-to-end tests and full CI

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/global-setup.ts`, `tests/e2e/parcours.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the UI labels from Task 10, `migrateDb`, `resetDb`, `makeDb`.

- [ ] **Step 1: Playwright config**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.test' });

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'npm run build && npx next start -p 3100',
    url: 'http://localhost:3100/rejoindre',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
```
`tests/e2e/global-setup.ts`:
```ts
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { makeDb } from '../../src/db';
import { staff } from '../../src/db/schema';
import { migrateDb, resetDb } from '../support/db';

export default async function globalSetup() {
  config({ path: '.env.test' });
  const url = process.env.DATABASE_URL!;
  await migrateDb(url);
  const db = makeDb(url, { max: 1 });
  try {
    await resetDb(db);
    await db.insert(staff).values({ name: 'E2E', role: 'owner', pinHash: await bcrypt.hash('123456', 10) });
  } finally {
    await db.$client.end();
  }
}
```

- [ ] **Step 2: Write the journeys** — `tests/e2e/parcours.spec.ts`

```ts
import { expect, type Browser, type Page, test } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { makeDb } from '../../src/db';
import { customers } from '../../src/db/schema';

async function join(page: Page, firstName: string, phone: string) {
  await page.goto('/rejoindre?nouveau=1');
  await page.getByLabel('Prénom').fill(firstName);
  await page.getByLabel('Téléphone').fill(phone);
  await page.getByRole('button', { name: 'Créer ma carte' }).click();
  await expect(page).toHaveURL(/\/c\/[A-Za-z0-9_-]{22}$/);
}

async function staffPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ baseURL: 'http://localhost:3100' });
  const page = await context.newPage();
  await page.goto('/staff/login');
  await page.getByLabel('Nom').fill('E2E');
  await page.getByLabel('PIN').fill('123456');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/staff$/);
  return page;
}

async function findCustomer(staff: Page, phone: string, name: string) {
  await staff.getByLabel('Téléphone du client').fill(phone);
  await staff.getByRole('button', { name: 'Rechercher' }).click();
  await expect(staff.getByRole('heading', { name })).toBeVisible();
}

test('un client rejoint, est tamponné une seule fois par jour, et voit sa carte se mettre à jour', async ({ page, browser }) => {
  await join(page, 'Salma', '22 123 456');
  await expect(page.getByText('0 / 13')).toBeVisible();

  const staff = await staffPage(browser);
  await findCustomer(staff, '22123456', 'Salma');
  await staff.getByLabel('Montant du ticket (TND)').fill('85,500');
  await staff.getByRole('button', { name: 'Tamponner' }).click();
  await expect(staff.getByRole('status')).toHaveText('+1 tampon · +2 pépins · Niveau 2 atteint !');
  await expect(staff.getByText("Déjà tamponné aujourd'hui")).toBeVisible();

  await page.reload();
  await expect(page.getByText('1 / 13')).toBeVisible();
  await expect(page.getByText('Niveau 2')).toBeVisible();
});

test('un numéro déjà inscrit ne donne pas accès à la carte existante', async ({ page }) => {
  await join(page, 'Leila', '22 999 000');
  await page.goto('/rejoindre?nouveau=1');
  await page.getByLabel('Prénom').fill('Intrus');
  await page.getByLabel('Téléphone').fill('22999000');
  await page.getByRole('button', { name: 'Créer ma carte' }).click();
  // getByText, not getByRole('alert'): Next's route announcer also has role="alert".
  await expect(page.getByText(/déjà une carte/)).toBeVisible();
  await expect(page).toHaveURL(/\/rejoindre/);
});

test("l'équipe applique une récompense et la carte repart à zéro", async ({ page, browser }) => {
  await join(page, 'Amira', '22 555 111');
  const db = makeDb(process.env.DATABASE_URL!, { max: 1 });
  await db.update(customers).set({ cardStamps: 3 }).where(eq(customers.phone, '+21622555111'));
  await db.$client.end();

  const staff = await staffPage(browser);
  await findCustomer(staff, '22555111', 'Amira');
  await staff.getByRole('button', { name: /Utiliser — palier 3/ }).click();
  await staff.getByRole('button', { name: 'Confirmer' }).click();
  await expect(staff.getByRole('status')).toContainText('Récompense appliquée');
  await expect(staff.getByText('0 / 13')).toBeVisible();
});
```

- [ ] **Step 3: Run the e2e tests locally**

```bash
npx playwright install chromium
npm run test:e2e
```
Expected: 3 passed. If the build fails on Google Fonts, check the network connection; CI has internet access.

- [ ] **Step 4: Full CI** — replace `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  checks:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: kinz
          POSTGRES_PASSWORD: kinz
          POSTGRES_DB: kinz_test
        ports: ['5433:5432']
        options: >-
          --health-cmd "pg_isready -U kinz"
          --health-interval 5s --health-timeout 5s --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 7
```

- [ ] **Step 5: Commit**

```bash
npm run format:write && npm run lint && npm run typecheck
git add -A
git commit -m "test: add Playwright journeys and run the full suite in CI

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
```

---

### Task 13: README for associates, deployment, pull request

**Files:**
- Create: `vercel.json`
- Modify: `README.md` (full French rewrite)

- [ ] **Step 1: `vercel.json`** (migrations run before each build, against that environment's database)

```json
{
  "buildCommand": "npm run db:migrate && npm run build"
}
```

- [ ] **Step 2: Replace `README.md`**

````markdown
# KINZ Fidélité — « Le Code KINZ »

Carte de fidélité digitale de la boutique KINZ (Tunis). Le client garde sa carte sur son
téléphone, l'équipe la tamponne en scannant son QR code, et un jeu de niveaux (1 → 50)
fondé sur les nombres premiers et la suite de Fibonacci récompense les plus fidèles.

Spécification complète : [`docs/superpowers/specs/2026-09-30-kinz-fidelite-design.md`](docs/superpowers/specs/2026-09-30-kinz-fidelite-design.md)

## Les règles en bref

| Ticket | Tampons |
|---|---|
| ≥ 40 TND | 1 |
| ≥ 120 TND | 2 |
| ≥ 300 TND | 3 |

- **Un seul passage tamponné par client et par jour.**
- **Paliers de la carte (nombres premiers)** :
  - 3 → −20 % sur 1 produit
  - 5 → −50 % sur 1 produit
  - 7 → −50 % sur 2 produits
  - 11 → 1 produit offert + 11 pépins
  - 13 → 1 produit offert + −50 % sur un 2e + 13 pépins
  - Utiliser un palier remet la carte à zéro. Produits à l'unité uniquement ; produit offert ≤ 49 TND.
- **Pépins** : 1 pépin par tranche de 40 TND. Passer du niveau n au niveau n+1 coûte n pépins (niveau 50 = 1 225 pépins).
- **Multiplicateurs (Fibonacci)** : ×2 dès le niveau 13, ×3 dès le 21, ×5 dès le 34.
- **Avantages** : aux niveaux premiers (2, 3, 5, 7, 11, 13, 17…), avec des niveaux d'or (premiers *et* Fibonacci : 2, 3, 5, 13). Au niveau 34, les nouveautés sont livrées gratuitement en avant-première. Au niveau 50 : Légende — Le Figuier d'Or.

## Les trois espaces

| Adresse | Pour qui | Usage |
|---|---|---|
| `/rejoindre` | Clients (QR de l'affiche au comptoir) | Créer sa carte |
| `/c/<code>` | Client | Sa carte : QR, tampons, niveau, avantages |
| `/staff` | Équipe (nom + PIN à 6 chiffres) | Scanner, tamponner, appliquer les récompenses |
| `/admin` | Propriétaires | Équipe, journal, Figuiers à livrer, exports CSV, affiche QR |

## Développement local

Prérequis : Node 20+, Docker.

```bash
npm ci
cp .env.example .env.local              # puis mettre un SESSION_SECRET aléatoire (32+ caractères)
npm run db:up                           # Postgres local sur le port 5433
npm run db:migrate
npm run db:seed-owner -- "Prénom" 123456
npm run dev                             # http://localhost:3000
```

Tests : `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`.
La CI GitHub lance tout à chaque pull request.

## Déploiement (Vercel + Neon)

1. Vercel → *Add New Project* → importer `nassim0014/kinz-fidelite`.
2. *Storage* → *Neon Postgres* (Marketplace) → lier au projet. `DATABASE_URL` est ajouté automatiquement, avec une base de prévisualisation par pull request.
3. *Settings → Environment Variables* :
   - `SESSION_SECRET` : générer avec `openssl rand -base64 48`.
   - `APP_URL` : l'URL de production (ex. `https://fidelite.kinzoils.com`).
4. Déployer. Les migrations s'exécutent automatiquement avant chaque build (`vercel.json`).
5. Créer le premier compte propriétaire sur la base de production :
   ```bash
   vercel env pull .env.production.local --environment=production
   ENV_FILE=.env.production.local npm run db:seed-owner -- "Prénom" 123456
   ```
6. Imprimer l'affiche QR : `/admin/affiche`.

**Sauvegardes** : Neon conserve un historique qui permet de restaurer la base à un instant
passé (*point-in-time restore*, durée selon le plan). Exporter aussi régulièrement les CSV
depuis `/admin`.

## Sécurité

- Les PIN sont hachés (bcrypt). Après 5 erreurs, le compte est verrouillé 10 minutes.
- Seule l'équipe connectée peut tamponner, et la base de données refuse un 2e tampon le même jour.
- Le lien de carte contient un code secret aléatoire de 128 bits. Il n'est jamais transmis à d'autres sites (`Referrer-Policy: no-referrer`).
- S'inscrire avec un numéro déjà utilisé ne donne **jamais** accès à la carte existante.
````

- [ ] **Step 3: Push the branch and open the PR**

```bash
npm run format:write && git add -A
git commit -m "docs: add French README for associates and Vercel build config

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7"
git push -u origin feat/loyalty-app
gh pr create --base main --title "Le Code KINZ — application de fidélité" --body "$(cat <<'EOF'
Implements the approved spec (docs/superpowers/specs/2026-09-30-kinz-fidelite-design.md):
customer card (/rejoindre, /c/<token>), staff console with QR scanning (/staff), owner admin (/admin),
prime/Fibonacci game rules, one-stamp-per-Tunis-day enforced in the database, CI with unit,
integration and Playwright tests.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_015QKgxywJ2qf4cZXuR7jdJ7
EOF
)"
gh pr checks --watch
```
Expected: CI green.

- [ ] **Step 4: Deploy (requires the user)**

Vercel project creation and the Neon link need the user's accounts, so **ask the user before doing anything**, then follow README "Déploiement" steps 1–6. Then do the two-phone check:
- Phone A joins through the poster QR.
- Phone B logs in at `/staff` and scans A's card (camera works over HTTPS).
- Stamp, check the second-stamp refusal, redeem at 3 (set up via a manual test account), and check that A's card updates within 15 s.

---

## Self-review notes

Spec coverage, requirement → task:
- Game rules → Task 2
- Stamp thresholds, once per day, Tunis date → Tasks 3 and 6
- Redeem, reset, bonus pépins → Task 6
- Manual perks and the level 34+ address → Tasks 5, 6 and 11
- Pages → Tasks 9–11
- Data model and partial index → Task 4
- PIN, bcrypt, lockout, cookie → Tasks 7 and 8
- Security headers → Task 9
- Seed script, CSV, backups note → Tasks 7, 11 and 13
- CI and preview deploys → Tasks 12 and 13
- French README → Task 13
- Brand → Task 9
````
