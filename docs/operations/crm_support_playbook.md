# CRM Support Playbook – Mr. DJ Tenant

Dit playbook beschrijft hoe het operations- en supportteam incidenten,
vragen en wijzigingsverzoeken rondom de CRM- en automation-suite afhandelt.

## 1. RACI

| Activiteit                        | Sales | Operations | Engineering | Support |
|----------------------------------|:-----:|:----------:|:-----------:|:-------:|
| Eerste-lijns ticket triage       |  R   |     A      |     C       |   R     |
| Lead capture issues              |  A   |     R      |     C       |   I     |
| Automation failures              |  I   |     R      |     A       |   C     |
| Dashboard/Metrics incident       |  I   |     A      |     C       |   R     |
| Data correction                  |  C   |     R      |     A       |   I     |
| Security/compliance vragen       |  I   |     C      |     A       |   R     |

Legenda: **R** = Responsible, **A** = Accountable, **C** = Consulted,
**I** = Informed.

## 2. Runbooks

### 2.1 Lead Capture API outage
1. Controleer statuspagina website en API gateway logs.
2. Schakel rate-limit tijdelijk naar "relaxed" profiel via `ops/cron/m365_sync.cron`.
3. Zet fallback formulier (Typeform) live en stuur communicatie naar marketing.
4. Maak retro-ticket in Jira met incidentdetails.

### 2.2 Automation failure-rate > 2%
1. Alert komt binnen via Alertmanager → Slack `#mrdj-ops`.
2. Controleer Grafana dashboard "Automation Throughput" en filter op flow.
3. Bekijk `crm_automation_runs` in Metabase voor recentste errors.
4. Pauzeer specifieke workflow met `automation/workers.py` (stop worker) indien nodig.
5. Indien structureel probleem: log bug in Jira + informeer customer success.

### 2.3 SSO issues (marketing → platform)
1. Raadpleeg `auth/sso_mrdj.md` voor huidige configuratie.
2. Draai smoke test `pytest -m tenant_smoke --tenant=mrdj --case=sso`.
3. Indien token mismatch: reset client secret in Azure AD en update Vault secret.
4. Documenteer wijziging in release notes.

## 3. Escalatiepaden
- **P1 (system down)** – bel direct engineering on-call (telefoonnummer in Opsgenie).
- **P2 (gedeeltelijke uitval)** – open Slack bridge met operations + engineering.
- **P3 (functionele vraag)** – registreer in Freshdesk, reactie binnen 8 werkuren.

## 4. Rapportage
- Wekelijks rapport in Metabase "Automation SLA" delen met Bart + operations.
- Maandelijkse retro: bekijk trends in `crm_automation_runs` en feedback uit UAT.

## 5. Rollback
- Gebruik `automation/tools/clone_templates.py --tenant mrdj --dry-run` om te
  verifiëren welke templates live staan.
- Pauzeer workers via `systemctl stop mrdj-crm-workers`.
- Draai `alembic downgrade 2025_03_01_add_crm_tables` alleen in overleg met DBA.

## 6. Contactgegevens
- **Operations lead:** Bart (bart@mr-dj.nl)
- **Engineering contact:** CRM squad lead (crm-lead@rentguy.nl)
- **Security officer:** Sofie (security@rentguy.nl)
