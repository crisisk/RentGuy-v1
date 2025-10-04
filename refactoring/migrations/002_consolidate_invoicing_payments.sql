-- Fase 2: Facturatie & Betalingen Refactoring
-- Migratiescript voor het consolideren van facturatie en betalingsdata van RentGuy naar Invoice Ninja

-- Stap 1: Backup van bestaande data
CREATE TABLE IF NOT EXISTS rentguy_invoices_backup AS SELECT * FROM rentguy_invoices;
CREATE TABLE IF NOT EXISTS rentguy_payments_backup AS SELECT * FROM rentguy_payments;
CREATE TABLE IF NOT EXISTS invoiceninja_invoices_backup AS SELECT * FROM invoiceninja_invoices;
CREATE TABLE IF NOT EXISTS invoiceninja_payments_backup AS SELECT * FROM invoiceninja_payments;

-- Stap 2: Uitbreiden van Invoice Ninja invoices tabel met RentGuy specifieke velden
ALTER TABLE invoiceninja_invoices 
ADD COLUMN IF NOT EXISTS rental_start_date DATE,
ADD COLUMN IF NOT EXISTS rental_end_date DATE,
ADD COLUMN IF NOT EXISTS rental_duration_days INT,
ADD COLUMN IF NOT EXISTS equipment_list JSON,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_date DATETIME,
ADD COLUMN IF NOT EXISTS pickup_date DATETIME,
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
ADD COLUMN IF NOT EXISTS pickup_instructions TEXT,
ADD COLUMN IF NOT EXISTS damage_assessment JSON,
ADD COLUMN IF NOT EXISTS late_return_fees DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS damage_charges DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS deposit_returned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rental_agreement_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS project_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS crew_assigned JSON,
ADD COLUMN IF NOT EXISTS setup_requirements TEXT,
ADD COLUMN IF NOT EXISTS breakdown_requirements TEXT,
ADD COLUMN IF NOT EXISTS insurance_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS insurance_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS special_conditions TEXT;

