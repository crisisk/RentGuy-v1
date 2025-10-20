from datetime import datetime, timedelta, timezone

import pytest

from app.modules.booking.models import Equipment, EquipmentStatus, Reservation


@pytest.fixture()
def equipment(db_session):
    item = Equipment(
        name="Cinema Camera",
        description="8K cinema camera",
        status=EquipmentStatus.AVAILABLE,
        hourly_rate=50.0,
        capacity=1,
        attributes={},
    )
    db_session.add(item)
    db_session.commit()
    return item


def test_create_reservation_success(client, db_session, equipment):
    start = datetime.now(timezone.utc) + timedelta(hours=1)
    end = start + timedelta(hours=2)

    response = client.post(
        "/api/v1/booking/reservations",
        json={
            "equipment_id": equipment.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["equipment_id"] == equipment.id
    assert not payload["cancelled"]

    stored = db_session.get(Reservation, payload["id"])
    assert stored is not None
    # SQLite stores naive datetimes, compare using naive values
    assert stored.start_time == start.replace(tzinfo=None)


def test_reservation_conflict(client, db_session, equipment):
    start = datetime.now(timezone.utc) + timedelta(hours=1)
    end = start + timedelta(hours=2)

    response = client.post(
        "/api/v1/booking/reservations",
        json={
            "equipment_id": equipment.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
    )
    assert response.status_code == 200

    conflict_response = client.post(
        "/api/v1/booking/reservations",
        json={
            "equipment_id": equipment.id,
            "start_time": (start + timedelta(minutes=30)).isoformat(),
            "end_time": (end + timedelta(hours=1)).isoformat(),
        },
    )

    assert conflict_response.status_code == 409
    assert "not available" in conflict_response.json()["detail"].lower()


def test_process_payment_creates_record(client, db_session, equipment):
    start = datetime.now(timezone.utc) + timedelta(hours=1)
    end = start + timedelta(hours=1)

    reservation_response = client.post(
        "/api/v1/booking/reservations",
        json={
            "equipment_id": equipment.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
    )
    reservation_id = reservation_response.json()["id"]

    payment_response = client.post(
        "/api/v1/booking/payments",
        json={
            "reservation_id": reservation_id,
            "amount": 75.0,
            "payment_method": "credit_card",
            "token": "tok_test",
        },
    )

    assert payment_response.status_code == 200
    data = payment_response.json()
    assert data["reservation_id"] == reservation_id
    assert data["status"] == "completed"
    assert data["amount"] == pytest.approx(75.0)

    refreshed_reservation = db_session.get(Reservation, reservation_id)
    db_session.refresh(refreshed_reservation)
    assert refreshed_reservation.payment is not None
