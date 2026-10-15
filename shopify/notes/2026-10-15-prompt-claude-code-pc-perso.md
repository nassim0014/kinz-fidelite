# Prompt for Claude Code (personal PC, today)

Paste everything inside the block into Claude Code, started in the folder that contains your `kinz-fidelite` clone (or its parent).

```text
Context: I am Nassim Kefi, owner of the KINZ shop (Shopify store "kinznature"). This is my PERSONAL PC, not the store PC. Today (2026-10-15) I updated three Shopify Flows for the loyalty card and exported them from Shopify to my Downloads folder. My app repo is github.com/nassim0014/kinz-fidelite (private). Work only on my files; never touch Shopify, never push to main.

Rules for anything written in the repo (code, docs, commit messages, PR text):
- No em dashes anywhere.
- Commits and PR are authored by me (Nassim Kefi). Do not mention Claude or Claude Code, no Co-Authored-By line.
- Repo docs are in French; keep that.

STEP 1. Find the local clone of kinz-fidelite on this PC (look in the current folder, ~/Documents, ~/Desktop, ~/Projects, ~/code). If none exists, clone https://github.com/nassim0014/kinz-fidelite.git into ~/Documents. Run `git status` and `git fetch`. If there are uncommitted changes, stop and show them to me.

STEP 2. In Downloads, list the files ending in .flow modified today. I expect 3 (names may differ slightly; Shopify may add "(1)" for duplicates; if there are older duplicates from an earlier export today, keep the most recent one of each):
- "Carte fidélité : tampon commande en ligne"  -> rename to tampon-commande.flow
- "Carte fidélité : remise utilisée"           -> rename to remise-utilisee.flow
- "Carte fidélité : commande annulée"          -> rename to commande-annulee.flow
Open each one (it is JSON or text) to confirm which Flow it is from its content (trigger: order paid / order created / order cancelled) before renaming. Show me the mapping and wait for my OK.
Also look in Downloads for "setup-done-2026-10-15.md" and "cowork-prompt-flows-ready.md"; if present, include them in step 3.

STEP 3. From an up-to-date main, create branch chore/flows-carte-fidelite. Then:
- Copy (not move yet) the 3 renamed files into shopify/flows/ in the repo.
- Copy the two .md notes, if found, into shopify/notes/ (rename them 2026-10-15-setup-shopify.md and 2026-10-15-prompt-flows.md). Before committing, read them and replace any em dash with a colon or comma.
- Create shopify/flows/README.md with the French content below (copy it exactly).
- In AGENTS.md (CLAUDE.md just imports it), add a short section "Shopify Flow (carte de fidélité)" that points to shopify/flows/README.md and lists the 4 "Constats plateforme" from that README, so a later session does not rely on stale assumptions.
Show me `git diff --stat` and wait for my OK, then commit with message:
  "docs(shopify): exports des Flows carte fidélité du 2026-10-15"
Push the branch and open a PR to main titled "Exports des Flows carte fidélité (2026-10-15)", body = 3 lines summarizing the 3 Flows. Do not merge.

STEP 4. Organize Downloads: once the commit is pushed and I confirmed, move the original .flow files and the two .md notes from Downloads into ~/Documents/KINZ/shopify-flows/2026-10-15/ (create it; use move without overwrite). Do not delete anything. Show me the final tree of that folder and of shopify/ in the repo.

--- shopify/flows/README.md (content to copy) ---
# Shopify Flow : carte de fidélité KINZ

Exports du 2026-10-15, boutique kinznature. Ces fichiers se réimportent dans Shopify : Applications > Flow > Importer.

Règle : 1 tampon par commande en ligne payée d'au moins 100 DT (sous-total après remises, hors livraison). 3 tampons donnent un code personnel de -30 % à usage unique. Métachamps client : kinz.tampons (entier), kinz.support ("papier" = carte papier, ignorée par les Flows), kinz.code_remise (texte).

## tampon-commande.flow : "Carte fidélité : tampon commande en ligne" (actif)
Déclencheur : Order paid.
1. currentSubtotalPriceSet.shopMoney.amount >= 100 ET client existant.
2. support = "papier" : rien.
3. tampons >= 3 : rien.
4. tampons >= 2 (3e tampon) : tampons = 3, puis discountCodeBasicCreate (code KINZ30-<id client>-<numéro commande>, 30 %, segment gid://shopify/Segment/582537150629, collection gid://shopify/Collection/491560173733, valable 180 jours, usage unique, cumulable avec la livraison offerte), puis code_remise = ce code.
5. Sinon : tampons = tampons + 1.

## remise-utilisee.flow : "Carte fidélité : remise utilisée" (actif)
Déclencheur : Order created.
Si au moins un code de réduction commence par "KINZ30-" ET client existant : suppression de code_remise, puis tampons = 0.

## commande-annulee.flow : "Carte fidélité : commande annulée" (actif)
Déclencheur : Order cancelled.
1. Client existant ET subtotalPriceSet.shopMoney.amount >= 100 ET tampons >= 1.
2. Statut financier = PAID OU PARTIALLY_REFUNDED OU REFUNDED (la commande avait été payée, donc avait donné un tampon).
3. support = "papier" : rien.
4. Sinon : tampons = tampons - 1.
subtotalPriceSet est volontaire ici : après annulation, le sous-total "current" peut tomber à 0.

## Constats plateforme (2026-10-15)
- Les conditions Flow n'ont pas d'opérateur "est l'un de" pour les champs à valeurs fixes (ex. displayFinancialStatus) : il faut une condition à part avec plusieurs critères reliés par OU. On ne peut pas mélanger ET et OU dans une même condition.
- Dans un nouveau Flow, les métachamps client (kinz.tampons, kinz.support) ne sont pas disponibles d'office : il faut les ajouter comme variables (order > customer > metafield +), avec les noms kinzTampons et kinzSupport.
- Un test "support n'est pas égal à papier" peut échouer quand le métachamp est vide : on teste donc "support = papier" et on continue sur la branche Faux.
- L'export d'un Flow se télécharge toujours dans le dossier Téléchargements du navigateur ; on ne peut pas choisir le dossier.
```
