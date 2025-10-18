"""Add all new modules (Customer Portal, Recurring Invoices, Jobboard, Booking, Scanning, Sub-Renting)

Revision ID: 0012
Revises: 0011
Create Date: 2025-10-14 09:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0012'
down_revision = '0011'
branch_labels = None
depends_on = None


def upgrade():
    # ============================================
    # Customer Portal Module
    # ============================================
    op.create_table(
        'customer_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(255), nullable=True),
        sa.Column('vat_number', sa.String(50), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('postal_code', sa.String(20), nullable=True),
        sa.Column('country', sa.String(2), nullable=False, server_default='NL'),
        sa.Column('preferences', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('idx_customer_profiles_user_id', 'customer_profiles', ['user_id'])

    op.create_table(
        'customer_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(50), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_customer_documents_user_id', 'customer_documents', ['user_id'])
    op.create_index('idx_customer_documents_type', 'customer_documents', ['document_type'])

    # ============================================
    # Recurring Invoices Module
    # ============================================
    op.create_table(
        'recurring_invoice_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('template_name', sa.String(255), nullable=False),
        sa.Column('frequency', sa.String(20), nullable=False),  # monthly, quarterly, yearly
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('next_invoice_date', sa.Date(), nullable=False),
        sa.Column('items', postgresql.JSONB(), nullable=False),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('tax_rate', sa.Numeric(5, 2), nullable=False, server_default='21.00'),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE')
    )
    op.create_index('idx_recurring_templates_customer', 'recurring_invoice_templates', ['customer_id'])
    op.create_index('idx_recurring_templates_status', 'recurring_invoice_templates', ['status'])
    op.create_index('idx_recurring_templates_next_date', 'recurring_invoice_templates', ['next_invoice_date'])

    op.create_table(
        'recurring_invoice_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=True),
        sa.Column('generated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['template_id'], ['recurring_invoice_templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='SET NULL')
    )
    op.create_index('idx_recurring_history_template', 'recurring_invoice_history', ['template_id'])

    # ============================================
    # Jobboard Module
    # ============================================
    op.create_table(
        'job_postings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('requirements', sa.Text(), nullable=True),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('hourly_rate', sa.Numeric(10, 2), nullable=True),
        sa.Column('positions_available', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(20), nullable=False, server_default='open'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_job_postings_status', 'job_postings', ['status'])
    op.create_index('idx_job_postings_start_date', 'job_postings', ['start_date'])

    op.create_table(
        'job_applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('crew_member_id', sa.Integer(), nullable=False),
        sa.Column('cover_letter', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('applied_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['job_id'], ['job_postings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['crew_member_id'], ['crew_members.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('job_id', 'crew_member_id', name='uq_job_application')
    )
    op.create_index('idx_job_applications_job', 'job_applications', ['job_id'])
    op.create_index('idx_job_applications_crew', 'job_applications', ['crew_member_id'])
    op.create_index('idx_job_applications_status', 'job_applications', ['status'])

    # ============================================
    # Online Booking Module
    # ============================================
    op.create_table(
        'booking_themes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('primary_color', sa.String(7), nullable=False),
        sa.Column('secondary_color', sa.String(7), nullable=False),
        sa.Column('accent_color', sa.String(7), nullable=False),
        sa.Column('font_family', sa.String(100), nullable=False),
        sa.Column('logo_url', sa.String(500), nullable=True),
        sa.Column('custom_css', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    op.create_table(
        'online_bookings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_reference', sa.String(20), nullable=False),
        sa.Column('customer_email', sa.String(255), nullable=False),
        sa.Column('customer_name', sa.String(255), nullable=False),
        sa.Column('customer_phone', sa.String(20), nullable=True),
        sa.Column('equipment_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('payment_status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('payment_id', sa.String(100), nullable=True),
        sa.Column('booking_status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('theme_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['equipment_id'], ['inv_items.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['theme_id'], ['booking_themes.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('booking_reference')
    )
    op.create_index('idx_online_bookings_reference', 'online_bookings', ['booking_reference'])
    op.create_index('idx_online_bookings_email', 'online_bookings', ['customer_email'])
    op.create_index('idx_online_bookings_status', 'online_bookings', ['booking_status'])
    op.create_index('idx_online_bookings_dates', 'online_bookings', ['start_date', 'end_date'])

    # ============================================
    # Barcode/QR Scanning Module
    # ============================================
    op.create_table(
        'scan_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('equipment_id', sa.Integer(), nullable=False),
        sa.Column('scanned_by', sa.Integer(), nullable=False),
        sa.Column('scan_type', sa.String(20), nullable=False),  # check_in, check_out, inventory
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('scanned_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['equipment_id'], ['inv_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['scanned_by'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_scan_history_equipment', 'scan_history', ['equipment_id'])
    op.create_index('idx_scan_history_user', 'scan_history', ['scanned_by'])
    op.create_index('idx_scan_history_type', 'scan_history', ['scan_type'])
    op.create_index('idx_scan_history_date', 'scan_history', ['scanned_at'])

    # ============================================
    # Sub-Renting Module
    # ============================================
    op.create_table(
        'partners',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('contact_name', sa.String(255), nullable=False),
        sa.Column('contact_email', sa.String(255), nullable=False),
        sa.Column('contact_phone', sa.String(20), nullable=True),
        sa.Column('api_key', sa.String(100), nullable=True),
        sa.Column('api_endpoint', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('commission_rate', sa.Numeric(5, 2), nullable=False, server_default='10.00'),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('contact_email'),
        sa.UniqueConstraint('api_key')
    )
    op.create_index('idx_partners_status', 'partners', ['status'])

    op.create_table(
        'partner_equipment',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('partner_id', sa.Integer(), nullable=False),
        sa.Column('external_id', sa.String(100), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('daily_rate', sa.Numeric(10, 2), nullable=False),
        sa.Column('availability_status', sa.String(20), nullable=False, server_default='available'),
        sa.Column('last_sync_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['partner_id'], ['partners.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('partner_id', 'external_id', name='uq_partner_equipment')
    )
    op.create_index('idx_partner_equipment_partner', 'partner_equipment', ['partner_id'])
    op.create_index('idx_partner_equipment_status', 'partner_equipment', ['availability_status'])

    op.create_table(
        'subrenting_bookings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('partner_equipment_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('daily_rate', sa.Numeric(10, 2), nullable=False),
        sa.Column('total_cost', sa.Numeric(10, 2), nullable=False),
        sa.Column('commission_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('external_booking_id', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['partner_equipment_id'], ['partner_equipment.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL')
    )
    op.create_index('idx_subrenting_bookings_equipment', 'subrenting_bookings', ['partner_equipment_id'])
    op.create_index('idx_subrenting_bookings_project', 'subrenting_bookings', ['project_id'])
    op.create_index('idx_subrenting_bookings_status', 'subrenting_bookings', ['status'])
    op.create_index('idx_subrenting_bookings_dates', 'subrenting_bookings', ['start_date', 'end_date'])


def downgrade():
    # Drop tables in reverse order (respecting foreign key constraints)
    op.drop_table('subrenting_bookings')
    op.drop_table('partner_equipment')
    op.drop_table('partners')
    op.drop_table('scan_history')
    op.drop_table('online_bookings')
    op.drop_table('booking_themes')
    op.drop_table('job_applications')
    op.drop_table('job_postings')
    op.drop_table('recurring_invoice_history')
    op.drop_table('recurring_invoice_templates')
    op.drop_table('customer_documents')
    op.drop_table('customer_profiles')

