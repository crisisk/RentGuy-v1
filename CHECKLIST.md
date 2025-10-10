# Release Readiness Checklist

## Persona acceptance
- [ ] CFO: Finance dashboard preset toont cashflow + onboarding stap "Activeer finance insights" ingevuld.
- [ ] Compliance: PSRA preset bevat audit log status en onboarding stap "Upload veiligheidsdossier" kan niet worden overgeslagen.
- [ ] Analyst: Dataset import CTA beschikbaar, refresh toont correcte status.
- [ ] System Admin: `.env` configuratie gedocumenteerd en SSO stap getest.
- [ ] Sales: CRM sync stap zichtbaar, pipeline widgets leveren data of duidelijke lege-state.
- [ ] Support: Ticketing koppeling stap bevat link naar queue en error banner bij API issues.
- [ ] External Partner: Gastinvite flow getest met beperkte datasets.
- [ ] Client: Read-only dashboard en rapportage download beschikbaar.
- [ ] Developer/DevOps: Playwright suite en Lighthouse commando’s draaien groen.
- [ ] Auditor: Audit export knop levert logbestand + MFA vereist voor toegang.

## Quality gates
- [ ] `npm run lint` en `npm run build` slagen lokaal.
- [ ] `npx playwright test tests/e2e/onboarding.spec.ts` succesvol.
- [ ] `npx lhci autorun --config=qa/lighthouse/lighthouserc.json` ≥ drempelwaarden.
- [ ] Axe scan (`npx playwright test --grep accessibility`) geeft geen WCAG 2.2 AA overtredingen.
- [ ] Secrets & environment variabelen gedocumenteerd (`.env.example`).

