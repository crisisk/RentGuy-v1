# Go-Live Beoordeling op basis van UAT-resultaten

## Aanpak
- Beschikbare UAT-documentatie (plan en resultaten) doorgenomen.
- Kritieke en hoge bevindingen geïnventariseerd en de impact op productie beoordeeld.

## Observaties
- Het UAT-plan vereist een minimale succesdrempel van ≥99% passrate en geen openstaande kritieke/hoge issues voordat een go-live kan plaatsvinden.【F:uat_plan_personas.md†L5-L36】
- R1 behaalde slechts 60% (12/20) waardoor go-live werd geblokkeerd; na herstelacties behaalde R2 een 100% passrate (20/20) zonder restissues.【F:uat_results_report.md†L7-L12】
- Alle vier aanbevelingen uit de vorige beoordelingsronde zijn uitgevoerd en met bewijs vastgelegd:
  1. Rollback-proces end-to-end gevalideerd met checksumcontrole.【F:uat_results_report.md†L18-L22】【F:uat_results_report.md†L75-L77】
  2. Prijs- en beschikbaarheidslogica herwerkt met duidelijke 409-foutmeldingen.【F:uat_results_report.md†L19-L22】【F:uat_results_report.md†L33-L35】【F:uat_results_report.md†L42-L44】
  3. iOS-uploadproblemen opgelost via HEIC→JPEG conversie en regressie op iOS 17.【F:uat_results_report.md†L20-L22】【F:uat_results_report.md†L51-L53】
  4. Volledige regressieronde gedocumenteerd inclusief API/webhook updates.【F:uat_results_report.md†L21-L22】【F:uat_results_report.md†L88-L105】
- Medium en lage prioriteit optimalisaties (rapportage, wisselkoersen, herinneringstemplates, documentatie) zijn eveneens bevestigd binnen R2.【F:uat_results_report.md†L22-L22】【F:uat_results_report.md†L32-L36】【F:uat_results_report.md†L67-L69】【F:uat_results_report.md†L83-L92】【F:uat_results_report.md†L104-L105】

## Risicobeoordeling
- **Operationeel:** Rollback is end-to-end getest en valideert checksums; voorraadconflicten leveren nu directe blokkades met duidelijke meldingen.【F:uat_results_report.md†L18-L22】【F:uat_results_report.md†L42-L44】【F:uat_results_report.md†L75-L77】
- **Financieel:** Gecorrigeerde prijslogica en sneller rapportageproces voorkomen foutieve facturatie en versnellen besluitvorming.【F:uat_results_report.md†L19-L22】【F:uat_results_report.md†L33-L36】
- **Gebruikerservaring:** iOS upload werkt stabiel, API/webhook documentatie is volledig en communicatiesjablonen zijn tenant-specifiek configureerbaar.【F:uat_results_report.md†L20-L22】【F:uat_results_report.md†L51-L53】【F:uat_results_report.md†L88-L105】

## Aanbeveling
Alle aanbevelingen uit de vorige beoordelingsronde zijn uitgevoerd. De regressie-artefacten tonen een bewezen ≥99% (100%) passrate zonder kritieke of hoge restissues. Advies: **GO-LIVE GOEDGEKEURD**, mits change-control board de release inplant volgens het standaardproces en monitoring/rollback checklists actief houdt.【F:uat_results_report.md†L6-L22】【F:uat_results_report.md†L104-L109】

## Openstaande acties en verbeterpunten
Hoewel er geen kritieke of hoge issues meer openstaan, blijven onderstaande verbeteracties actief opgevolgd zodat de livegang gefaseerd en gecontroleerd verloopt.

| # | Beschrijving | Prioriteit | Eigenaar | Doel-datum | Status | Opmerking |
|---|---|---|---|---|---|---|
| 1 | Publiceer klantgerichte release notes en FAQ in het helpcenter | Medium | Product Marketing | 17 maart | Concept afgerond; publicatie wacht op vertalingen | Helpt support-volume te reduceren bij uitrol |
| 2 | Monitoring dashboards valideren met NOC-team (SLA checks) | Medium | Operations | 18 maart | Dry-run ingepland met NOC-lead | Dashboards en alerts staan klaar, validatie bevestigt alert-routing |
| 3 | Support-team oefent rollback playbook (tabletop) | Laag | Customer Success | 19 maart | Voorbereiding gedeeld; sessie staat ingepland | Tabletop zorgt voor kennisborging ondanks lage rollback-kans |

## Go-Live Checklist (af te vinken door Release Manager)

- [x] Regressie-UAT ≥99% passrate en nul kritieke/hoge issues.【F:uat_results_report.md†L7-L22】
- [x] Rollback-scripts en backups getest en gevalideerd.【F:uat_results_report.md†L18-L22】【F:uat_results_report.md†L75-L77】
- [x] Prijs- en beschikbaarheidslogica hertest in productie-achtige data set.【F:uat_results_report.md†L19-L22】【F:uat_results_report.md†L42-L44】
- [x] iOS upload regressietesten met bewijs vastgelegd.【F:uat_results_report.md†L20-L22】【F:uat_results_report.md†L51-L53】
- [x] API/webhook documentatie bijgewerkt en gedeeld met partners.【F:uat_results_report.md†L21-L22】【F:uat_results_report.md†L104-L105】
- [ ] Release notes en FAQ gepubliceerd naar klanten *(Product Marketing – 17 maart, afhankelijk van vertalingen)*
- [ ] Monitoring dashboard dry-run met NOC-team afgerond *(Operations – 18 maart, validatieplan klaar)*
- [ ] Support rollback tabletop uitgevoerd en gedocumenteerd *(Customer Success – 19 maart, draaiboek gedeeld)*
