export type EquipmentStatus =
  | 'available'
  | 'in_use'
  | 'maintenance'
  | 'damaged'
  | 'reserved'
  | 'inactive'
  | 'unknown'

export interface EquipmentCategory {
  readonly id: number
  readonly name: string
}

export interface EquipmentItem {
  readonly id: number
  readonly name: string
  readonly status: EquipmentStatus
  readonly categoryId: number
  readonly categoryName: string | null
  readonly quantityTotal: number
  readonly minStock: number
  readonly active: boolean
  readonly pricePerDay: number
  readonly costPerDay: number
  readonly updatedAt?: string | null
}

export interface EquipmentAvailabilityRequest {
  readonly itemId: number
  readonly quantity: number
  readonly start: string
  readonly end: string
}

export interface EquipmentAvailability {
  readonly itemId: number
  readonly requested: number
  readonly available: number
  readonly ok: boolean
}
