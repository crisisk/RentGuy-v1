"""postgis_location_tracking

Revision ID: 0010_postgis_location_tracking
Revises: 0009_role_selection_pending_role
Create Date: 2025-10-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision = '0010_postgis_location_tracking'
down_revision = '0009_role_selection_pending_role'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Enable PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 2. Create the Location table
    op.create_table(
        'locations',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('auth_users.id'), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        # Use Geometry type for geospatial data
        sa.Column('geom', Geometry(geometry_type='POINT', srid=4326), nullable=False),
        sa.Column('accuracy', sa.Float, nullable=True),
        sa.Column('speed', sa.Float, nullable=True),
        sa.Column('heading', sa.Float, nullable=True),
        sa.Column('project_id', sa.Integer, sa.ForeignKey('prj_projects.id'), nullable=True),
        sa.UniqueConstraint('user_id', name='uq_locations_user_id')
    )

    # 3. Create a spatial index for performance
    # NOTE: PostGIS automatically creates a spatial index on geometry columns
    # op.create_index('idx_locations_geom', 'locations', ['geom'], unique=False, postgresql_using='gist')


def downgrade():
    # 1. Drop the spatial index (commented out as it's auto-created by PostGIS)
    # op.drop_index('idx_locations_geom', table_name='locations', postgresql_using='gist')

    # 2. Drop the Location table
    op.drop_table('locations')

    # 3. Note: We generally do not drop the PostGIS extension in a downgrade
    # unless it was created solely for this feature and is not used elsewhere.
    # For safety, we will leave the extension enabled.
    pass