-- Stap 3: Uitbreiden van Invoice Ninja payments tabel met RentGuy specifieke velden
ALTER TABLE invoiceninja_payments
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(100),
ADD COLUMN IF NOT EXISTS gateway_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_fee DECIMAL(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS refund_date DATETIME,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS deposit_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS final_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_schedule JSON,
ADD COLUMN IF NOT EXISTS auto_payment_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS late_payment_fee DECIMAL(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Stap 4: Data mapping en migratie van RentGuy facturen naar Invoice Ninja
INSERT INTO invoiceninja_invoices (
    client_id,
    invoice_number,
    invoice_date,
    due_date,
    amount,
    balance,
    status,
    notes,
    terms,
    footer,
    public_notes,
    private_notes,
    po_number,
    discount,
    tax_amount,
    rental_start_date,
    rental_end_date,
    rental_duration_days,
    equipment_list,
    delivery_address,
    pickup_address,
    delivery_date,
    pickup_date,
    delivery_instructions,
    pickup_instructions,
    damage_assessment,
    late_return_fees,
    damage_charges,
    security_deposit,
    deposit_returned,
    rental_agreement_id,
    project_reference,
    event_type,
    crew_assigned,
    setup_requirements,
    breakdown_requirements,
    insurance_required,
    insurance_amount,
    special_conditions,
    created_at,
    updated_at
)
SELECT 
    -- Map client_id from consolidated clients table
    ic.id as client_id,
    rg.invoice_number,
    rg.invoice_date,
    rg.due_date,
    rg.total_amount,
    rg.outstanding_balance,
    CASE 
        WHEN rg.status = 'paid' THEN 'paid'
        WHEN rg.status = 'pending' THEN 'sent'
        WHEN rg.status = 'overdue' THEN 'sent'
        WHEN rg.status = 'cancelled' THEN 'cancelled'
        ELSE 'draft'
    END as status,
    rg.notes,
    rg.terms_conditions,
    rg.footer_text,
    rg.public_notes,
    rg.internal_notes,
    rg.purchase_order_number,
    rg.discount_amount,
    rg.tax_amount,
    rg.rental_start_date,
    rg.rental_end_date,
    DATEDIFF(rg.rental_end_date, rg.rental_start_date) as rental_duration_days,
    rg.equipment_details,
    rg.delivery_address,
    rg.pickup_address,
    rg.delivery_datetime,
    rg.pickup_datetime,
    rg.delivery_notes,
    rg.pickup_notes,
    rg.damage_report,
    rg.late_fees,
    rg.damage_fees,
    rg.security_deposit_amount,
    rg.deposit_returned_flag,
    rg.rental_contract_id,
    rg.project_code,
    rg.event_category,
    rg.assigned_crew,
    rg.setup_instructions,
    rg.breakdown_instructions,
    rg.insurance_required_flag,
    rg.insurance_coverage_amount,
    rg.special_terms,
    rg.created_at,
    rg.updated_at
FROM rentguy_invoices rg
JOIN invoiceninja_clients ic ON rg.client_email = ic.email
WHERE rg.invoice_number NOT IN (SELECT invoice_number FROM invoiceninja_invoices WHERE invoice_number IS NOT NULL)
ON DUPLICATE KEY UPDATE
    client_id = VALUES(client_id),
    invoice_date = VALUES(invoice_date),
    due_date = VALUES(due_date),
    amount = VALUES(amount),
    balance = VALUES(balance),
    status = VALUES(status),
    notes = VALUES(notes),
    rental_start_date = VALUES(rental_start_date),
    rental_end_date = VALUES(rental_end_date),
    rental_duration_days = VALUES(rental_duration_days),
    equipment_list = VALUES(equipment_list),
    delivery_address = VALUES(delivery_address),
    pickup_address = VALUES(pickup_address),
    delivery_date = VALUES(delivery_date),
    pickup_date = VALUES(pickup_date),
    damage_assessment = VALUES(damage_assessment),
    late_return_fees = VALUES(late_return_fees),
    damage_charges = VALUES(damage_charges),
    security_deposit = VALUES(security_deposit),
    deposit_returned = VALUES(deposit_returned),
    updated_at = NOW();

-- Stap 5: Data mapping en migratie van RentGuy betalingen naar Invoice Ninja
INSERT INTO invoiceninja_payments (
    client_id,
    invoice_id,
    amount,
    payment_date,
    payment_type,
    transaction_reference,
    notes,
    payment_gateway,
    gateway_transaction_id,
    payment_fee,
    refund_amount,
    refund_date,
    refund_reason,
    deposit_payment,
    final_payment,
    payment_schedule,
    auto_payment_enabled,
    payment_reminder_sent,
    late_payment_fee,
    payment_notes,
    created_at,
    updated_at
)
SELECT 
    ic.id as client_id,
    ini.id as invoice_id,
    rp.payment_amount,
    rp.payment_date,
    rp.payment_method,
    rp.transaction_id,
    rp.payment_notes,
    rp.gateway_used,
    rp.gateway_transaction_ref,
    rp.processing_fee,
    rp.refunded_amount,
    rp.refund_processed_date,
    rp.refund_explanation,
    rp.is_deposit_payment,
    rp.is_final_payment,
    rp.installment_schedule,
    rp.auto_payment_setup,
    rp.reminder_sent_flag,
    rp.late_fee_applied,
    rp.additional_notes,
    rp.created_at,
    rp.updated_at
FROM rentguy_payments rp
JOIN invoiceninja_clients ic ON rp.client_email = ic.email
JOIN invoiceninja_invoices ini ON rp.invoice_number = ini.invoice_number
WHERE rp.transaction_id NOT IN (SELECT transaction_reference FROM invoiceninja_payments WHERE transaction_reference IS NOT NULL)
ON DUPLICATE KEY UPDATE
    client_id = VALUES(client_id),
    invoice_id = VALUES(invoice_id),
    amount = VALUES(amount),
    payment_date = VALUES(payment_date),
    payment_type = VALUES(payment_type),
    transaction_reference = VALUES(transaction_reference),
    notes = VALUES(notes),
    payment_gateway = VALUES(payment_gateway),
    gateway_transaction_id = VALUES(gateway_transaction_id),
    payment_fee = VALUES(payment_fee),
    refund_amount = VALUES(refund_amount),
    refund_date = VALUES(refund_date),
    deposit_payment = VALUES(deposit_payment),
    final_payment = VALUES(final_payment),
    updated_at = NOW();

-- Stap 6: Update invoice balances na payment migratie
UPDATE invoiceninja_invoices i
SET balance = (
    SELECT i.amount - COALESCE(SUM(p.amount), 0)
    FROM invoiceninja_payments p
    WHERE p.invoice_id = i.id
    AND p.refund_amount = 0
);

-- Stap 7: Update invoice status gebaseerd op balance
UPDATE invoiceninja_invoices 
SET status = CASE 
    WHEN balance <= 0 THEN 'paid'
    WHEN balance < amount THEN 'partial'
    WHEN due_date < CURDATE() AND balance > 0 THEN 'overdue'
    ELSE status
END;

-- Stap 8: Update relaties in andere tabellen
-- Update rental_agreements tabel
UPDATE rental_agreements ra
JOIN rentguy_invoices rg ON ra.invoice_number = rg.invoice_number
JOIN invoiceninja_invoices ini ON rg.invoice_number = ini.invoice_number
SET ra.invoice_id = ini.id;

-- Update equipment_rentals tabel
UPDATE equipment_rentals er
JOIN rentguy_invoices rg ON er.invoice_reference = rg.invoice_number
JOIN invoiceninja_invoices ini ON rg.invoice_number = ini.invoice_number
SET er.invoice_id = ini.id;

-- Stap 9: Validatie van de migratie
-- Controleer of alle facturen zijn gemigreerd
SELECT 
    'RentGuy Invoices' as source,
    COUNT(*) as total_count,
    SUM(total_amount) as total_value
FROM rentguy_invoices
UNION ALL
SELECT 
    'Invoice Ninja Invoices (after migration)' as source,
    COUNT(*) as total_count,
    SUM(amount) as total_value
FROM invoiceninja_invoices
WHERE rental_start_date IS NOT NULL OR equipment_list IS NOT NULL;

-- Controleer of alle betalingen zijn gemigreerd
SELECT 
    'RentGuy Payments' as source,
    COUNT(*) as total_count,
    SUM(payment_amount) as total_value
FROM rentguy_payments
UNION ALL
SELECT 
    'Invoice Ninja Payments (after migration)' as source,
    COUNT(*) as total_count,
    SUM(amount) as total_value
FROM invoiceninja_payments
WHERE payment_gateway IS NOT NULL OR deposit_payment IS NOT NULL;

-- Controleer op ontbrekende relaties
SELECT 
    'Orphaned Rental Agreements' as issue,
    COUNT(*) as count
FROM rental_agreements ra
LEFT JOIN invoiceninja_invoices ini ON ra.invoice_id = ini.id
WHERE ini.id IS NULL
UNION ALL
SELECT 
    'Orphaned Equipment Rentals' as issue,
    COUNT(*) as count
FROM equipment_rentals er
LEFT JOIN invoiceninja_invoices ini ON er.invoice_id = ini.id
WHERE ini.id IS NULL;

-- Stap 10: Maak indexen voor performance
CREATE INDEX IF NOT EXISTS idx_invoiceninja_invoices_rental_dates ON invoiceninja_invoices(rental_start_date, rental_end_date);
CREATE INDEX IF NOT EXISTS idx_invoiceninja_invoices_rental_agreement ON invoiceninja_invoices(rental_agreement_id);
CREATE INDEX IF NOT EXISTS idx_invoiceninja_invoices_project_reference ON invoiceninja_invoices(project_reference);
CREATE INDEX IF NOT EXISTS idx_invoiceninja_invoices_event_type ON invoiceninja_invoices(event_type);
CREATE INDEX IF NOT EXISTS idx_invoiceninja_payments_gateway ON invoiceninja_payments(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_invoiceninja_payments_gateway_transaction ON invoiceninja_payments(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoiceninja_payments_deposit ON invoiceninja_payments(deposit_payment);
CREATE INDEX IF NOT EXISTS idx_invoiceninja_payments_final ON invoiceninja_payments(final_payment);

-- Stap 11: Update statistieken
ANALYZE TABLE invoiceninja_invoices;
ANALYZE TABLE invoiceninja_payments;

-- Rollback script (indien nodig)
-- DROP TABLE IF EXISTS invoiceninja_invoices;
-- CREATE TABLE invoiceninja_invoices AS SELECT * FROM invoiceninja_invoices_backup;
-- DROP TABLE IF EXISTS invoiceninja_payments;
-- CREATE TABLE invoiceninja_payments AS SELECT * FROM invoiceninja_payments_backup;
-- DROP TABLE invoiceninja_invoices_backup;
-- DROP TABLE invoiceninja_payments_backup;
-- DROP TABLE rentguy_invoices_backup;
-- DROP TABLE rentguy_payments_backup;
