import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFinanceStore } from '@stores/financeStore'
import type { InvoiceLineItem } from '@rg-types/financeTypes'

const InvoiceForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const createInvoice = useFinanceStore(state => state.createInvoice)
  const updateInvoice = useFinanceStore(state => state.updateInvoice)
  const getInvoiceById = useFinanceStore(state => state.getInvoiceById)
  const [clientName, setClientName] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const generateUniqueId = useCallback(() => Math.random().toString(36).slice(2, 10), [])

  const addLineItem = useCallback(() => {
    setLineItems(items => ([
      ...items,
      { id: generateUniqueId(), description: '', quantity: 1, unitPrice: 0 },
    ]))
  }, [generateUniqueId])

  const updateLineItem = useCallback((itemId: string, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems(items => items.map(item => (item.id === itemId ? { ...item, [field]: value } : item)))
  }, [])

  const removeLineItem = useCallback((itemId: string) => {
    setLineItems(items => items.filter(item => item.id !== itemId))
  }, [])

  const totalAmount = useMemo(() => (
    lineItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
  ), [lineItems])

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!invoiceDate || !dueDate) {
      setError('Selecteer een factuur- en vervaldatum.')
      return
    }

    const payload = {
      clientName,
      invoiceDate,
      dueDate,
      lineItems,
      total: totalAmount,
    }

    try {
      if (id) {
        await updateInvoice(id, payload)
      } else {
        await createInvoice(payload)
      }
      navigate('/invoices')
    } catch (submitError) {
      console.warn('Kon factuur niet opslaan', submitError)
      setError('Opslaan van de factuur is mislukt. Probeer het opnieuw.')
    }
  }, [clientName, invoiceDate, dueDate, lineItems, totalAmount, id, updateInvoice, createInvoice, navigate])

  useEffect(() => {
    let mounted = true
    const loadInvoice = async () => {
      if (!id) {
        setLoading(false)
        return
      }
      try {
        const invoice = await getInvoiceById(id)
        if (!mounted) return
        setClientName(invoice.clientName)
        setInvoiceDate(invoice.issuedAt)
        setDueDate(invoice.dueAt)
        setLineItems(invoice.lineItems)
      } catch (loadError) {
        if (mounted) {
          setError('Kon factuurgegevens niet laden.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadInvoice()

    return () => {
      mounted = false
    }
  }, [id, getInvoiceById])

  if (loading) return <div className="p-4 text-sm text-slate-500">Factuurgegevens laden…</div>
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <form onSubmit={handleSubmit} className="rounded-xl bg-white px-8 py-6 shadow-sm">
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Klantnaam
            <input
              type="text"
              value={clientName}
              onChange={event => setClientName(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Factuurdatum
              <input
                type="date"
                value={invoiceDate}
                onChange={event => setInvoiceDate(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Vervaldatum
              <input
                type="date"
                value={dueDate}
                onChange={event => setDueDate(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </label>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Regels</h3>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Regel toevoegen
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Omschrijving</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Aantal</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tarief</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Totaal</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={event => updateLineItem(item.id, 'description', event.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={event => updateLineItem(item.id, 'quantity', Number(event.target.value))}
                        className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={event => updateLineItem(item.id, 'unitPrice', Number(event.target.value))}
                        className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold text-slate-900">
                      {(item.quantity * item.unitPrice).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700"
                      >
                        Verwijder
                      </button>
                    </td>
                  </tr>
                ))}
                {lineItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                      Voeg een of meerdere regels toe om een factuur op te bouwen.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Totaal exclusief btw</span>
          <span className="text-2xl font-bold text-slate-900">{totalAmount.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })}</span>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Annuleren
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {id ? 'Factuur bijwerken' : 'Factuur opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default InvoiceForm
