# Fase 1: Invoice Ninja Codebase Analyse en Extractie

## Overzicht
Deze fase analyseert de Invoice Ninja v5 codebase en extraheert herbruikbare modules voor integratie in RentGuy. We identificeren kerncomponenten die aangepast kunnen worden voor equipment rental management.

## Doelstellingen
- Volledige architectuuranalyse van Invoice Ninja v5
- Identificatie van herbruikbare Laravel packages
- Mapping van Invoice Ninja entities naar RentGuy context
- Extractie van kernmodules voor equipment rental

## Technische Analyse

### Invoice Ninja Architectuur
Invoice Ninja v5 is gebouwd op een moderne Laravel architectuur met de volgende kerncomponenten:

#### Backend API (Laravel)
```php
// Core entities geïdentificeerd
- Invoice Management Engine
- Quote/Estimate System  
- Client Portal Framework
- Payment Gateway Integration
- Project Management Module
- Expense Tracking System
- Recurring Billing Engine
- Multi-tenant Architecture
- Document Generation (PDF)
- Notification System
```

#### Database Schema Analyse
```sql
-- Kernentiteiten voor equipment rental mapping
invoices -> rental_contracts
invoice_items -> equipment_line_items  
quotes -> rental_quotes
clients -> rental_customers
projects -> rental_events
products -> equipment_items
payments -> rental_payments
expenses -> equipment_costs
```

### Herbruikbare Modules Geïdentificeerd

#### 1. Invoice Engine (`app/Models/Invoice.php`)
**Functionaliteit**: Complete factureringslogica met line items, tax calculations, discounts
**Equipment Rental Aanpassing**: 
- Rental period calculations
- Equipment-specific pricing rules
- Damage assessment integration
- Multi-day discount logic

#### 2. Quote System (`app/Models/Quote.php`)
**Functionaliteit**: Offerte creation, approval workflow, quote-to-invoice conversion
**Equipment Rental Aanpassing**:
- Equipment availability checking
- Package-based quotes (Mr. DJ Silver/Gold/Diamond)
- Rental period validation
- Crew assignment integration

#### 3. Payment Processing (`app/PaymentDrivers/`)
**Functionaliteit**: Multi-gateway support (Stripe, PayPal, Mollie)
**Equipment Rental Aanpassing**:
- Deposit/aanbetaling workflow
- Damage cost additional charges
- Refund handling for cancellations
- Mollie integration voor Nederlandse markt

#### 4. Client Portal (`resources/views/portal/`)
**Functionaliteit**: Customer self-service interface
**Equipment Rental Aanpassing**:
- Equipment catalog browsing
- Rental history tracking
- Booking management
- Document downloads (contracts, invoices)

#### 5. Document Generation (`app/Services/PdfMaker/`)
**Functionaliteit**: PDF generation with custom templates
**Equipment Rental Aanpassing**:
- Equipment rental contracts
- Pakbon/delivery notes
- Branded invoices (Mr. DJ styling)
- Multi-language support

### Laravel Package Extractie Strategie

#### Composer Packages te Extraheren
```json
{
  "invoiceninja/invoice-engine": "Core factureringslogica",
  "invoiceninja/payment-drivers": "Payment gateway integraties", 
  "invoiceninja/pdf-generator": "Document generation",
  "invoiceninja/client-portal": "Customer self-service",
  "invoiceninja/multi-tenant": "White-label capabilities"
}
```

#### Custom Middleware voor Equipment Rental
```php
// Nieuwe middleware voor equipment-specifieke logica
- EquipmentAvailabilityMiddleware
- RentalPeriodValidationMiddleware  
- DamageAssessmentMiddleware
- CrewAssignmentMiddleware
```

## Database Schema Integratie Plan

