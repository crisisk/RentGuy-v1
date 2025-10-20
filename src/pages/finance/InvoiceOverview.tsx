import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFinanceStore } from '@stores/financeStore'

const statusClasses: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-800',
  sent: 'bg-blue-100 text-blue-800',
  draft: 'bg-slate-100 text-slate-700',
}

function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })
}

const InvoiceOverview: React.FC = () => {
  const invoices = useFinanceStore(state => state.invoices)
  const fetchInvoices = useFinanceStore(state => state.fetchInvoices)
  const loading = useFinanceStore(state => state.loading.invoices)
  const error = useFinanceStore(state => state.error)
  const clearError = useFinanceStore(state => state.clearError)
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'sent' | 'draft'>('all')
  const [clientNameFilter, setClientNameFilter] = useState('')

  useEffect(() => {
    void fetchInvoices()
    return () => {
      clearError()
    }
  }, [fetchInvoices, clearError])

  const filteredInvoices = useMemo(() => {
    const lowerCaseFilter = clientNameFilter.trim().toLowerCase()
    return invoices.filter(invoice => {
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
      const matchesClient = lowerCaseFilter
        ? invoice.clientName.toLowerCase().includes(lowerCaseFilter)
        : true
      return matchesStatus && matchesClient
    })
  }, [invoices, statusFilter, clientNameFilter])

  if (loading) {
    return <div className="p-6 text-center text-sm text-slate-500">Facturen worden geladen…</div>
  }

  if (error) {
    return <div className="p-6 text-center text-sm text-red-600">Fout bij het laden van facturen: {error}</div>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturen</h1>
          <p className="text-sm text-slate-500">Filter op klantnaam of status om snel de juiste factuur te vinden.</p>
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
          value={clientNameFilter}
          onChange={event => setClientNameFilter(event.target.value)}
        />
        <select
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-56"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
        >
          <option value="all">Alle statussen</option>
          <option value="paid">Betaald</option>
          <option value="pending">Openstaand</option>
          <option value="overdue">Achterstallig</option>
          <option value="sent">Verzonden</option>
          <option value="draft">Concept</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Klant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Bedrag</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Factuurdatum</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-700">{invoice.clientName}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {invoice.totalGross.toLocaleString('nl-NL', { style: 'currency', currency: invoice.currency })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(invoice.issuedAt)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[invoice.status] ?? 'bg-slate-100 text-slate-700'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Bekijken
                    </button>
                  </td>
                </tr>
              ))}
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

export default InvoiceOverview
