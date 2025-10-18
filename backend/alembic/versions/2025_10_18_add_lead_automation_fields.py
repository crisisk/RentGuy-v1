"""Add event_type, priority, and assignment_notes to crm_leads for automation.

Revision ID: 2025_10_18_add_lead_automation_fields
Revises: 2025_03_01_add_crm_tables
Create Date: 2025-10-18
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "2025_10_18_automation"
down_revision = "2025_03_01_add_crm_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add automation-related fields to crm_leads table."""

    # Add event_type for lead classification and assignment rules
    op.add_column(
        "crm_leads",
        sa.Column("event_type", sa.String(length=100), nullable=True)
    )

    # Add priority for lead routing (high, medium, normal)
    op.add_column(
        "crm_leads",
        sa.Column("priority", sa.String(length=20), nullable=True, server_default="normal")
    )

    # Add assignment_notes for automation metadata
    op.add_column(
        "crm_leads",
        sa.Column("assignment_notes", sa.Text(), nullable=True)
    )

    # Add index on event_type for filtering
    op.create_index("ix_crm_leads_event_type", "crm_leads", ["event_type"])

    # Add index on priority for sorting
    op.create_index("ix_crm_leads_priority", "crm_leads", ["priority"])


def downgrade() -> None:
    """Remove automation-related fields from crm_leads table."""

    op.drop_index("ix_crm_leads_priority", table_name="crm_leads")
    op.drop_index("ix_crm_leads_event_type", table_name="crm_leads")
    op.drop_column("crm_leads", "assignment_notes")
    op.drop_column("crm_leads", "priority")
    op.drop_column("crm_leads", "event_type")
