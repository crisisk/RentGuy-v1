import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { api } from '@infra/http/api'
import type {
  EquipmentAvailability,
  EquipmentAvailabilityRequest,
  EquipmentCategory,
  EquipmentItem,
  EquipmentStatus,
} from '@rg-types/equipmentTypes'

interface InventoryState {
  items: EquipmentItem[]
  categories: EquipmentCategory[]
  availability: Record<number, EquipmentAvailability>
  loading: boolean
  availabilityLoading: boolean
  error: string | null
  lastFetchedAt: string | null
  fetchInventory: () => Promise<EquipmentItem[]>
  refreshAvailability: (
    requests: EquipmentAvailabilityRequest[],
  ) => Promise<Record<number, EquipmentAvailability>>
  updateStatus: (itemId: number, status: EquipmentStatus) => Promise<EquipmentItem | null>
  clearError: () => void
}

const INVENTORY_BASE_PATH = '/api/v1/inventory'

type RawCategory = { id?: unknown; name?: unknown }
type RawItem = {
  id?: unknown
  name?: unknown
  status?: unknown
  category_id?: unknown
  category?: { name?: unknown } | null
  quantity_total?: unknown
  min_stock?: unknown
  active?: unknown
  price_per_day?: unknown
  cost_per_day?: unknown
  updated_at?: unknown
}
type RawAvailability = {
  item_id?: unknown
  requested?: unknown
  available?: unknown
  ok?: unknown
}

const statusMap: Record<string, EquipmentStatus> = {
  available: 'available',
  in_use: 'in_use',
  maintenance: 'maintenance',
  damaged: 'damaged',
  reserved: 'reserved',
  inactive: 'inactive',
}

function normaliseStatus(value: unknown): EquipmentStatus {
  if (typeof value !== 'string') {
    return 'unknown'
  }
  const key = value.trim().toLowerCase()
  return statusMap[key] ?? 'unknown'
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (value && typeof value === 'object' && 'toString' in value) {
    const parsed = Number.parseFloat(String(value))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1'
  }
  return false
}

function mapCategory(raw: RawCategory): EquipmentCategory {
  const id = Number.parseInt(String(raw.id ?? '0'), 10)
  return {
    id: Number.isFinite(id) && id > 0 ? id : 0,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Onbekende categorie',
  }
}

function mapItem(raw: RawItem, categories: Map<number, EquipmentCategory>): EquipmentItem {
  const id = Number.parseInt(String(raw.id ?? '0'), 10)
  const categoryId = Number.parseInt(String(raw.category_id ?? '0'), 10)
  const categoryName =
    typeof raw.category?.name === 'string' && raw.category?.name.trim()
      ? raw.category.name.trim()
      : categories.get(categoryId)?.name ?? null

  return {
    id: Number.isFinite(id) && id > 0 ? id : 0,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Onbekend item',
    status: normaliseStatus(raw.status),
    categoryId,
    categoryName,
    quantityTotal: toNumber(raw.quantity_total),
    minStock: toNumber(raw.min_stock),
    active: toBoolean(raw.active),
    pricePerDay: toNumber(raw.price_per_day),
    costPerDay: toNumber(raw.cost_per_day),
    updatedAt:
      typeof raw.updated_at === 'string' && raw.updated_at.trim()
        ? new Date(raw.updated_at).toISOString()
        : null,
  }
}

function mapAvailability(raw: RawAvailability): EquipmentAvailability {
  const itemId = Number.parseInt(String(raw.item_id ?? '0'), 10)
  return {
    itemId: Number.isFinite(itemId) && itemId > 0 ? itemId : 0,
    requested: toNumber(raw.requested),
    available: toNumber(raw.available),
    ok: toBoolean(raw.ok),
  }
}

export const useInventoryStore = create<InventoryState>()(
  immer((set, get) => ({
    items: [],
    categories: [],
    availability: {},
    loading: false,
    availabilityLoading: false,
    error: null,
    lastFetchedAt: null,

    clearError: () => {
      set(state => {
        state.error = null
      })
    },

    fetchInventory: async () => {
      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const [itemsResponse, categoriesResponse] = await Promise.all([
          api.get(`${INVENTORY_BASE_PATH}/items`),
          api.get(`${INVENTORY_BASE_PATH}/categories`),
        ])

        const categoriesPayload = Array.isArray(categoriesResponse.data)
          ? (categoriesResponse.data as RawCategory[])
          : []
        const categories = categoriesPayload.map(mapCategory)
        const categoryMap = new Map(categories.map(category => [category.id, category]))

        const itemsPayload = Array.isArray(itemsResponse.data)
          ? (itemsResponse.data as RawItem[])
          : []
        const items = itemsPayload.map(item => mapItem(item, categoryMap))

        set(state => {
          state.categories = categories
          state.items = items
          state.loading = false
          state.lastFetchedAt = new Date().toISOString()
        })

        return items
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Inventaris laden mislukt'
        set(state => {
          state.loading = false
          state.error = message
        })
        throw error
      }
    },

    refreshAvailability: async requests => {
      if (!requests.length) {
        return {}
      }

      set(state => {
        state.availabilityLoading = true
        state.error = null
      })

      try {
        const payload = requests.map(request => ({
          item_id: request.itemId,
          quantity: request.quantity,
          start: request.start,
          end: request.end,
        }))
        const response = await api.post(`${INVENTORY_BASE_PATH}/availability`, payload)
        const entries = Array.isArray(response.data) ? (response.data as RawAvailability[]) : []
        const availability = entries.map(mapAvailability)

        set(state => {
          state.availabilityLoading = false
          for (const entry of availability) {
            state.availability[entry.itemId] = entry
          }
        })

        return availability.reduce<Record<number, EquipmentAvailability>>((acc, entry) => {
          acc[entry.itemId] = entry
          return acc
        }, {})
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Beschikbaarheid ophalen mislukt'
        set(state => {
          state.availabilityLoading = false
          state.error = message
        })
        throw error
      }
    },

    updateStatus: async (itemId, status) => {
      set(state => {
        state.error = null
      })

      try {
        const response = await api.patch(`${INVENTORY_BASE_PATH}/items/${itemId}/status`, { status })
        const updatedItem = mapItem(response.data as RawItem, new Map(get().categories.map(category => [category.id, category])))

        set(state => {
          const index = state.items.findIndex(item => item.id === updatedItem.id)
          if (index >= 0) {
            state.items[index] = { ...state.items[index], ...updatedItem }
          } else if (updatedItem.id) {
            state.items.push(updatedItem)
          }
        })

        return updatedItem
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Status bijwerken mislukt'
        set(state => {
          state.error = message
        })
        throw error
      }
    },
  })),
)
