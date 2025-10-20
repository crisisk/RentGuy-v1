"""Create booking module tables."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "2025_03_15_add_booking_tables"
down_revision = "2025_03_01_add_crm_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "booking_themes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(length=100), nullable=False, server_default="mdi-camera"),
        sa.UniqueConstraint("name", name="uq_booking_themes_name"),
    )
    op.create_index("ix_booking_themes_name", "booking_themes", ["name"])

    op.create_table(
        "booking_equipment",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="available"),
        sa.Column("hourly_rate", sa.Numeric(10, 2), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.UniqueConstraint("name", name="uq_booking_equipment_name"),
    )
    op.create_index("ix_booking_equipment_name", "booking_equipment", ["name"])
    op.create_index("ix_booking_equipment_status", "booking_equipment", ["status"])

    op.create_table(
        "booking_equipment_themes",
        sa.Column("equipment_id", sa.Integer(), nullable=False),
        sa.Column("theme_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["equipment_id"], ["booking_equipment.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["theme_id"], ["booking_themes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("equipment_id", "theme_id"),
    )

    op.create_table(
        "booking_reservations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("equipment_id", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("cancelled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(["user_id"], ["auth_users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["equipment_id"], ["booking_equipment.id"], ondelete="RESTRICT"),
    )
    op.create_index(
        "ix_booking_reservation_time",
        "booking_reservations",
        ["equipment_id", "start_time", "end_time"],
    )

    op.create_table(
        "booking_payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reservation_id", sa.Integer(), nullable=False, unique=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("transaction_id", sa.String(length=100), nullable=True),
        sa.Column("payment_method", sa.String(length=50), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["reservation_id"], ["booking_reservations.id"], ondelete="CASCADE"),
    )


def downgrade() -> None:
    op.drop_table("booking_payments")
    op.drop_index("ix_booking_reservation_time", table_name="booking_reservations")
    op.drop_table("booking_reservations")
    op.drop_table("booking_equipment_themes")
    op.drop_index("ix_booking_equipment_status", table_name="booking_equipment")
    op.drop_index("ix_booking_equipment_name", table_name="booking_equipment")
    op.drop_table("booking_equipment")
    op.drop_index("ix_booking_themes_name", table_name="booking_themes")
    op.drop_table("booking_themes")
