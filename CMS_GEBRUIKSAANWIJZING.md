# Decap CMS - Gebruiksaanwijzing

## ✅ Wat is geïnstalleerd?

Je hebt nu **Decap CMS** (voorheen Netlify CMS) geïnstalleerd op je RentGuy platform. Hiermee kun je eenvoudig de content van je websites aanpassen zonder code te hoeven schrijven.

## 🌐 Toegang tot het CMS

Ga naar het CMS admin panel op **elk van je domeinen** + `/admin`:

- **Sevensa**: https://sevensa.rentguy.nl/admin
- **Mr. DJ**: https://mr-dj.rentguy.nl/admin
- **Algemeen**: https://www.rentguy.nl/admin

## 📝 Content Bewerken

### Via CMS Interface (Aanbevolen)

1. Open https://sevensa.rentguy.nl/admin in je browser
2. Je ziet nu de **Decap CMS** interface
3. Klik op "Tenant Content" om tenant-specifieke content te bewerken
4. Klik op "Pagina's" om custom pagina's aan te maken

### Direct via YAML Bestanden

Als je liever direct de content files bewerkt:

```bash
# Content bestanden zijn hier:
/srv/apps/RentGuy-v1/public/content/tenants/sevensa.yml
/srv/apps/RentGuy-v1/public/content/tenants/mrdj.yml
```

Na het bewerken:
```bash
cd /srv/apps/RentGuy-v1
npm run build
NODE_VERSION=20 VERSION=1.0.20 docker-compose -f docker-compose.production.yml up -d --build rentguy-frontend
```

## 🎨 Wat kun je aanpassen?

### Per Tenant:

**Hero Sectie** (Login pagina hoofdteksten)
- Titel (bijv. "Sevensa Operations Dashboard")
- Subtitel (bijv. "Professioneel project- en teammanagement")
- Login welkomst tekst

**Demo Accounts**
- Email adressen voor demo accounts
- Wachtwoorden

**Branding**
- Primaire kleur (hex code, bijv. `#2563EB`)
- Logo URL
- Favicon URL
- Achtergrond en tekst kleuren

**SEO**
- Meta titel
- Meta beschrijving
- Keywords

**Contact Informatie**
- Email
- Telefoon
- Adres

## 📂 Bestandsstructuur

```
public/
├── admin/
│   ├── index.html          # CMS Admin interface
│   └── config.yml          # CMS configuratie
└── content/
    ├── tenants/
    │   ├── sevensa.yml     # Sevensa content
    │   └── mrdj.yml        # Mr. DJ content
    └── pages/              # Custom pagina's (optioneel)
```

## 🚀 Deployment

De app laadt automatisch CMS content bij het opstarten. Na wijzigingen:

1. **Optie A - Rebuild & Deploy**:
   ```bash
   cd /srv/apps/RentGuy-v1
   npm run build
   NODE_VERSION=20 VERSION=1.0.20 docker-compose -f docker-compose.production.yml up -d --build rentguy-frontend
   ```

2. **Optie B - Alleen permissions fix** (als je alleen YAML wijzigt):
   ```bash
   docker exec rentguy-frontend-prod chmod -R 755 /usr/share/nginx/html/content
   ```

## ⚙️ Git Integration (Optioneel)

Voor production gebruik met Git workflow:

1. **Setup Git Gateway** in je Git provider (GitHub/GitLab)
2. **Configure OAuth** voor authentication
3. **Enable Editorial Workflow** in `/public/admin/config.yml`

Dan:
- Content wijzigingen worden automatisch commits
- Review via Editorial Workflow
- Publish → automatisch naar main branch

## 🔍 Troubleshooting

**Probleem**: CMS Admin geeft foutmelding
- **Oplossing**: Check browser console voor specifieke errors
- Verify dat bestanden in `/public/admin/` correct zijn

**Probleem**: Content wordt niet geladen na wijziging
- **Oplossing**: Doe een rebuild of herstart de frontend container
- Check of YAML syntax correct is (geen tabs, alleen spaties!)

**Probleem**: YAML bestanden geven 404
- **Oplossing**: Check permissions met `docker exec rentguy-frontend-prod ls -la /usr/share/nginx/html/content/tenants/`
- Fix met: `docker exec rentguy-frontend-prod chmod -R 755 /usr/share/nginx/html/content`

## 📖 Voorbeeld YAML

```yaml
tenantId: sevensa
name: Sevensa
domain: sevensa.rentguy.nl
primaryColor: '#2563EB'

hero:
  title: Je Nieuwe Titel Hier
  subtitle: Je nieuwe subtitel
  loginWelcome: Welkom bij je platform

demoAccounts:
  account1: demo@example.com
  account2: admin@example.com
  password: jouwwachtwoord

seo:
  title: SEO Titel
  description: SEO beschrijving voor zoekmachines
  keywords: keyword1, keyword2, keyword3
```

## 🎯 Volgende Stappen

1. Open https://sevensa.rentguy.nl/admin
2. Bewerk de Hero titel van Sevensa
3. Sla op en zie je wijziging live!

**Tip**: Test eerst op één tenant voordat je alle content wijzigt.

---

**Versie**: v1.0.19+
**CMS Type**: Decap CMS (Git-based)
**Status**: ✅ Production Ready
