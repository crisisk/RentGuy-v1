import { useEffect, useMemo, useRef, useState } from 'react'
import { useInventoryStore } from '@stores/equipmentStore'
import { brand, headingFontStack, withOpacity } from '@ui/branding'
import type { EquipmentItem, EquipmentStatus } from '@rg-types/equipmentTypes'

const statusLabels: Record<EquipmentStatus, string> = {
  available: 'Beschikbaar',
  in_use: 'In gebruik',
  maintenance: 'Onderhoud',
  damaged: 'Beschadigd',
  reserved: 'Gereserveerd',
  inactive: 'Inactief',
  unknown: 'Onbekend',
}

const statusStyles: Record<EquipmentStatus, { background: string; color: string }> = {
  available: { background: withOpacity(brand.colors.success, 0.16), color: brand.colors.success },
  in_use: { background: withOpacity(brand.colors.accent, 0.18), color: brand.colors.accent },
  maintenance: { background: withOpacity(brand.colors.warning, 0.18), color: brand.colors.warning },
  damaged: { background: withOpacity(brand.colors.danger, 0.2), color: brand.colors.danger },
  reserved: { background: withOpacity(brand.colors.secondary, 0.16), color: brand.colors.secondary },
  inactive: { background: withOpacity('#94A3B8', 0.2), color: '#475569' },
  unknown: { background: withOpacity('#94A3B8', 0.2), color: '#475569' },
}

const statusOrder: readonly EquipmentStatus[] = [
  'available',
  'reserved',
  'in_use',
  'maintenance',
  'damaged',
  'inactive',
  'unknown',
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function getAvailabilityWindow(days = 7) {
  const start = new Date()
  const end = new Date()
  end.setDate(start.getDate() + days)
  const toIsoDate = (input: Date) => input.toISOString().slice(0, 10)
  return { start: toIsoDate(start), end: toIsoDate(end) }
}

const filterControlStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
  background: withOpacity('#ffffff', 0.92),
  color: brand.colors.secondary,
  fontSize: '0.95rem',
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: '0.8rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
}

interface InventorySnapshotProps {
  readonly heading?: string
}

function matchesSearch(item: EquipmentItem, term: string): boolean {
  if (!term) return true
  const query = term.trim().toLowerCase()
  if (!query) return true
  return (
    item.name.toLowerCase().includes(query) ||
    (item.categoryName?.toLowerCase().includes(query) ?? false)
  )
}

