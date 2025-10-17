"""phase 7-10 transport billing warehouse reporting updates

Revision ID: 0008_phase7_to_10_updates
Revises: 0007_onboarding
Create Date: 2024-04-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_phase7_to_10_updates"
down_revision = "0007_onboarding"
branch_labels = None
depends_on = None


def upgrade():
    # Inventory cost tracking
    op.add_column(
        "inv_items",
        sa.Column("cost_per_day", sa.Numeric(10, 2), nullable=False, server_default="0"),
    )
    op.create_index("ix_inv_items_category_id", "inv_items", ["category_id"])

    # Warehouse item tag schema and richer movement tracking
    op.create_table(
        "wh_item_tags",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("tag_value", sa.String(120), nullable=False, unique=True),
        sa.Column("item_id", sa.Integer, sa.ForeignKey("inv_items.id"), nullable=True),
        sa.Column("bundle_id", sa.Integer, sa.ForeignKey("inv_bundles.id"), nullable=True),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_wh_item_tags_tag_value", "wh_item_tags", ["tag_value"], unique=True)

    # NOTE: wh_movements table operations commented out - table doesn't exist in baseline
    # op.alter_column("wh_movements", "item_id", existing_type=sa.Integer(), nullable=True)
    # op.add_column(
    #     "wh_movements",
    #     sa.Column("bundle_id", sa.Integer, sa.ForeignKey("inv_bundles.id"), nullable=True),
    # )
    # op.add_column(
    #     "wh_movements",
    #     sa.Column("source_tag", sa.String(120), nullable=True),
    # )
    # op.create_check_constraint(
    #     "ck_wh_movements_subject",
    #     "wh_movements",
    #     "(item_id IS NOT NULL) OR (bundle_id IS NOT NULL)",
    # )
    # op.create_index("ix_wh_movements_bundle", "wh_movements", ["bundle_id"])

    # Transport schema indexes / constraints
    op.create_index("ix_veh_vehicles_plate", "veh_vehicles", ["plate"], unique=True)
    op.create_index("ix_veh_vehicles_active", "veh_vehicles", ["active"])
    op.create_index("ix_veh_drivers_email", "veh_drivers", ["email"], unique=True)
    op.create_index("ix_veh_routes_date", "veh_routes", ["date"])
    op.create_index("ix_veh_routes_status", "veh_routes", ["status"])
    op.create_unique_constraint(
        "uq_veh_route_stop_sequence",
        "veh_route_stops",
        ["route_id", "sequence"],
    )

    # Billing totals + references
    op.add_column(
        "bil_invoices",
        sa.Column("total_net", sa.Numeric(10, 2), nullable=False, server_default="0"),
    )
    op.add_column(
        "bil_invoices",
        sa.Column("total_vat", sa.Numeric(10, 2), nullable=False, server_default="0"),
    )
    op.add_column(
        "bil_invoices",
        sa.Column("vat_rate", sa.Numeric(5, 2), nullable=False, server_default="21"),
    )
    op.add_column(
        "bil_invoices",
        sa.Column("reference", sa.String(64), nullable=True),
    )
    op.create_index("ix_bil_invoices_issued_at", "bil_invoices", ["issued_at"])
    op.create_index("ix_bil_payments_provider", "bil_payments", ["provider"])


def downgrade():
    op.drop_index("ix_bil_payments_provider", table_name="bil_payments")
    op.drop_index("ix_bil_invoices_issued_at", table_name="bil_invoices")
    op.drop_column("bil_invoices", "reference")
    op.drop_column("bil_invoices", "vat_rate")
    op.drop_column("bil_invoices", "total_vat")
    op.drop_column("bil_invoices", "total_net")

    op.drop_constraint("uq_veh_route_stop_sequence", "veh_route_stops", type_="unique")
    op.drop_index("ix_veh_routes_status", table_name="veh_routes")
    op.drop_index("ix_veh_routes_date", table_name="veh_routes")
    op.drop_index("ix_veh_drivers_email", table_name="veh_drivers")
    op.drop_index("ix_veh_vehicles_active", table_name="veh_vehicles")
    op.drop_index("ix_veh_vehicles_plate", table_name="veh_vehicles")

    # NOTE: wh_movements table operations commented out - table doesn't exist in baseline
    # op.drop_index("ix_wh_movements_bundle", table_name="wh_movements")
    # op.drop_constraint("ck_wh_movements_subject", "wh_movements", type_="check")
    # op.drop_column("wh_movements", "source_tag")
    # op.drop_column("wh_movements", "bundle_id")
    # op.alter_column("wh_movements", "item_id", existing_type=sa.Integer(), nullable=False)

    op.drop_index("ix_wh_item_tags_tag_value", table_name="wh_item_tags")
    op.drop_table("wh_item_tags")

    op.drop_index("ix_inv_items_category_id", table_name="inv_items")
    op.drop_column("inv_items", "cost_per_day")
