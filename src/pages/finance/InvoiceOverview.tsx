import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import financeStore, { type Invoice } from '../../stores/financeStore'

const InvoiceOverview: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | Invoice['status']>('all')
  const [clientNameFilter, setClientNameFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setIsLoading(true)
        const data = await financeStore.fetchInvoices()
        setInvoices(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoices')
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoices()
  }, [])

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    const matchesName = invoice.clientName.toLowerCase().includes(clientNameFilter.toLowerCase())
    return matchesStatus && matchesName
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) return <div className="p-4 text-center">Loading invoices...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoice Overview</h1>
        <Link
          to="/invoices/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Invoice
        </Link>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Filter by client name..."
          className="p-2 border rounded flex-grow"
          value={clientNameFilter}
          onChange={event => setClientNameFilter(event.target.value)}
        />
        <select
          className="p-2 border rounded"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value as 'all' | Invoice['status'])}
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="rounded-lg border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3">{invoice.clientName}</td>
                  <td className="px-4 py-3">{formatCurrency(invoice.amount)}</td>
                  <td className="px-4 py-3">{formatDate(invoice.invoiceDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusClass(invoice.status)}`}>
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
  );
};

export default InvoiceOverview;
