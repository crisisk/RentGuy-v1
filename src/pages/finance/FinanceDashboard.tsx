import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import financeStore, { type FinanceStats, type InvoiceRecord } from '../../stores/financeStore';

const FinanceDashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

  const formatDate = (value: Date): string => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setLoading(true);
        const { invoices: invoiceList, stats: dashboardStats } = await financeStore.getDashboardData();
        setInvoices(invoiceList);
        setStats(dashboardStats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load finance data');
      } finally {
        setLoading(false);
      }
    };
  }, [getDashboardData, clearError]);

  const resolvedStats = useMemo<FinanceStats>(() => {
    if (stats) {
      return stats;
    }
    return calculateFallbackStats(invoices);
  }, [stats, invoices]);

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

  const visibleInvoices = invoices.slice(0, 10);

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <h1 className="mb-6 text-3xl font-bold">Finance Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Monthly Revenue</h2>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(resolvedStats.monthlyRevenue)}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Pending Invoices</h2>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(resolvedStats.pendingInvoicesTotal)}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Paid Invoices</h2>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(resolvedStats.paidInvoicesTotal)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Invoice Date</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b">
                <td className="px-4 py-3">{invoice.clientName}</td>
                <td className="px-4 py-3">{formatCurrency(invoice.amount)}</td>
                <td className="px-4 py-3">{formatDate(invoice.dueDate ?? invoice.date)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/invoices/${invoice.id}`} className="text-blue-500 hover:underline">
                    View
                  </Link>
                </td>
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
