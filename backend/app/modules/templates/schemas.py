"""
Pydantic schemas for CRM templates
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class TemplateBase(BaseModel):
    """Base template schema"""
    name: str = Field(..., max_length=255, description="Template name")
    category: str = Field(..., max_length=100, description="Template category")
    template_type: Optional[str] = Field(None, max_length=100, description="Specific template type")
    subject: Optional[str] = Field(None, max_length=500, description="Email subject line")
    content_text: str = Field(..., description="Plain text or Markdown content")
    content_html: Optional[str] = Field(None, description="HTML content")
    content_json: Optional[Dict[str, Any]] = Field(None, description="Structured content")
    variables: Optional[Dict[str, Any]] = Field(None, description="Available template variables")
    tags: Optional[List[str]] = Field(default_factory=list, description="Template tags")
    is_active: bool = Field(default=True, description="Whether template is active")
    is_default: bool = Field(default=False, description="Whether this is default template for type")
    language: str = Field(default='nl', max_length=10, description="Template language")


class TemplateCreate(TemplateBase):
    """Schema for creating a template"""
    pass


class TemplateUpdate(BaseModel):
    """Schema for updating a template"""
    name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    template_type: Optional[str] = Field(None, max_length=100)
    subject: Optional[str] = Field(None, max_length=500)
    content_text: Optional[str] = None
    content_html: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None
    variables: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    language: Optional[str] = Field(None, max_length=10)


class TemplateResponse(TemplateBase):
    """Schema for template response"""
    id: int
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    """Schema for paginated template list"""
    total: int
    templates: List[TemplateResponse]
    page: int
    page_size: int


class TemplateRenderRequest(BaseModel):
    """Schema for rendering a template with variables"""
    template_id: int
    variables: Dict[str, Any] = Field(..., description="Variables to render in template")
    format: str = Field(default="html", description="Output format: html, text, json")


class TemplateRenderResponse(BaseModel):
    """Schema for rendered template response"""
    template_id: int
    template_name: str
    subject: Optional[str] = None
    content: str
    format: str


class TemplateGenerationRequest(BaseModel):
    """Schema for AI-powered template generation"""
    name: str = Field(..., max_length=255, description="Template name")
    category: str = Field(..., max_length=100, description="Template category (email, invoice, etc.)")
    template_type: Optional[str] = Field(None, max_length=100, description="Specific template type")
    description: str = Field(..., description="Description of what the template should contain")
    language: str = Field(default='nl', description="Template language (nl, en)")
    format: str = Field(default='html', description="Output format (html, text)")
    brand_colors: Optional[Dict[str, str]] = Field(None, description="Brand colors for HTML templates")
    variables: Optional[List[str]] = Field(None, description="Required template variables")
    save_to_db: bool = Field(default=True, description="Whether to save generated template to database")


class TemplateGenerationResponse(BaseModel):
    """Schema for AI-generated template response"""
    success: bool
    template_id: Optional[int] = None
    name: str
    category: str
    template_type: Optional[str] = None
    subject: Optional[str] = None
    content_text: str
    content_html: Optional[str] = None
    variables: Optional[Dict[str, Any]] = None
    message: str
