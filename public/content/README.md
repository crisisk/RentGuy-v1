# RentGuy CMS Content

Dit is de content folder voor het Decap CMS systeem.

## Structuur

```
content/
├── tenants/         # Tenant-specifieke configuratie
│   ├── sevensa.yml  # Sevensa tenant content
│   └── mrdj.yml     # Mr. DJ tenant content
└── pages/           # Custom pagina's (optioneel)
```

## Content Bewerken

### Via CMS Admin Interface (Aanbevolen)

1. Ga naar `https://jouw-domein.nl/admin`
2. Login (eerste keer: setup nodig)
3. Bewerk content via de visuele interface

### Direct Bewerken (Voor Developers)

Je kunt de `.yml` bestanden ook direct bewerken:

**Sevensa Content** (`tenants/sevensa.yml`):
```yaml
tenantId: sevensa
name: Sevensa
domain: sevensa.rentguy.nl
primaryColor: '#2563EB'

hero:
  title: Je Hero Titel
  subtitle: Je Hero Subtitel
  loginWelcome: Welkom tekst

demoAccounts:
  account1: email@example.com
  account2: admin@example.com
  password: wachtwoord
```

## Content Toevoegen

### Nieuwe Tenant Content Veld

1. Bewerk `/public/admin/config.yml`
2. Voeg veld toe aan `collections.tenants.fields`
3. Update `/src/services/contentLoader.ts` interface
4. Update `/src/config/tenants.ts` merge functie

### Nieuwe Pagina

1. Ga naar CMS Admin → Pagina's → Nieuwe Pagina
2. Selecteer tenant (of "all" voor alle tenants)
3. Vul titel, slug en inhoud in
4. Publiceer

## Git Workflow (Production)

Voor productie met Git backend:

1. Content wijzigingen maken in CMS
2. CMS maakt automatisch Git commit
3. Review via Editorial Workflow
4. Publish → automatisch naar main branch
5. Deploy pipeline pikt wijzigingen op

## Local Development

Voor local testing kun je `local_backend` enablen in `config.yml`:

```yaml
backend:
  name: git-gateway
local_backend: true  # Uncomment deze regel
```

Dan `npx decap-server` draaien in een aparte terminal.

## Troubleshooting

**CMS Admin geeft 404**
- Check of `/public/admin/` bestanden correct zijn gebuild
- Verify dat Nginx routing `/admin` correct serveert

**Content wordt niet geladen**
- Check browser console voor fetch errors
- Verify dat `/content/tenants/*.yml` bestanden bestaan
- Check CORS headers als je API gebruikt

**Git backend werkt niet**
- Setup Git Gateway in je Git provider
- Configure OAuth voor authentication
- Check `backend.name` in `config.yml`
