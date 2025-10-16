"""Create table for managed platform secrets."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0011_platform_secrets"
down_revision = "0010_postgis_location_tracking"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "platform_secrets",
        sa.Column("key", sa.String(length=120), primary_key=True),
        sa.Column("label", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False, server_default="general"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_sensitive", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("requires_restart", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("value_encrypted", sa.LargeBinary(), nullable=True),
        sa.Column("value_hint", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_platform_secrets_category", "platform_secrets", ["category"])


def downgrade() -> None:
    op.drop_index("ix_platform_secrets_category", table_name="platform_secrets")
    op.drop_table("platform_secrets")
