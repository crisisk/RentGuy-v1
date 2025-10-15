from app.modules.inventory.models import BundleItem


def test_create_bundle_with_items_persists_links(client, db_session):
    category_response = client.post(
        "/api/v1/inventory/categories",
        json={"name": "Lighting"},
    )
    assert category_response.status_code == 200
    category_id = category_response.json()["id"]

    item_response = client.post(
        "/api/v1/inventory/items",
        json={
            "name": "Moving Head",
            "category_id": category_id,
            "quantity_total": 4,
        },
    )
    assert item_response.status_code == 200
    item_id = item_response.json()["id"]

    bundle_response = client.post(
        "/api/v1/inventory/bundles",
        json={
            "name": "Stage Kit",
            "active": True,
            "items": [
                {
                    "item_id": item_id,
                    "quantity": 2,
                }
            ],
        },
    )
    assert bundle_response.status_code == 200
    payload = bundle_response.json()

    assert payload["name"] == "Stage Kit"
    assert payload["items"] == [{"item_id": item_id, "quantity": 2}]

    links = db_session.query(BundleItem).all()
    assert len(links) == 1
    link = links[0]
    assert link.bundle_id == payload["id"]
    assert link.item_id == item_id
    assert link.quantity == 2
