# Prospect Demo & Support Routing

## Doel
De marketing- en demo-ervaring van RentGuy is uitgebreid zodat prospects rechtstreeks vanuit www.rentguy.nl naar een eigen demo-flow kunnen navigeren, met dynamische koppelingen naar het tenant-specifieke helpcenter en de Sevensa statuspagina. Deze notitie documenteert hoe de routing werkt en welke bronnen elke stap aanstuurt.

## Kernonderdelen
- **Dynamische supportconfig** – `src/ui/experienceConfig.ts` berekent per domein:
  - `support.helpCenterBaseUrl` → `https://help.sevensa.nl/<tenantSlug>`
  - `support.statusPageUrl` → `https://status.sevensa.nl` met optionele tenantfilter
  - Helpers `buildHelpCenterUrl` en `resolveSupportConfig` worden overal gebruikt (Login, Planner, Secrets Dashboard, marketingpagina's).
- **Marketing landing** – `src/ui/MarketingLandingPage.tsx`
  - Hero CTA en navigatie linken naar de nieuwe demopagina (`/demo`).
  - Secties "Sales funnel", "Onboarding flow" en "Platform betrouwbaarheid" verwijzen naar de juiste helpcenterartikelen en statuspagina.
  - Contacttegels tonen nu ook Helpcenter en Status links voor snelle opvolging.
- **Demo-ervaring** – `src/ui/MarketingDemoPage.tsx`
  - Introduceert een prospectgerichte walkthrough met persona-journeys, onboarding checklist en bewijsmateriaal.
  - Sectie `id="onboarding"` vervangt de oude link naar `mr-dj.rentguy.nl` en ondersteunt de hero-knop "Bekijk onboarding checklist".
  - Alle bronnen (journey library, runbook, compliance) gebruiken `buildHelpCenterUrl` zodat nieuwe tenants automatisch hun documentatie zien.

## Navigatieflow
1. **Hero CTA** → `/demo`
2. **Demo persona-kaarten** → relevante helpcenterartikelen (`operations-playbook`, `finance-automation`, `journey-library`).
3. **Onboarding CTA** → `/demo#onboarding` + downloads naar `onboarding-checklist` en `compliance`.
4. **Trust & support** → statuspagina + helpcenter zonder de app te verlaten.

## Impact op andere schermen
- `Login.tsx`, `Planner.tsx` en `SecretsDashboard.tsx` lezen dezelfde supportconfig zodat helpcenter- en compliance-links automatisch per tenant wisselen.
- Supportinformatie is gecentraliseerd, waardoor nieuwe tenants alleen een slug hoeven te krijgen; alle UI-links volgen direct.

## Volgende stappen
- Status-API integreren zodra de openbare status-endpoints beschikbaar zijn, zodat realtime status ook als badge in de UI kan verschijnen.
- Journey-metrics (conversies) koppelen aan analytics-store voor datagedreven optimalisaties van de funnel.
