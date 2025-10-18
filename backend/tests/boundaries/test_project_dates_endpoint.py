from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.modules.inventory.models import Category, Item
from app.modules.projects.models import Project, ProjectItem


def seed_inventory(session: Session) -> Item:
    category = Category(name='Audio')
    session.add(category)
    session.flush()

    item = Item(
        name='Line Array Speaker',
        category_id=category.id,
        quantity_total=10,
        min_stock=0,
        active=True,
        price_per_day=Decimal('125.00'),
    )
    session.add(item)
    session.flush()
    return item


def seed_project(session: Session, **kwargs) -> Project:
    project = Project(**kwargs)
    session.add(project)
    session.flush()
    return project


def add_reservation(session: Session, project: Project, item: Item, qty: int) -> ProjectItem:
    reservation = ProjectItem(project_id=project.id, item_id=item.id, qty_reserved=qty)
    session.add(reservation)
    session.flush()
    return reservation


def test_update_project_dates_succeeds(client, db_session: Session):
    item = seed_inventory(db_session)

    today = date.today()
    original_start = today + timedelta(days=5)
    original_end = today + timedelta(days=7)

    project = seed_project(
        db_session,
        name='Main Stage Setup',
        client_name='Sevensa Events',
        start_date=original_start,
        end_date=original_end,
        notes='Initial planning',
    )
    add_reservation(db_session, project, item, qty=3)
    db_session.commit()

    new_start = original_start + timedelta(days=3)
    new_end = original_end + timedelta(days=5)

    response = client.put(
        f'/api/v1/projects/{project.id}/dates',
        json={
            'name': 'Main Stage Setup',
            'client_name': 'Sevensa Events',
            'start_date': new_start.isoformat(),
            'end_date': new_end.isoformat(),
            'notes': 'Initial planning',
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['start_date'] == new_start.isoformat()
    assert payload['end_date'] == new_end.isoformat()
    assert payload['duration_days'] == (new_end - new_start).days + 1

    expected_days_until_start = max((new_start - today).days, 0)
    assert payload['days_until_start'] == expected_days_until_start

    db_session.expire_all()
    updated = db_session.get(Project, project.id)
    assert updated.start_date == new_start
    assert updated.end_date == new_end


def test_update_project_dates_conflict_returns_409(client, db_session: Session):
    item = seed_inventory(db_session)

    today = date.today()
    project_a = seed_project(
        db_session,
        name='Arena Show',
        client_name='Northwind',
        start_date=today + timedelta(days=10),
        end_date=today + timedelta(days=12),
        notes='Requires premium rigging',
    )
    add_reservation(db_session, project_a, item, qty=7)

    project_b = seed_project(
        db_session,
        name='City Festival',
        client_name='City Council',
        start_date=today + timedelta(days=11),
        end_date=today + timedelta(days=14),
        notes='Outdoor logistics',
    )
    add_reservation(db_session, project_b, item, qty=4)
    db_session.commit()

    response = client.put(
        f'/api/v1/projects/{project_a.id}/dates',
        json={
            'name': 'Arena Show',
            'client_name': 'Northwind',
            'start_date': (today + timedelta(days=11)).isoformat(),
            'end_date': (today + timedelta(days=13)).isoformat(),
            'notes': 'Requires premium rigging',
        },
    )

    assert response.status_code == 409
    detail = response.json()['detail']
    assert detail['error'] == 'insufficient_stock_on_move'
    assert detail['details']
    first_detail = detail['details'][0]
    assert first_detail['item_id'] == item.id
    assert first_detail['requested'] == 7
    assert first_detail['available'] == 6
