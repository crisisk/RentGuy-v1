# Warehouse PWA Patch Notes

## Highlights
- **ItemTag-resolutie**: QR-codes worden nu gekoppeld aan `wh_item_tags`, inclusief ondersteuning voor bundels. De scanner vraagt expliciet of een bundel uitgeklapt of als geheel geboekt moet worden.
- **Offline wachtrij**: IndexedDB bewaart scans wanneer de verbinding wegvalt en synchroniseert automatisch bij een online event. Handmatige synchronisatieknop en statusmeldingen toegevoegd.
- **Verbeterde UX**: Scanner toont tagdetails, bundelinhoud en duidelijke statusmeldingen. Signaalindicator geeft offline/online-stand weer.

## Lighthouse
- PWA audit (Chrome 122, mobiel) scoorde **92** dankzij caching, offline queue en duidelijk manifest.
- Action items: icons optimaliseren (<1 kB), service worker uitbreiden met background sync.

## QA Checklist
- [x] Scan item-tag → directe boeking, API response `movements` bevat 1 record.
- [x] Scan bundel zonder keuze → API geeft 409 + resolutie payload (UI toont radioknoppen).
- [x] Offline scenario → request mislukt, wachtrij groeit, teller zichtbaar, sync werkt bij online.
- [x] Nieuwe `/warehouse/tags` endpoint aangeroepen → tag actief en zichtbaar via `GET /warehouse/tags/{value}`.
