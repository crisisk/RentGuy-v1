# Fase 3: Core Invoice Engine Implementatie

## Overzicht
Deze fase implementeert Invoice Ninja's factureringsengine in RentGuy met equipment-specifieke invoice line items, rental period calculations en tax handling voor equipment verhuur.

## Doelstellingen
- Integratie van Invoice Ninja's core invoicing API
- Equipment-specifieke invoice line items
- Rental period calculations
- Tax handling voor Nederlandse BTW (9% en 21%)
- Mr. DJ specifieke factureringsworkflow

## Technische Implementatie

### Invoice Ninja API Integratie

#### Core API Schema
```php
// Invoice Ninja v5 API endpoint: POST /api/v1/invoices
{
    "client_id": "string",           // Invoice Ninja client ID
    "date": "2025-10-03",           // Invoice date
    "due_date": "2025-10-17",       // Payment due date
    "line_items": [                 // Equipment rental line items
        {
            "product_key": "EQP_001",    // RentGuy equipment ID
            "notes": "Equipment description + rental period",
            "cost": 250.00,              // Daily rental rate
            "qty": 7,                    // Number of rental days
            "tax_name1": "BTW",          // Tax name
            "tax_rate1": 21.00           // Tax rate percentage
        }
    ],
    "public_notes": "Rental terms and conditions",
    "private_notes": "Internal notes",
    "custom_value1": "rental_start_date",
    "custom_value2": "rental_end_date",
    "custom_value3": "equipment_return_status",
    "custom_value4": "crew_assigned"
}
```

### RentGuy Database Schema Uitbreidingen

#### Invoice Management Tables
```sql
-- RentGuy invoice tracking
CREATE TABLE rentguy_invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    rental_agreement_id BIGINT UNSIGNED NOT NULL,
    invoice_ninja_id VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100),
    client_id BIGINT UNSIGNED NOT NULL,
    rental_start_date DATE NOT NULL,
    rental_end_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    status ENUM('draft', 'sent', 'viewed', 'approved', 'paid', 'cancelled') DEFAULT 'draft',
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_status (company_id, status),
    INDEX idx_rental_agreement (rental_agreement_id),
    INDEX idx_invoice_ninja (invoice_ninja_id),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (rental_agreement_id) REFERENCES rental_agreements(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Invoice line items voor equipment details
CREATE TABLE rentguy_invoice_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT UNSIGNED NOT NULL,
    equipment_id BIGINT UNSIGNED NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    rental_days INT NOT NULL,
    daily_rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    
    INDEX idx_invoice (invoice_id),
    INDEX idx_equipment (equipment_id),
    
    FOREIGN KEY (invoice_id) REFERENCES rentguy_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment_items(id) ON DELETE CASCADE
);
```

### Laravel Service Classes

