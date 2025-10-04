<?php

namespace App\Http\Controllers;

use App\Models\ConsolidatedClient;
use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Geconsolideerde Client Controller
 * 
 * Deze controller combineert de functionaliteiten van de oorspronkelijke RentGuy ClientController
 * met de uitgebreide functionaliteiten van de Invoice Ninja ClientController.
 */
class ConsolidatedClientController extends Controller
{
    /**
     * Display a listing of clients
     */
    public function index(Request $request): JsonResponse
    {
        $query = ConsolidatedClient::query();

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%")
                  ->orWhere('vat_number', 'LIKE', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('rental_status', $request->get('status'));
        }

        // Filter by recent activity
        if ($request->has('recent_activity')) {
            $days = (int) $request->get('recent_activity', 30);
            $query->recentlyActive($days);
        }

        // Filter by high value clients
        if ($request->has('high_value')) {
            $threshold = (float) $request->get('high_value', 10000);
            $query->highValue($threshold);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        
        $allowedSortFields = ['name', 'email', 'created_at', 'last_rental_date', 'total_rental_value', 'rental_status'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination
        $perPage = min((int) $request->get('per_page', 15), 100);
        $clients = $query->with(['country', 'currentRentals', 'invoices' => function ($q) {
            $q->whereIn('status', ['sent', 'partial'])->latest()->limit(5);
        }])->paginate($perPage);

        // Add computed fields
        $clients->getCollection()->transform(function ($client) {
            $client->current_rental_value = $client->getCurrentRentalValue();
            $client->payment_reliability_score = $client->getPaymentReliabilityScore();
            $client->has_outstanding_invoices = $client->hasOutstandingInvoices();
            $client->preferred_categories = $client->getPreferredEquipmentCategories();
            return $client;
        });

        return response()->json([
            'success' => true,
            'data' => $clients,
            'meta' => [
                'total_clients' => ConsolidatedClient::count(),
                'active_clients' => ConsolidatedClient::active()->count(),
                'recent_activity' => ConsolidatedClient::recentlyActive()->count(),
                'high_value_clients' => ConsolidatedClient::highValue()->count(),
            ]
        ]);
    }

    /**
     * Store a newly created client
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:invoiceninja_clients,email',
            'phone' => 'nullable|string|max:50',
            'address1' => 'nullable|string|max:255',
            'address2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country_id' => 'nullable|exists:countries,id',
            'website' => 'nullable|url|max:255',
            'vat_number' => 'nullable|string|max:50',
            'id_number' => 'nullable|string|max:50',
            'custom_value1' => 'nullable|string|max:255',
            'custom_value2' => 'nullable|string|max:255',
            'custom_value3' => 'nullable|string|max:255',
            'custom_value4' => 'nullable|string|max:255',
            'rental_preferences' => 'nullable|string',
            'preferred_delivery_location' => 'nullable|string|max:255',
            'rental_credit_limit' => 'nullable|numeric|min:0|max:999999.99',
            'rental_status' => ['nullable', Rule::in([
                ConsolidatedClient::STATUS_ACTIVE,
                ConsolidatedClient::STATUS_SUSPENDED,
                ConsolidatedClient::STATUS_PENDING_APPROVAL
            ])],
            'preferred_payment_method' => 'nullable|string|max:50',
            'rental_notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $client = ConsolidatedClient::create($validated);

            // Log client creation
            Log::info('New client created', [
                'client_id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'created_by' => auth()->id(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client created successfully',
                'data' => $client->load('country')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create client', [
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified client
     */
    public function show(ConsolidatedClient $client): JsonResponse
    {
        $client->load([
            'country',
            'currentRentals.equipment',
            'rentalHistory' => function ($q) {
                $q->latest()->limit(10);
            },
            'invoices' => function ($q) {
                $q->latest()->limit(10);
            },
            'quotes' => function ($q) {
                $q->latest()->limit(5);
            }
        ]);

        // Add computed fields
        $client->current_rental_value = $client->getCurrentRentalValue();
        $client->payment_reliability_score = $client->getPaymentReliabilityScore();
        $client->has_outstanding_invoices = $client->hasOutstandingInvoices();
        $client->preferred_categories = $client->getPreferredEquipmentCategories();

        return response()->json([
            'success' => true,
            'data' => $client
        ]);
    }

    /**
     * Update the specified client
     */
    public function update(Request $request, ConsolidatedClient $client): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:invoiceninja_clients,email,' . $client->id,
            'phone' => 'nullable|string|max:50',
            'address1' => 'nullable|string|max:255',
            'address2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country_id' => 'nullable|exists:countries,id',
            'website' => 'nullable|url|max:255',
            'vat_number' => 'nullable|string|max:50',
            'id_number' => 'nullable|string|max:50',
            'custom_value1' => 'nullable|string|max:255',
            'custom_value2' => 'nullable|string|max:255',
            'custom_value3' => 'nullable|string|max:255',
            'custom_value4' => 'nullable|string|max:255',
            'rental_preferences' => 'nullable|string',
            'preferred_delivery_location' => 'nullable|string|max:255',
            'rental_credit_limit' => 'nullable|numeric|min:0|max:999999.99',
            'rental_status' => ['nullable', Rule::in([
                ConsolidatedClient::STATUS_ACTIVE,
                ConsolidatedClient::STATUS_SUSPENDED,
                ConsolidatedClient::STATUS_PENDING_APPROVAL
            ])],
            'preferred_payment_method' => 'nullable|string|max:50',
            'rental_notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $oldStatus = $client->rental_status;
            $client->update($validated);

            // Log status changes
            if (isset($validated['rental_status']) && $oldStatus !== $validated['rental_status']) {
                Log::info('Client status changed', [
                    'client_id' => $client->id,
                    'old_status' => $oldStatus,
                    'new_status' => $validated['rental_status'],
                    'updated_by' => auth()->id(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client updated successfully',
                'data' => $client->load('country')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update client', [
                'client_id' => $client->id,
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified client
     */
    public function destroy(ConsolidatedClient $client): JsonResponse
    {
        try {
            // Check if client has active rentals
            if ($client->currentRentals()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete client with active rentals'
                ], 422);
            }

            // Check if client has unpaid invoices
            if ($client->invoices()->whereIn('status', ['sent', 'partial'])->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete client with unpaid invoices'
                ], 422);
            }

            DB::beginTransaction();

            $clientName = $client->name;
            $client->delete();

            Log::info('Client deleted', [
                'client_id' => $client->id,
                'client_name' => $clientName,
                'deleted_by' => auth()->id(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete client', [
                'client_id' => $client->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get client statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_clients' => ConsolidatedClient::count(),
            'active_clients' => ConsolidatedClient::active()->count(),
            'suspended_clients' => ConsolidatedClient::where('rental_status', ConsolidatedClient::STATUS_SUSPENDED)->count(),
            'pending_approval' => ConsolidatedClient::where('rental_status', ConsolidatedClient::STATUS_PENDING_APPROVAL)->count(),
            'recent_activity' => ConsolidatedClient::recentlyActive(30)->count(),
            'high_value_clients' => ConsolidatedClient::highValue(10000)->count(),
            'clients_with_outstanding_invoices' => ConsolidatedClient::whereHas('invoices', function ($q) {
                $q->whereIn('status', ['sent', 'partial']);
            })->count(),
            'total_rental_value' => ConsolidatedClient::sum('total_rental_value'),
            'average_rental_value' => ConsolidatedClient::avg('total_rental_value'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Update client rental statistics
     */
    public function updateStatistics(ConsolidatedClient $client): JsonResponse
    {
        try {
            $client->updateRentalStatistics();

            return response()->json([
                'success' => true,
                'message' => 'Client statistics updated successfully',
                'data' => [
                    'last_rental_date' => $client->last_rental_date,
                    'total_rental_value' => $client->total_rental_value,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update client statistics', [
                'client_id' => $client->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update client statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add damage report for client
     */
    public function addDamageReport(Request $request, ConsolidatedClient $client): JsonResponse
    {
        $validated = $request->validate([
            'equipment_id' => 'required|exists:equipment,id',
            'damage_description' => 'required|string',
            'damage_cost' => 'required|numeric|min:0',
            'incident_date' => 'required|date',
            'photos' => 'nullable|array',
            'photos.*' => 'string|url',
        ]);

        try {
            $client->addDamageReport($validated);

            Log::info('Damage report added for client', [
                'client_id' => $client->id,
                'equipment_id' => $validated['equipment_id'],
                'damage_cost' => $validated['damage_cost'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Damage report added successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to add damage report', [
                'client_id' => $client->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add damage report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get countries for dropdown
     */
    public function getCountries(): JsonResponse
    {
        $countries = Country::select('id', 'name', 'iso_code')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $countries
        ]);
    }
}
