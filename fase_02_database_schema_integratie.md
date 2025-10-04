# Fase 2: Database Schema Integratie

## Overzicht
Deze fase integreert Invoice Ninja's database schema met RentGuy's equipment-specifieke tabellen en implementeert multi-tenant isolatie voor white-label capabilities.

## Doelstellingen
- Integratie van Invoice Ninja schema met equipment rental context
- Implementatie van multi-tenant database structuur
- Rental-specifieke velden en relaties
- Performance optimalisatie voor equipment queries

## Database Architectuur

### Core Schema Integratie

#### Equipment Management Tables
```sql
-- Hoofdtabel voor equipment items
CREATE TABLE equipment_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id BIGINT UNSIGNED,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    rental_price_per_day DECIMAL(10,2) NOT NULL,
    rental_price_per_week DECIMAL(10,2),
    rental_price_per_month DECIMAL(10,2),
    status ENUM('available', 'rented', 'maintenance', 'damaged', 'retired') DEFAULT 'available',
    location VARCHAR(255),
    notes TEXT,
    image_url VARCHAR(500),
    qr_code VARCHAR(255),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_company_status (company_id, status),
    INDEX idx_category (category_id),
    INDEX idx_serial (serial_number),
    INDEX idx_availability (status, company_id),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id) ON DELETE SET NULL
);

-- Equipment categorieën voor organisatie
CREATE TABLE equipment_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id BIGINT UNSIGNED NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company (company_id),
    INDEX idx_parent (parent_id),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES equipment_categories(id) ON DELETE SET NULL
);

-- Equipment packages (Mr. DJ Silver/Gold/Diamond)
CREATE TABLE equipment_packages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_active (company_id, is_active),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Package items koppeling
CREATE TABLE equipment_package_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id BIGINT UNSIGNED NOT NULL,
    equipment_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    is_optional BOOLEAN DEFAULT FALSE,
    
    UNIQUE KEY unique_package_equipment (package_id, equipment_id),
    
    FOREIGN KEY (package_id) REFERENCES equipment_packages(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment_items(id) ON DELETE CASCADE
);
```

#### Invoice Ninja Schema Uitbreidingen
```sql
-- Uitbreiding van invoices tabel voor rental specifics
ALTER TABLE invoices 
ADD COLUMN rental_start_date DATE NULL AFTER due_date,
ADD COLUMN rental_end_date DATE NULL AFTER rental_start_date,
ADD COLUMN rental_days INT GENERATED ALWAYS AS (DATEDIFF(rental_end_date, rental_start_date) + 1) STORED,
ADD COLUMN equipment_return_status ENUM('pending', 'partial', 'complete', 'damaged') DEFAULT 'pending',
ADD COLUMN crew_assigned JSON NULL,
ADD COLUMN delivery_address TEXT NULL,
ADD COLUMN pickup_address TEXT NULL,
ADD COLUMN setup_time TIME NULL,
ADD COLUMN breakdown_time TIME NULL,
ADD COLUMN special_instructions TEXT NULL,
ADD INDEX idx_rental_dates (rental_start_date, rental_end_date),
ADD INDEX idx_return_status (equipment_return_status);

-- Uitbreiding van invoice_items voor equipment details
ALTER TABLE invoice_items
ADD COLUMN equipment_id BIGINT UNSIGNED NULL AFTER product_id,
ADD COLUMN package_id BIGINT UNSIGNED NULL AFTER equipment_id,
ADD COLUMN rental_days INT NULL,
ADD COLUMN daily_rate DECIMAL(10,2) NULL,
ADD COLUMN damage_assessment TEXT NULL,
ADD COLUMN damage_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN crew_notes TEXT NULL,
ADD COLUMN return_condition ENUM('excellent', 'good', 'fair', 'damaged') NULL,
ADD INDEX idx_equipment (equipment_id),
ADD INDEX idx_package (package_id),
ADD FOREIGN KEY (equipment_id) REFERENCES equipment_items(id) ON DELETE SET NULL,
ADD FOREIGN KEY (package_id) REFERENCES equipment_packages(id) ON DELETE SET NULL;

-- Uitbreiding van quotes voor equipment availability checking
ALTER TABLE quotes
ADD COLUMN rental_start_date DATE NULL,
ADD COLUMN rental_end_date DATE NULL,
ADD COLUMN equipment_availability_checked BOOLEAN DEFAULT FALSE,
ADD COLUMN availability_check_date TIMESTAMP NULL,
ADD INDEX idx_quote_rental_dates (rental_start_date, rental_end_date);
```

