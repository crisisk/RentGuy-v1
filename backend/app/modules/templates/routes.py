"""
FastAPI routes for CRM templates
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.modules.templates import schemas, service


router = APIRouter()


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_tenant_id() -> str:
    """Get tenant ID from header or token - simplified for now"""
    # TODO: Implement proper tenant resolution from JWT token or header
    return "mr-dj"


@router.get("/", response_model=schemas.TemplateListResponse)
def list_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    template_type: Optional[str] = Query(None, description="Filter by template type"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in name and content"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """List all templates for tenant with filters and pagination"""
    skip = (page - 1) * page_size

    templates, total = service.TemplateService.list_templates(
        db=db,
        tenant_id=tenant_id,
        category=category,
        template_type=template_type,
        tags=tags,
        is_active=is_active,
        search=search,
        skip=skip,
        limit=page_size
    )

    return schemas.TemplateListResponse(
        total=total,
        templates=[schemas.TemplateResponse.model_validate(t) for t in templates],
        page=page,
        page_size=page_size
    )


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all template categories with counts"""
    return service.TemplateService.get_categories(db, tenant_id)


@router.get("/types")
def get_types(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all template types with counts"""
    return service.TemplateService.get_types(db, tenant_id, category)


@router.get("/{template_id}", response_model=schemas.TemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific template by ID"""
    template = service.TemplateService.get_template(db, template_id, tenant_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template {template_id} not found"
        )

    return schemas.TemplateResponse.model_validate(template)


@router.post("/", response_model=schemas.TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: schemas.TemplateCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new template"""
    # Check if template with same name and category already exists
    existing = service.TemplateService.get_template_by_name(
        db=db,
        name=template_data.name,
        category=template_data.category,
        tenant_id=tenant_id
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Template '{template_data.name}' already exists in category '{template_data.category}'"
        )

    template = service.TemplateService.create_template(
        db=db,
        tenant_id=tenant_id,
        template_data=template_data
    )

    return schemas.TemplateResponse.model_validate(template)


@router.put("/{template_id}", response_model=schemas.TemplateResponse)
def update_template(
    template_id: int,
    template_data: schemas.TemplateUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update an existing template"""
    template = service.TemplateService.update_template(
        db=db,
        template_id=template_id,
        tenant_id=tenant_id,
        template_data=template_data
    )

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template {template_id} not found"
        )

    return schemas.TemplateResponse.model_validate(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a template"""
    success = service.TemplateService.delete_template(db, template_id, tenant_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template {template_id} not found"
        )

    return None


@router.post("/render", response_model=schemas.TemplateRenderResponse)
def render_template(
    render_request: schemas.TemplateRenderRequest,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Render a template with provided variables"""
    result = service.TemplateService.render_template(
        db=db,
        template_id=render_request.template_id,
        tenant_id=tenant_id,
        variables=render_request.variables,
        format=render_request.format
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template {render_request.template_id} not found"
        )

    return schemas.TemplateRenderResponse(**result)


@router.get("/type/{template_type}", response_model=schemas.TemplateResponse)
def get_template_by_type(
    template_type: str,
    get_default: bool = Query(True, description="Get default template for this type"),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get template by type (optionally get default)"""
    template = service.TemplateService.get_template_by_type(
        db=db,
        template_type=template_type,
        tenant_id=tenant_id,
        get_default=get_default
    )

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {'default ' if get_default else ''}template found for type '{template_type}'"
        )

    return schemas.TemplateResponse.model_validate(template)


@router.get("/{template_id}/preview", response_model=schemas.TemplateRenderResponse)
def preview_template(
    template_id: int,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Preview template with realistic dummy data"""
    template = service.TemplateService.get_template(db, template_id, tenant_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template {template_id} not found"
        )

    # Generate realistic dummy data based on template type
    dummy_vars = _generate_dummy_data(template.template_type)

    result = service.TemplateService.render_template(
        db=db,
        template_id=template_id,
        tenant_id=tenant_id,
        variables=dummy_vars,
        format="html" if template.content_html else "text"
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to render template"
        )

    return schemas.TemplateRenderResponse(**result)


def _generate_dummy_data(template_type: Optional[str]) -> dict:
    """Generate realistic dummy data based on template type"""
    from datetime import datetime, timedelta

    base_data = {
        "client_name": "Jan & Marie de Vries",
        "client_email": "jan.marie@example.nl",
        "client_phone": "+31 6 1234 5678",
        "company_name": "Mister DJ",
        "company_email": "info@mr-dj.nl",
        "company_phone": "+31 (0) 40 8422594",
        "current_date": datetime.now().strftime("%d-%m-%Y"),
        "current_year": str(datetime.now().year),
    }

    if template_type == "lead_notification":
        return {
            **base_data,
            "event_type": "Bruiloft",
            "event_date": (datetime.now() + timedelta(days=180)).strftime("%d-%m-%Y"),
            "package_id": "Premium DJ Pakket",
            "message": "Wij zijn op zoek naar een professionele DJ voor onze bruiloft in juni. We verwachten ongeveer 120 gasten en willen een mix van moderne hits en klassiekers. Graag een offerte ontvangen!",
            "lead_id": 12345,
            "external_id": "MRDJ-2025-001",
            "status": "new",
            "source": "mister-dj-website",
            "workspace": "mr-dj",
            "received_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            "crm_link": "https://sevensa.rentguy.nl/crm/leads/12345"
        }
    elif template_type in ["invoice", "factuur"]:
        return {
            **base_data,
            "invoice_number": "2025-001",
            "invoice_date": datetime.now().strftime("%d-%m-%Y"),
            "due_date": (datetime.now() + timedelta(days=14)).strftime("%d-%m-%Y"),
            "subtotal": "€ 1.250,00",
            "vat": "€ 262,50",
            "total": "€ 1.512,50",
            "items": [
                {"description": "Premium DJ Set (4 uur)", "quantity": 1, "price": "€ 750,00"},
                {"description": "Lichtshow", "quantity": 1, "price": "€ 500,00"}
            ]
        }
    elif template_type in ["quote", "offerte"]:
        return {
            **base_data,
            "quote_number": "OFF-2025-042",
            "quote_date": datetime.now().strftime("%d-%m-%Y"),
            "valid_until": (datetime.now() + timedelta(days=30)).strftime("%d-%m-%Y"),
            "event_date": (datetime.now() + timedelta(days=180)).strftime("%d-%m-%Y"),
            "package_name": "Premium DJ Pakket",
            "total": "€ 1.512,50"
        }
    elif template_type == "booking_confirmation":
        return {
            **base_data,
            "booking_number": "BOOK-2025-089",
            "event_type": "Bruiloft",
            "event_date": (datetime.now() + timedelta(days=180)).strftime("%d-%m-%Y"),
            "event_time": "20:00 - 01:00",
            "venue": "Grand Hotel Amsterdam",
            "address": "Oudezijds Voorburgwal 197, 1012 EX Amsterdam"
        }
    else:
        return base_data


@router.post("/generate", response_model=schemas.TemplateGenerationResponse, status_code=status.HTTP_201_CREATED)
async def generate_template_with_ai(
    request: schemas.TemplateGenerationRequest,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Generate template using OpenRouter AI"""
    import httpx
    import json
    import re

    OPENROUTER_API_KEY = "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"
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

    # Build brand colors string
    brand_colors = request.brand_colors or {
        "primary": "#1A2C4B",
        "secondary": "#00AEEF",
        "accent": "#D4AF37"
    }
    colors_str = ", ".join([f"{k}: {v}" for k, v in brand_colors.items()])

    # Build variables string
    variables_str = ", ".join(request.variables) if request.variables else "{{client_name}}, {{client_email}}, {{client_phone}}"

    # Create prompt for AI
    if request.format == "html":
        prompt = f"""Je bent een expert template designer. Maak een professionele {request.category} template in HTML formaat voor de Nederlandse markt.

**Vereisten:**
- Naam: {request.name}
- Categorie: {request.category}
- Type: {request.template_type or 'algemeen'}
- Taal: {request.language}
- Beschrijving: {request.description}

**Brand Kleuren:**
{colors_str}

**Template Variabelen:**
Gebruik deze variabelen in de template: {variables_str}
Formaat: {{{{variable_name}}}}

**Output Formaat:**
Genereer ALLEEN de volgende JSON structuur zonder extra tekst:
{{
    "subject": "Email onderwerp hier (met {{{{variabelen}}}})",
    "content_html": "Volledige HTML template hier...",
    "content_text": "Plain text versie hier...",
    "variables": {{"variable_name": "description"}},
    "tags": ["tag1", "tag2"]
}}

**HTML Template Eisen:**
1. Responsive design (max-width: 600px voor email)
2. Inline CSS styles voor email compatibiliteit
3. Gebruik brand kleuren
4. Professionele Nederlandse tekst
5. Duidelijke call-to-action indien relevant
6. Alle variabelen in {{{{variable}}}} formaat

Begin nu met de JSON output:"""
    else:
        prompt = f"""Je bent een expert template designer. Maak een professionele {request.category} template in plain text formaat voor de Nederlandse markt.

**Vereisten:**
- Naam: {request.name}
- Categorie: {request.category}
- Type: {request.template_type or 'algemeen'}
- Taal: {request.language}
- Beschrijving: {request.description}

**Template Variabelen:**
Gebruik deze variabelen: {variables_str}
Formaat: {{{{variable_name}}}}

**Output Formaat:**
Genereer ALLEEN de volgende JSON structuur zonder extra tekst:
{{
    "subject": "Onderwerp hier (met {{{{variabelen}}}})",
    "content_text": "Volledige text template hier...",
    "variables": {{"variable_name": "description"}},
    "tags": ["tag1", "tag2"]
}}

Begin nu met de JSON output:"""

    try:
        # Call OpenRouter API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://sevensa.rentguy.nl",
                    "X-Title": "RentGuy CRM Template Generator"
                },
                json={
                    "model": "anthropic/claude-3.5-sonnet",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 4000
                }
            )
            response.raise_for_status()

        ai_response = response.json()
        generated_content = ai_response["choices"][0]["message"]["content"]

        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r'```json\s*(.*?)\s*```', generated_content, re.DOTALL)
        if json_match:
            generated_content = json_match.group(1)

        # Parse AI response
        template_data = json.loads(generated_content)

        # Prepare template for database
        subject = template_data.get("subject", f"{request.name}")
        content_text = template_data.get("content_text", "")
        content_html = template_data.get("content_html") if request.format == "html" else None
        variables = template_data.get("variables", {})
        tags = template_data.get("tags", [request.category])

        template_id = None
        if request.save_to_db:
            # Save to database
            template = service.TemplateService.create_template(
                db=db,
                tenant_id=tenant_id,
                template_data=schemas.TemplateCreate(
                    name=request.name,
                    category=request.category,
                    template_type=request.template_type,
                    subject=subject,
                    content_text=content_text,
                    content_html=content_html,
                    variables=variables,
                    tags=tags,
                    language=request.language,
                    is_active=True,
                    is_default=False
                )
            )
            template_id = template.id

        return schemas.TemplateGenerationResponse(
            success=True,
            template_id=template_id,
            name=request.name,
            category=request.category,
            template_type=request.template_type,
            subject=subject,
            content_text=content_text,
            content_html=content_html,
            variables=variables,
            message=f"Template successfully generated{' and saved to database' if request.save_to_db else ''}"
        )

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate template via OpenRouter: {str(e)}"
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI response: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Template generation failed: {str(e)}"
        )
