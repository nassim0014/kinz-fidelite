# KINZ Fidélité — « Le Code KINZ » — Design Spec

## Context
The KINZ boutique in Tunis (natural cosmetics, prickly pear oil) takes cash with manual receipts and has no POS software. The goal is a digital loyalty card that:
- customers keep on their phone,
- staff stamp by scanning it,
- keeps the stamp count across visits,
- cannot be self-stamped or double-stamped,
- works as a game ("amusant et qui fait penser"), built on prime numbers and the Fibonacci sequence, with levels up to 50.

Nothing to install: a small web app that can be added to the phone's home screen.

## Repository & delivery (approved)
- New project folder `/home/kiwif/Desktop/Claude/kinz-fidelite`, set up as its own git repo (`git init`, `main` branch).
- **Private GitHub repo `kinz-fidelite`**, pushed to the user's account so their associates can be invited as collaborators. Work happens on feature branches merged through PRs, so progress is traceable.
- This spec is committed as `docs/superpowers/specs/2026-09-30-kinz-fidelite-design.md`. The next step is the writing-plans skill, which produces `docs/superpowers/plans/…`.
- A `README.md` (in French) written for associates: what the programme is, the game rules, how to run it locally, how to deploy.

## Production-grade stack
- Next.js (App Router) + TypeScript in strict mode, and pnpm.
- **Drizzle ORM** with versioned SQL migrations, on Neon Postgres. Separate databases for dev/preview and for prod.
- **Zod** validation on every API input. Typed environment variables (validated at boot), with `.env.example` committed and secrets kept only in Vercel.
- Tailwind CSS in the KINZ brand colours and fonts (from `Ressources de travail KINZ/brand-assets/colors.txt` and `fonts.txt`).
- Tests: **Vitest** for unit and integration tests (the integration tests run against Postgres), plus a **Playwright** end-to-end test of join → stamp → same-day refusal → redeem.
- **GitHub Actions CI** on every PR: lint (ESLint + Prettier), typecheck, unit, integration, e2e.
- Vercel: preview deploy per PR, production deploy from `main`.
- Security: bcrypt PINs, signed httpOnly `SameSite=Strict` cookies, PIN rate limiting, and security headers. Tokens are 128-bit random values; the database never holds a plaintext PIN.
- Operations: seed script to create the owner account; CSV export of customers and events; a note in the README on Neon's built-in backups (point-in-time restore).

## Game rules

### Two currencies
- **Tampons** (card): earned per visit, and the card resets after a reward is used.
- **Pépins** (lifetime score): earned from spending, never decrease, and determine the level.

### Earning (one staff scan per customer per Tunis calendar day)
| Receipt total | Tampons |
|---|---|
| < 40 TND | 0 — refused, no pépins |
| ≥ 40 TND | 1 |
| ≥ 120 TND | 2 |
| ≥ 300 TND | 3 |

- Pépins = `floor(total / 40) × multiplier`. The multiplier is the one for the customer's level **before** the purchase.
- Level 19+: on the customer's birthday, the tampons from that scan are doubled.

### Rule 1 — prime numbers = stops on the card
| Tampons | Reward (used by staff; card resets) |
|---|---|
| 3 | −20% on 1 product |
| 5 | −50% on 1 product |
| 7 | −50% on 2 products |
| 11 | 1 free product (value ≤ 49 TND) + 11 bonus pépins |
| 13 | 1 free product (≤ 49 TND) + −50% on a second + 13 bonus pépins |

- The card is capped at 13. Extra tampons are lost, and staff are prompted to use the reward.
- Rewards apply to **single products only**, never to packs, trios, duos, collections or coffrets.
- Using any stop resets the card to 0. Level 17+ resets to 1; level 23+ resets to 2.
- Economics, with an average single product of about 30 TND: about 5–11% back on the minimum spend. Stop 7 is the best discount per visit; stops 11 and 13 pay out in pépins instead. That trade-off is intentional.

### Rule 2 — levels 1→50
- Going from level n to level n+1 costs **n pépins**, so reaching level L takes L(L−1)/2 pépins in total. Level 50 = 1,225 pépins.

### Rule 3 — Fibonacci multipliers and titles
| Levels | Multiplier | Title | Approx. spend to reach |
|---|---|---|---|
| 1–4 | ×1 | Graine | — |
| 5–7 | ×1 | Pousse | ~400 TND |
| 8–12 | ×1 | Raquette | ~1,100 TND |
| 13–20 | ×2 | Fleur | ~3,100 TND |
| 21–33 | ×3 | Figue | ~5,800 TND |
| 34–49 | ×5 | Figuier | ~10,400 TND |
| 50 | ×5 | Légende — Le Figuier d'Or | ~15,800 TND |

