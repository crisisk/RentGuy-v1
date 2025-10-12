# Billing UAT Script – Stripe & Mollie

## Voorbereiding
- Zorg voor test-API sleutels voor Stripe en Mollie en vul `.env` / omgevingsvariabelen in.
- Start backend (`uvicorn app.main:app --reload`) en frontend (`npm run dev`).
- Seed minimaal één project en inventaris item zodat er een invoice kan worden aangemaakt.

## Positieve scenario’s
1. **Conceptfactuur aanmaken**
   - Ga naar `/api/v1/billing/invoices` (via API of admin UI) en maak een factuur met line-items en BTW van 21%.
   - Verwacht: API response `201`, `total_net`, `total_vat`, `total_gross` correct berekend.

2. **Stripe checkout starten**
   - POST naar `/api/v1/billing/payments/stripe/checkout` met `invoice_id`, `success_url`, `cancel_url`, `customer_email`.
   - Verwacht: response met `checkout_url`. Open URL, doorloop Stripe testbetaling (`4242 4242 4242 4242`).
   - Na redirect: webhook wordt aangesproken, invoice status gaat naar `paid`, `bil_payments.status == "succeeded"`.

3. **Mollie betaling starten**
   - POST naar `/api/v1/billing/payments/mollie/session` met dezelfde velden.
   - Gebruik Mollie testbetaallink, kies “betaal geslaagd”.
   - Verwacht: webhook bevestigt betaling, invoice status = `paid`, payment status = `paid`.

4. **CSV export**
   - GET `/api/v1/billing/export.csv?from_date=2024-04-01&to_date=2024-04-30`.
   - Controleer dat kolommen `total_net`, `total_vat`, `vat_rate`, `reference` gevuld zijn volgens mapping.

## Negatieve scenario’s
1. **Onbekend invoice ID** – start checkout met niet-bestaand `invoice_id` → verwacht HTTP 404.
2. **Stripe signature mismatch** – stuur webhook met ongeldige `Stripe-Signature` → verwacht HTTP 400.
3. **Mollie signature mismatch** – stuur webhook met verkeerde `X-Mollie-Signature` → verwacht HTTP 400.
4. **Geen items & geen overrides** – probeer factuur te creëren zonder line-items én zonder overrides → verwacht totals = 0 en duidelijke melding in UI dat bedragen ontbreken.

## Regressie checks
- `GET /billing/invoices` blijft werken voor bestaande facturen.
- `GET /billing/invoices/{id}/payments` toont alle transacties inclusief status.
- CSV-bestand kan zonder aanpassing worden geïmporteerd in Moneybird/Exact via meegeleverde mapping.