#### Invoice Service Implementation
```php
<?php
// app/Services/InvoiceNinjaService.php

namespace App\Services;

use App\Models\RentalAgreement;
use App\Models\RentguyInvoice;
use App\Models\Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InvoiceNinjaService
{
    private $apiUrl;
    private $apiToken;
    
    public function __construct()
    {
        $this->apiUrl = config('invoiceninja.api_url');
        $this->apiToken = config('invoiceninja.api_token');
    }
    
    /**
     * Create invoice in Invoice Ninja for rental agreement
     */
    public function createInvoiceFromRental(RentalAgreement $rental): RentguyInvoice
    {
        $client = $rental->client;
        $invoiceNinjaClientId = $this->getOrCreateInvoiceNinjaClient($client);
        
        $lineItems = $this->buildLineItems($rental);
        $invoiceData = $this->buildInvoiceData($rental, $invoiceNinjaClientId, $lineItems);
        
        $response = $this->callInvoiceNinjaAPI('invoices', $invoiceData);
        
        if (!$response['success']) {
            throw new \Exception('Failed to create invoice in Invoice Ninja: ' . $response['message']);
        }
        
        return $this->storeInvoiceLocally($rental, $response['data']);
    }
    
    /**
     * Build line items for equipment rental
     */
    private function buildLineItems(RentalAgreement $rental): array
    {
        $lineItems = [];
        
        foreach ($rental->equipmentItems as $item) {
            $rentalDays = $this->calculateRentalDays(
                $rental->start_date, 
                $rental->end_date
            );
            
            // Mr. DJ discount logic: dag 1 = vol, daarna 50%
            $totalCost = $this->calculateMrDjPricing(
                $item->daily_rate, 
                $rentalDays
            );
            
            $lineItems[] = [
                'product_key' => $item->equipment_id,
                'notes' => $this->buildItemDescription($item, $rental),
                'cost' => $item->daily_rate,
                'qty' => $rentalDays,
                'tax_name1' => $this->getTaxName($item),
                'tax_rate1' => $this->getTaxRate($item),
                'custom_value1' => $item->equipment_id,
                'custom_value2' => $item->serial_number ?? '',
            ];
        }
        
        // Add delivery/pickup fees if applicable
        if ($rental->delivery_fee > 0) {
            $lineItems[] = [
                'product_key' => 'DELIVERY',
                'notes' => 'Delivery to: ' . $rental->delivery_address,
                'cost' => $rental->delivery_fee,
                'qty' => 1,
                'tax_name1' => 'BTW',
                'tax_rate1' => 9.00, // Reduced rate for services
            ];
        }
        
        return $lineItems;
    }
    
    /**
     * Calculate Mr. DJ specific pricing (dag 1 = vol, daarna 50%)
     */
    private function calculateMrDjPricing(float $dailyRate, int $rentalDays): float
    {
        if ($rentalDays <= 1) {
            return $dailyRate;
        }
        
        // First day full price, subsequent days 50%
        $firstDayPrice = $dailyRate;
        $subsequentDaysPrice = ($rentalDays - 1) * ($dailyRate * 0.5);
        
        return $firstDayPrice + $subsequentDaysPrice;
    }
    
    /**
     * Calculate rental days (inclusive)
     */
    private function calculateRentalDays(\DateTime $startDate, \DateTime $endDate): int
    {
        $diff = $startDate->diff($endDate);
        return $diff->days + 1; // Inclusive of both start and end date
    }
    
    /**
     * Build item description for invoice
     */
    private function buildItemDescription($item, RentalAgreement $rental): string
    {
        $description = $item->equipment->name;
        $description .= " - Rental period: ";
        $description .= $rental->start_date->format('d-m-Y');
        $description .= " to ";
        $description .= $rental->end_date->format('d-m-Y');
        $description .= " (" . $this->calculateRentalDays($rental->start_date, $rental->end_date) . " days)";
        
        if ($item->equipment->serial_number) {
            $description .= " - S/N: " . $item->equipment->serial_number;
        }
        
        return $description;
    }
    
    /**
     * Get tax rate based on equipment type
     */
    private function getTaxRate($item): float
    {
        // Equipment rental: 9% BTW
        // Services (delivery, setup): 21% BTW
        return $item->equipment->category->is_service ? 21.00 : 9.00;
    }
    
    /**
     * Get tax name
     */
    private function getTaxName($item): string
    {
        return 'BTW';
    }
    
    /**
     * Build complete invoice data
     */
    private function buildInvoiceData(
        RentalAgreement $rental, 
        string $clientId, 
        array $lineItems
    ): array {
        return [
            'client_id' => $clientId,
            'date' => now()->format('Y-m-d'),
            'due_date' => $rental->payment_due_date->format('Y-m-d'),
            'line_items' => $lineItems,
            'public_notes' => $this->buildPublicNotes($rental),
            'private_notes' => $this->buildPrivateNotes($rental),
            'terms' => $this->getRentalTerms($rental->company_id),
            'custom_value1' => $rental->start_date->format('Y-m-d'),
            'custom_value2' => $rental->end_date->format('Y-m-d'),
            'custom_value3' => 'pending', // return status
            'custom_value4' => json_encode($rental->crew_assigned ?? []),
        ];
    }
    
    /**
     * Build public notes for client
     */
    private function buildPublicNotes(RentalAgreement $rental): string
    {
        $notes = "Equipment Rental Agreement #{$rental->agreement_number}\n\n";
        $notes .= "Rental Period: {$rental->start_date->format('d-m-Y')} to {$rental->end_date->format('d-m-Y')}\n";
        
        if ($rental->delivery_address) {
            $notes .= "Delivery Address: {$rental->delivery_address}\n";
        }
        
        if ($rental->special_instructions) {
            $notes .= "\nSpecial Instructions:\n{$rental->special_instructions}";
        }
        
        return $notes;
    }
    
    /**
     * Build private notes for internal use
     */
    private function buildPrivateNotes(RentalAgreement $rental): string
    {
        $notes = "RentGuy Rental ID: {$rental->id}\n";
        $notes .= "Created: " . now()->format('d-m-Y H:i') . "\n";
        
        if ($rental->internal_notes) {
            $notes .= "Internal Notes: {$rental->internal_notes}";
        }
        
        return $notes;
    }
    
    /**
     * Call Invoice Ninja API
     */
    private function callInvoiceNinjaAPI(string $endpoint, array $data): array
    {
        try {
            $response = Http::withHeaders([
                'X-Api-Token' => $this->apiToken,
                'X-Requested-With' => 'XMLHttpRequest',
                'Content-Type' => 'application/json'
            ])->post("{$this->apiUrl}/{$endpoint}", $data);
            
            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()
                ];
            }
            
            Log::error('Invoice Ninja API Error', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            
            return [
                'success' => false,
                'message' => 'API call failed with status: ' . $response->status()
            ];
            
        } catch (\Exception $e) {
            Log::error('Invoice Ninja API Exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Store invoice data locally in RentGuy
     */
    private function storeInvoiceLocally(
        RentalAgreement $rental, 
        array $invoiceNinjaData
    ): RentguyInvoice {
        $invoice = RentguyInvoice::create([
            'company_id' => $rental->company_id,
            'rental_agreement_id' => $rental->id,
            'invoice_ninja_id' => $invoiceNinjaData['data']['id'],
            'invoice_number' => $invoiceNinjaData['data']['number'],
            'client_id' => $rental->client_id,
            'rental_start_date' => $rental->start_date,
            'rental_end_date' => $rental->end_date,
            'total_amount' => $invoiceNinjaData['data']['amount'],
            'tax_amount' => $invoiceNinjaData['data']['tax_amount'] ?? 0,
            'status' => 'sent',
            'invoice_date' => now(),
            'due_date' => $rental->payment_due_date,
            'notes' => $this->buildPublicNotes($rental),
            'terms' => $this->getRentalTerms($rental->company_id),
        ]);
        
        // Store line items
        foreach ($rental->equipmentItems as $index => $item) {
            $invoice->items()->create([
                'equipment_id' => $item->equipment_id,
                'equipment_name' => $item->equipment->name,
                'rental_days' => $this->calculateRentalDays($rental->start_date, $rental->end_date),
                'daily_rate' => $item->daily_rate,
                'total_amount' => $this->calculateMrDjPricing(
                    $item->daily_rate, 
                    $this->calculateRentalDays($rental->start_date, $rental->end_date)
                ),
                'tax_rate' => $this->getTaxRate($item),
                'tax_amount' => $this->calculateTaxAmount($item),
                'notes' => $this->buildItemDescription($item, $rental),
            ]);
        }
        
        return $invoice;
    }
}
```

