from alembic import op
import sqlalchemy as sa

revision = "0004_crew_and_calendar"
down_revision = "0003_projects"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "crew_members",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("role", sa.String(120), nullable=False, server_default="crew"),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(200), nullable=True),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "crew_bookings",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("project_id", sa.Integer, nullable=False),
        sa.Column("crew_id", sa.Integer, nullable=False),
        sa.Column("start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("role", sa.String(120), nullable=False, server_default="crew"),
        sa.Column("status", sa.String(20), nullable=False, server_default="tentative"),
        sa.Column("external_event_id_google", sa.String(200), nullable=True),
        sa.Column("external_event_id_o365", sa.String(200), nullable=True),
        sa.Column("notify_email_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "calendar_accounts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, nullable=False),
        sa.Column("provider", sa.String(20), nullable=False),
        sa.Column("account_email", sa.String(200), nullable=False),
        sa.Column("access_token", sa.String(200), nullable=True),
        sa.Column("refresh_token", sa.String(200), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

def downgrade():
    op.drop_table("calendar_accounts")
    op.drop_table("crew_bookings")
    op.drop_table("crew_members")
