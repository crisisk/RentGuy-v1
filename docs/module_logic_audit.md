# Module Logic Audit

Deze audit inventariseert backend modules die wel in de codebase aanwezig zijn
maar nog geen uitvoerbare logica hadden doordat ze afhankelijk waren van
niet-bestaande infrastructuur of stubs. De inventaris resulteert in vier
batches zodat de herstelinspanningen gefaseerd kunnen plaatsvinden.

## Inventarisatie

| Module | Probleemomschrijving | Batch | Status |
| --- | --- | --- | --- |
| `app.modules.subrenting` | Router niet geregistreerd; gebruikte niet-bestaande `app.database` en `app.authStore`; modellen werkten met GeoAlchemy en Postgres-specifieke defaults; API-sync asynchroon met aiohttp. | 1 | ✅ Voltooid |
| `app.modules.booking` | Gebruikt `app.core.database` en `authStore` die ontbreken; modellen declareren eigen `declarative_base()` en missen imports (`Index`), waardoor ORM-integratie stukloopt. | 2 | ⏳ Open |
| `app.modules.jobboard` | Verwacht `app.database` en async SQLAlchemy setup die niet bestaat; mix van async/await en ontbrekende afhankelijkheden. | 3 | ⏳ Open |
| `app.modules.scanning` | Verwijst naar `auth.auth_store`, `database.database` en `models.asset/scan_history` die niet bestaan; businesslogica vertrouwt op ontbrekende GeoAlchemy types. | 4 | ⏳ Open |

## Batchstatus

1. **Batch 1 – Subrenting module herstellen** ✅ voltooid in deze wijziging.
2. **Batch 2 – Booking module aligneren met bestaande ORM/dep-injectie.**
3. **Batch 3 – Jobboard module herimplementeren op sync SQLAlchemy stack.**
4. **Batch 4 – Scanning module herschrijven met bestaande inventory/warehouse modellen.**

Elke batch kan nu afzonderlijk ingepland worden zonder verborgen afhankelijkheden.
