from datetime import date, timedelta

from app.modules.inventory.models import Category, Item, MaintenanceLog
from app.modules.projects.models import Project, ProjectItem
from app.modules.reporting.repo import ReportingRepo
from app.modules.reporting.usecases import ReportingService


def test_margins_calculate_project_financials(db_session):
    repo = ReportingRepo(db_session)
    service = ReportingService(repo)

    category = Category(name='Lighting')
    db_session.add(category)
    db_session.flush()

    item = Item(
        name='LED Bar',
        category_id=category.id,
        quantity_total=10,
        min_stock=2,
        price_per_day=100,
        cost_per_day=30,
    )
    db_session.add(item)
    db_session.flush()

    project = Project(
        name='Festival',
        client_name='ACME',
        start_date=date(2024, 3, 1),
        end_date=date(2024, 3, 3),
        notes='',
    )
    db_session.add(project)
    db_session.flush()

    db_session.add(
        ProjectItem(
            project_id=project.id,
            item_id=item.id,
            qty_reserved=2,
            price_override=None,
        )
    )
    db_session.flush()

    rows = service.margins()
    assert len(rows) == 1
    row = rows[0]
    assert row.project_id == project.id
    assert row.project_name == 'Festival'
    assert row.revenue == 600.0
    assert row.cost == 180.0
    assert row.margin == 420.0
    assert row.margin_percentage == 70.0


def test_alert_summary_combines_sources(db_session):
    repo = ReportingRepo(db_session)
    service = ReportingService(repo)

    category = Category(name='Audio')
    db_session.add(category)
    db_session.flush()

    item = Item(
        name='Mixer',
        category_id=category.id,
        quantity_total=1,
        min_stock=2,
        price_per_day=50,
        cost_per_day=10,
    )
    db_session.add(item)
    db_session.flush()

    log = MaintenanceLog(item_id=item.id, due_date=date.today() + timedelta(days=3), done=False, note='Check fan')
    db_session.add(log)

    project_a = Project(name='Event A', client_name='Client', start_date=date.today(), end_date=date.today(), notes='')
    project_b = Project(name='Event B', client_name='Client', start_date=date.today(), end_date=date.today(), notes='')
    db_session.add_all([project_a, project_b])
    db_session.flush()

    db_session.add_all(
        [
            ProjectItem(project_id=project_a.id, item_id=item.id, qty_reserved=1, price_override=None),
            ProjectItem(project_id=project_b.id, item_id=item.id, qty_reserved=1, price_override=None),
        ]
    )
    db_session.flush()

    alerts = service.alert_summary()

    types = {alert.type for alert in alerts}
    assert 'maintenance' in types
    assert 'low_stock' in types
    assert 'double_booking' in types
