from alembic import op
import sqlalchemy as sa

revision = "0005_transport"
down_revision = "0004_crew_and_calendar"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "veh_vehicles",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("plate", sa.String(40), nullable=False),
        sa.Column("capacity_kg", sa.Integer, nullable=False, server_default="0"),
        sa.Column("volume_m3", sa.Numeric(10,2), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "veh_drivers",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(60), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("license_types", sa.String(120), nullable=False, server_default="B"),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "veh_routes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("project_id", sa.Integer, nullable=False),
        sa.Column("vehicle_id", sa.Integer, nullable=False),
        sa.Column("driver_id", sa.Integer, nullable=False),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("start_time", sa.Time, nullable=False),
        sa.Column("end_time", sa.Time, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="planned"),
    )
    op.create_table(
        "veh_route_stops",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("route_id", sa.Integer, sa.ForeignKey("veh_routes.id"), nullable=False),
        sa.Column("sequence", sa.Integer, nullable=False, server_default="1"),
        sa.Column("address", sa.String(250), nullable=False),
        sa.Column("contact_name", sa.String(120), nullable=False),
        sa.Column("contact_phone", sa.String(60), nullable=False),
        sa.Column("eta", sa.DateTime(timezone=True), nullable=False),
        sa.Column("etd", sa.DateTime(timezone=True), nullable=False),
    )

def downgrade():
    op.drop_table("veh_route_stops")
    op.drop_table("veh_routes")
    op.drop_table("veh_drivers")
    op.drop_table("veh_vehicles")
