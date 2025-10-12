"""Set pending as default role for new users"""

from alembic import op
import sqlalchemy as sa


revision = "0009_role_selection_pending_role"
down_revision = "0008_phase7_to_10_updates"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "auth_users",
        "role",
        existing_type=sa.String(length=50),
        server_default="pending",
    )
    op.execute("UPDATE auth_users SET role='pending' WHERE role IS NULL OR role=''")


def downgrade() -> None:
    op.alter_column(
        "auth_users",
        "role",
        existing_type=sa.String(length=50),
        server_default="admin",
    )
