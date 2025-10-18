#!/usr/bin/env python3
"""
CRM Seed Data Script for Mr-DJ Tenant
Seeds pipelines, stages, and demo leads for testing
"""
import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal

# Add the app directory to the path
sys.path.insert(0, '/app')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://rentguy:rentguy@rentguy-db-prod:5432/rentguy_production')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def seed_mrdj_crm():
    """Seed CRM data for Mr-DJ tenant"""
    session = Session()

    try:
        print("🚀 Starting CRM seed for Mr-DJ tenant...")

        # 1. Create Main Pipeline
        print("\n📋 Creating Wedding Sales Pipeline...")
        pipeline_id = session.execute(text("""
            INSERT INTO crm_pipelines (tenant_id, name, is_default)
            VALUES ('mrdj', 'Wedding Sales', true)
            ON CONFLICT DO NOTHING
            RETURNING id
        """)).fetchone()

        if not pipeline_id:
            # Pipeline already exists, fetch it
            pipeline_id = session.execute(text("""
                SELECT id FROM crm_pipelines WHERE tenant_id = 'mrdj' AND name = 'Wedding Sales'
            """)).fetchone()

        pipeline_id = pipeline_id[0]
        print(f"   ✅ Pipeline created with ID: {pipeline_id}")

        # 2. Create Pipeline Stages
        print("\n📊 Creating Pipeline Stages...")
        stages = [
            ('Nieuwe Lead', 0, 'lead_intake'),
            ('Oriëntatie Gesprek', 1, None),
            ('Offerte Uitgebracht', 2, 'proposal_followup'),
            ('Onderhandeling', 3, None),
            ('Deal Gesloten', 4, None),
            ('Event Planning', 5, None),
            ('Event Uitgevoerd', 6, 'post_event_care'),
            ('Afgerond', 7, None),
        ]

        stage_ids = {}
        for name, order, automation in stages:
            result = session.execute(text("""
                INSERT INTO crm_pipeline_stages (pipeline_id, name, "order", automation_flow)
                VALUES (:pipeline_id, :name, :order, :automation)
                ON CONFLICT DO NOTHING
                RETURNING id
            """), {
                'pipeline_id': pipeline_id,
                'name': name,
                'order': order,
                'automation': automation
            }).fetchone()

            if not result:
                # Stage already exists, fetch it
                result = session.execute(text("""
                    SELECT id FROM crm_pipeline_stages
                    WHERE pipeline_id = :pipeline_id AND name = :name
                """), {'pipeline_id': pipeline_id, 'name': name}).fetchone()

            stage_ids[name] = result[0]
            print(f"   ✅ Stage '{name}' created (ID: {result[0]})")

        session.commit()

        # 3. Create Demo Leads
        print("\n👥 Creating Demo Leads...")
        demo_leads = [
            {
                'name': 'Lisa & Mark van den Berg',
                'email': 'lisa.vandenberg@example.nl',
                'phone': '+31612345678',
                'source': 'website_form',
                'status': 'new'
            },
            {
                'name': 'Sophie & Thomas Janssen',
                'email': 'sophie.janssen@example.nl',
                'phone': '+31687654321',
                'source': 'instagram',
                'status': 'contacted'
            },
            {
                'name': 'Emma & Lukas de Vries',
                'email': 'emma.devries@example.nl',
                'phone': '+31623456789',
                'source': 'referral',
                'status': 'qualified'
            },
            {
                'name': 'Julia & Mike Peters',
                'email': 'julia.peters@example.nl',
                'phone': '+31698765432',
                'source': 'google_ads',
                'status': 'new'
            },
        ]

        lead_ids = []
        for lead_data in demo_leads:
            result = session.execute(text("""
                INSERT INTO crm_leads (tenant_id, name, email, phone, source, status, created_at, updated_at)
                VALUES ('mrdj', :name, :email, :phone, :source, :status, NOW(), NOW())
                RETURNING id
            """), lead_data).fetchone()

            lead_ids.append(result[0])
            print(f"   ✅ Lead '{lead_data['name']}' created (ID: {result[0]})")

        session.commit()

        # 4. Create Demo Deals
        print("\n💼 Creating Demo Deals...")
        demo_deals = [
            {
                'lead_id': lead_ids[0],
                'stage': 'Offerte Uitgebracht',
                'title': 'Bruiloft Lisa & Mark - Juli 2025',
                'value': 8500.00,
                'expected_close': (datetime.now() + timedelta(days=30)).date(),
                'probability': 70
            },
            {
                'lead_id': lead_ids[1],
                'stage': 'Oriëntatie Gesprek',
                'title': 'Bruiloft Sophie & Thomas - September 2025',
                'value': 12000.00,
                'expected_close': (datetime.now() + timedelta(days=45)).date(),
                'probability': 50
            },
            {
                'lead_id': lead_ids[2],
                'stage': 'Deal Gesloten',
                'title': 'Bruiloft Emma & Lukas - Juni 2025',
                'value': 15000.00,
                'expected_close': (datetime.now() + timedelta(days=15)).date(),
                'probability': 100
            },
        ]

        for deal_data in demo_deals:
            stage_id = stage_ids[deal_data.pop('stage')]

            result = session.execute(text("""
                INSERT INTO crm_deals (
                    tenant_id, lead_id, pipeline_id, stage_id,
                    title, value, currency, expected_close, probability, status,
                    created_at, updated_at
                )
                VALUES (
                    'mrdj', :lead_id, :pipeline_id, :stage_id,
                    :title, :value, 'EUR', :expected_close, :probability, 'open',
                    NOW(), NOW()
                )
                RETURNING id
            """), {
                **deal_data,
                'pipeline_id': pipeline_id,
                'stage_id': stage_id
            }).fetchone()

            print(f"   ✅ Deal '{deal_data['title']}' created (ID: {result[0]})")

        session.commit()

        # 5. Create Sample Activities
        print("\n📝 Creating Sample Activities...")

        # Get the first deal ID to add activities to
        first_deal = session.execute(text("""
            SELECT id FROM crm_deals WHERE tenant_id = 'mrdj' LIMIT 1
        """)).fetchone()

        if first_deal:
            activities = [
                {
                    'deal_id': first_deal[0],
                    'activity_type': 'email',
                    'summary': 'Welkomst email verstuurd',
                    'payload': 'Introductie email met portfolio en tarieven'
                },
                {
                    'deal_id': first_deal[0],
                    'activity_type': 'call',
                    'summary': 'Telefonisch contact - wensen besproken',
                    'payload': 'Bruiloft voor 150 gasten, live muziek gewenst'
                },
                {
                    'deal_id': first_deal[0],
                    'activity_type': 'meeting',
                    'summary': 'Kennismakingsgesprek locatie',
                    'payload': 'Kennisgemaakt, muziekvoorkeuren doorgenomen'
                },
            ]

            for activity in activities:
                session.execute(text("""
                    INSERT INTO crm_activities (
                        tenant_id, deal_id, activity_type, summary, payload,
                        occurred_at, created_at
                    )
                    VALUES (
                        'mrdj', :deal_id, :activity_type, :summary, :payload,
                        NOW() - INTERVAL '1 day' * :days_ago, NOW()
                    )
                """), {**activity, 'days_ago': len(activities) - activities.index(activity)})

                print(f"   ✅ Activity '{activity['summary']}' created")

        session.commit()

        # 6. Summary Statistics
        print("\n📊 Database Summary:")
        stats = session.execute(text("""
            SELECT
                (SELECT COUNT(*) FROM crm_pipelines WHERE tenant_id = 'mrdj') as pipelines,
                (SELECT COUNT(*) FROM crm_pipeline_stages WHERE pipeline_id = :pipeline_id) as stages,
                (SELECT COUNT(*) FROM crm_leads WHERE tenant_id = 'mrdj') as leads,
                (SELECT COUNT(*) FROM crm_deals WHERE tenant_id = 'mrdj') as deals,
                (SELECT COUNT(*) FROM crm_activities WHERE tenant_id = 'mrdj') as activities,
                (SELECT COALESCE(SUM(value), 0) FROM crm_deals WHERE tenant_id = 'mrdj') as total_value
        """), {'pipeline_id': pipeline_id}).fetchone()

        print(f"""
   ✅ Pipelines:  {stats[0]}
   ✅ Stages:     {stats[1]}
   ✅ Leads:      {stats[2]}
   ✅ Deals:      {stats[3]}
   ✅ Activities: {stats[4]}
   ✅ Total Deal Value: €{float(stats[5]):,.2f}
        """)

        print("\n✅ CRM seed data successfully created for Mr-DJ tenant!")
        print("\n🎯 Next steps:")
        print("   1. Login to https://mr-dj.rentguy.nl")
        print("   2. Navigate to CRM section")
        print("   3. View your leads and deals")
        print("   4. Test the pipeline workflow")

        return True

    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        session.rollback()
        import traceback
        traceback.print_exc()
        return False

    finally:
        session.close()

if __name__ == '__main__':
    success = seed_mrdj_crm()
    sys.exit(0 if success else 1)
