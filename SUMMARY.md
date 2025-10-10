# PSRA-LTSD Onboarding & UX Audit Summary

## Persona Onboarding Friction Overview
| Persona | Friction (0-5) | Estimated Time-to-Value | Top Blockers | Top Fixes |
| --- | --- | --- | --- | --- |
| CFO / Finance Admin | 4 | 3-4 dagen | Geen finance-specifieke stappen of dashboards ondanks checklist claim; data afhankelijk van externe API die vaak terugvalt op defaults.【F:OnboardingOverlay.jsx†L6-L173】 | Introduceer finance-stap met cashflow/KPI feed en stub-data zodat CFO direct inzicht krijgt.【F:OnboardingOverlay.jsx†L413-L436】 |
| Compliance / PSRA Manager | 5 | Geblokkeerd | Geen onboarding-stap of preset voor compliance/PSRA-rollen; Planner-presets dekken andere fictieve persona’s.【F:Planner.jsx†L5-L101】 | Voeg PSRA preset en policy-check workflow toe inclusief document upload en audit trail stub.【F:Planner.jsx†L185-L200】 |
| Analyst / Operator | 3 | 1-2 dagen | Dataset-import stap ontbreekt; overlay toont generieke tekst zonder dataprogressie of filters.【F:OnboardingOverlay.jsx†L6-L173】 | Maak datasets-import CTA met statusmapping + skeleton states in checklist.【F:OnboardingOverlay.jsx†L245-L374】 |
| System Admin | 4 | 2-3 dagen | Geen rolbeheer, SSO/Keycloak-config of health checks in onboarding; API-base URL hardcoded naar prod, geen env toggles.【F:api.js†L1-L43】 | Introduceer systeemadmin-stap en .env configuratie voor veilige endpoint selectie.【F:api.js†L10-L43】 |
| Sales / BD | 4 | 3 dagen | Geen pipeline/lead data; planner presets niet afgestemd op sales; onboarding tips missen conversiegerichte acties.【F:onboarding_tips.json†L1-L32】 | Voeg sales-module stap + tip met CRM-import en demodashboard toe.【F:onboarding_tips.json†L1-L18】 |
| Support Agent | 4 | 3 dagen | Geen support-workflows, SLA-tracking of kennisbanklinks; overlay fallback verbergt eventuele errors.【F:OnboardingOverlay.jsx†L149-L214】 | Maak support-specific step met link naar ticketqueue en open API response errors in UI.【F:OnboardingOverlay.jsx†L213-L237】 |
| External Supplier / Partner | 5 | Geblokkeerd | Geen uitnodigingsflow of gastlogin; planner data vereist interne tokens.【F:App.jsx†L78-L131】【F:api.js†L10-L43】 | Voeg partner-invite stap + beperkte scope token generaties toe.【F:Login.jsx†L12-L33】 |
| Client / End-Customer | 5 | Geblokkeerd | Geen self-service portal of read-only dashboards; onboarding overlay nooit bereikt zonder intern token.【F:App.jsx†L27-L131】 | Bied client-view preset + sharebare dashboard en e-mail verificatie.【F:App.jsx†L78-L116】 |
| Developer / DevOps | 3 | 1 dag | Geen infrastructuur seeds; fallback data verbergt API-fouten; ontbrekende logging/hook voor step errors.【F:OnboardingOverlay.jsx†L149-L237】 | Voeg dev preset + log surface (toast/console) en seed scripts per module.【F:OnboardingOverlay.jsx†L297-L361】 |
| Auditor | 5 | Geblokkeerd | Geen audit-trail, export of evidence stap; planner mist compliance filters; login vereist demo-accounts zonder MFA.【F:Login.jsx†L6-L37】【F:Planner.jsx†L5-L200】 | Introduceer audit step met downloadbare logs en keycloak-scope instructies.【F:OnboardingOverlay.jsx†L6-L47】 |

## Top 10 Product Fixes (Priority)
1. **Parameteriseer API base URL + environment-safe auth handling** – vervangt hardcoded SaaS endpoint, voorkomt dat testomgevingen productie aanraken (security & availability).【F:api.js†L10-L43】
2. **Persona-aligned onboarding steps** – vervang generieke fallbacklijst door persona/rol-gestuurde taken met dataset/role binding voor snelle waarde.【F:OnboardingOverlay.jsx†L6-L173】
3. **Expose onboarding API errors in UI met retry/backoff** – nu gecachte fallback maskeert storingen, gebruikers denken ten onrechte dat data live staat.【F:OnboardingOverlay.jsx†L149-L214】
4. **Add dataset import/upload step** – North Star (eerste waarde) vereist data, maar ontbreekt volledig in flow.【F:OnboardingOverlay.jsx†L6-L47】
5. **Introduce role & permissions management UI** – login accepteert alleen hardcoded demo users; geen uitnodiging of rol mapping.【F:Login.jsx†L6-L37】
6. **Dashboard preset realignment** – vervang fictieve namen door echte B2B personas; voeg KPI definities per rol.【F:Planner.jsx†L5-L101】
7. **Empty/error state for Planner feed** – geen handling wanneer API geen events terugstuurt.【F:Planner.jsx†L1-L200】
8. **Accessibility improvements** – buttons en overlays missen focus states/ARIA live regions, toetsenbordnavigatie zwaar.【F:OnboardingOverlay.jsx†L245-L374】
9. **Token storage hardening** – localStorage gebruikt zonder expiratie/refresh logica; verhoogd risico op token leakage.【F:api.js†L14-L43】
10. **Audit/export tooling** – geen logging/audit downloads voor compliance & auditors.【F:OnboardingOverlay.jsx†L6-L47】

