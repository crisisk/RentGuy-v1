from app.modules.inventory.models import Bundle, BundleItem, Category, Item
from app.modules.warehouse.models import ItemTag


def _setup_bundle(db_session):
    category = Category(name='Staging')
    db_session.add(category)
    db_session.flush()

    moving_head = Item(
        name='Moving Head',
        category_id=category.id,
        quantity_total=10,
        min_stock=1,
        price_per_day=50,
        cost_per_day=10,
    )
    hazer = Item(
        name='Hazer',
        category_id=category.id,
        quantity_total=5,
        min_stock=1,
        price_per_day=30,
        cost_per_day=8,
    )
    db_session.add_all([moving_head, hazer])
    db_session.flush()

    bundle = Bundle(name='Stage Kit', active=True)
    db_session.add(bundle)
    db_session.flush()

    db_session.add_all(
        [
            BundleItem(bundle_id=bundle.id, item_id=moving_head.id, quantity=2),
            BundleItem(bundle_id=bundle.id, item_id=hazer.id, quantity=1),
        ]
    )
    db_session.add(ItemTag(tag_value='BND-001', bundle_id=bundle.id, item_id=None, active=True))
    db_session.flush()

    return bundle, {moving_head.id: 2, hazer.id: 1}


def test_scan_bundle_requires_mode(client, db_session):
    _setup_bundle(db_session)

    response = client.post(
        '/api/v1/warehouse/scan',
        json={'tag_value': 'BND-001', 'direction': 'out', 'project_id': 1, 'qty': 1},
    )

    assert response.status_code == 409
    payload = response.json()
    assert payload['detail']['code'] == 'bundle_mode_required'
    assert payload['detail']['resolution']['kind'] == 'bundle'


def test_scan_bundle_explode_creates_component_movements(client, db_session):
    bundle, quantities = _setup_bundle(db_session)

    response = client.post(
        '/api/v1/warehouse/scan',
        json={
            'tag_value': 'BND-001',
            'direction': 'out',
            'project_id': 5,
            'qty': 1,
            'bundle_mode': 'explode',
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['resolution']['kind'] == 'bundle'
    assert payload['resolution']['bundle_id'] == bundle.id
    assert len(payload['movements']) == len(quantities)
    for movement in payload['movements']:
        assert movement['item_id'] in quantities
        assert movement['bundle_id'] == bundle.id
        assert movement['project_id'] == 5
        assert movement['quantity'] == quantities[movement['item_id']] * 1


def test_scan_item_creates_single_movement(client, db_session):
    category = Category(name='Generic')
    db_session.add(category)
    db_session.flush()

    item = Item(
        name='Microphone',
        category_id=category.id,
        quantity_total=5,
        min_stock=1,
        price_per_day=15,
        cost_per_day=5,
    )
    db_session.add(item)
    db_session.flush()

    db_session.add(ItemTag(tag_value='ITEM-1', item_id=item.id, bundle_id=None, active=True))
    db_session.flush()

    response = client.post(
        '/api/v1/warehouse/scan',
        json={'tag_value': 'ITEM-1', 'direction': 'in', 'project_id': 9, 'qty': 3},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['resolution']['kind'] == 'item'
    assert len(payload['movements']) == 1
    movement = payload['movements'][0]
    assert movement['item_id'] == item.id
    assert movement['bundle_id'] is None
    assert movement['quantity'] == 3
    assert movement['direction'] == 'in'