### Nieuwe Tabellen voor Equipment Rental
```sql
-- Equipment management
CREATE TABLE equipment_items (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    category VARCHAR(100),
    serial_number VARCHAR(100),
    rental_price_per_day DECIMAL(10,2),
    status ENUM('available', 'rented', 'maintenance', 'damaged'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Rental-specific invoice extensions  
ALTER TABLE invoices ADD COLUMN rental_start_date DATE;
ALTER TABLE invoices ADD COLUMN rental_end_date DATE;
ALTER TABLE invoices ADD COLUMN equipment_return_status ENUM('pending', 'returned', 'damaged');
ALTER TABLE invoices ADD COLUMN crew_assigned JSON;

-- Equipment line items
ALTER TABLE invoice_items ADD COLUMN equipment_id BIGINT;
ALTER TABLE invoice_items ADD COLUMN rental_days INTEGER;
ALTER TABLE invoice_items ADD COLUMN damage_assessment TEXT;
ALTER TABLE invoice_items ADD COLUMN crew_notes TEXT;
```

### Multi-tenant Isolatie
```sql
-- Tenant-specific equipment isolation
ALTER TABLE equipment_items ADD COLUMN company_id BIGINT;
ALTER TABLE equipment_items ADD INDEX idx_company_equipment (company_id, status);

-- White-label branding per tenant
CREATE TABLE tenant_branding (
    company_id BIGINT PRIMARY KEY,
    logo_url VARCHAR(255),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    custom_domain VARCHAR(255)
);
```

## API Endpoints Uitbreiding

### Equipment Rental Specifieke Endpoints
```php
// Equipment availability
Route::get('/api/v1/equipment/availability', 'EquipmentController@availability');
Route::get('/api/v1/equipment/{id}/calendar', 'EquipmentController@calendar');

// Rental management  
Route::post('/api/v1/rentals', 'RentalController@store');
Route::patch('/api/v1/rentals/{id}/return', 'RentalController@return');
Route::post('/api/v1/rentals/{id}/damage', 'DamageController@assess');

// Package management (Mr. DJ Silver/Gold/Diamond)
Route::get('/api/v1/packages', 'PackageController@index');
Route::post('/api/v1/packages/{id}/quote', 'PackageController@generateQuote');

// Crew management
Route::get('/api/v1/crew/available', 'CrewController@available');
Route::post('/api/v1/crew/assign', 'CrewController@assign');
```

## Implementatie Roadmap

### Week 1: Core Module Extractie
- Clone Invoice Ninja v5.12.28 (latest stable)
- Extract core Laravel packages
- Create equipment rental namespace
- Setup development environment

### Week 2: Database Schema Aanpassingen  
- Implement equipment-specific migrations
- Setup multi-tenant isolation
- Create seed data voor Mr. DJ test case
- Validate schema with sample data

### Week 3: API Development
- Implement equipment availability endpoints
- Create rental booking workflow
- Integrate with existing Invoice Ninja API
- Add equipment-specific validation rules

### Week 4: Testing & Validation
- Unit tests voor equipment rental logic
- Integration tests met Invoice Ninja core
- Performance testing met sample data
- Security audit voor multi-tenant isolation

## Risico's en Mitigaties

### License Compliance
**Risico**: Invoice Ninja Elastic License 2.0 vereisten
**Mitigatie**: Implement proper attribution, overweeg commercial license voor white-label

### Code Maintenance  
**Risico**: Invoice Ninja updates kunnen breaking changes introduceren
**Mitigatie**: Fork specifieke versie (v5.12.28), maintain eigen update cycle

### Customization Complexity
**Risico**: Extensive customizations compliceren upgrade path
**Mitigatie**: Minimize core modifications, gebruik Laravel service container

## Deliverables

### Code Artifacts
- Extracted Laravel packages in `/packages/invoiceninja/`
- Equipment rental migrations in `/database/migrations/equipment/`
- API controllers in `/app/Http/Controllers/Equipment/`
- Custom middleware in `/app/Http/Middleware/Equipment/`

### Documentatie
- Architecture decision records (ADRs)
- API documentation voor equipment endpoints  
- Database schema documentation
- Integration guide voor developers

## Volgende Fase
Fase 2 zal focussen op Database Schema Integratie, waarbij we de geëxtraheerde modules integreren met RentGuy's bestaande architectuur en equipment-specifieke functionaliteit implementeren.

## Status: ✅ Voltooid
- Invoice Ninja v5.12.28 geanalyseerd
- Kernmodules geïdentificeerd voor extractie
- Database schema plan ontwikkeld  
- API endpoints gedefinieerd
- Implementatie roadmap opgesteld
