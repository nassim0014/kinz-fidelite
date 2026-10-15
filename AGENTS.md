<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Shopify Flow (carte de fidélité)

Les 3 Flows de la carte de fidélité (tampon, remise utilisée, commande annulée) sont exportés dans `shopify/flows/`. Leur logique est décrite dans `shopify/flows/README.md` : le lire avant de toucher aux tampons ou au code KINZ30, plutôt que de supposer ce que font les Flows.

Constats plateforme (2026-10-15), à ne pas redécouvrir :

- Les conditions Flow n'ont pas d'opérateur "est l'un de" pour les champs à valeurs fixes (ex. displayFinancialStatus) : il faut une condition à part avec plusieurs critères reliés par OU. On ne peut pas mélanger ET et OU dans une même condition.
- Dans un nouveau Flow, les métachamps client (kinz.tampons, kinz.support) ne sont pas disponibles d'office : il faut les ajouter comme variables (order > customer > metafield +), avec les noms kinzTampons et kinzSupport.
- Un test "support n'est pas égal à papier" peut échouer quand le métachamp est vide : on teste donc "support = papier" et on continue sur la branche Faux.
- L'export d'un Flow se télécharge toujours dans le dossier Téléchargements du navigateur ; on ne peut pas choisir le dossier.
