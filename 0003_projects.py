from alembic import op
import sqlalchemy as sa

revision = "0003_projects"
down_revision = "0002_inventory"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "prj_projects",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("client_name", sa.String(200), nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=False),
        sa.Column("notes", sa.String(1000), nullable=False, server_default=""),
        sa.Column("created_by", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_prj_projects_name", "prj_projects", ["name"])

    op.create_table(
        "prj_project_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("project_id", sa.Integer, sa.ForeignKey("prj_projects.id"), nullable=False),
        sa.Column("item_id", sa.Integer, nullable=False),
        sa.Column("qty_reserved", sa.Integer, nullable=False),
        sa.Column("price_override", sa.Numeric(10,2), nullable=True),
    )

def downgrade():
    op.drop_table("prj_project_items")
    op.drop_index("ix_prj_projects_name", table_name="prj_projects")
    op.drop_table("prj_projects")
