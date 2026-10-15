# Loyalty reward setup done in Shopify (2026-10-15)

- Segment « Carte fidélité complète »: gid://shopify/Segment/582537150629, query `metafields.kinz.tampons = 3`
- Tag `carte-30` added to 31 single products (no packs, coffrets, duos, trios, rituel).
- Automated collection « Carte fidélité – éligibles » (handle carte-fidelite-eligibles): gid://shopify/Collection/491560173733
  Rules (all): tag = carte-30 AND IS_PRICE_REDUCED is not set (compare-at empty). The API refuses VARIANT_COMPARE_AT_PRICE IS_NOT_SET; IS_PRICE_REDUCED IS_NOT_SET is the working equivalent.
  27 products in it today. Left out by the promo rule: creme-hydratante-visage-anti-age-50gr, creme-mains-10-uree..., huile-de-cresson (compare-at = price), huile-de-sesame (compare-at < price).
- kinz.tampons validation: max 6 -> 3 (only one customer had a value, 0).
- Not tagged yet, owner to decide: 3 « Trousse ... Signée Kinz », savon exfoliant, miel.
- Defaults used: code valid 180 days, combines with free delivery.
- Note: kinz.tampons customerAccount access is READ today (threat model said NONE). Still no write access from customer APIs.
