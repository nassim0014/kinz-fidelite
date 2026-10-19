# Prompt for Cowork (store PC, later)

Paste this into Cowork on the store PC, with the kinz-fidelite folder (Documents\kinz-fidelite) connected and Chrome open on the Shopify admin.

This file is on GitHub (public repo, no login needed): https://github.com/nassim0014/kinz-fidelite/blob/main/shopify/notes/2026-10-15-prompt-cowork-pc-magasin.md. Until this file reaches main, replace `main` with `chore/prompts-flows-carte-fidelite` in that link.

```text
Context: I am Nassim Kefi, owner of the KINZ shop (Shopify store "kinznature"). This is the STORE PC (Windows), where the kinz-fidelite app runs in Docker (see docs\magasin.md). On 2026-10-15 I updated three Shopify Flows for the loyalty card from my personal PC, and their exports were merged into main of https://github.com/nassim0014/kinz-fidelite with PR #11 "Exports des Flows carte fidélité (2026-10-15)" (the repo is public, no GitHub login needed to read it). The Flows live in Shopify, not on this PC: nothing in the running app needs to change today.

Ask me before every Save / Activate / Delete click, before any git command that changes files, and before restarting the app. Never place, edit, cancel or refund an order, never change products, customers, discounts, segments or settings, never type a password or code into a login screen, and do not test with a real order. If something does not match these instructions, stop and describe what you see.

STEP 1. Read only. In Shopify admin > Applications > Flow, check that these 3 Flows are "Actif" and open "Exécutions récentes" for each:
- "Carte fidélité : tampon commande en ligne" (Order paid)
- "Carte fidélité : remise utilisée" (Order created)
- "Carte fidélité : commande annulée" (Order cancelled)
Also list every other Flow whose name contains "fidélité" or "tampon", with its status: an old copy left "Actif" would give 2 stamps per order.
Report, for each, the runs since 2026-10-15 13:00 (Tunis time) with their status, and read me any error word for word. If a run created a KINZ30- discount code, give me the order number and the code, nothing else.

STEP 2. Repo on this PC. Do not run git yourself: I run it in PowerShell, as docs\magasin.md does. Give me these commands and read the output I paste back:
  cd $HOME\Documents\kinz-fidelite
  git status
  git branch --show-current
- If the branch is main and git status says "nothing to commit, working tree clean": ask me, then give me `git pull --ff-only` to run, and check with `dir shopify\flows` that it contains tampon-commande.flow, remise-utilisee.flow, commande-annulee.flow and README.md.
- In any other case (another branch, local changes, an error from git pull): stop step 2 and tell me exactly what you see.
Do not run store\demarrer.ps1: these are docs only, no restart needed.

STEP 3. Pending decisions from the 2026-10-15 setup notes (shopify\notes\2026-10-15-setup-shopify.md). Only list them and ask me what to do; change nothing:
- Not tagged carte-30 yet: the 3 "Trousse ... Signée Kinz" products, the savon exfoliant, the miel. Should they be eligible for the -30 % code?
- 4 single products are tagged carte-30 but left out of the collection "Carte fidélité – éligibles" because they have a compare-at price (promo rule): creme-hydratante-visage-anti-age-50gr, the product whose handle starts with creme-mains-10-uree, huile-de-cresson (compare-at = price) and huile-de-sesame (compare-at lower than the price). For the last 2 the compare-at price is not a real promo. Show me the price and compare-at price of the 4; should they stay excluded?
- Paper-card customers: in Clients, filter with metafields.kinz.tampons >= 0 (do not save it as a segment; if the editor refuses this filter, tell me what it offers instead). For each customer found, give me the name, kinz.tampons and kinz.support (customer page > Champs méta). Every customer who still uses the paper card should have kinz.support = "papier": tell me who does not, and do not edit anyone.

STEP 4. Short summary in plain English: Flows status (and any duplicate Flow), errors seen (word for word), repo state, and my open decisions.
```
