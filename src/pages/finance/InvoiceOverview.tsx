import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useFinanceStore } from '@stores/financeStore'
import type { InvoiceSummary } from '@rg-types/financeTypes'

const statusClasses: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) {
    return '—'
  }

  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const InvoiceOverview: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientNameFilter, setClientNameFilter] = useState<string>('')
  const navigate = useNavigate()

  const { invoices, isLoading, error } = useFinanceStore((state) => ({
    invoices: state.invoices,
    isLoading: state.loading,
    error: state.error,
  }))
  const fetchInvoices = useFinanceStore((state) => state.fetchInvoices)

  useEffect(() => {
    fetchInvoices().catch(() => {
      /* error handled via store */
    })
  }, [fetchInvoices])

  const filteredInvoices = useMemo(() => {
    const normalisedFilter = clientNameFilter.trim().toLowerCase()

    return invoices.filter((invoice: InvoiceSummary) => {
      const matchesStatus =
        statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter.toLowerCase()
      const matchesName =
        normalisedFilter.length === 0 ||
        invoice.clientName.toLowerCase().includes(normalisedFilter)
      return matchesStatus && matchesName
    })
  }, [invoices, statusFilter, clientNameFilter])

  if (isLoading && invoices.length === 0) {
    return <div className="p-4 text-center">Loading invoices...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoice Overview</h1>
        <Link to="/invoices/new" className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          New Invoice
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          placeholder="Filter by client name..."
          className="flex-grow rounded border p-2"
          value={clientNameFilter}
          onChange={(event) => setClientNameFilter(event.target.value)}
        />
        <select
          className="rounded border p-2"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Invoice Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Due Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3">{invoice.clientName}</td>
                  <td className="px-4 py-3">${invoice.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">{formatDate(invoice.invoiceDate)}</td>
                  <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-sm ${statusClasses[invoice.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="text-blue-500 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-4 text-center text-gray-500">No invoices found</div>
        )}
      </div>
    </div>
  )
}

export default InvoiceOverview
