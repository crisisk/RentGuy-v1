"""
Service layer for CRM templates
"""

import re
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.modules.templates.models import CRMTemplate
from app.modules.templates.schemas import TemplateCreate, TemplateUpdate


class TemplateService:
    """Service for managing CRM templates"""

    @staticmethod
    def get_template(db: Session, template_id: int, tenant_id: str) -> Optional[CRMTemplate]:
        """Get a single template by ID"""
        return db.query(CRMTemplate).filter(
            and_(
                CRMTemplate.id == template_id,
                CRMTemplate.tenant_id == tenant_id
            )
        ).first()

    @staticmethod
    def get_template_by_name(
        db: Session,
        name: str,
        category: str,
        tenant_id: str
    ) -> Optional[CRMTemplate]:
        """Get template by name and category"""
        return db.query(CRMTemplate).filter(
            and_(
                CRMTemplate.tenant_id == tenant_id,
                CRMTemplate.name == name,
                CRMTemplate.category == category
            )
        ).first()

    @staticmethod
    def get_template_by_type(
        db: Session,
        template_type: str,
        tenant_id: str,
        get_default: bool = True
    ) -> Optional[CRMTemplate]:
        """Get template by type, optionally get default"""
        query = db.query(CRMTemplate).filter(
            and_(
                CRMTemplate.tenant_id == tenant_id,
                CRMTemplate.template_type == template_type,
                CRMTemplate.is_active == True
            )
        )

        if get_default:
            query = query.filter(CRMTemplate.is_default == True)

        return query.first()

    @staticmethod
    def list_templates(
        db: Session,
        tenant_id: str,
        category: Optional[str] = None,
        template_type: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[CRMTemplate], int]:
        """List templates with filters and pagination"""
        query = db.query(CRMTemplate).filter(CRMTemplate.tenant_id == tenant_id)

        # Apply filters
        if category:
            query = query.filter(CRMTemplate.category == category)

        if template_type:
            query = query.filter(CRMTemplate.template_type == template_type)

        if is_active is not None:
            query = query.filter(CRMTemplate.is_active == is_active)

        if tags:
            query = query.filter(CRMTemplate.tags.overlap(tags))

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    CRMTemplate.name.ilike(search_term),
                    CRMTemplate.content_text.ilike(search_term)
                )
            )

        # Get total count
        total = query.count()

        # Apply pagination
        templates = query.order_by(CRMTemplate.category, CRMTemplate.name).offset(skip).limit(limit).all()

        return templates, total

    @staticmethod
    def create_template(
        db: Session,
        tenant_id: str,
        template_data: TemplateCreate,
        user_id: Optional[int] = None
    ) -> CRMTemplate:
        """Create a new template"""
        template = CRMTemplate(
            tenant_id=tenant_id,
            name=template_data.name,
            category=template_data.category,
            template_type=template_data.template_type,
            subject=template_data.subject,
            content_text=template_data.content_text,
            content_html=template_data.content_html,
            content_json=template_data.content_json,
            variables=template_data.variables,
            tags=template_data.tags,
            is_active=template_data.is_active,
            is_default=template_data.is_default,
            language=template_data.language,
            created_by=user_id
        )

        db.add(template)
        db.commit()
        db.refresh(template)

        return template

    @staticmethod
    def update_template(
        db: Session,
        template_id: int,
        tenant_id: str,
        template_data: TemplateUpdate
    ) -> Optional[CRMTemplate]:
        """Update an existing template"""
        template = TemplateService.get_template(db, template_id, tenant_id)

        if not template:
            return None

        # Update fields
        update_data = template_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)

        db.commit()
        db.refresh(template)

        return template

    @staticmethod
    def delete_template(db: Session, template_id: int, tenant_id: str) -> bool:
        """Delete a template"""
        template = TemplateService.get_template(db, template_id, tenant_id)

        if not template:
            return False

        db.delete(template)
        db.commit()

        return True

    @staticmethod
    def render_template(
        db: Session,
        template_id: int,
        tenant_id: str,
        variables: Dict[str, Any],
        format: str = "html"
    ) -> Optional[Dict[str, Any]]:
        """Render a template with provided variables"""
        template = TemplateService.get_template(db, template_id, tenant_id)

        if not template:
            return None

        # Select content based on format
        if format == "html" and template.content_html:
            content = template.content_html
        elif format == "json" and template.content_json:
            content = template.content_json
        else:
            content = template.content_text

        # Render variables in content
        if isinstance(content, str):
            rendered_content = TemplateService._render_variables(content, variables)
        else:
            rendered_content = content  # JSON content

        # Render subject if present
        rendered_subject = None
        if template.subject:
            rendered_subject = TemplateService._render_variables(template.subject, variables)

        return {
            "template_id": template.id,
            "template_name": template.name,
            "subject": rendered_subject,
            "content": rendered_content,
            "format": format
        }

    @staticmethod
    def _render_variables(content: str, variables: Dict[str, Any]) -> str:
        """Replace {{variable}} placeholders with actual values"""
        def replace_var(match):
            var_name = match.group(1).strip()
            return str(variables.get(var_name, match.group(0)))

        # Replace {{variable}} patterns
        return re.sub(r'\{\{([^}]+)\}\}', replace_var, content)

    @staticmethod
    def get_categories(db: Session, tenant_id: str) -> List[Dict[str, Any]]:
        """Get all categories with template counts"""
        from sqlalchemy import func

        result = db.query(
            CRMTemplate.category,
            func.count(CRMTemplate.id).label('count')
        ).filter(
            CRMTemplate.tenant_id == tenant_id
        ).group_by(
            CRMTemplate.category
        ).all()

        return [{"category": row[0], "count": row[1]} for row in result]

    @staticmethod
    def get_types(db: Session, tenant_id: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all template types with counts"""
        from sqlalchemy import func

        query = db.query(
            CRMTemplate.template_type,
            func.count(CRMTemplate.id).label('count')
        ).filter(
            and_(
                CRMTemplate.tenant_id == tenant_id,
                CRMTemplate.template_type.isnot(None)
            )
        )

        if category:
            query = query.filter(CRMTemplate.category == category)

        result = query.group_by(CRMTemplate.template_type).all()

        return [{"template_type": row[0], "count": row[1]} for row in result]