### API Endpoints

#### RentGuy Invoice API
```php
<?php
// app/Http/Controllers/Api/InvoiceController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InvoiceNinjaService;
use App\Models\RentalAgreement;
use App\Models\RentguyInvoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    private $invoiceService;
    
    public function __construct(InvoiceNinjaService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
    }
    
    /**
     * Create invoice from rental agreement
     * POST /api/v1/rental-agreements/{id}/invoice
     */
    public function createFromRental(Request $request, $rentalId)
    {
        try {
            $rental = RentalAgreement::findOrFail($rentalId);
            
            // Check if invoice already exists
            if ($rental->invoice) {
                return response()->json([
                    'error' => 'Invoice already exists for this rental agreement',
                    'invoice_id' => $rental->invoice->id
                ], 409);
            }
            
            $invoice = $this->invoiceService->createInvoiceFromRental($rental);
            
            return response()->json([
                'message' => 'Invoice created successfully',
                'invoice' => $invoice->load('items'),
                'invoice_ninja_url' => config('invoiceninja.client_url') . '/invoices/' . $invoice->invoice_ninja_id
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create invoice',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get invoice details
     * GET /api/v1/invoices/{id}
     */
    public function show($id)
    {
        $invoice = RentguyInvoice::with(['items', 'rentalAgreement', 'client'])
                                ->findOrFail($id);
        
        return response()->json($invoice);
    }
    
    /**
     * Update invoice status from Invoice Ninja webhook
     * POST /api/v1/webhooks/invoice-ninja/status-update
     */
    public function updateStatus(Request $request)
    {
        $invoiceNinjaId = $request->input('invoice_id');
        $status = $request->input('status');
        
        $invoice = RentguyInvoice::where('invoice_ninja_id', $invoiceNinjaId)->first();
        
        if (!$invoice) {
            return response()->json(['error' => 'Invoice not found'], 404);
        }
        
        $invoice->update(['status' => $status]);
        
        // Trigger additional actions based on status
        if ($status === 'paid') {
            // Mark rental as confirmed, send confirmation emails, etc.
            $this->handlePaidInvoice($invoice);
        }
        
        return response()->json(['message' => 'Status updated successfully']);
    }
    
    private function handlePaidInvoice(RentguyInvoice $invoice)
    {
        $rental = $invoice->rentalAgreement;
        $rental->update(['status' => 'confirmed']);
        
        // Send confirmation email to client
        // Schedule equipment preparation
        // Notify crew if assigned
    }
}
```

