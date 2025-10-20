import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFinanceStore } from '@stores/financeStore'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const statusPalette: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  sent: 'bg-blue-100 text-blue-800',
  draft: 'bg-slate-100 text-slate-700',
  overdue: 'bg-red-100 text-red-800',
}

const FinanceDashboard: React.FC = () => {
  const invoices = useFinanceStore(state => state.invoices)
  const metrics = useFinanceStore(state => state.dashboardMetrics)
  const dashboardLoading = useFinanceStore(state => state.loading.dashboard)
  const invoiceLoading = useFinanceStore(state => state.loading.invoices)
  const error = useFinanceStore(state => state.error)
  const getDashboardData = useFinanceStore(state => state.getDashboardData)

  useEffect(() => {
    void getDashboardData()
  }, [getDashboardData])

  const isLoading = dashboardLoading || invoiceLoading
  const recentInvoices = useMemo(() => invoices.slice(0, 8), [invoices])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" role="status" aria-live="polite">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="mx-auto mt-10 max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        role="alert"
      >
        {error}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <header className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Finance Dashboard</h1>
          <p className="text-sm text-slate-500">
            Overzicht van facturatieprestaties, lopende omzet en recente betalingen.
          </p>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Nieuwe factuur
        </Link>
      </header>

      {metrics && (
        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Maandelijkse omzet</h2>
            <p className="mt-3 text-3xl font-bold text-slate-900">{formatCurrency(metrics.monthlyRevenue)}</p>
            <p className="mt-1 text-xs text-slate-500">Bevestigde betalingen in de huidige kalendermaand.</p>
          </article>
          <article className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Openstaand</h2>
            <p className="mt-3 text-3xl font-bold text-amber-600">{formatCurrency(metrics.pendingInvoicesTotal)}</p>
            <p className="mt-1 text-xs text-slate-500">Facturen met status concept, verzonden of wachtend op betaling.</p>
          </article>
          <article className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ontvangen</h2>
            <p className="mt-3 text-3xl font-bold text-emerald-600">{formatCurrency(metrics.paidInvoicesTotal)}</p>
            <p className="mt-1 text-xs text-slate-500">Som van alle facturen met status betaald.</p>
          </article>
        </section>
      )}

      <section className="rounded-xl bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recente facturen</h2>
            <p className="text-xs text-slate-500">Laatste acht facturen met status- en vervaldatuminformatie.</p>
          </div>
          <Link to="/invoices" className="text-sm font-semibold text-blue-600 hover:underline">
            Bekijk alle facturen
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Klant
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bedrag
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Vervaldatum
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actie
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInvoices.map(invoice => {
                const badgeClass = statusPalette[invoice.status] ?? 'bg-slate-100 text-slate-700'
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{invoice.clientName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {formatCurrency(invoice.totalGross)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(invoice.dueAt)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <Link to={`/invoices/${invoice.id}`} className="font-semibold text-blue-600 hover:underline">
                        Details
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {recentInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    Er zijn nog geen facturen beschikbaar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default FinanceDashboard
