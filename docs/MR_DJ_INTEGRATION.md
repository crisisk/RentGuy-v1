# Mr. DJ integratiehandleiding

Deze handleiding beschrijft hoe de RentGuy secrets-infrastructuur samenwerkt met
de Express/React stack in [`mr-djv1`](https://github.com/crisisk/mr-djv1). Het doel
is dat productie-credentials slechts op één plaats worden ingevoerd en vervolgens
automatisch beschikbaar zijn voor zowel de FastAPI backend als de Mr. DJ
koppeling.

## Overzicht

- Het secrets dashboard op [`rentguy.sevensa.nl/dashboard`](https://rentguy.sevensa.nl/dashboard)
  beheert alle .env-waarden en schrijft de volledige set met één klik naar
  `.env.secrets`.
- De nieuwe **Mr. DJ integratie**-tab groepeert alle variabelen die de
  Express/React codebase nodig heeft, inclusief SMTP, service-accounts en het
  webhookgeheim.
- De backend biedt een e-maildiagnoserapport zodat operators direct zien of de
  SMTP-configuratie geschikt is voor de Node.js mailer in mr-djv1.

## Vereiste secrets

| Sleutel | Beschrijving | Gebruik in mr-djv1 |
| --- | --- | --- |
| `SMTP_HOST` / `SMTP_PORT` | Mailserver host en poort | NodeMailer transport in de Express app |
| `SMTP_USER` / `SMTP_PASS` | Authenticatiegegevens voor SMTP | Inloggen op de mailserver wanneer vereist |
| `MAIL_FROM` | Afzenderadres | Default `from` adres voor notificaties |
| `MRDJ_API_URL` | Publieke URL van de Express API | `.env` variabelen zoals `VITE_API_URL` en server-side API-clients |
| `MRDJ_SERVICE_ACCOUNT_EMAIL` | Serviceaccount voor RentGuy API-aanroepen | JWT- of sessionbootstrap richting RentGuy |
| `MRDJ_SERVICE_ACCOUNT_PASSWORD` | Bijpassend wachtwoord/token | Opslag in mr-djv1 secrets manager voor authentiseren |
| `MRDJ_WEBHOOK_SECRET` | Gedeeld geheim voor webhookvalidatie | Express middleware om inkomende RentGuy events te verifiëren |
| `PAYMENT_WEBHOOK_BASE_URL` (optioneel) | Basis-URL voor webhook callbacks | Configuratie voor payment/webhook routes |

Alle sleutels worden versleuteld opgeslagen. Niet-gevoelige waarden (zoals
`MRDJ_API_URL`) worden in het dashboard leesbaar getoond, zodat operators eenvoudig
kunnen kopiëren naar de React `.env`.

## Synchronisatie naar de Express/React stack

1. Vul of update de variabelen via de **Mr. DJ integratie**-tab en klik op
   **Secrets synchroniseren**. Hierdoor ontstaat/wordt bijgewerkt: `repo/.env.secrets`.
2. Distribueer dit bestand naar de Mr. DJ host (bijvoorbeeld als `config/.env.production`).
   In Docker compose kan het bestand als volume worden gemount zodat zowel Express
   als de frontend er toegang toe hebben.
3. Laad de waarden in Express met `dotenv` en map de RentGuy sleutelnaam naar de
   verwachte mr-djv1 variabelen, bijvoorbeeld:

   ```js
   // server/config/secrets.js
   export const SMTP_HOST = process.env.SMTP_HOST;
   export const RENTGUY_WEBHOOK_SECRET = process.env.MRDJ_WEBHOOK_SECRET;
   ```

4. Herstart de Express service nadat secrets zijn gewijzigd. Voor RentGuy moet de
   FastAPI toepassing opnieuw opstarten wanneer er "Herstart vereist" bij de secret staat.
5. Voor de React frontend kopieer je `MRDJ_API_URL` en eventuele OAuth waarden naar
   `.env.production` (`VITE_API_URL=<...>`).

## E-mailintegratie en monitoring

- Gebruik de **SMTP status**-kaart op het dashboard om te controleren of alle
  vereiste velden zijn ingevuld. Status `ok` betekent dat de Node mailer direct kan
  verbinden; `warning` of `error` geeft aan welke sleutel ontbreekt.
- De backend mailer gebruikt dezelfde secrets. Een geslaagde testmail vanuit
  RentGuy bevestigt daarmee ook de bruikbaarheid voor Express.
- Logbestanden voor mislukte synchronisaties worden vastgelegd in de backend en
  kunnen via `docker logs` of de observability module bekeken worden.

## Koppeling met mr-djv1

- **Authenticatie:** gebruik het serviceaccount (e-mail + wachtwoord/token) om
  toegangstokens voor RentGuy API's op te halen. Bewaar tokens in de mr-djv1
  secrets store (bijv. `process.env.RENTGUY_TOKEN`).
- **Webhooks:** configureer mr-djv1 om `MRDJ_WEBHOOK_SECRET` te gebruiken bij het
  genereren en verifiëren van HMAC headers. Aan RentGuy kant wordt dezelfde
  waarde gebruikt om binnenkomende callbacks te valideren.
- **CI/CD:** voeg een stap toe aan de deployment pipeline die `.env.secrets`
  versleuteld ophaalt (bijvoorbeeld via SSH/scp) en het bestand naar de target
  server kopieert voordat containers worden herstart.
- **Documentatie:** noteer in het mr-djv1 repository welke variabelen direct uit
  RentGuy komen, zodat toekomstige updates consistent verlopen.

Volg deze stappen om dubbele configuratie te voorkomen en om alle RentGuy en
Mr. DJ componenten synchroon te houden tijdens productie-updates.
