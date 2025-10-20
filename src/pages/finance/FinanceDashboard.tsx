import React, { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { useFinanceStore } from '@stores/financeStore'
import type { InvoiceSummary } from '@rg-types/financeTypes'

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) {
    return '—'
  }

  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const FinanceDashboard: React.FC = () => {
  const { invoices, stats, loading, error } = useFinanceStore((state) => ({
    invoices: state.invoices,
    stats: state.stats,
    loading: state.loading,
    error: state.error,
  }))
  const fetchDashboardData = useFinanceStore((state) => state.fetchDashboardData)

  useEffect(() => {
    fetchDashboardData().catch(() => {
      /* error state handled by store */
    })
  }, [fetchDashboardData])

  const recentInvoices = useMemo<InvoiceSummary[]>(() => invoices.slice(0, 10), [invoices])

  if (loading && !stats && invoices.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-3xl rounded border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <h1 className="mb-6 text-3xl font-bold">Finance Dashboard</h1>

      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-2 text-lg font-semibold">Monthly Revenue</h2>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monthlyRevenue)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-2 text-lg font-semibold">Pending Invoices</h2>
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pendingInvoicesTotal)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-2 text-lg font-semibold">Paid Invoices</h2>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.paidInvoicesTotal)}
            </p>
          </div>
        </div>
      )}

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
            {recentInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b">
                <td className="px-4 py-3">{invoice.clientName}</td>
                <td className="px-4 py-3">{formatCurrency(invoice.amount)}</td>
                <td className="px-4 py-3">{formatDate(invoice.invoiceDate)}</td>
                <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
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
            ))}
          </tbody>
        </table>

        {recentInvoices.length === 0 && (
          <div className="px-4 py-6 text-center text-gray-500">No invoices found</div>
        )}
      </div>
    </div>
  )
}

export default FinanceDashboard
