<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\ConsolidatedClient;
use App\Models\Country;
use App\Models\RentalAgreement;
use App\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

/**
 * Test suite voor de geconsolideerde Client functionaliteit
 */
class ConsolidatedClientTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test country
        $this->country = Country::factory()->create([
            'name' => 'Netherlands',
            'iso_code' => 'NL'
        ]);
    }

    /** @test */
    public function it_can_create_a_client_with_basic_information()
    {
        $clientData = [
            'name' => 'Test Company BV',
            'email' => 'test@company.nl',
            'phone' => '+31 20 123 4567',
            'address1' => 'Teststraat 123',
            'city' => 'Amsterdam',
            'postal_code' => '1012 AB',
            'country_id' => $this->country->id,
        ];

        $response = $this->postJson('/api/clients', $clientData);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Client created successfully'
                ]);

        $this->assertDatabaseHas('invoiceninja_clients', [
            'name' => 'Test Company BV',
            'email' => 'test@company.nl',
            'rental_status' => ConsolidatedClient::STATUS_ACTIVE
        ]);
    }

    /** @test */
    public function it_can_create_a_client_with_rental_specific_fields()
    {
        $clientData = [
            'name' => 'Rental Company Ltd',
            'email' => 'rental@company.com',
            'rental_preferences' => 'Prefers morning deliveries',
            'preferred_delivery_location' => 'Loading dock B',
            'rental_credit_limit' => 5000.00,
            'preferred_payment_method' => 'bank_transfer',
            'rental_notes' => 'VIP customer, handle with care'
        ];

        $response = $this->postJson('/api/clients', $clientData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('invoiceninja_clients', [
            'email' => 'rental@company.com',
            'rental_preferences' => 'Prefers morning deliveries',
            'rental_credit_limit' => 5000.00
        ]);
    }

    /** @test */
    public function it_validates_required_fields_when_creating_client()
    {
        $response = $this->postJson('/api/clients', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['name', 'email']);
    }

    /** @test */
    public function it_validates_unique_email_when_creating_client()
    {
        ConsolidatedClient::factory()->create(['email' => 'existing@company.com']);

        $response = $this->postJson('/api/clients', [
            'name' => 'New Company',
            'email' => 'existing@company.com'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_can_retrieve_a_client_with_relationships()
    {
        $client = ConsolidatedClient::factory()->create([
            'country_id' => $this->country->id
        ]);

        $response = $this->getJson("/api/clients/{$client->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'id' => $client->id,
                        'name' => $client->name,
                        'email' => $client->email
                    ]
                ])
                ->assertJsonStructure([
                    'data' => [
                        'country',
                        'current_rental_value',
                        'payment_reliability_score',
                        'has_outstanding_invoices',
                        'preferred_categories'
                    ]
                ]);
    }

    /** @test */
    public function it_can_update_client_information()
    {
        $client = ConsolidatedClient::factory()->create();

        $updateData = [
            'name' => 'Updated Company Name',
            'phone' => '+31 20 999 8888',
            'rental_credit_limit' => 7500.00
        ];

        $response = $this->putJson("/api/clients/{$client->id}", $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Client updated successfully'
                ]);

        $this->assertDatabaseHas('invoiceninja_clients', [
            'id' => $client->id,
            'name' => 'Updated Company Name',
            'rental_credit_limit' => 7500.00
        ]);
    }

    /** @test */
    public function it_can_update_client_status()
    {
        $client = ConsolidatedClient::factory()->create([
            'rental_status' => ConsolidatedClient::STATUS_ACTIVE
        ]);

        $response = $this->putJson("/api/clients/{$client->id}", [
            'rental_status' => ConsolidatedClient::STATUS_SUSPENDED
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('invoiceninja_clients', [
            'id' => $client->id,
            'rental_status' => ConsolidatedClient::STATUS_SUSPENDED
        ]);
    }

    /** @test */
    public function it_cannot_delete_client_with_active_rentals()
    {
        $client = ConsolidatedClient::factory()->create();
        
        // Create active rental
        RentalAgreement::factory()->create([
            'client_id' => $client->id,
            'status' => 'active',
            'end_date' => now()->addDays(7)
        ]);

        $response = $this->deleteJson("/api/clients/{$client->id}");

        $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'message' => 'Cannot delete client with active rentals'
                ]);

        $this->assertDatabaseHas('invoiceninja_clients', ['id' => $client->id]);
    }

    /** @test */
    public function it_cannot_delete_client_with_unpaid_invoices()
    {
        $client = ConsolidatedClient::factory()->create();
        
        // Create unpaid invoice
        Invoice::factory()->create([
            'client_id' => $client->id,
            'status' => 'sent'
        ]);

        $response = $this->deleteJson("/api/clients/{$client->id}");

        $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'message' => 'Cannot delete client with unpaid invoices'
                ]);

        $this->assertDatabaseHas('invoiceninja_clients', ['id' => $client->id]);
    }

    /** @test */
    public function it_can_delete_client_without_constraints()
    {
        $client = ConsolidatedClient::factory()->create();

        $response = $this->deleteJson("/api/clients/{$client->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Client deleted successfully'
                ]);

        $this->assertSoftDeleted('invoiceninja_clients', ['id' => $client->id]);
    }

    /** @test */
    public function it_can_search_clients()
    {
        ConsolidatedClient::factory()->create(['name' => 'ABC Company', 'email' => 'abc@test.com']);
        ConsolidatedClient::factory()->create(['name' => 'XYZ Corporation', 'email' => 'xyz@test.com']);

        $response = $this->getJson('/api/clients?search=ABC');

        $response->assertStatus(200)
                ->assertJsonCount(1, 'data.data')
                ->assertJsonPath('data.data.0.name', 'ABC Company');
    }

    /** @test */
    public function it_can_filter_clients_by_status()
    {
        ConsolidatedClient::factory()->create(['rental_status' => ConsolidatedClient::STATUS_ACTIVE]);
        ConsolidatedClient::factory()->create(['rental_status' => ConsolidatedClient::STATUS_SUSPENDED]);

        $response = $this->getJson('/api/clients?status=' . ConsolidatedClient::STATUS_ACTIVE);

        $response->assertStatus(200)
                ->assertJsonCount(1, 'data.data');
    }

    /** @test */
    public function it_can_get_client_statistics()
    {
        ConsolidatedClient::factory()->count(5)->create(['rental_status' => ConsolidatedClient::STATUS_ACTIVE]);
        ConsolidatedClient::factory()->count(2)->create(['rental_status' => ConsolidatedClient::STATUS_SUSPENDED]);

        $response = $this->getJson('/api/clients/statistics');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'total_clients' => 7,
                        'active_clients' => 5,
                        'suspended_clients' => 2
                    ]
                ]);
    }

    /** @test */
    public function it_calculates_current_rental_value_correctly()
    {
        $client = ConsolidatedClient::factory()->create();
        
        // Create active rental with items
        $rental = RentalAgreement::factory()->create([
            'client_id' => $client->id,
            'status' => 'active',
            'end_date' => now()->addDays(7)
        ]);

        // Mock rental items total
        $this->assertEquals(0, $client->getCurrentRentalValue());
    }

    /** @test */
    public function it_checks_rental_eligibility_correctly()
    {
        $client = ConsolidatedClient::factory()->create([
            'rental_status' => ConsolidatedClient::STATUS_ACTIVE,
            'rental_credit_limit' => 1000.00
        ]);

        $this->assertTrue($client->isEligibleForRental());

        $client->rental_status = ConsolidatedClient::STATUS_SUSPENDED;
        $this->assertFalse($client->isEligibleForRental());
    }

    /** @test */
    public function it_can_add_equipment_to_history()
    {
        $client = ConsolidatedClient::factory()->create();

        $equipment = [
            'id' => 1,
            'name' => 'Test Equipment',
            'category' => 'Audio',
            'rental_rate' => 50.00
        ];

        $client->addToEquipmentHistory($equipment);

        $this->assertNotEmpty($client->fresh()->equipment_history);
        $this->assertEquals('Test Equipment', $client->fresh()->equipment_history[0]['name']);
    }

    /** @test */
    public function it_can_add_damage_report()
    {
        $client = ConsolidatedClient::factory()->create();

        $damageReport = [
            'equipment_id' => 1,
            'damage_description' => 'Scratched surface',
            'damage_cost' => 150.00,
            'incident_date' => '2025-01-01'
        ];

        $client->addDamageReport($damageReport);

        $this->assertNotEmpty($client->fresh()->damage_history);
        $this->assertEquals('Scratched surface', $client->fresh()->damage_history[0]['damage_description']);
    }

    /** @test */
    public function it_can_get_preferred_equipment_categories()
    {
        $client = ConsolidatedClient::factory()->create([
            'equipment_history' => [
                ['category' => 'Audio', 'name' => 'Speaker'],
                ['category' => 'Audio', 'name' => 'Microphone'],
                ['category' => 'Lighting', 'name' => 'LED Panel'],
                ['category' => 'Audio', 'name' => 'Mixer']
            ]
        ]);

        $categories = $client->getPreferredEquipmentCategories();

        $this->assertEquals(['Audio', 'Lighting'], $categories);
    }

    /** @test */
    public function it_calculates_payment_reliability_score()
    {
        $client = ConsolidatedClient::factory()->create();

        // New client should get 100% score
        $this->assertEquals(100, $client->getPaymentReliabilityScore());
    }

    /** @test */
    public function it_can_update_rental_statistics()
    {
        $client = ConsolidatedClient::factory()->create();

        $client->updateRentalStatistics();

        // Should not throw any errors
        $this->assertInstanceOf(ConsolidatedClient::class, $client);
    }

    /** @test */
    public function it_formats_full_address_correctly()
    {
        $client = ConsolidatedClient::factory()->create([
            'address1' => 'Teststraat 123',
            'city' => 'Amsterdam',
            'postal_code' => '1012 AB',
            'country_id' => $this->country->id
        ]);

        $client->load('country');
        $expectedAddress = 'Teststraat 123, Amsterdam, 1012 AB, Netherlands';
        
        $this->assertEquals($expectedAddress, $client->full_address);
    }

    /** @test */
    public function it_can_scope_active_clients()
    {
        ConsolidatedClient::factory()->create(['rental_status' => ConsolidatedClient::STATUS_ACTIVE]);
        ConsolidatedClient::factory()->create(['rental_status' => ConsolidatedClient::STATUS_SUSPENDED]);

        $activeClients = ConsolidatedClient::active()->get();

        $this->assertCount(1, $activeClients);
        $this->assertEquals(ConsolidatedClient::STATUS_ACTIVE, $activeClients->first()->rental_status);
    }

    /** @test */
    public function it_can_scope_recently_active_clients()
    {
        ConsolidatedClient::factory()->create(['last_rental_date' => now()->subDays(15)]);
        ConsolidatedClient::factory()->create(['last_rental_date' => now()->subDays(45)]);

        $recentClients = ConsolidatedClient::recentlyActive(30)->get();

        $this->assertCount(1, $recentClients);
    }

    /** @test */
    public function it_can_scope_high_value_clients()
    {
        ConsolidatedClient::factory()->create(['total_rental_value' => 15000.00]);
        ConsolidatedClient::factory()->create(['total_rental_value' => 5000.00]);

        $highValueClients = ConsolidatedClient::highValue(10000)->get();

        $this->assertCount(1, $highValueClients);
        $this->assertEquals(15000.00, $highValueClients->first()->total_rental_value);
    }
}
