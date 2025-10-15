from app.modules.inventory.models import Category, Item
from app.modules.inventory.repo import InventoryRepo


def _seed_items(db_session):
    category = Category(name="Lighting")
    db_session.add(category)
    db_session.flush()

    first = Item(name="Fresnel", category_id=category.id, quantity_total=4)
    second = Item(name="Spot", category_id=category.id, quantity_total=6)
    db_session.add_all([first, second])
    db_session.flush()
    return first, second


def test_create_bundle_accepts_embedded_items(client, db_session):
    item_a, item_b = _seed_items(db_session)

    response = client.post(
        "/api/v1/inventory/bundles",
        json={
            "name": "Stage Essentials",
            "active": True,
            "items": [
                {"item_id": item_a.id, "quantity": 2},
                {"item_id": item_b.id, "quantity": 1},
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["name"] == "Stage Essentials"
    assert {entry["item_id"] for entry in payload["items"]} == {item_a.id, item_b.id}
    assert {entry["quantity"] for entry in payload["items"]} == {2, 1}

    repo = InventoryRepo(db_session)
    stored = repo.get_bundle_items(payload["id"])
    assert len(stored) == 2
    assert {link.item_id: link.quantity for link in stored} == {
        item_a.id: 2,
        item_b.id: 1,
    }
