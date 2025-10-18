"""add_status_to_inv_items

Revision ID: 0011_add_status_to_inv_items
Revises: 0010_postgis_location_tracking
Create Date: 2025-10-14 12:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0011_add_status_to_inv_items'
down_revision = '0012'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('inv_items', sa.Column('status', sa.String(length=50), nullable=False, server_default='available'))
    # After adding the column with a default, we can remove the default if desired,
    # but for simplicity, we'll leave it for now.


def downgrade():
    op.drop_column('inv_items', 'status')

