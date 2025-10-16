# Helpcenter Publicatie: RentGuy Enterprise Release Notes & FAQ

## Samenvatting
- **Publicatiedatum:** 17 maart 2025
- **Kanalen:** Helpcenter (NL/EN), in-app notificatie, e-mail naar bestaande klanten
- **Versie:** RentGuy Enterprise v1.0 GO-live

## Belangrijkste Wijzigingen
1. Gevalideerd rollback-proces met checksumcontrole en audit logging.
2. Herwerkte prijs- en beschikbaarheidslogica inclusief duidelijke 409-fouten.
3. Opgeloste iOS uploadflow met automatische HEIC→JPEG conversie.
4. Uitgebreide API/webhook documentatie en rapportage-optimalisaties.

## FAQ Updates
| Vraag | Antwoord | Kanaal |
|---|---|---|
| Hoe werkt de nieuwe rollback-optie? | Rollback scripts zijn beschikbaar via het beheerportaal en herstellen binnen <5 min. | Helpcenter artikel + in-app tooltip |
| Wat verandert er in de prijslogica? | Kortingen worden per dag berekend, conflicten geven een 409 melding met voorraaddetail. | Release notes, FAQ |
| Ondersteunt de mobiele app HEIC-foto's? | Ja, uploads converteren automatisch naar JPEG en worden direct zichtbaar. | FAQ, onboarding e-mail |

## Publicatiechecklist
- [x] Content review door Product Marketing
- [x] Technische validatie door Engineering
- [x] Vertalingen (EN) gecontroleerd door Localization
- [x] Helpcenter artikel live gezet met permalinks
- [x] Support-team geïnformeerd via interne nieuwsbrief

## Bijlagen
- Screenshots van helpcenter-artikel (`artifacts/helpcenter_release_notes_2025-03-17.png`)
- E-mail template voor bestaande klanten (`artifacts/email_template_release_2025-03-17.html`)
