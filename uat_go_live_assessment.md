# Go-Live Beoordeling op basis van UAT-resultaten

## Aanpak
- Beschikbare UAT-documentatie (plan en resultaten) doorgenomen.
- Kritieke en hoge bevindingen geïnventariseerd en de impact op productie beoordeeld.

## Observaties
- Het UAT-plan hanteert een minimale succesdrempel van >99% passrate (feitelijk 100%) zonder kritieke fouten.【F:uat_plan_personas.md†L5-L99】
- De actuele UAT-passrate ligt op 60% (12/20), ver beneden de drempel.【F:uat_results_report.md†L9-L21】
- Eén kritieke fout (rollback script corrumpeert tenant database) veroorzaakt direct risico op dataverlies.【F:uat_results_report.md†L55-L64】
- Meerdere hoge prioriteit issues blijven open, waaronder incorrecte multi-day kortingen, onduidelijke foutmeldingen bij overboekingen en falende foto-upload op iOS.【F:uat_results_report.md†L23-L54】【F:uat_results_report.md†L67-L77】
- Aanvullende medium/laag prioriteit problemen beïnvloeden performance, documentatie en internationale functionaliteit.【F:uat_results_report.md†L29-L54】【F:uat_results_report.md†L79-L92】

## Risicobeoordeling
- **Operationeel:** Fout bij rollback vormt een showstopper voor veilige uitrol; overboeking zonder duidelijke waarschuwing kan tot logistieke fouten leiden.
- **Financieel:** Onjuiste multi-day kortingen en trage rapportages zorgen voor incorrecte facturatie en vertraagde besluitvorming.
- **Gebruikerservaring:** Foto-upload fouten en beperkte template-aanpasbaarheid verminderen vertrouwen van eindgebruikers en klanten.

## Aanbeveling
De dienst is **niet go-live klaar** totdat alle kritieke en hoge prioriteit bevindingen zijn opgelost, regressietesten een >99% passrate bevestigen en alle bevindingen zijn hertest met bewijs. Advies:
1. Herstel en valideer het rollback-proces end-to-end.
2. Corrigeer prijs- en beschikbaarheidslogica en voorzie duidelijke foutmeldingen.
3. Los mobiele uploadproblemen op en voer regressietests uit op iOS.
4. Voer een volledige regressieronde uit en documenteer de resultaten voordat een nieuwe go/no-go wordt gepland, en bevestig daarin de >99% passrate en afwezigheid van kritieke/hoge issues.【F:uat_plan_personas.md†L1-L99】【F:uat_results_report.md†L1-L92】