#### Rental Management Tables
```sql
-- Rental reservations voor equipment availability
CREATE TABLE equipment_reservations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    equipment_id BIGINT UNSIGNED NOT NULL,
    invoice_id BIGINT UNSIGNED NULL,
    quote_id BIGINT UNSIGNED NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('reserved', 'confirmed', 'active', 'returned', 'cancelled') DEFAULT 'reserved',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_equipment_dates (equipment_id, start_date, end_date),
    INDEX idx_company_status (company_id, status),
    INDEX idx_client (client_id),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment_items(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Crew management voor Mr. DJ requirements
CREATE TABLE crew_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    specializations JSON NULL,
    hourly_rate DECIMAL(8,2),
    is_active BOOLEAN DEFAULT TRUE,
    availability_calendar JSON NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_active (company_id, is_active),
    INDEX idx_email (email),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Crew assignments per rental
CREATE TABLE rental_crew_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT UNSIGNED NOT NULL,
    crew_member_id BIGINT UNSIGNED NOT NULL,
    role VARCHAR(100),
    start_time DATETIME,
    end_time DATETIME,
    hourly_rate DECIMAL(8,2),
    status ENUM('assigned', 'confirmed', 'declined', 'completed') DEFAULT 'assigned',
    notes TEXT,
    
    UNIQUE KEY unique_invoice_crew (invoice_id, crew_member_id),
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (crew_member_id) REFERENCES crew_members(id) ON DELETE CASCADE
);
```

### Multi-tenant Isolatie

#### Tenant Branding en Configuratie
```sql
-- White-label branding per tenant (Mr. DJ specifiek)
CREATE TABLE tenant_branding (
    company_id BIGINT UNSIGNED PRIMARY KEY,
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#6B46C1',
    secondary_color VARCHAR(7) DEFAULT '#2563EB',
    accent_color VARCHAR(7) DEFAULT '#F59E0B',
    custom_domain VARCHAR(255),
    custom_css TEXT,
    email_template_header TEXT,
    email_template_footer TEXT,
    invoice_template_id INT,
    quote_template_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_domain (custom_domain),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Tenant-specific configuratie
CREATE TABLE tenant_settings (
    company_id BIGINT UNSIGNED PRIMARY KEY,
    timezone VARCHAR(50) DEFAULT 'Europe/Amsterdam',
    currency VARCHAR(3) DEFAULT 'EUR',
    date_format VARCHAR(20) DEFAULT 'd-m-Y',
    time_format VARCHAR(10) DEFAULT 'H:i',
    language VARCHAR(5) DEFAULT 'nl',
    vat_number VARCHAR(50),
    default_vat_rate DECIMAL(5,2) DEFAULT 21.00,
    equipment_vat_rate DECIMAL(5,2) DEFAULT 9.00,
    rental_terms TEXT,
    cancellation_policy TEXT,
    damage_policy TEXT,
    late_return_fee DECIMAL(8,2) DEFAULT 0,
    settings JSON,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

### Performance Optimalisatie

#### Database Indexing Strategie
```sql
-- Composite indexes voor equipment availability queries
CREATE INDEX idx_equipment_availability ON equipment_reservations 
(equipment_id, start_date, end_date, status);

-- Covering index voor rental calendar queries  
CREATE INDEX idx_rental_calendar ON equipment_reservations 
(company_id, start_date, end_date) 
INCLUDE (equipment_id, quantity, status);

