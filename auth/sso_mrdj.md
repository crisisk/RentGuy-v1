# OAuth2 / SAML SSO Plan – Mr. DJ

## Architectuur
- Marketing website (`mr-dj.nl`) fungeert als OAuth2 client.
- Platform (`mr-dj.rentguy.nl`) is de resource server met FastAPI backend.
- Azure AD B2C als identity provider (OIDC + PKCE).

## Stappenplan
1. Registreer app in Azure AD B2C met redirect URI `https://mr-dj.nl/auth/callback`.
2. Update `backend/app/modules/auth` om PKCE verifier op te slaan in Redis.
3. Voeg endpoint `/api/v1/auth/sso/login` toe dat `state` + `code_verifier` genereert.
4. Marketing website roept endpoint aan en redirect gebruiker naar Azure login.
5. Callback pagina wisselt `code` om voor tokens via backend endpoint.
6. Backend maakt/vernieuwt session + JWT en redirect naar platform met `session_token`.
7. Platform frontend leest token, slaat op in `localStorage` en navigeert naar CRM dashboard.

## Veiligheidsmaatregelen
- `state` parameter koppelen aan CSRF cookie.
- PKCE verplicht (`S256`).
- Access tokens maximaal 10 minuten geldig; refresh tokens 12 uur.
- Tenant header (`X-Tenant-ID`) afleiden van claim `tenant:mrdj`.

## To-do
- [x] Documentatie
- [ ] Backend endpoints implementeren
- [ ] Marketing site callback bouwen
- [ ] End-to-end smoke test (`pytest -m tenant_smoke --case=sso`)
