# Prompt for Claude Cowork (Claude in Chrome): Kinz loyalty Flows

Ready to paste: segment and collection IDs filled in on 2026-10-15 (segment « Carte fidélité complète » = gid://shopify/Segment/582537150629, collection « Carte fidélité – éligibles » = gid://shopify/Collection/491560173733).

```text
You are helping me (Kinz owner, Shopify store "kinznature") edit 3 Shopify Flows in my admin, in Chrome where I am already logged in. Work only in admin.shopify.com → Applications → Flow. Ask me before every Save / Activate / Delete click and wait for my "yes". Never place, edit, cancel or refund an order, never change products, customers, discounts or settings, and never type any password or code into a login screen. If something on screen does not match these instructions, stop and describe what you see.

Context: loyalty card = 1 stamp per order ≥ 100 DT (after discounts, excl. delivery); 3 stamps = a personal one-time −30 % code. Customer metafields: kinz.tampons (integer), kinz.support ("papier" = paper card, skip), kinz.code_remise (text). In Flow, insert customer fields ONLY with Flow's variable picker (order.customer.kinzTampons.value, order.customer.kinzSupport.value), never type theme Liquid like customer.metafields.

STEP 0: Read first, change nothing. Open « Carte fidélité : tampon commande en ligne » (Flow A) and « Carte fidélité : remise utilisée » (Flow B). Describe each step you see (trigger, every condition with its exact field/operator/value, every action) and whether each Flow is on or off. Export both (⋯ → Exporter) to my Downloads folder as a backup. Wait for my OK.

STEP 1: Flow A (trigger: Order paid). Target logic:
 1. Condition: order.currentSubtotalPriceSet.shopMoney.amount ≥ 100 AND order.customer.id exists.
    (If the condition uses subtotalPriceSet, replace it with currentSubtotalPriceSet: the price after order edits.)
 2. If true → condition order.customer.kinzSupport.value == "papier" → if true: nothing.
 3. Else → condition order.customer.kinzTampons.value ≥ 3 → if true: nothing (branch stays empty).
 4. Else → NEW condition order.customer.kinzTampons.value ≥ 2:
    - If true (this is the 3rd stamp), three actions in this order:
      a. Update customer metafield kinz / tampons (number_integer) = 3
      b. Send Admin API request, mutation discountCodeBasicCreate, with this body:
         {
           "basicCodeDiscount": {
             "title": "Carte fidélité KINZ −30 % {{ order.customer.legacyResourceId }}",
             "code": "KINZ30-{{ order.customer.legacyResourceId }}-{{ order.name | remove: '#' }}",
             "startsAt": "{{ 'now' | date: '%Y-%m-%dT%H:%M:%SZ' }}",
             "endsAt": "{{ 'now' | date: '%s' | plus: 15552000 | date: '%Y-%m-%dT%H:%M:%SZ' }}",
             "context": { "customerSegments": { "add": ["gid://shopify/Segment/582537150629"] } },
             "customerGets": { "value": { "percentage": 0.3 }, "items": { "collections": { "add": ["gid://shopify/Collection/491560173733"] } } },
             "appliesOncePerCustomer": true,
             "usageLimit": 1,
             "combinesWith": { "orderDiscounts": false, "productDiscounts": false, "shippingDiscounts": true }
           }
         }
      c. Update customer metafield kinz / code_remise (single_line_text_field) = KINZ30-{{ order.customer.legacyResourceId }}-{{ order.name | remove: '#' }}
    - Else: Update customer metafield kinz / tampons = {{ order.customer.kinzTampons.value | default: 0 | plus: 1 }} (keep the existing action).
 Show me the whole Flow, then Save and activate the new version only after my "yes". Flow will report errors if the body is invalid: read them to me word for word.

STEP 2: Flow B « Carte fidélité : remise utilisée » (trigger: Order created). Target logic:
 - Condition: at least one item of order.discountCodes has code that starts with "KINZ30-" (use Flow's "any of" list condition), AND order.customer.id exists.
 - If true: Update customer metafield kinz / tampons = 0, then Remove customer metafield kinz / code_remise.
 Change the existing condition/actions to this, show me, then Save and turn the Flow ON after my "yes".

STEP 3: New Flow D « Carte fidélité : commande annulée » (trigger: Order cancelled).
 - Condition (all true): order.customer.id exists; order.subtotalPriceSet.shopMoney.amount ≥ 100; order.displayFinancialStatus is one of PAID, PARTIALLY_REFUNDED, REFUNDED (= the order had been paid, so it earned a stamp); order.customer.kinzSupport.value is not "papier"; order.customer.kinzTampons.value ≥ 1.
   If a field name differs, tell me which fields Flow offers instead of guessing.
 - If true: Update customer metafield kinz / tampons = {{ order.customer.kinzTampons.value | minus: 1 }}
 Show me, then Save and turn ON after my "yes".

STEP 4: Export Flows A, B and D again to Downloads (names: tampon-commande.flow, remise-utilisee.flow, commande-annulee.flow) and give me a short summary: what changed, what is on/off, any error Flow showed. Do not test with a real order.
```
