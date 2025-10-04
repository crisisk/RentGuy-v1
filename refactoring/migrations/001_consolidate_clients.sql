-- Fase 1: Klantenbeheer Consolidatie
-- Migratiescript voor het consolideren van klantdata van RentGuy naar Invoice Ninja

-- Stap 1: Backup van bestaande data
CREATE TABLE IF NOT EXISTS rentguy_clients_backup AS SELECT * FROM rentguy_clients;
CREATE TABLE IF NOT EXISTS invoiceninja_clients_backup AS SELECT * FROM invoiceninja_clients;

-- Stap 2: Uitbreiden van Invoice Ninja clients tabel met RentGuy specifieke velden
ALTER TABLE invoiceninja_clients 
ADD COLUMN IF NOT EXISTS rental_preferences TEXT,
ADD COLUMN IF NOT EXISTS equipment_history JSON,
ADD COLUMN IF NOT EXISTS preferred_delivery_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS rental_credit_limit DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rental_status ENUM('active', 'suspended', 'pending_approval') DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_rental_date DATETIME,
ADD COLUMN IF NOT EXISTS total_rental_value DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS damage_history JSON,
ADD COLUMN IF NOT EXISTS preferred_payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS rental_notes TEXT;

-- Stap 3: Data mapping en migratie van RentGuy naar Invoice Ninja
INSERT INTO invoiceninja_clients (
    name, 
    email, 
    phone, 
    address1, 
    address2, 
    city, 
    state, 
    postal_code, 
    country_id,
    website,
    vat_number,
    id_number,
    custom_value1,
    custom_value2,
    custom_value3,
    custom_value4,
    rental_preferences,
    equipment_history,
    preferred_delivery_location,
    rental_credit_limit,
    rental_status,
    last_rental_date,
    total_rental_value,
    damage_history,
    preferred_payment_method,
    rental_notes,
    created_at,
    updated_at
)
SELECT 
    COALESCE(rg.company_name, CONCAT(rg.first_name, ' ', rg.last_name)) as name,
    rg.email,
    rg.phone,
    rg.address,
    rg.address_line_2,
    rg.city,
    rg.state,
    rg.postal_code,
    1 as country_id, -- Default to Nederland
    rg.website,
    rg.vat_number,
    rg.registration_number,
    rg.industry,
    rg.company_size,
    rg.preferred_contact_method,
    rg.account_manager,
    rg.rental_preferences,
    rg.equipment_history,
    rg.preferred_delivery_location,
    rg.credit_limit,
    CASE 
        WHEN rg.status = 'active' THEN 'active'
        WHEN rg.status = 'inactive' THEN 'suspended'
        ELSE 'pending_approval'
    END as rental_status,
    rg.last_rental_date,
    rg.total_spent,
    rg.damage_reports,
    rg.preferred_payment_method,
    rg.notes,
    rg.created_at,
    rg.updated_at
FROM rentguy_clients rg
WHERE rg.email NOT IN (SELECT email FROM invoiceninja_clients WHERE email IS NOT NULL)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    phone = VALUES(phone),
    address1 = VALUES(address1),
    address2 = VALUES(address2),
    city = VALUES(city),
    state = VALUES(state),
    postal_code = VALUES(postal_code),
    website = VALUES(website),
    vat_number = VALUES(vat_number),
    rental_preferences = VALUES(rental_preferences),
    equipment_history = VALUES(equipment_history),
    preferred_delivery_location = VALUES(preferred_delivery_location),
    rental_credit_limit = VALUES(rental_credit_limit),
    rental_status = VALUES(rental_status),
    last_rental_date = VALUES(last_rental_date),
    total_rental_value = VALUES(total_rental_value),
    damage_history = VALUES(damage_history),
    preferred_payment_method = VALUES(preferred_payment_method),
    rental_notes = VALUES(rental_notes),
    updated_at = NOW();

-- Stap 4: Update relaties in andere tabellen
-- Update rental_agreements tabel
UPDATE rental_agreements ra
JOIN rentguy_clients rg ON ra.client_id = rg.id
JOIN invoiceninja_clients inc ON rg.email = inc.email
SET ra.client_id = inc.id;

-- Update invoices tabel
UPDATE invoices i
JOIN rentguy_clients rg ON i.client_id = rg.id
JOIN invoiceninja_clients inc ON rg.email = inc.email
SET i.client_id = inc.id;

-- Update quotes tabel
UPDATE quotes q
JOIN rentguy_clients rg ON q.client_id = rg.id
JOIN invoiceninja_clients inc ON rg.email = inc.email
SET q.client_id = inc.id;

-- Stap 5: Validatie van de migratie
-- Controleer of alle klanten zijn gemigreerd
SELECT 
    'RentGuy Clients' as source,
    COUNT(*) as total_count
FROM rentguy_clients
UNION ALL
SELECT 
    'Invoice Ninja Clients (after migration)' as source,
    COUNT(*) as total_count
FROM invoiceninja_clients
WHERE rental_preferences IS NOT NULL OR equipment_history IS NOT NULL;

-- Controleer op ontbrekende relaties
SELECT 
    'Orphaned Rental Agreements' as issue,
    COUNT(*) as count
FROM rental_agreements ra
LEFT JOIN invoiceninja_clients inc ON ra.client_id = inc.id
WHERE inc.id IS NULL
UNION ALL
SELECT 
    'Orphaned Invoices' as issue,
    COUNT(*) as count
FROM invoices i
LEFT JOIN invoiceninja_clients inc ON i.client_id = inc.id
WHERE inc.id IS NULL;

-- Stap 6: Maak indexen voor performance
CREATE INDEX IF NOT EXISTS idx_invoiceninja_clients_rental_status ON invoiceninja_clients(rental_status);
CREATE INDEX IF NOT EXISTS idx_invoiceninja_clients_last_rental_date ON invoiceninja_clients(last_rental_date);
CREATE INDEX IF NOT EXISTS idx_invoiceninja_clients_total_rental_value ON invoiceninja_clients(total_rental_value);

-- Stap 7: Update statistieken
ANALYZE TABLE invoiceninja_clients;

-- Rollback script (indien nodig)
-- DROP TABLE IF EXISTS invoiceninja_clients;
-- CREATE TABLE invoiceninja_clients AS SELECT * FROM invoiceninja_clients_backup;
-- DROP TABLE invoiceninja_clients_backup;
-- DROP TABLE rentguy_clients_backup;
