<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Geconsolideerd Client Model
 * 
 * Dit model combineert de functionaliteiten van het oorspronkelijke RentGuy Client model
 * met de uitgebreide functionaliteiten van het Invoice Ninja Client model.
 * 
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property string|null $address1
 * @property string|null $address2
 * @property string|null $city
 * @property string|null $state
 * @property string|null $postal_code
 * @property int|null $country_id
 * @property string|null $website
 * @property string|null $vat_number
 * @property string|null $id_number
 * @property string|null $custom_value1
 * @property string|null $custom_value2
 * @property string|null $custom_value3
 * @property string|null $custom_value4
 * @property string|null $rental_preferences
 * @property array|null $equipment_history
 * @property string|null $preferred_delivery_location
 * @property float $rental_credit_limit
 * @property string $rental_status
 * @property \Carbon\Carbon|null $last_rental_date
 * @property float $total_rental_value
 * @property array|null $damage_history
 * @property string|null $preferred_payment_method
 * @property string|null $rental_notes
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class ConsolidatedClient extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'invoiceninja_clients';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address1',
        'address2',
        'city',
        'state',
        'postal_code',
        'country_id',
        'website',
        'vat_number',
        'id_number',
        'custom_value1',
        'custom_value2',
        'custom_value3',
        'custom_value4',
        'rental_preferences',
        'equipment_history',
        'preferred_delivery_location',
        'rental_credit_limit',
        'rental_status',
        'last_rental_date',
        'total_rental_value',
        'damage_history',
        'preferred_payment_method',
        'rental_notes',
    ];

    protected $casts = [
        'equipment_history' => 'array',
        'damage_history' => 'array',
        'last_rental_date' => 'datetime',
        'rental_credit_limit' => 'decimal:2',
        'total_rental_value' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $attributes = [
        'rental_credit_limit' => 0.00,
        'total_rental_value' => 0.00,
        'rental_status' => 'active',
    ];

    // Rental Status Constants
    const STATUS_ACTIVE = 'active';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_PENDING_APPROVAL = 'pending_approval';

    /**
     * Get all rental agreements for this client
     */
    public function rentalAgreements(): HasMany
    {
        return $this->hasMany(RentalAgreement::class, 'client_id');
    }

    /**
     * Get all invoices for this client
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'client_id');
    }

    /**
     * Get all quotes for this client
     */
    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class, 'client_id');
    }

    /**
     * Get the country for this client
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    /**
     * Get all equipment currently rented by this client
     */
    public function currentRentals(): HasMany
    {
        return $this->rentalAgreements()
            ->where('status', 'active')
            ->where('end_date', '>=', now());
    }

    /**
     * Get the client's rental history
     */
    public function rentalHistory(): HasMany
    {
        return $this->rentalAgreements()
            ->where('status', 'completed')
            ->orderBy('end_date', 'desc');
    }

    /**
     * Check if client is eligible for rental
     */
    public function isEligibleForRental(): bool
    {
        return $this->rental_status === self::STATUS_ACTIVE 
            && $this->getCurrentRentalValue() < $this->rental_credit_limit;
    }

    /**
     * Get current rental value
     */
    public function getCurrentRentalValue(): float
    {
        return $this->currentRentals()
            ->join('rental_items', 'rental_agreements.id', '=', 'rental_items.rental_agreement_id')
            ->sum('rental_items.total_price');
    }

    /**
     * Add equipment to rental history
     */
    public function addToEquipmentHistory(array $equipment): void
    {
        $history = $this->equipment_history ?? [];
        $history[] = array_merge($equipment, ['rented_at' => now()->toISOString()]);
        
        // Keep only last 50 entries
        if (count($history) > 50) {
            $history = array_slice($history, -50);
        }
        
        $this->equipment_history = $history;
        $this->save();
    }

    /**
     * Add damage report to history
     */
    public function addDamageReport(array $damageReport): void
    {
        $history = $this->damage_history ?? [];
        $history[] = array_merge($damageReport, ['reported_at' => now()->toISOString()]);
        
        $this->damage_history = $history;
        $this->save();
    }

    /**
     * Update rental statistics
     */
    public function updateRentalStatistics(): void
    {
        $this->last_rental_date = $this->rentalAgreements()
            ->orderBy('created_at', 'desc')
            ->value('created_at');
            
        $this->total_rental_value = $this->invoices()
            ->where('status', 'paid')
            ->sum('amount');
            
        $this->save();
    }

    /**
     * Get client's preferred equipment categories
     */
    public function getPreferredEquipmentCategories(): array
    {
        $history = $this->equipment_history ?? [];
        $categories = [];
        
        foreach ($history as $item) {
            $category = $item['category'] ?? 'Unknown';
            $categories[$category] = ($categories[$category] ?? 0) + 1;
        }
        
        arsort($categories);
        return array_keys(array_slice($categories, 0, 5));
    }

    /**
     * Check if client has any outstanding invoices
     */
    public function hasOutstandingInvoices(): bool
    {
        return $this->invoices()
            ->whereIn('status', ['sent', 'partial'])
            ->exists();
    }

    /**
     * Get client's payment reliability score (0-100)
     */
    public function getPaymentReliabilityScore(): int
    {
        $totalInvoices = $this->invoices()->count();
        
        if ($totalInvoices === 0) {
            return 100; // New client gets benefit of doubt
        }
        
        $paidOnTime = $this->invoices()
            ->where('status', 'paid')
            ->whereRaw('paid_date <= due_date')
            ->count();
            
        return (int) round(($paidOnTime / $totalInvoices) * 100);
    }

    /**
     * Scope for active clients
     */
    public function scopeActive($query)
    {
        return $query->where('rental_status', self::STATUS_ACTIVE);
    }

    /**
     * Scope for clients with recent activity
     */
    public function scopeRecentlyActive($query, $days = 30)
    {
        return $query->where('last_rental_date', '>=', now()->subDays($days));
    }

    /**
     * Scope for high-value clients
     */
    public function scopeHighValue($query, $threshold = 10000)
    {
        return $query->where('total_rental_value', '>=', $threshold);
    }

    /**
     * Get full address as string
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address1,
            $this->address2,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country->name ?? null,
        ]);
        
        return implode(', ', $parts);
    }

    /**
     * Get display name (company name or full name)
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->name;
    }

    /**
     * Boot method for model events
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($client) {
            // Set default values
            if (empty($client->rental_status)) {
                $client->rental_status = self::STATUS_ACTIVE;
            }
        });
        
        static::updating(function ($client) {
            // Update statistics when relevant fields change
            if ($client->isDirty(['rental_status', 'rental_credit_limit'])) {
                // Log status changes for audit trail
                \Log::info('Client status updated', [
                    'client_id' => $client->id,
                    'old_status' => $client->getOriginal('rental_status'),
                    'new_status' => $client->rental_status,
                ]);
            }
        });
    }
}
