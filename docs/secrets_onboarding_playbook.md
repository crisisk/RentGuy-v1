# Secrets Onboarding Playbook

Deze playbook beschrijft hoe administrators secrets uploaden, fouten herstellen en validatiefeedback interpreteren zodat de MR-DJ en toekomstige tenants compliant blijven.

## 1. Voorbereiding
- Verzamel alle SMTP-, MR DJ-, en observability-variabelen in het `secrets_template.xlsx` bestand.
- Controleer of wachtwoorden en tokens minimaal 12 tekens bevatten met een mix van letters en cijfers.
- Noteer welke variabelen een herstart vereisen (label `requiresRestart` in het dashboard).

## 2. Inline validatie
- Velden tonen direct statusfeedback:
  - **Groen kader** – waarde voldoet aan formatregels (port range, URL, e-mail, secretlengte).
  - **Rood kader** – veld mist een vereiste waarde of voldoet niet aan het format. Klik op **Reset invoer** om vanaf nul te beginnen.
- Gebruik de knop **Herstelgids openen** om deze handleiding te raadplegen en meer context per fouttype te lezen.

## 3. Opslaan & synchroniseren
1. Vul een veld in en klik op **Opslaan**. Het dashboard toont tijdstempel en bevestigingsbericht.
2. Klik op **Secrets synchroniseren** om de `.env.secrets` file te schrijven. Bij MR-DJ triggert dit automatisch een sync deep link vanuit de planner.
3. Voer de e-maildiagnose opnieuw uit zodat SMTP-statusen up-to-date blijven.

## 4. Foutafhandeling
- **API-fout**: controleer netwerkverbinding en bevoegdheden. Probeer opnieuw of reset het veld.
- **Formatfout**: valideer het veld tegen het format (bijv. `https://` prefix of numerieke port).
- **Rollback**: raadpleeg `docs/support_rollback_tabletop.md` voor procedures wanneer secrets sync moet worden teruggedraaid.

## 5. Escalaties & SLA
- Gebruik de SLA-matrix op het planner dashboard om escalatiepaden te bevestigen.
- Documenteer elke wijziging inclusief timestamp, gebruiker en impact op services.
- Meld kritieke problemen via NOC hotline of Slack-kanaal volgens de matrix in het dashboard.

## 6. Tenants uitbreiden
- Nieuwe tenants gebruiken hetzelfde proces; branding kan per tenant wisselen volgens de blueprint in `docs/multi_tenant_subdomain_rollout.md`.
- Voeg per tenant een `secrets_<tenant>.md` checklist toe met specifieke variabelen en rotatiebeleid.

Deze playbook wordt samen met de go-live checklist gebruikt om >99% readiness te waarborgen.