### Perks (prime levels + Fibonacci/golden ✦; permanent once unlocked)
| Level | Perk |
|---|---|
| 2✦ | Welcome sample |
| 3✦ | Sample |
| 5✦ | 10 ml prickly pear oil as a gift |
| 7 | Birthday month −20% |
| 11 | Free gift-wrapping |
| 13✦ | Points ×2 (Fleur) |
| 17 | Card restarts at 1 |
| 19 | Double tampons on birthday |
| 23 | Card restarts at 2 |
| 29 | Free delivery on kinzoils.com |
| 31 | Vote on the next product |
| 34✦ | One of every new product delivered free before launch (address collected on reaching this level) |
| 37 | Gift card for a friend |
| 41 | Free gift box every year |
| 43 | Workshop visit / meeting the founders |
| 47 | Permanent −10% |
| 50 | Mur des Légendes in the shop + a limited-edition product made with the customer |

Automatic in the app: multipliers, card restart, birthday double tampons. Every other perk is shown on the card and fulfilled by staff by hand; staff tick it as given, and that is logged.

## Technical design
- **Stack:** Next.js (App Router, TypeScript) on Vercel, Postgres (Neon via the Vercel Marketplace), a PWA manifest, a QR scanner (`BarcodeDetector` with an `html5-qrcode` fallback), and a QR generator library. Free tiers throughout.
- **Customer-facing text in French.**

### Pages
| Route | Who | What |
|---|---|---|
| `/rejoindre` | customer (via QR code at the till) | First name, phone (unique), optional birthday → creates the customer and redirects to the card link |
| `/c/[token]` | customer | Personal QR code; stamp track 0–13 with stops; level, title and multiplier; pépins progress to next level; unlocked and next perks; address form once level 34 is reached |
| `/staff` | staff (PIN) | Scan or search by phone → customer panel → type receipt total → Tamponner; available stops → Utiliser; tick manual perks |
| `/admin` | owner PIN | Staff CRUD, event log, level 34+ list with addresses, CSV export |

### Data
- `customers`: id, token (128-bit random, unique), first_name, phone (unique), birthday, address, card_stamps, lifetime_pepins, created_at.
- `events`: id, customer_id, type (`stamp` | `redeem` | `bonus` | `perk_given`), amount_tnd, stamps_delta, pepins_delta, detail, staff_id, created_at, business_date (Africa/Tunis). A **unique partial index on (customer_id, business_date) where type='stamp'** enforces once per day in the database.
- `staff`: id, name, pin_hash, role (`staff` | `owner`).
- The level is never stored; it is always derived from lifetime_pepins.

### Code units
- `lib/rules.ts`: pure functions, no I/O, the single source of truth:
  - `stampsFor(amount)`
  - `pepinsFor(amount, level)`
  - `levelFromPepins(p)`
  - `multiplier(level)`
  - `title(level)`
  - `cardStops`
  - `availableStops(cardStamps)`
  - `resetValue(level)`
  - `perksUnlocked(level)`
  - `nextPerk(level)`
- `lib/db.ts`: queries. Stamp and redeem each run in a single transaction.
- `lib/auth.ts`: PIN check (bcrypt), signed httpOnly session cookie, rate limit of 5 failed attempts then a 10-minute lockout.
- API route handlers: `POST /api/customers`, `POST /api/stamp`, `POST /api/redeem`, `POST /api/perk`, `GET /api/customer/[token]`, `GET /api/staff/search?phone=`.

### Errors
- The server returns plain French messages: "Déjà tamponné aujourd'hui", "Montant < 40 TND", "Carte pleine — utilisez la récompense", "Palier non atteint".

## Verification
1. `npm test`: unit tests on `rules.ts` covering thresholds, the level formula (level 50 = 1,225 pépins), multiplier switches at 13/21/34, card cap at 13, resets at levels 17/23, and bonus pépins at stops 11/13.
2. Integration test against a local or dev Postgres: two stamps on the same day → the second is rejected; redeem resets the card; pépins accumulate.
3. Manual check with `npm run dev` exposed to the LAN (or a Vercel preview) and two phones: join as a customer, scan as staff, stamp, get refused on a second stamp, redeem stop 3, check the card updates.
