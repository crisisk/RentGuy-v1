import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { brand, headingFontStack, withOpacity } from '@ui/branding'
import {
  useFinanceStore,
  type InvoiceInput,
  type InvoiceLineItem,
} from '@stores/financeStore'

const createLineItem = (): InvoiceLineItem => ({
  id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `line-${Math.random().toString(36).slice(2, 9)}`,
  description: '',
  quantity: 1,
  unitPrice: 0,
})

const toInputDate = (value: string | Date | undefined): string => {
  if (!value) {
    return ''
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString().slice(0, 10)
}

export default function InvoiceForm(): JSX.Element {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const createInvoice = useFinanceStore(state => state.createInvoice)
  const updateInvoice = useFinanceStore(state => state.updateInvoice)
  const getInvoiceById = useFinanceStore(state => state.getInvoiceById)
  const loading = useFinanceStore(state => state.loading)
  const clearError = useFinanceStore(state => state.clearError)

  const [clientName, setClientName] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([createLineItem()])
  const [initialising, setInitialising] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadInvoice = async () => {
      if (!id) {
        setInitialising(false)
        return
      }

      try {
        const invoice = await getInvoiceById(id)
        if (!invoice || cancelled) {
          setError('Factuur niet gevonden')
          return
        }

        setClientName(invoice.clientName)
        setInvoiceDate(toInputDate(invoice.date))
        setDueDate(toInputDate(invoice.dueDate))
        setLineItems(
          invoice.lineItems.length ? invoice.lineItems.map(item => ({ ...item })) : [createLineItem()],
        )
        setError(null)
      } catch (err) {
        if (!cancelled) {
          console.warn('Kon factuur niet laden', err)
          setError('Het ophalen van de factuur is mislukt')
        }
      } finally {
        if (!cancelled) {
          setInitialising(false)
        }
      }
    }

    loadInvoice()

    return () => {
      cancelled = true
      clearError()
    }
  }, [id, getInvoiceById, clearError])

  const handleLineItemChange = useCallback((lineId: string, field: keyof InvoiceLineItem, value: string) => {
    setLineItems(previous =>
      previous.map(item =>
        item.id === lineId
          ? {
              ...item,
              [field]: field === 'description' ? value : Number(value) || 0,
            }
          : item,
      ),
    )
  }, [])

  const handleRemoveLineItem = useCallback((lineId: string) => {
    setLineItems(previous => {
      const next = previous.filter(item => item.id !== lineId)
      return next.length ? next : [createLineItem()]
    })
  }, [])

  const handleAddLineItem = useCallback(() => {
    setLineItems(previous => [...previous, createLineItem()])
  }, [])

  const total = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [lineItems],
  )

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!clientName || !invoiceDate) {
        setError('Vul de verplichte velden in')
        return
      }

      const payload: InvoiceInput = {
        clientName,
        invoiceDate,
        dueDate: dueDate || undefined,
        lineItems,
        total,
      }

      try {
        if (id) {
          await updateInvoice(id, payload)
        } else {
          const created = await createInvoice(payload)
          navigate(`/invoices/${created.id}`)
          return
        }
        navigate('/invoices')
      } catch (err) {
        console.error('Opslaan van factuur mislukt', err)
        setError('Opslaan van de factuur is mislukt. Probeer het opnieuw.')
      }
    },
    [clientName, invoiceDate, dueDate, lineItems, total, id, updateInvoice, createInvoice, navigate],
  )

  if (initialising) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: brand.fontStack,
        }}
        role="status"
        aria-live="polite"
      >
        <span>Laden…</span>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '32px clamp(16px, 4vw, 48px)',
        fontFamily: brand.fontStack,
        color: brand.colors.secondary,
      }}
    >
      <header style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <span
          style={{
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            color: withOpacity(brand.colors.secondary, 0.68),
            fontWeight: 600,
          }}
        >
          Facturen
        </span>
        <h1 style={{ margin: 0, fontFamily: headingFontStack, fontSize: '2rem' }}>
          {id ? 'Factuur bijwerken' : 'Nieuwe factuur'}
        </h1>
        <p style={{ margin: 0, color: withOpacity(brand.colors.secondary, 0.75) }}>
          Vul klantgegevens in, voeg regels toe en valideer het totaalbedrag voordat je de factuur opslaat.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 24,
            padding: '14px 18px',
            borderRadius: 16,
            background: withOpacity(brand.colors.danger, 0.12),
            border: `1px solid ${withOpacity(brand.colors.danger, 0.3)}`,
            color: brand.colors.danger,
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: 24,
          padding: '24px clamp(16px, 4vw, 36px)',
          borderRadius: 28,
          background: '#ffffff',
          border: `1px solid ${withOpacity(brand.colors.primary, 0.1)}`,
          boxShadow: brand.colors.shadow,
        }}
      >
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <label style={{ display: 'grid', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
            Klantnaam
            <input
              type="text"
              value={clientName}
              onChange={event => setClientName(event.target.value)}
              required
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                border: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}`,
                fontSize: '0.95rem',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
            Factuurdatum
            <input
              type="date"
              value={invoiceDate}
              onChange={event => setInvoiceDate(event.target.value)}
              required
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                border: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}`,
                fontSize: '0.95rem',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
            Vervaldatum
            <input
              type="date"
              value={dueDate}
              onChange={event => setDueDate(event.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                border: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}`,
                fontSize: '0.95rem',
              }}
            />
          </label>
        </div>

        <section style={{ display: 'grid', gap: 16 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Regels</h2>
            <button
              type="button"
              onClick={handleAddLineItem}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: `1px solid ${withOpacity(brand.colors.primary, 0.3)}`,
                background: 'transparent',
                color: brand.colors.primary,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Regel toevoegen
            </button>
          </header>

          <div style={{ display: 'grid', gap: 12 }}>
            {lineItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'minmax(0, 3fr) repeat(2, minmax(0, 1fr)) auto',
                  alignItems: 'center',
                }}
              >
                <label style={{ display: 'grid', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                  Omschrijving
                  <input
                    type="text"
                    value={item.description}
                    onChange={event => handleLineItemChange(item.id, 'description', event.target.value)}
                    required
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}`,
                      fontSize: '0.9rem',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                  Aantal
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={event => handleLineItemChange(item.id, 'quantity', event.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}`,
                      fontSize: '0.9rem',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                  Prijs per eenheid
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={event => handleLineItemChange(item.id, 'unitPrice', event.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}`,
                      fontSize: '0.9rem',
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveLineItem(item.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 12,
                    border: 'none',
                    background: withOpacity(brand.colors.danger, 0.12),
                    color: brand.colors.danger,
                    cursor: 'pointer',
                  }}
                  aria-label="Regel verwijderen"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        <footer
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Totaal: {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(total)}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: `1px solid ${withOpacity(brand.colors.secondary, 0.25)}`,
                background: 'transparent',
                color: brand.colors.secondary,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                background: loading
                  ? withOpacity(brand.colors.primary, 0.45)
                  : brand.colors.primary,
                color: '#ffffff',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Bezig met opslaan…' : id ? 'Factuur bijwerken' : 'Factuur opslaan'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}
