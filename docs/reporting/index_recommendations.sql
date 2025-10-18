-- Transport domain
CREATE UNIQUE INDEX IF NOT EXISTS ix_veh_vehicles_plate ON veh_vehicles (plate);
CREATE INDEX IF NOT EXISTS ix_veh_routes_date ON veh_routes (date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_veh_route_stop_sequence ON veh_route_stops (route_id, sequence);

-- Billing domain
CREATE INDEX IF NOT EXISTS ix_bil_invoices_issued_at ON bil_invoices (issued_at);
CREATE INDEX IF NOT EXISTS ix_bil_payments_provider ON bil_payments (provider, status);

-- Warehouse + inventory to support reporting queries
CREATE INDEX IF NOT EXISTS ix_inv_items_category_id ON inv_items (category_id);
CREATE INDEX IF NOT EXISTS ix_wh_movements_bundle ON wh_movements (bundle_id);
CREATE INDEX IF NOT EXISTS ix_wh_item_tags_tag_value ON wh_item_tags (tag_value);
