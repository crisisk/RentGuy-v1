export type EquipmentStatus =
  | 'available'
  | 'in_use'
  | 'maintenance'
  | 'damaged'
  | 'reserved'
  | 'inactive'
  | 'unknown'

export interface EquipmentCategoryInput {
  readonly name: string
}

export interface EquipmentCategory {
  readonly id: number
  readonly name: string
}

export interface EquipmentItemInput {
  readonly name: string
  readonly categoryId: number
  readonly quantityTotal?: number
  readonly minStock?: number
  readonly active?: boolean
  readonly pricePerDay?: number
  readonly costPerDay?: number
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

export interface EquipmentBundleItemInput {
  readonly itemId: number
  readonly quantity?: number
}

export interface EquipmentBundleInput {
  readonly name: string
  readonly active?: boolean
  readonly items?: readonly EquipmentBundleItemInput[]
}

export interface EquipmentBundleItem {
  readonly itemId: number
  readonly quantity: number
}

export interface EquipmentBundle {
  readonly id: number
  readonly name: string
  readonly active: boolean
  readonly items: readonly EquipmentBundleItem[]
}

export interface EquipmentMaintenanceLogInput {
  readonly itemId: number
  readonly dueDate?: string | null
  readonly note?: string | null
}

export interface EquipmentMaintenanceLog {
  readonly id: number
  readonly itemId: number
  readonly dueDate?: string | null
  readonly done: boolean
  readonly note?: string | null
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

export type EquipmentStatusUpdatePayload = {
  readonly status: Exclude<EquipmentStatus, 'unknown'>
}
