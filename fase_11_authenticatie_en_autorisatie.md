# Fase 11: Authenticatie en Autorisatie Versterking

## 1. Inleiding

Authenticatie (wie ben je?) en autorisatie (wat mag je?) vormen de kern van de applicatiebeveiliging. Hoewel de huidige JWT-gebaseerde implementatie functioneel is, mist deze de robuustheid, flexibiliteit en centrale beheerbaarheid die vereist zijn voor een enterprise-omgeving. Deze fase beschrijft de migratie van de ingebouwde authenticatielogica naar een externe, gespecialiseerde Identity and Access Management (IAM) oplossing.

## 2. Probleemstelling: Ingebouwde Authenticatie

De huidige aanpak, waarbij de applicatie zelf verantwoordelijk is voor het beheren van gebruikers, wachtwoorden en tokens, heeft significante nadelen:

-   **Gedecentraliseerd Beheer**: Elke applicatie moet zijn eigen user store beheren, wat leidt tot inconsistenties en beheeroverhead.
-   **Beperkte Features**: Het zelf bouwen van geavanceerde features zoals Single Sign-On (SSO), Multi-Factor Authentication (MFA), of social login is complex en tijdrovend.
-   **Security Risico**: De applicatie-ontwikkelaars moeten experts zijn in security om alles correct en veilig te implementeren, inclusief wachtwoord-hashing, token-revocatie, etc.
-   **Niet Schaalbaar**: Het is moeilijk om dit model op te schalen naar een landschap met meerdere applicaties en services.

## 3. Gekozen Oplossing: Keycloak

We kiezen voor **Keycloak** als de centrale IAM-oplossing voor de Rentguy-applicatie. Keycloak is een toonaangevend open-source IAM-systeem dat een breed scala aan features biedt en kan worden gehost op onze eigen VPS.

**Waarom Keycloak?**

-   **Standaard-gebaseerd**: Ondersteunt industriestandaarden zoals **OAuth 2.0** en **OpenID Connect (OIDC)**.
-   **Centraal Gebruikersbeheer**: Biedt een centrale plek voor het beheren van gebruikers, rollen en permissies.
-   **Feature-rijk**: Out-of-the-box ondersteuning voor SSO, social login (Google, Facebook, etc.), user federation (LDAP, Active Directory) en een uitgebreide admin console.
-   **Self-Hosted**: Kan als Docker-container op onze eigen VPS draaien, waardoor we volledige controle houden over de data.

## 4. Migratiestrategie

De migratie naar Keycloak omvat de volgende stappen:

1.  **Deployment van Keycloak**: Keycloak wordt als een aparte service toegevoegd aan de `docker-compose.yml`.
2.  **Configuratie van een Realm**: Er wordt een nieuwe "realm" (een geïsoleerde configuratie) genaamd `rentguy` aangemaakt in Keycloak.
3.  **User Migratie**: Er wordt een eenmalig script geschreven om de bestaande gebruikers uit de PostgreSQL-database van de applicatie te exporteren en te importeren in de Keycloak-database.
4.  **Backend Aanpassing (FastAPI)**:
    -   De bestaande authenticatie-endpoints (`/api/v1/auth/login`, etc.) worden verwijderd.
    -   De security-dependencies worden aangepast om de JWT's (access tokens) die door Keycloak worden uitgegeven, te valideren. De backend haalt de public key van de Keycloak-realm op om de handtekening van het token te verifiëren.
5.  **Frontend Aanpassing (React)**:
    -   De frontend wordt aangepast om de `keycloak-js` adapter te gebruiken.
    -   Wanneer een gebruiker wil inloggen, wordt deze geredirect naar de login-pagina van Keycloak. Na een succesvolle login, redirect Keycloak de gebruiker terug naar de applicatie met de benodigde tokens.

## 5. Autorisatie: Role-Based Access Control (RBAC)

Met Keycloak wordt het implementeren van een fijnmazig autorisatiemodel (RBAC) aanzienlijk eenvoudiger.

-   **Definitie van Rollen**: In de Keycloak admin console worden applicatie-specifieke rollen gedefinieerd, zoals `admin`, `planner`, `crew_member`.
-   **Toewijzing van Rollen**: Gebruikers kunnen één of meerdere rollen krijgen toegewezen.
-   **Handhaving in de Backend**: De rollen van een gebruiker worden als "claims" opgenomen in het access token. De FastAPI-backend kan deze claims inspecteren en op basis daarvan toegang verlenen tot specifieke endpoints.

**Voorbeeld in FastAPI:**

```python
# Een dependency die controleert of de gebruiker de 'admin' rol heeft
def require_admin_role(token: dict = Depends(security_scheme)):
    roles = token.get("realm_access", {}).get("roles", [])
    if "admin" not in roles:
        raise HTTPException(status_code=403, detail="Admin role required")

@router.delete("/projects/{project_id}", dependencies=[Depends(require_admin_role)])
def delete_project(project_id: int):
    # ... logica om een project te verwijderen
```

## 6. Conclusie

De overstap naar Keycloak is een cruciale stap in de professionalisering van de beveiliging van Rentguy. Het centraliseert het gebruikersbeheer, verhoogt de veiligheid door het gebruik van industriestandaarden, en biedt een krachtig en flexibel platform voor autorisatie. Dit maakt de applicatie niet alleen veiliger, maar ook beter voorbereid op toekomstige uitbreidingen en integraties.
