<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * Geconsolideerd Invoice Model
 * 
 * Dit model combineert de functionaliteiten van het oorspronkelijke RentGuy Invoice model
 * met de uitgebreide functionaliteiten van het Invoice Ninja Invoice model.
 * 
 * @property int $id
 * @property int $client_id
 * @property string $invoice_number
 * @property \Carbon\Carbon $invoice_date
 * @property \Carbon\Carbon $due_date
 * @property float $amount
 * @property float $balance
 * @property string $status
 * @property string|null $notes
 * @property string|null $terms
 * @property string|null $footer
 * @property string|null $public_notes
 * @property string|null $private_notes
 * @property string|null $po_number
 * @property float $discount
 * @property float $tax_amount
 * @property \Carbon\Carbon|null $rental_start_date
 * @property \Carbon\Carbon|null $rental_end_date
 * @property int|null $rental_duration_days
 * @property array|null $equipment_list
 * @property string|null $delivery_address
 * @property string|null $pickup_address
 * @property \Carbon\Carbon|null $delivery_date
 * @property \Carbon\Carbon|null $pickup_date
 * @property string|null $delivery_instructions
 * @property string|null $pickup_instructions
 * @property array|null $damage_assessment
 * @property float $late_return_fees
 * @property float $damage_charges
 * @property float $security_deposit
 * @property bool $deposit_returned
 * @property string|null $rental_agreement_id
 * @property string|null $project_reference
 * @property string|null $event_type
 * @property array|null $crew_assigned
 * @property string|null $setup_requirements
 * @property string|null $breakdown_requirements
 * @property bool $insurance_required
 * @property float $insurance_amount
 * @property string|null $special_conditions
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class ConsolidatedInvoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'invoiceninja_invoices';

    protected $fillable = [
        'client_id',
        'invoice_number',
        'invoice_date',
        'due_date',
        'amount',
        'balance',
        'status',
        'notes',
        'terms',
        'footer',
        'public_notes',
        'private_notes',
        'po_number',
        'discount',
        'tax_amount',
        'rental_start_date',
        'rental_end_date',
        'rental_duration_days',
        'equipment_list',
        'delivery_address',
        'pickup_address',
        'delivery_date',
        'pickup_date',
        'delivery_instructions',
        'pickup_instructions',
        'damage_assessment',
        'late_return_fees',
        'damage_charges',
        'security_deposit',
        'deposit_returned',
        'rental_agreement_id',
        'project_reference',
        'event_type',
        'crew_assigned',
        'setup_requirements',
        'breakdown_requirements',
        'insurance_required',
        'insurance_amount',
        'special_conditions',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'rental_start_date' => 'date',
        'rental_end_date' => 'date',
        'delivery_date' => 'datetime',
        'pickup_date' => 'datetime',
        'equipment_list' => 'array',
        'damage_assessment' => 'array',
        'crew_assigned' => 'array',
        'amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'late_return_fees' => 'decimal:2',
        'damage_charges' => 'decimal:2',
        'security_deposit' => 'decimal:2',
        'insurance_amount' => 'decimal:2',
        'deposit_returned' => 'boolean',
        'insurance_required' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $attributes = [
        'amount' => 0.00,
        'balance' => 0.00,
        'discount' => 0.00,
        'tax_amount' => 0.00,
        'late_return_fees' => 0.00,
        'damage_charges' => 0.00,
        'security_deposit' => 0.00,
        'insurance_amount' => 0.00,
        'deposit_returned' => false,
        'insurance_required' => false,
        'status' => 'draft',
    ];

    // Invoice Status Constants
    const STATUS_DRAFT = 'draft';
    const STATUS_SENT = 'sent';
    const STATUS_PARTIAL = 'partial';
    const STATUS_PAID = 'paid';
    const STATUS_OVERDUE = 'overdue';
    const STATUS_CANCELLED = 'cancelled';

    // Event Type Constants
    const EVENT_TYPE_CORPORATE = 'corporate';
    const EVENT_TYPE_WEDDING = 'wedding';
    const EVENT_TYPE_FESTIVAL = 'festival';
    const EVENT_TYPE_CONFERENCE = 'conference';
    const EVENT_TYPE_CONCERT = 'concert';
    const EVENT_TYPE_EXHIBITION = 'exhibition';
    const EVENT_TYPE_OTHER = 'other';

    /**
     * Get the client that owns the invoice
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(ConsolidatedClient::class, 'client_id');
    }

    /**
     * Get all payments for this invoice
     */
    public function payments(): HasMany
    {
        return $this->hasMany(ConsolidatedPayment::class, 'invoice_id');
    }

    /**
     * Get all invoice items
     */
    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id');
    }

    /**
     * Get the rental agreement associated with this invoice
     */
    public function rentalAgreement(): BelongsTo
    {
        return $this->belongsTo(RentalAgreement::class, 'rental_agreement_id', 'id');
    }

    /**
     * Check if invoice is overdue
     */
    public function isOverdue(): bool
    {
        return $this->due_date->isPast() && $this->balance > 0;
    }

    /**
     * Check if invoice is paid in full
     */
    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID || $this->balance <= 0;
    }

    /**
     * Check if invoice is partially paid
     */
    public function isPartiallyPaid(): bool
    {
        return $this->balance > 0 && $this->balance < $this->amount;
    }

    /**
     * Check if this is a rental invoice
     */
    public function isRentalInvoice(): bool
    {
        return !is_null($this->rental_start_date) || !is_null($this->equipment_list);
    }

    /**
     * Get total paid amount
     */
    public function getTotalPaidAmount(): float
    {
        return $this->payments()
            ->where('refund_amount', 0)
            ->sum('amount');
    }

    /**
     * Get remaining balance
     */
    public function getRemainingBalance(): float
    {
        return max(0, $this->amount - $this->getTotalPaidAmount());
    }

    /**
     * Calculate rental duration in days
     */
    public function calculateRentalDuration(): int
    {
        if ($this->rental_start_date && $this->rental_end_date) {
            return $this->rental_start_date->diffInDays($this->rental_end_date) + 1;
        }
        return $this->rental_duration_days ?? 0;
    }

    /**
     * Get equipment count
     */
    public function getEquipmentCount(): int
    {
        if (!$this->equipment_list) {
            return 0;
        }
        
        return array_sum(array_column($this->equipment_list, 'quantity'));
    }

    /**
     * Get total equipment value
     */
    public function getTotalEquipmentValue(): float
    {
        if (!$this->equipment_list) {
            return 0.00;
        }
        
        $total = 0;
        foreach ($this->equipment_list as $item) {
            $total += ($item['quantity'] ?? 0) * ($item['daily_rate'] ?? 0) * $this->calculateRentalDuration();
        }
        
        return $total;
    }

    /**
     * Add equipment to the invoice
     */
    public function addEquipment(array $equipment): void
    {
        $currentList = $this->equipment_list ?? [];
        $currentList[] = array_merge($equipment, ['added_at' => now()->toISOString()]);
        
        $this->equipment_list = $currentList;
        $this->recalculateAmount();
        $this->save();
    }

    /**
     * Remove equipment from the invoice
     */
    public function removeEquipment(string $equipmentId): void
    {
        if (!$this->equipment_list) {
            return;
        }
        
        $this->equipment_list = array_filter($this->equipment_list, function ($item) use ($equipmentId) {
            return ($item['id'] ?? '') !== $equipmentId;
        });
        
        $this->recalculateAmount();
        $this->save();
    }

    /**
     * Add damage assessment
     */
    public function addDamageAssessment(array $damage): void
    {
        $currentAssessment = $this->damage_assessment ?? [];
        $currentAssessment[] = array_merge($damage, ['assessed_at' => now()->toISOString()]);
        
        $this->damage_assessment = $currentAssessment;
        $this->damage_charges += $damage['cost'] ?? 0;
        $this->recalculateAmount();
        $this->save();
    }

    /**
     * Assign crew to the rental
     */
    public function assignCrew(array $crew): void
    {
        $this->crew_assigned = $crew;
        $this->save();
    }

    /**
     * Mark deposit as returned
     */
    public function returnDeposit(): void
    {
        $this->deposit_returned = true;
        $this->save();
        
        // Log deposit return
        \Log::info('Security deposit returned', [
            'invoice_id' => $this->id,
            'deposit_amount' => $this->security_deposit,
            'returned_at' => now(),
        ]);
    }

    /**
     * Recalculate invoice amount based on equipment, fees, and charges
     */
    public function recalculateAmount(): void
    {
        $equipmentTotal = $this->getTotalEquipmentValue();
        $feesTotal = $this->late_return_fees + $this->damage_charges;
        $subtotal = $equipmentTotal + $feesTotal - $this->discount;
        
        $this->amount = $subtotal + $this->tax_amount;
        $this->balance = $this->getRemainingBalance();
    }

    /**
     * Update invoice status based on payments and due date
     */
    public function updateStatus(): void
    {
        $paidAmount = $this->getTotalPaidAmount();
        
        if ($paidAmount >= $this->amount) {
            $this->status = self::STATUS_PAID;
            $this->balance = 0;
        } elseif ($paidAmount > 0) {
            $this->status = self::STATUS_PARTIAL;
            $this->balance = $this->amount - $paidAmount;
        } elseif ($this->due_date->isPast() && $this->status !== self::STATUS_DRAFT) {
            $this->status = self::STATUS_OVERDUE;
        }
        
        $this->save();
    }

    /**
     * Send invoice to client
     */
    public function send(): bool
    {
        if ($this->status === self::STATUS_DRAFT) {
            $this->status = self::STATUS_SENT;
            $this->save();
            
            // Log invoice sent
            \Log::info('Invoice sent to client', [
                'invoice_id' => $this->id,
                'client_id' => $this->client_id,
                'sent_at' => now(),
            ]);
            
            return true;
        }
        
        return false;
    }

    /**
     * Cancel the invoice
     */
    public function cancel(string $reason = null): bool
    {
        if (in_array($this->status, [self::STATUS_DRAFT, self::STATUS_SENT])) {
            $this->status = self::STATUS_CANCELLED;
            if ($reason) {
                $this->private_notes = ($this->private_notes ?? '') . "\nCancelled: " . $reason;
            }
            $this->save();
            
            // Log invoice cancellation
            \Log::info('Invoice cancelled', [
                'invoice_id' => $this->id,
                'reason' => $reason,
                'cancelled_at' => now(),
            ]);
            
            return true;
        }
        
        return false;
    }

    /**
     * Get days until due date
     */
    public function getDaysUntilDue(): int
    {
        return now()->diffInDays($this->due_date, false);
    }

    /**
     * Get days overdue
     */
    public function getDaysOverdue(): int
    {
        if (!$this->isOverdue()) {
            return 0;
        }
        
        return $this->due_date->diffInDays(now());
    }

    /**
     * Scope for overdue invoices
     */
    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                    ->where('balance', '>', 0)
                    ->whereNotIn('status', [self::STATUS_PAID, self::STATUS_CANCELLED]);
    }

    /**
     * Scope for paid invoices
     */
    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID)
                    ->orWhere('balance', '<=', 0);
    }

    /**
     * Scope for rental invoices
     */
    public function scopeRental($query)
    {
        return $query->whereNotNull('rental_start_date')
                    ->orWhereNotNull('equipment_list');
    }

    /**
     * Scope for invoices by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('invoice_date', [$startDate, $endDate]);
    }

    /**
     * Scope for invoices by client
     */
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Get formatted invoice number
     */
    public function getFormattedInvoiceNumberAttribute(): string
    {
        return 'INV-' . str_pad($this->invoice_number, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Get status badge color
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            self::STATUS_DRAFT => 'gray',
            self::STATUS_SENT => 'blue',
            self::STATUS_PARTIAL => 'yellow',
            self::STATUS_PAID => 'green',
            self::STATUS_OVERDUE => 'red',
            self::STATUS_CANCELLED => 'gray',
            default => 'gray'
        };
    }

    /**
     * Boot method for model events
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($invoice) {
            // Generate invoice number if not provided
            if (empty($invoice->invoice_number)) {
                $invoice->invoice_number = self::generateInvoiceNumber();
            }
            
            // Set default due date if not provided
            if (empty($invoice->due_date)) {
                $invoice->due_date = $invoice->invoice_date->addDays(30);
            }
            
            // Calculate rental duration if dates are provided
            if ($invoice->rental_start_date && $invoice->rental_end_date) {
                $invoice->rental_duration_days = $invoice->calculateRentalDuration();
            }
        });
        
        static::updating(function ($invoice) {
            // Recalculate duration if dates change
            if ($invoice->isDirty(['rental_start_date', 'rental_end_date'])) {
                $invoice->rental_duration_days = $invoice->calculateRentalDuration();
            }
            
            // Update status if amount or payments change
            if ($invoice->isDirty(['amount', 'balance'])) {
                $invoice->updateStatus();
            }
        });
    }

    /**
     * Generate unique invoice number
     */
    protected static function generateInvoiceNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        
        $lastInvoice = self::whereYear('created_at', $year)
                          ->whereMonth('created_at', $month)
                          ->orderBy('id', 'desc')
                          ->first();
        
        $sequence = $lastInvoice ? (int) substr($lastInvoice->invoice_number, -4) + 1 : 1;
        
        return $year . $month . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
