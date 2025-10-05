from alembic import op
import sqlalchemy as sa

revision = "0007_onboarding"
down_revision = "0006_billing"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "onb_steps",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.String(1000), nullable=False),
    )
    op.create_index("ix_onb_steps_code", "onb_steps", ["code"], unique=True)

    op.create_table(
        "onb_progress",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_email", sa.String(255), nullable=False, index=True),
        sa.Column("step_code", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "onb_tips",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("module", sa.String(50), nullable=False),
        sa.Column("message", sa.String(500), nullable=False),
        sa.Column("cta", sa.String(200), nullable=False, server_default=""),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
    )

def downgrade():
    op.drop_table("onb_tips")
    op.drop_table("onb_progress")
    op.drop_index("ix_onb_steps_code", table_name="onb_steps")
    op.drop_table("onb_steps")