-- Partitioning voor grote datasets (optioneel)
ALTER TABLE equipment_reservations 
PARTITION BY RANGE (YEAR(start_date)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

#### Query Optimalisatie Views
```sql
-- View voor equipment availability checking
CREATE VIEW equipment_availability AS
SELECT 
    e.id,
    e.company_id,
    e.name,
    e.status,
    COALESCE(SUM(CASE 
        WHEN r.status IN ('reserved', 'confirmed', 'active') 
        THEN r.quantity 
        ELSE 0 
    END), 0) as reserved_quantity,
    e.quantity - COALESCE(SUM(CASE 
        WHEN r.status IN ('reserved', 'confirmed', 'active') 
        THEN r.quantity 
        ELSE 0 
    END), 0) as available_quantity
FROM equipment_items e
LEFT JOIN equipment_reservations r ON e.id = r.equipment_id 
    AND r.start_date <= CURDATE() 
    AND r.end_date >= CURDATE()
WHERE e.status = 'available'
GROUP BY e.id, e.company_id, e.name, e.status;

-- View voor rental revenue analytics
CREATE VIEW rental_revenue_summary AS
SELECT 
    i.company_id,
    DATE(i.rental_start_date) as rental_date,
    COUNT(DISTINCT i.id) as rental_count,
    SUM(i.amount) as total_revenue,
    AVG(i.amount) as avg_rental_value,
    COUNT(DISTINCT ii.equipment_id) as unique_equipment_count
FROM invoices i
JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.rental_start_date IS NOT NULL
GROUP BY i.company_id, DATE(i.rental_start_date);
```

## Laravel Migrations

### Equipment Tables Migration
```php
<?php
// database/migrations/2025_01_01_000001_create_equipment_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEquipmentTables extends Migration
{
    public function up()
    {
        Schema::create('equipment_categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['company_id']);
            $table->index(['parent_id']);
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('equipment_categories')->onDelete('set null');
        });

        Schema::create('equipment_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('brand', 100)->nullable();
            $table->string('model', 100)->nullable();
            $table->string('serial_number', 100)->unique()->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 10, 2)->nullable();
            $table->decimal('rental_price_per_day', 10, 2);
            $table->decimal('rental_price_per_week', 10, 2)->nullable();
            $table->decimal('rental_price_per_month', 10, 2)->nullable();
            $table->enum('status', ['available', 'rented', 'maintenance', 'damaged', 'retired'])->default('available');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->string('image_url', 500)->nullable();
            $table->string('qr_code')->nullable();
            $table->date('last_maintenance_date')->nullable();
            $table->date('next_maintenance_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['company_id', 'status']);
            $table->index(['category_id']);
            $table->index(['serial_number']);
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('equipment_categories')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('equipment_items');
        Schema::dropIfExists('equipment_categories');
    }
}
```

## Data Seeding voor Mr. DJ

### Equipment Categories Seed
```php
<?php
// database/seeders/MrDjEquipmentSeeder.php

use Illuminate\Database\Seeder;
use App\Models\EquipmentCategory;
use App\Models\EquipmentItem;

class MrDjEquipmentSeeder extends Seeder
{
    public function run()
    {
        $company_id = 1; // Mr. DJ company ID
        
        // Categories
        $categories = [
            ['name' => 'Geluid', 'description' => 'Audio equipment en speakers'],
            ['name' => 'Licht', 'description' => 'Verlichting en lichteffecten'],
            ['name' => 'DJ Equipment', 'description' => 'DJ controllers en mixers'],
            ['name' => 'Kabels', 'description' => 'Audio en power kabels'],
            ['name' => 'Meubels', 'description' => 'Tafels, stoelen en decoratie'],
        ];
        
        foreach ($categories as $category) {
            EquipmentCategory::create([
                'company_id' => $company_id,
                'name' => $category['name'],
                'description' => $category['description'],
            ]);
        }
        
        // Equipment items voor Mr. DJ Silver/Gold/Diamond packages
        $equipment = [
            // Geluid
            ['name' => 'JBL EON615 Speaker (2x)', 'category' => 'Geluid', 'price' => 75.00],
            ['name' => 'Subwoofer JBL EON618S', 'category' => 'Geluid', 'price' => 50.00],
            ['name' => 'Draadloze microfoon Shure', 'category' => 'Geluid', 'price' => 25.00],
            
            // Licht  
            ['name' => 'LED Par spots (8x)', 'category' => 'Licht', 'price' => 40.00],
            ['name' => 'Moving heads (4x)', 'category' => 'Licht', 'price' => 60.00],
            ['name' => 'LED strip verlichting', 'category' => 'Licht', 'price' => 30.00],
            
            // DJ Equipment
            ['name' => 'Pioneer DDJ-SX3 Controller', 'category' => 'DJ Equipment', 'price' => 100.00],
            ['name' => 'Laptop met Serato DJ', 'category' => 'DJ Equipment', 'price' => 50.00],
        ];
        
        foreach ($equipment as $item) {
            $category = EquipmentCategory::where('name', $item['category'])->first();
            
            EquipmentItem::create([
                'company_id' => $company_id,
                'name' => $item['name'],
                'category_id' => $category->id,
                'rental_price_per_day' => $item['price'],
                'status' => 'available',
            ]);
        }
    }
}
```

## Testing & Validatie

### Database Performance Tests
```php
<?php
// tests/Feature/EquipmentAvailabilityTest.php

use Tests\TestCase;
use App\Models\EquipmentItem;
use App\Models\EquipmentReservation;

class EquipmentAvailabilityTest extends TestCase
{
    public function test_equipment_availability_query_performance()
    {
        // Create test data
        $equipment = EquipmentItem::factory()->count(1000)->create();
        $reservations = EquipmentReservation::factory()->count(5000)->create();
        
        // Test availability query performance
        $start = microtime(true);
        
        $available = EquipmentItem::whereNotIn('id', function($query) {
            $query->select('equipment_id')
                  ->from('equipment_reservations')
                  ->where('start_date', '<=', '2025-06-01')
                  ->where('end_date', '>=', '2025-06-01')
                  ->where('status', 'confirmed');
        })->get();
        
        $duration = microtime(true) - $start;
        
        $this->assertLessThan(0.1, $duration, 'Availability query should complete in under 100ms');
    }
}
```

## Deliverables

### Database Schema Files
- `/database/migrations/equipment/` - Alle equipment-gerelateerde migrations
- `/database/seeders/MrDjEquipmentSeeder.php` - Test data voor Mr. DJ
- `/database/views/equipment_availability.sql` - Performance views

### Model Classes
- `app/Models/Equipment/EquipmentItem.php`
- `app/Models/Equipment/EquipmentCategory.php`
- `app/Models/Equipment/EquipmentPackage.php`
- `app/Models/Rental/RentalReservation.php`

### Performance Monitoring
- Database query performance benchmarks
- Index usage analytics
- Multi-tenant isolation validation

## Volgende Fase
Fase 3 zal focussen op Core Invoice Engine Implementatie, waarbij we de geëxtraheerde Invoice Ninja modules integreren met onze nieuwe equipment rental database schema.

## Status: ✅ Voltooid
- Database schema ontwerp voltooid
- Multi-tenant isolatie geïmplementeerd
- Performance optimalisaties toegepast
- Mr. DJ test data seeding voorbereid
- Laravel migrations ontwikkeld
