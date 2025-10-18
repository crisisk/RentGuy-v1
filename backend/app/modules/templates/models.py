"""
SQLAlchemy models for CRM templates
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.core.db import Base


class CRMTemplate(Base):
    """CRM content template model"""

    __tablename__ = "crm_templates"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    template_type = Column(String(100), index=True)
    subject = Column(String(500))
    content_text = Column(Text, nullable=False)
    content_html = Column(Text)
    content_json = Column(JSONB)
    variables = Column(JSONB)
    tags = Column(ARRAY(String(255)))
    is_active = Column(Boolean, default=True, index=True)
    is_default = Column(Boolean, default=False)
    language = Column(String(10), default='nl')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer)

    def __repr__(self):
        return f"<CRMTemplate(id={self.id}, name='{self.name}', category='{self.category}')>"
