import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFinanceStore } from '@stores/financeStore'

type InvoiceStatusFilter = 'all' | 'pending' | 'paid' | 'overdue' | 'draft' | 'sent' | 'converted'

const statusVariants: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-700',
  draft: 'bg-slate-200 text-slate-700',
  sent: 'bg-blue-100 text-blue-800',
  converted: 'bg-indigo-100 text-indigo-800',
}

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
})

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return currencyFormatter.format(0)
  }
  return currencyFormatter.format(value)
}

function formatDate(value?: string): string {
  if (!value) {
    return '—'
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '—'
  }
  return dateFormatter.format(parsed)
}

export default function InvoiceOverview(): JSX.Element {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all')
  const [clientFilter, setClientFilter] = useState('')
  const navigate = useNavigate()

  const invoices = useFinanceStore((state) => state.invoices)
  const loading = useFinanceStore((state) => state.loading)
  const error = useFinanceStore((state) => state.error)
  const fetchInvoices = useFinanceStore((state) => state.fetchInvoices)
  const clearError = useFinanceStore((state) => state.clearError)

  useEffect(() => {
    let cancelled = false

    const loadInvoices = async () => {
      try {
        await fetchInvoices()
      } catch (err) {
        if (!cancelled) {
          console.warn('Kon facturen niet laden', err)
        }
      }
    }

    void loadInvoices()

    return () => {
      cancelled = true
      clearError()
    }
  }, [fetchInvoices, clearError])

  const filteredInvoices = useMemo(() => {
    const normalisedSearch = clientFilter.trim().toLowerCase()
    const selectedStatus = statusFilter.toLowerCase()

    return invoices.filter((invoice) => {
      const invoiceStatus = (invoice.status ?? '').toLowerCase()
      const matchesStatus =
        selectedStatus === 'all' ||
        invoiceStatus === selectedStatus ||
        (selectedStatus === 'paid' && invoiceStatus === 'completed')

      const clientName = (invoice.clientName ?? '').toLowerCase()
      const matchesClient = !normalisedSearch || clientName.includes(normalisedSearch)

      return matchesStatus && matchesClient
    })
  }, [invoices, statusFilter, clientFilter])

  const showLoadingState = loading && invoices.length === 0

  if (showLoadingState) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="mx-auto mt-6 max-w-xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        role="alert"
      >
        {error}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturen</h1>
          <p className="text-sm text-slate-500">
            Filter op klantnaam of status om snel de juiste factuur te vinden.
          </p>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          Nieuwe factuur
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="text"
          placeholder="Zoek op klantnaam"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={clientFilter}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setClientFilter(event.target.value)}
        />
        <select
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-56"
          value={statusFilter}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setStatusFilter(event.target.value as InvoiceStatusFilter)
          }
        >
          <option value="all">Alle statussen</option>
          <option value="paid">Betaald</option>
          <option value="pending">Openstaand</option>
          <option value="overdue">Achterstallig</option>
          <option value="sent">Verzonden</option>
          <option value="draft">Concept</option>
          <option value="converted">Geconverteerd</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Klant
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bedrag
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Factuurdatum
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((invoice) => {
                const invoiceStatus = (invoice.status ?? '').toLowerCase()
                const badgeClass = statusVariants[invoiceStatus] ?? 'bg-slate-100 text-slate-700'
                return (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {invoice.clientName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(invoice.date)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                      >
                        {invoice.status ?? 'onbekend'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                      >
                        Bekijken
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    Geen facturen gevonden voor de huidige filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
