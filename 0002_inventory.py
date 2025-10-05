from alembic import op
import sqlalchemy as sa

revision = "0002_inventory"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "inv_categories",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(120), unique=True, nullable=False),
    )
    op.create_index("ix_inv_categories_name", "inv_categories", ["name"], unique=True)

    op.create_table(
        "inv_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("category_id", sa.Integer, sa.ForeignKey("inv_categories.id")),
        sa.Column("quantity_total", sa.Integer, nullable=False, server_default="0"),
        sa.Column("min_stock", sa.Integer, nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("price_per_day", sa.Numeric(10,2), nullable=False, server_default="0"),
    )
    op.create_index("ix_inv_items_name", "inv_items", ["name"])

    op.create_table(
        "inv_bundles",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(200), unique=True, nullable=False),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_inv_bundles_name", "inv_bundles", ["name"], unique=True)

    op.create_table(
        "inv_bundle_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("bundle_id", sa.Integer, sa.ForeignKey("inv_bundles.id")),
        sa.Column("item_id", sa.Integer, sa.ForeignKey("inv_items.id")),
        sa.Column("quantity", sa.Integer, nullable=False, server_default="1"),
    )

    op.create_table(
        "inv_maintenance_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("item_id", sa.Integer, sa.ForeignKey("inv_items.id")),
        sa.Column("due_date", sa.Date, nullable=True),
        sa.Column("done", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("note", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

def downgrade():
    op.drop_table("inv_maintenance_logs")
    op.drop_table("inv_bundle_items")
    op.drop_index("ix_inv_bundles_name", table_name="inv_bundles")
    op.drop_table("inv_bundles")
    op.drop_index("ix_inv_items_name", table_name="inv_items")
    op.drop_table("inv_items")
    op.drop_index("ix_inv_categories_name", table_name="inv_categories")
    op.drop_table("inv_categories")