export default function InventorySnapshot({ heading = 'Realtime voorraadstatus' }: InventorySnapshotProps) {
  const items = useInventoryStore(state => state.items)
  const categories = useInventoryStore(state => state.categories)
  const availability = useInventoryStore(state => state.availability)
  const loading = useInventoryStore(state => state.loading)
  const availabilityLoading = useInventoryStore(state => state.availabilityLoading)
  const error = useInventoryStore(state => state.error)
  const lastFetchedAt = useInventoryStore(state => state.lastFetchedAt)
  const fetchInventory = useInventoryStore(state => state.fetchInventory)
  const refreshAvailability = useInventoryStore(state => state.refreshAvailability)
  const updateStatus = useInventoryStore(state => state.updateStatus)
  const clearError = useInventoryStore(state => state.clearError)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)
  const availabilityKeyRef = useRef('')
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (hasFetchedRef.current) {
      return
    }
    hasFetchedRef.current = true
    fetchInventory().catch(() => {
      /* error state handled by store */
    })
  }, [fetchInventory])

  useEffect(() => {
    if (!items.length) {
      availabilityKeyRef.current = ''
      return
    }
    const key = items
      .map(item => item.id)
      .filter(id => id > 0)
      .sort((a, b) => a - b)
      .join(',')
    if (key && availabilityKeyRef.current === key) {
      return
    }
    availabilityKeyRef.current = key
    const window = getAvailabilityWindow(7)
    const requests = items
      .filter(item => item.id > 0)
      .map(item => ({ itemId: item.id, quantity: 1, start: window.start, end: window.end }))
    refreshAvailability(requests).catch(() => {
      availabilityKeyRef.current = ''
    })
  }, [items, refreshAvailability])

  const statusSummary = useMemo(() => {
    const counts = new Map<EquipmentStatus, number>()
    for (const status of statusOrder) {
      counts.set(status, 0)
    }
    let totalActive = 0
    let attention = 0
    let lowStock = 0

    for (const item of items) {
      const current = counts.get(item.status) ?? 0
      counts.set(item.status, current + 1)
      if (item.active) {
        totalActive += 1
      }
      if (item.status === 'maintenance' || item.status === 'damaged' || item.status === 'unknown') {
        attention += 1
      }
      if (item.quantityTotal <= item.minStock) {
        lowStock += 1
      }
    }

    return { counts, totalActive, attention, lowStock }
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!matchesSearch(item, searchTerm)) {
        return false
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }
      if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) {
        return false
      }
      return true
    })
  }, [items, searchTerm, statusFilter, categoryFilter])

  const handleStatusUpdate = async (itemId: number, status: EquipmentStatus) => {
    setUpdatingItemId(itemId)
    try {
      await updateStatus(itemId, status)
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleRefresh = () => {
    fetchInventory()
      .then(() => {
        availabilityKeyRef.current = ''
      })
      .catch(() => {
        /* errors handled globally */
      })
  }

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (a.status === b.status) {
        return a.name.localeCompare(b.name)
      }
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
    })
  }, [filteredItems])

  const availabilityWindowLabel = 'Beschikbaarheid komende 7 dagen'

  return (
    <section
      data-testid="inventory-snapshot"
      style={{
        display: 'grid',
        gap: 18,
        padding: '24px 28px',
        borderRadius: 26,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(227, 232, 255, 0.88) 100%)',
        border: `1px solid ${withOpacity(brand.colors.primary, 0.16)}`,
        boxShadow: brand.colors.shadow,
      }}
    >
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <h3 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}>{heading}</h3>
          <p style={{ margin: 0, color: brand.colors.mutedText, fontSize: '0.9rem' }}>
            Monitor voorraadstatus, laag niveau waarschuwingen en beschikbaarheid zonder het planner dashboard te verlaten.
          </p>
          {lastFetchedAt && (
            <span style={{ fontSize: '0.75rem', color: brand.colors.mutedText }}>
              Laatst bijgewerkt: {new Date(lastFetchedAt).toLocaleString('nl-NL')}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          data-testid="inventory-refresh"
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: brand.colors.primary,
            color: '#fff',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.65 : 1,
            boxShadow: '0 12px 24px rgba(79, 70, 229, 0.18)',
          }}
        >
          {loading ? 'Bezig…' : 'Vernieuwen'}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 16,
            background: withOpacity(brand.colors.danger, 0.12),
            color: brand.colors.danger,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            style={{
              border: 'none',
              background: 'transparent',
              color: brand.colors.danger,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Verbergen
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        <article
          style={{
            padding: '16px 18px',
            borderRadius: 20,
            background: '#ffffff',
            border: `1px solid ${withOpacity(brand.colors.primary, 0.14)}`,
            display: 'grid',
            gap: 4,
          }}
        >
          <span style={{ fontSize: '0.8rem', color: brand.colors.mutedText }}>Actieve items</span>
          <strong style={{ fontSize: '1.6rem', color: brand.colors.secondary }}>{statusSummary.totalActive}</strong>
          <span style={{ fontSize: '0.75rem', color: brand.colors.mutedText }}>Op basis van actieve voorraadrecords</span>
        </article>

        <article
          style={{
            padding: '16px 18px',
            borderRadius: 20,
            background: '#ffffff',
            border: `1px solid ${withOpacity(brand.colors.warning, 0.18)}`,
            display: 'grid',
            gap: 4,
          }}
        >
          <span style={{ fontSize: '0.8rem', color: brand.colors.mutedText }}>Laag voorraadniveau</span>
          <strong style={{ fontSize: '1.6rem', color: brand.colors.warning }}>{statusSummary.lowStock}</strong>
          <span style={{ fontSize: '0.75rem', color: brand.colors.mutedText }}>Items ≤ minimum voorraadgrens</span>
        </article>

        <article
          style={{
            padding: '16px 18px',
            borderRadius: 20,
            background: '#ffffff',
            border: `1px solid ${withOpacity(brand.colors.danger, 0.16)}`,
            display: 'grid',
            gap: 4,
          }}
        >
          <span style={{ fontSize: '0.8rem', color: brand.colors.mutedText }}>Vraagt aandacht</span>
          <strong style={{ fontSize: '1.6rem', color: brand.colors.danger }}>{statusSummary.attention}</strong>
          <span style={{ fontSize: '0.75rem', color: brand.colors.mutedText }}>Beschadigd, onderhoud of onbekend</span>
        </article>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <input
            type="search"
            placeholder="Zoek op item of categorie"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            data-testid="inventory-search"
            style={{ ...filterControlStyle, minWidth: 220 }}
          />
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as EquipmentStatus | 'all')}
            data-testid="inventory-status-filter"
            style={{ ...filterControlStyle, minWidth: 180 }}
          >
            <option value="all">Alle statussen</option>
            {statusOrder.map(status => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={event => {
              setCategoryFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))
            }}
            data-testid="inventory-category-filter"
            style={{ ...filterControlStyle, minWidth: 180 }}
          >
            <option value="all">Alle categorieën</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <span style={{ fontSize: '0.8rem', color: brand.colors.mutedText }}>
          {availabilityLoading ? 'Beschikbaarheidsdata bijwerken…' : availabilityWindowLabel}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          data-testid="inventory-table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#ffffff',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ background: withOpacity(brand.colors.secondary, 0.08), textAlign: 'left' }}>
              {['Item', 'Categorie', 'Status', 'Voorraad', 'Beschikbaar', 'Dagprijs', 'Acties'].map(column => (
                <th key={column} style={{ padding: '14px 16px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: brand.colors.mutedText }}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: brand.colors.mutedText }}>
                  Geen items gevonden voor de huidige filters.
                </td>
              </tr>
            ) : (
              sortedItems.map(item => {
                const statusToken = statusStyles[item.status] ?? statusStyles.unknown
                const availabilityEntry = availability[item.id]
                const isUpdating = updatingItemId === item.id
                const lowStock = item.quantityTotal <= item.minStock

                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}` }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: brand.colors.secondary }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span>{item.name}</span>
                        {lowStock && (
                          <span style={{ ...badgeStyle, background: withOpacity(brand.colors.danger, 0.16), color: brand.colors.danger }}>
                            Lage voorraad
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: brand.colors.mutedText }}>{item.categoryName ?? 'Onbekend'}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ ...badgeStyle, background: statusToken.background, color: statusToken.color }}>
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: brand.colors.secondary }}>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <span>
                          Totale voorraad: <strong>{item.quantityTotal}</strong>
                        </span>
                        <span style={{ fontSize: '0.75rem', color: brand.colors.mutedText }}>
                          Minimum voorraad: {item.minStock}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: brand.colors.secondary }}>
                      {availabilityEntry ? (
                        <div style={{ display: 'grid', gap: 4 }}>
                          <span>
                            Beschikbaar: <strong>{availabilityEntry.available}</strong>
                          </span>
                          <span style={{ fontSize: '0.75rem', color: brand.colors.mutedText }}>
                            Aanvraag: {availabilityEntry.requested}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: brand.colors.mutedText }}>Nog geen data</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: brand.colors.secondary }}>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <span>{formatCurrency(item.pricePerDay)}</span>
                        <span style={{ fontSize: '0.75rem', color: brand.colors.mutedText }}>
                          Kosten: {formatCurrency(item.costPerDay)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {statusOrder.map(targetStatus => {
                          if (targetStatus === item.status || targetStatus === 'unknown') {
                            return null
                          }
                          const label = statusLabels[targetStatus]
                          return (
                            <button
                              key={targetStatus}
                              type="button"
                              data-testid={`inventory-action-${item.id}-${targetStatus}`}
                              onClick={() => handleStatusUpdate(item.id, targetStatus)}
                              disabled={isUpdating}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 999,
                                border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
                                background: '#fff',
                                color: brand.colors.secondary,
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: isUpdating ? 'not-allowed' : 'pointer',
                                opacity: isUpdating ? 0.6 : 1,
                              }}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