## Testing Strategie

### Unit Tests
```php
<?php
// tests/Unit/InvoiceNinjaServiceTest.php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\InvoiceNinjaService;
use App\Models\RentalAgreement;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InvoiceNinjaServiceTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_calculate_mr_dj_pricing()
    {
        $service = new InvoiceNinjaService();
        
        // Test single day rental
        $this->assertEquals(100.00, $service->calculateMrDjPricing(100.00, 1));
        
        // Test multi-day rental (day 1 = full, subsequent days = 50%)
        $this->assertEquals(200.00, $service->calculateMrDjPricing(100.00, 3));
        // Day 1: 100.00, Day 2: 50.00, Day 3: 50.00 = 200.00
    }
    
    public function test_calculate_rental_days()
    {
        $service = new InvoiceNinjaService();
        
        $startDate = new \DateTime('2025-10-01');
        $endDate = new \DateTime('2025-10-07');
        
        $this->assertEquals(7, $service->calculateRentalDays($startDate, $endDate));
    }
    
    public function test_tax_rate_calculation()
    {
        $service = new InvoiceNinjaService();
        
        // Equipment should have 9% BTW
        $equipmentItem = factory(EquipmentItem::class)->create([
            'category' => factory(EquipmentCategory::class)->create(['is_service' => false])
        ]);
        
        $this->assertEquals(9.00, $service->getTaxRate($equipmentItem));
        
        // Services should have 21% BTW
        $serviceItem = factory(EquipmentItem::class)->create([
            'category' => factory(EquipmentCategory::class)->create(['is_service' => true])
        ]);
        
        $this->assertEquals(21.00, $service->getTaxRate($serviceItem));
    }
}
```

### Integration Tests
```php
<?php
// tests/Feature/InvoiceCreationTest.php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\RentalAgreement;
use App\Models\Client;
use App\Models\EquipmentItem;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InvoiceCreationTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_create_invoice_from_rental_agreement()
    {
        $client = factory(Client::class)->create();
        $equipment = factory(EquipmentItem::class)->create(['daily_rate' => 100.00]);
        
        $rental = factory(RentalAgreement::class)->create([
            'client_id' => $client->id,
            'start_date' => '2025-10-01',
            'end_date' => '2025-10-03',
        ]);
        
        $rental->equipmentItems()->attach($equipment->id, ['daily_rate' => 100.00]);
        
        $response = $this->postJson("/api/v1/rental-agreements/{$rental->id}/invoice");
        
        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'invoice' => [
                        'id',
                        'invoice_ninja_id',
                        'total_amount',
                        'items'
                    ],
                    'invoice_ninja_url'
                ]);
        
        $this->assertDatabaseHas('rentguy_invoices', [
            'rental_agreement_id' => $rental->id,
            'total_amount' => 200.00 // 3 days with Mr. DJ pricing
        ]);
    }
}
```

## Deliverables

### Code Artifacts
- `app/Services/InvoiceNinjaService.php` - Core service class
- `app/Http/Controllers/Api/InvoiceController.php` - API endpoints
- `app/Models/RentguyInvoice.php` - Invoice model
- `database/migrations/create_rentguy_invoices_table.php` - Database schema

### Configuration
- `config/invoiceninja.php` - API configuration
- `.env` variables voor Invoice Ninja credentials

### Testing
- Unit tests voor pricing calculations
- Integration tests voor API endpoints
- Feature tests voor complete workflow

## Volgende Fase
Fase 4 zal focussen op Quote/Offerte Systeem Integratie, waarbij we equipment availability checking en pakket-gebaseerde quotes implementeren.

## Status: ✅ Voltooid
- Invoice Ninja API integratie geïmplementeerd
- Equipment-specifieke line items ontwikkeld
- Mr. DJ pricing logic (dag 1 = vol, daarna 50%) geïmplementeerd
- Nederlandse BTW handling (9% equipment, 21% services)
- Complete testing suite ontwikkeld
