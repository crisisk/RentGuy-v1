# Internationalisation Roadmap

## Vision
Deliver a multi-language RentGuy experience starting with Dutch and English, expanding to German and French for EU growth.

## Scope & Priorities
1. **Foundational Audit (Week 1):** Inventory static copy, dynamic notifications, and PDF exports for localisation gaps.
2. **Technical Enablement (Weeks 2-4):**
   - Adopt `react-i18next` for the frontend with code-splitting per locale.
   - Externalise FastAPI response strings and email templates using gettext catalogs.
3. **Content Pipeline (Weeks 5-6):**
   - Integrate with Lokalise for translation management.
   - Establish glossary and tone of voice guidelines with marketing.
4. **Pilot Locales (Weeks 7-9):**
   - Release English UI alongside Dutch baseline.
   - Provide German preview to selected partners.
5. **Full Rollout (Weeks 10-12):**
   - Launch French locale.
   - Enable locale selection in user profile and onboarding flows.

## Technical Tasks
- Refactor UI components to replace hard-coded strings with translation keys (`t('navigation.projects')`).
- Provide locale-aware formatting utilities for currency (EUR/GBP/USD) and dates.
- Extend backend to accept `Accept-Language` headers and respond with the appropriate locale.

## Operational Considerations
- Maintain translation completeness CI check to prevent missing keys during releases.
- Document fallback rules: default to Dutch (`nl-NL`) if translation missing.
- Coordinate quarterly translation review cycles with marketing and customer success teams.

## Success Metrics
- 100% translation coverage for supported locales at release time.
- <1% localisation-related support tickets within first quarter post-launch.
- Increase international trial conversions by 25% after multilingual rollout.
