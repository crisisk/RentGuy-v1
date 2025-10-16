"""Add CRM tables for leads, deals and automation tracking."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "2025_03_01_add_crm_tables"
down_revision = "0010_postgis_location_tracking"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "crm_leads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.String(length=100), nullable=False),
        sa.Column("external_id", sa.String(length=120), nullable=True, unique=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("source", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_crm_leads_tenant_id", "crm_leads", ["tenant_id"])

    op.create_table(
        "crm_pipelines",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_unique_constraint("uq_pipeline_tenant_name", "crm_pipelines", ["tenant_id", "name"])
    op.create_index("ix_crm_pipelines_tenant", "crm_pipelines", ["tenant_id"])

    op.create_table(
        "crm_pipeline_stages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pipeline_id", sa.Integer(), sa.ForeignKey("crm_pipelines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("automation_flow", sa.String(length=120), nullable=True),
    )
    op.create_unique_constraint("uq_stage_pipeline_name", "crm_pipeline_stages", ["pipeline_id", "name"])

    op.create_table(
        "crm_deals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.String(length=100), nullable=False),
        sa.Column("lead_id", sa.Integer(), sa.ForeignKey("crm_leads.id", ondelete="SET NULL"), nullable=True),
        sa.Column("pipeline_id", sa.Integer(), sa.ForeignKey("crm_pipelines.id"), nullable=False),
        sa.Column("stage_id", sa.Integer(), sa.ForeignKey("crm_pipeline_stages.id"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("value", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="EUR"),
        sa.Column("expected_close", sa.Date(), nullable=True),
        sa.Column("probability", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_check_constraint("ck_deal_probability", "crm_deals", "probability BETWEEN 0 AND 100")
    op.create_index("ix_crm_deals_tenant", "crm_deals", ["tenant_id"])

    op.create_table(
        "crm_activities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.String(length=100), nullable=False),
        sa.Column("deal_id", sa.Integer(), sa.ForeignKey("crm_deals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("activity_type", sa.String(length=50), nullable=False),
        sa.Column("summary", sa.String(length=255), nullable=False),
        sa.Column("payload", sa.Text(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_crm_activities_tenant", "crm_activities", ["tenant_id"])

    op.create_table(
        "crm_automation_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.String(length=100), nullable=False, index=True),
        sa.Column("deal_id", sa.Integer(), sa.ForeignKey("crm_deals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trigger", sa.String(length=120), nullable=False),
        sa.Column("workflow_id", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="queued"),
        sa.Column("context", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_crm_automation_runs_trigger", "crm_automation_runs", ["trigger"])
    op.create_index("ix_crm_automation_runs_tenant", "crm_automation_runs", ["tenant_id"])

    op.create_table(
        "crm_acquisition_metrics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.String(length=100), nullable=False, index=True),
        sa.Column("channel", sa.String(length=120), nullable=True),
        sa.Column("source", sa.String(length=120), nullable=True),
        sa.Column("medium", sa.String(length=120), nullable=True),
        sa.Column("captured_date", sa.Date(), nullable=False, index=True),
        sa.Column("sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("new_users", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("engaged_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ga_conversions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ga_conversion_value", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("gtm_conversions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("gtm_conversion_value", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("ga_property_id", sa.String(length=120), nullable=True),
        sa.Column("gtm_container_id", sa.String(length=120), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "tenant_id",
            "channel",
            "source",
            "captured_date",
            name="uq_acquisition_tenant_channel_source_date",
        ),
    )
    op.create_index(
        "ix_crm_acquisition_metrics_tenant_date",
        "crm_acquisition_metrics",
        ["tenant_id", "captured_date"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_crm_acquisition_metrics_tenant_date",
        table_name="crm_acquisition_metrics",
    )
    op.drop_table("crm_acquisition_metrics")

    op.drop_index("ix_crm_automation_runs_tenant", table_name="crm_automation_runs")
    op.drop_index("ix_crm_automation_runs_trigger", table_name="crm_automation_runs")
    op.drop_table("crm_automation_runs")

    op.drop_index("ix_crm_activities_tenant", table_name="crm_activities")
    op.drop_table("crm_activities")

    op.drop_index("ix_crm_deals_tenant", table_name="crm_deals")
    op.drop_constraint("ck_deal_probability", "crm_deals", type_="check")
    op.drop_table("crm_deals")

    op.drop_constraint("uq_stage_pipeline_name", "crm_pipeline_stages", type_="unique")
    op.drop_table("crm_pipeline_stages")

    op.drop_index("ix_crm_pipelines_tenant", table_name="crm_pipelines")
    op.drop_constraint("uq_pipeline_tenant_name", "crm_pipelines", type_="unique")
    op.drop_table("crm_pipelines")

    op.drop_index("ix_crm_leads_tenant_id", table_name="crm_leads")
    op.drop_table("crm_leads")
