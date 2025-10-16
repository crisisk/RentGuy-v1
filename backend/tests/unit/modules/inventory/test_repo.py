"""Unit tests for :mod:`app.modules.inventory.repo`."""

from __future__ import annotations

from datetime import date

import pytest
from sqlalchemy.orm import Session

from app.modules.inventory.models import Bundle, BundleItem, Category, Item, MaintenanceLog
from app.modules.inventory.repo import InventoryRepo
from app.modules.projects.models import Project, ProjectItem


def _create_category(session: Session, name: str = "Lighting") -> Category:
    category = Category(name=name)
    session.add(category)
    session.flush()
    return category


def _create_item(session: Session, category: Category, name: str = "LED Panel", quantity: int = 5) -> Item:
    item = Item(name=name, category_id=category.id, quantity_total=quantity)
    session.add(item)
    session.flush()
    return item


def test_upsert_category_returns_existing_instance(db_session: Session) -> None:
    repo = InventoryRepo(db_session)

    first = repo.upsert_category("Audio")
    second = repo.upsert_category("Audio")

    assert first.id == second.id


def test_delete_item_optionally_raises_for_missing_records(db_session: Session) -> None:
    repo = InventoryRepo(db_session)

    assert repo.delete_item(1234) is False

    with pytest.raises(LookupError):
        repo.delete_item(1234, raise_if_missing=True)


def test_delete_item_removes_record(db_session: Session) -> None:
    repo = InventoryRepo(db_session)
    category = _create_category(db_session)
    item = _create_item(db_session, category)

    assert repo.delete_item(item.id) is True
    assert repo.get_item(item.id) is None


def test_get_item_by_id_matches_get_item(db_session: Session) -> None:
    repo = InventoryRepo(db_session)
    category = _create_category(db_session, "Power")
    item = _create_item(db_session, category, name="Extension Cord", quantity=3)

    assert repo.get_item(item.id) == repo.get_item_by_id(item.id)


def test_calc_available_validates_date_window(db_session: Session) -> None:
    repo = InventoryRepo(db_session)

    with pytest.raises(ValueError):
        repo.calc_available(1, date(2024, 5, 10), date(2024, 5, 1))


def test_calc_available_respects_strict_mode(db_session: Session) -> None:
    repo = InventoryRepo(db_session)

    assert repo.calc_available(99, date(2024, 1, 1), date(2024, 1, 2)) == 0

    with pytest.raises(LookupError):
        repo.calc_available(99, date(2024, 1, 1), date(2024, 1, 2), strict=True)


def test_calc_available_returns_total_quantity(db_session: Session) -> None:
    repo = InventoryRepo(db_session)
    category = _create_category(db_session, "Staging")
    item = _create_item(db_session, category, quantity=7)

    assert repo.calc_available(item.id, date(2024, 5, 1), date(2024, 5, 2)) == 7


def test_calc_available_subtracts_project_reservations(db_session: Session) -> None:
    repo = InventoryRepo(db_session)
    category = _create_category(db_session, "Events")
    item = _create_item(db_session, category, name="Stage Deck", quantity=6)
    other_item = _create_item(db_session, category, name="Cable Loom", quantity=10)

    project_one = Project(
        name="Festival Build Day",
        client_name="ACME",
        start_date=date(2024, 5, 1),
        end_date=date(2024, 5, 3),
        notes="",
    )
    project_two = Project(
        name="Soundcheck",
        client_name="ACME",
        start_date=date(2024, 5, 2),
        end_date=date(2024, 5, 4),
        notes="",
    )
    project_future = Project(
        name="Summer Event",
        client_name="ACME",
        start_date=date(2024, 6, 10),
        end_date=date(2024, 6, 12),
        notes="",
    )
    project_other_item = Project(
        name="Other Gear",
        client_name="ACME",
        start_date=date(2024, 5, 1),
        end_date=date(2024, 5, 3),
        notes="",
    )

    db_session.add_all([project_one, project_two, project_future, project_other_item])
    db_session.flush()

    db_session.add_all(
        [
            ProjectItem(project_id=project_one.id, item_id=item.id, qty_reserved=4),
            ProjectItem(project_id=project_two.id, item_id=item.id, qty_reserved=5),
            ProjectItem(project_id=project_future.id, item_id=item.id, qty_reserved=2),
            ProjectItem(project_id=project_other_item.id, item_id=other_item.id, qty_reserved=7),
        ]
    )
    db_session.flush()

    available = repo.calc_available(item.id, date(2024, 5, 2), date(2024, 5, 3))

    assert available == 0


def test_log_maintenance_persists_entry(db_session: Session) -> None:
    repo = InventoryRepo(db_session)
    category = _create_category(db_session, "Maintenance")
    item = _create_item(db_session, category)

    log_entry = MaintenanceLog(item_id=item.id, note="Replaced bulbs")
    repo.log_maintenance(log_entry)

    assert log_entry.id is not None


def test_bundle_helpers_round_trip(db_session: Session) -> None:
    repo = InventoryRepo(db_session)
    category = _create_category(db_session, "Bundles")
    item = _create_item(db_session, category)

    bundle = repo.add_bundle(Bundle(name="Stage Kit"))
    link = repo.add_bundle_item(BundleItem(bundle_id=bundle.id, item_id=item.id, quantity=2))

    assert link.id is not None
    assert repo.get_bundle_items(bundle.id) == [link]
