# RentGuy multi-tenant subdomein roll-out

Deze notitie beschrijft hoe we het platform uitrollen over meerdere subdomeinen, hoe de branding kan wisselen per klant en welke acties nog openstaan voor de MR-DJ implementatie.

## 1. Domeinarchitectuur

| Domein | Doel | Beschrijving |
| --- | --- | --- |
| `www.rentguy.nl` | Marketing/demo | Toont de publieke marketing- en demo-ervaring met hero, value props, pricing en contact. |
| `mr-dj.rentguy.nl` | Productie tenant | Draait het huidige MR-DJ control center met focus op secrets-onboarding via `/dashboard`. |
| `<tenant>.rentguy.nl` | Template voor nieuwe klanten | Elke nieuwe klant krijgt een eigen subdomein met tenantconfiguratie en branding-theming. |

### DNS & certificaten
- Gebruik wildcard certificaat `*.rentguy.nl` of per-tenant certificaten via Let’s Encrypt.
- Richt CNAME-records naar de front-end hosting (bijv. Vercel/Netlify of eigen Nginx).
- **Openstaande actie:** huidige customer-facing domein `www.mr-dj.nl` verwijst nog naar `staging.sevensa.nl`. Na productie-validatie DNS bijwerken naar `mr-dj.rentguy.nl` of directe CNAME naar productiediensten.

## 2. Tenantconfiguratie in de codebase

| Configuratie | Implementatie | Notities |
| --- | --- | --- |
| Router `basename` | Bepaald door `resolveExperienceConfig` zodat `/dashboard` en `/login` paden consistent blijven. | Subdomeinen krijgen standaard `/planner`; MR-DJ forceert `/dashboard` voor secrets-onboarding. |
| Document title & branding | `describeTenantDisplayName` zorgt voor juiste titel zonder extra codewijzigingen. | Laat ruimte om in de toekomst brand-kleuren via CMS te laden. |
| Marketingervaring | `MarketingLandingPage` wordt gerenderd voor `www.rentguy.nl`. | Minimaliseert afhankelijkheid van de authenticated app. |

## 3. Onboarding-flow per subdomein

1. **Provisioning** – Maak tenant entry aan, zet subdomein op met standaard theming en activeer secrets vault.
2. **Credentials upload** – Gebruik `/dashboard` (Secrets) als startpunt. MR-DJ krijgt directe CTA’s in login en nav-rail.
3. **Journey activatie** – Persona dashboards en journeys volgen direct na secrets upload.
4. **Go-live validatie** – Draai regression tests, check monitoring dashboards en markeer checklist.

## 4. Branding & theming uitbreiden

- Definieer per tenant een JSON/YAML-config met kleuren, logo’s en tone-of-voice.
- Laad config vroegtijdig (voor React-render) en koppel aan `useBrandingChrome`.
- Ondersteun overrides voor typografie en illustraties voor tenants zoals `sevensa.rentguy.nl`.

## 5. Automatisering voor nieuwe tenants

1. CLI-commando `pnpm run tenant:init -- --tenant <naam>` (te bouwen) dat:
   - DNS-record placeholders aanmaakt (Terraform of Pulumi stack).
   - Een branding-config template kopieert.
   - Secrets vault bootstrap scripts draait.
2. CI-pijplijn update: automatische preview-build per tenantbranch met QA-checks.
3. Documenteer per-tenant SLA en support schema in `docs/tenant_playbooks/<tenant>.md`.

## 6. Checklist voor nieuwe klant (voorbeeld `sevensa.rentguy.nl`)

- [ ] Subdomein aangemaakt en SSL actief.
- [ ] Branding-config ingevuld (kleuren, logo, fonts).
- [ ] Secrets dashboard template ingevuld (API keys, opslag, boekhouding).
- [ ] Persona journeys gevalideerd door operations & finance.
- [ ] Monitoring dashboards gekoppeld (Uptime, error reporting, billing alerts).
- [ ] Go-live review gepland met customer success.

> **Tip:** hergebruik de MR-DJ setup scripts als referentie voor volgorde en security-hardening.

## 7. Design & styling blueprint voor nieuwe tenants

1. **Brand intake** – verzamel logo’s, kleuren, tone-of-voice en gewenste UX-accenten via een gestandaardiseerd intakeformulier.
2. **Design tokens genereren** – gebruik `branding.ts` als basis en genereer per tenant een token-bestand (`configs/tenants/<tenant>.json`). Zet daarin primaire/secondary kleuren, gradients, button-styling en iconografische voorkeuren.
3. **Layout overrides** – koppel tokens aan `FlowExperienceShell`, nav-rail en marketingcomponenten via een theming hook zodat hero’s, CTA’s en achtergrondgradients per tenant verschillen zonder code duplicatie.
4. **Component library sync** – documenteer afwijkende componenten (bijv. custom hero, aangepaste CTA-knoppen) in `docs/tenant_playbooks/<tenant>_design.md` inclusief screenshots en QA-checks.
5. **Regression check** – draai visuele regressietests (Loki/Playwright) op de tenantbranch om design-kwaliteit (perfect pixel) te waarborgen voordat het subdomein live gaat.
6. **Roll-back plan** – voorzie een fallback naar de standaard Sevensa-styling wanneer tokens ontbreken of inconsistent zijn zodat onboarding nooit blokkeert.

## 8. Communicatieplan

- Marketing-site verwijst naar demo op `mr-dj.rentguy.nl` om prospects een echte tenant te tonen.
- Customer onboarding krijgt dedicated e-mails met directe links naar `/dashboard` voor secrets upload.
- Interne notities over domeinwijzigingen bijhouden in `docs/domain_change_log.md` (nog aan te maken) met datum, eigenaar en DNS-wijziging.

