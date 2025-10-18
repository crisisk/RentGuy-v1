# UAT – Fase 1–2

## Fase 1 – Platform
- [ ] `/healthz` retourneert `{"status":"ok"}`
- [ ] `/readyz` retourneert `{"status":"ready"}`
- [ ] OpenAPI op `/docs` laadt zonder errors

## Fase 2 – Auth & RBAC
- [ ] Alembic migration maakt `auth_users` aan
- [ ] Voeg admin toe via SQL of endpoint (na tijdelijke whitelist)
- [ ] `/api/v1/auth/login` met geldig user → token
- [ ] `/api/v1/auth/me` met token → user-info
- [ ] Rolrestrictie op `/api/v1/auth/register` (alleen admin)
