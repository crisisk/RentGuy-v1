# Fase 10: API Versiebeheer en Documentatie

## 1. Inleiding

Een API (Application Programming Interface) is het contract tussen de backend en haar clients (zoals de frontend, mobiele apps of externe systemen). In een enterprise-omgeving, waar stabiliteit en voorspelbaarheid cruciaal zijn, is het essentieel om dit contract zorgvuldig te beheren. Deze fase beschrijft de strategie voor API-versiebeheer en de verbetering van de API-documentatie om een stabiele en heldere integratie te garanderen.

## 2. API Versiebeheer

Het doel van versiebeheer is om de API te kunnen doorontwikkelen zonder bestaande clients te breken. Wanneer een wijziging wordt doorgevoerd die niet achterwaarts compatibel is (een "breaking change"), moet een nieuwe versie van de API worden geïntroduceerd.

### Strategie: URL-gebaseerd Versiebeheer

We kiezen voor de meest gangbare en duidelijke methode: **URL-gebaseerd versiebeheer**. Elke API-versie krijgt een eigen prefix in de URL.

-   **Voorbeeld**: `/api/v1/projects`, `/api/v2/projects`

Dit maakt het voor clients expliciet welke versie van de API ze gebruiken. De huidige API wordt gestandaardiseerd als `v1`.

### Implementatie in FastAPI

FastAPI maakt dit eenvoudig te implementeren met `APIRouter`. Voor elke versie wordt een aparte `APIRouter` aangemaakt met een `prefix`.

```python
# In /app/api/v1/api.py
from fastapi import APIRouter
from .endpoints import projects, users

api_router_v1 = APIRouter(prefix="/api/v1")
api_router_v1.include_router(projects.router, tags=["projects"])
api_router_v1.include_router(users.router, tags=["users"])

# In main.py
app.include_router(api_router_v1)
```

Wanneer in de toekomst een `v2` nodig is, kan een nieuwe `api_router_v2` worden aangemaakt naast de `v1`-router, waardoor beide versies tegelijkertijd kunnen bestaan.

### Wanneer een Nieuwe Versie?

-   **MAJOR (v1 -> v2)**: Bij breaking changes (bv. een veld verwijderen uit een response, een endpoint verwijderen).
-   **MINOR (v1.1)**: Bij achterwaarts compatibele toevoegingen (bv. een nieuw veld toevoegen aan een response, een nieuw optioneel request-parameter).
-   **PATCH (v1.1.1)**: Bij achterwaarts compatibele bugfixes.

In de URL wordt alleen de MAJOR-versie opgenomen (`/api/v1`, `/api/v2`). Minor en patch versies worden intern beheerd en gedocumenteerd in de changelog.

## 3. Documentatie Verbetering

FastAPI genereert automatisch interactieve API-documentatie (Swagger UI en ReDoc) op basis van de code. We zullen deze documentatie aanzienlijk verrijken om ze nog nuttiger te maken.

### Gebruik van Pydantic voor Gedetailleerde Schema's

De Pydantic-modellen die worden gebruikt voor request- en response-validatie, worden uitgebreid met:

-   **`description`**: Een duidelijke omschrijving van elk veld.
-   **`example`**: Een concreet voorbeeld van de verwachte waarde.
-   **Validatie**: Gebruik van Pydantic's validatoren (bv. `min_length`, `max_length`, `gt`, `lt`) om de constraints van een veld te specificeren.

```python
from pydantic import BaseModel, Field

class ProjectCreate(BaseModel):
    name: str = Field(..., description="De naam van het project.", min_length=3, example="Project Alpha")
    description: str | None = Field(None, description="Een optionele beschrijving van het project.", example="Een project voor de ontwikkeling van...")
```

### Verrijken van Endpoints

Elk endpoint in de `APIRouter` wordt voorzien van:

-   **`summary`**: Een korte, duidelijke samenvatting van wat het endpoint doet.
-   **`description`**: Een meer gedetailleerde uitleg, inclusief eventuele bijzonderheden over de businesslogica.
-   **`tags`**: Groepeert gerelateerde endpoints in de Swagger UI.

```python
@router.post("/", summary="Creëer een nieuw project", description="Creëert een nieuw project en slaat dit op in de database.")
def create_project(project: ProjectCreate):
    # ...
```

## 4. Conclusie

Een strikte API-versiestrategie en rijke, automatisch gegenereerde documentatie zijn essentieel voor een schaalbare en onderhoudbare enterprise-applicatie. Het stelt frontend- en andere client-ontwikkelaars in staat om snel en efficiënt te integreren, vermindert de kans op misverstanden en zorgt ervoor dat de API op een gecontroleerde manier kan evolueren zonder de stabiliteit van het ecosysteem in gevaar te brengen.
