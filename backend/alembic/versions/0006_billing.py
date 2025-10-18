from alembic import op
import sqlalchemy as sa

revision = "0006_billing"
down_revision = "0005_transport"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "bil_invoices",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("project_id", sa.Integer, nullable=False),
        sa.Column("client_name", sa.String(200), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False, server_default="EUR"),
        sa.Column("total_gross", sa.Numeric(10,2), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("issued_at", sa.Date, nullable=False),
        sa.Column("due_at", sa.Date, nullable=False),
    )
    op.create_table(
        "bil_payments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("invoice_id", sa.Integer, nullable=False),
        sa.Column("provider", sa.String(20), nullable=False),
        sa.Column("external_id", sa.String(120), nullable=False),
        sa.Column("amount", sa.Numeric(10,2), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

def downgrade():
    op.drop_table("bil_payments")
    op.drop_table("bil_invoices")
