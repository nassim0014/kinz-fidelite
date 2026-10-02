---
name: kinz-langues
description: Use when writing, translating or reviewing KINZ customer-facing text (loyalty card, sign-up page, WhatsApp messages) in French, Tunisian Arabizi (tn), English or Modern Standard Arabic (ar), including src/lib/copy/*.ts.
---

# KINZ languages

## Overview

KINZ is a prickly-pear and fig oil boutique in Tunis. Its customer screens speak four languages. Each string has one fixed shape per language, and every non-French string stays "à relire" until Nassim approves it.

## Output contract, per language

| Code | Script | Address | Shape |
|---|---|---|---|
| `fr` | Latin | vous, warm | Reference text. Never change its meaning when translating. |
| `tn` | **Arabizi**: Latin letters + digits | tu (inti) | Tunis derja as typed on WhatsApp, French loanwords kept in French spelling. |
| `en` | Latin | you, warm, plain | Short sentences, no idioms. |
| `ar` | Arabic | أنتم/أنت, simple | Modern Standard Arabic, friendly, never administrative. |

Arabizi digits for `tn`: 3 = ع, 7 = ح, 9 = ق, 5 = خ, 8 = غ, 2 = ء. Example: "3aslema Salma, ba9i tampon wa7ed bech te5ou −20 % 3la produit."

## Locked terms (same in every language unless the table says otherwise)

| Term | fr | tn | en | ar |
|---|---|---|---|---|
| Brand | KINZ | KINZ | KINZ | KINZ |
| Stamp | tampon(s) | tampon(s) | stamp(s) | طابع / طوابع |
| Points | pépins | pépins | seeds (pépins) | بذور |
| Card | carte | carte | card | بطاقة |
| Money | 40 TND | 40 TND | 40 TND | 40 TND |
| Discount | −20 % | −20 % | −20% | −20% |

Level names come from `src/lib/copy/<code>.ts` `titles`; reuse them, never invent new ones.

"Pépins" are loyalty points (fruit seeds), never the oil, never the fruit.

## Every string keeps

- Placeholders and values exactly: first name, numbers, URLs, `${…}` expressions.
- Western digits (13, 40), also in `ar`.
- The marker comment `// À relire par Nassim avant mise en ligne.` at the top of `tn.ts`, `en.ts`, `ar.ts`.

## Writing `tn`

**REQUIRED SUB-SKILL:** load `lahja` (Maghrebi guide, Tunisian column) for grammar: negation `ma…ch`, future `bech`, "now" `tawa`, "a lot" `barcha`, "there is" `famma`. Ask it for Arabizi output explicitly; its default is Arabic script.

Known limits: `lahja`'s `check_output.py` reads Arabic script only, so check Arabizi by eye; `lahja` does not cover `ar` (MSA).

## Common mistakes

| Mistake | Fix |
|---|---|
| `tn` written in Arabic script | Rewrite in Arabizi. |
| "pépins" translated as oil, fruit or زيت | Use the locked term. |
| Levantine or MSA forms in `tn` (صار، سوف، عيد ميلاد سعيد) | Tunisian forms: `walla`, `bech`, `3id miled mabrouk`. |
| Persian letters (پ، ڤ) or French accents dropped in loanwords | Keep the French spelling: produit, carte, tampon. |
| `q`, `kh`, `gh`, `'` for ق خ غ ء in `tn` (waqt, khir) | Digits, every time: wa9t, 5ir, 8ali, so2al. |
| Em dash (U+2014) | Comma or colon. |
