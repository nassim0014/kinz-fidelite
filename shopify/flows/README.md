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
