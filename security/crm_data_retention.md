# CRM Data Retention & Security Controls

## Doelen
- Beschermen van klant- en leadgegevens volgens AVG.
- Vastleggen van bewaartermijnen voor automation logs en communicaties.

## Bewaartermijnen
| Dataset | Bewaartermijn | Locatie | Opmerkingen |
|---------|---------------|---------|-------------|
| Leads (`crm_leads`) | 24 maanden na laatste activiteit | PostgreSQL (tenant schema) | Anonimiseer na 12 maanden inactief |
| Deals (`crm_deals`) | 36 maanden | PostgreSQL | Nodig voor revenue-rapportage |
| Activiteiten (`crm_activities`) | 24 maanden | PostgreSQL | Logs voor audit & support |
| Automation runs (`crm_automation_runs`) | 18 maanden | PostgreSQL + S3 export | Dagelijkse export naar S3 bucket met 365 dagen Glacier |
| WhatsApp transcripts | 12 maanden | Encrypted S3 bucket | Vernietig bij opt-out of delete verzoek |
| Email templates | 36 maanden | Git + S3 | Historiek voor audits |

## Toegang & Encryptie
- Database draait met AES-256 at-rest encryptie (AWS RDS).
- Secrets en API keys opgeslagen in Vault namespace `crm/mrdj`.
- TLS 1.2+ enforced voor alle externe integraties (Mollie, WhatsApp Business).

## Verwijderingsproces
1. Support ticket registreren met verwijderingsverzoek.
2. Controleer of open deals/activiteiten aanwezig zijn; indien ja → escalate naar operations.
3. Draai `scripts/purge_lead.py --tenant <tenant> --lead <id>` voor volledige verwijdering.
4. Verwijder gekoppelde bestanden in S3 (whatsapp transcripts, bijlagen).
5. Registreer actie in privacy-register.

## Logging & Monitoring
- Audit logs naar SIEM (`security_events` index) met 400 dagen retentie.
- Alert op ongeautoriseerde exports uit `crm_automation_runs` (>500 records).
- Maandelijkse check door security officer (Sofie) + rapportage in Confluence.
- Kwartaalreview van retention policies tijdens security board met notulen in `security/crm_reviews/`.
