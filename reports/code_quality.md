# Code Quality & Architecture Review

## Architectuur & modulariteit
- **Single-page entry met conditionele root**: `main.jsx` wisselt tussen `App` en `Scanner` via environment flag, maar `src/main.jsx` importeert enkel `../main.jsx`, wat bundling verwart en wijst op dubbele entry-files.【F:main.jsx†L1-L9】【F:src/main.jsx†L1-L1】
- **Onboarding overlay** beheert API-calls en UI in één component, resulterend in grote bestand (>500 regels) zonder scheiding tussen data en presentatie.【F:OnboardingOverlay.jsx†L1-L566】
- **Planner** bevat statische persona presets als JavaScript-object; geen scheiding tussen data en view. Geen testbare services.【F:Planner.jsx†L5-L200】

## Configuratie & 12-Factor
- API-base URL hardcoded; geen `.env` support ondanks Vite stack → schendt configuratie via omgeving.【F:api.js†L10-L19】
- Tokens persistent in `localStorage` met globale axios instance; geen rotation of refresh => verhoogd securityrisico.【F:api.js†L14-L43】
- Geen logging/observability: fouten worden enkel gelogd in console binnen overlay.【F:OnboardingOverlay.jsx†L164-L237】

## Security & privacy
- Demo-credentials hardcoded; geen MFA of rate limiting op login form.【F:Login.jsx†L6-L207】
- `api.js` redirect bij 401 door pagina te reloaden; geen duidelijke sign-out of audit trail.【F:api.js†L31-L43】
- Onboarding fallback gebruikt remote API maar toont zelfde copy bij fout, wat risico op verkeerde assumpties oplevert.【F:OnboardingOverlay.jsx†L149-L173】

## Performance
- Grote inline styles in `Login.jsx`, `OnboardingOverlay.jsx`, `Planner.jsx` beperken re-render performance en caching.【F:Login.jsx†L41-L223】【F:OnboardingOverlay.jsx†L245-L566】
- Geen code-splitting of lazy loading voor zware overlays; overlay mount blokkeert hoofdthread.【F:App.jsx†L118-L131】

## Tests & kwaliteit
- `package.json` bevat geen test scripts; repo heeft geen e2e/unit tests.【F:package.json†L1-L21】
- Geen CI-config (GitHub Actions) in repo zichtbaar; onboarding-critical paden ongetest.

## Aanpak
1. Introduceer environment config (`VITE_API_BASE_URL`) + axios instatie in dedicated service.
2. Splits `OnboardingOverlay` in container + presentational component met state machines voor API status.
3. Bouw rolgestuurde preset-config uit JSON schema + tests.
4. Voeg Playwright + unit tests toe; integreer in CI pipeline.
5. Harden auth (MFA, refresh tokens, rate limit).

