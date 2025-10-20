import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useFinanceStore } from '@stores/financeStore'
import type { Quote } from '@rg-types/financeTypes'

const QuoteManagement: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const getQuotes = useFinanceStore((state) => state.getQuotes)
  const convertQuoteToInvoice = useFinanceStore((state) => state.convertQuoteToInvoice)

  useEffect(() => {
    getQuotes()
      .then((data) => setQuotes(data))
      .catch(() => setError('Failed to load quotes'))
      .finally(() => setLoading(false))
  }, [getQuotes])

  const handleConvert = async (quoteId: string) => {
    setError(null)
    try {
      const invoiceId = await convertQuoteToInvoice(quoteId)
      setQuotes((previous) =>
        previous.map((quote) => (quote.id === quoteId ? { ...quote, status: 'converted' } : quote)),
      )
      navigate(`/invoices/${invoiceId}`)
    } catch {
      setError('Failed to convert quote to invoice')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error) {
    return <div className="rounded-lg bg-red-100 p-4 text-red-500">{error}</div>
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Quotes</h1>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {quotes.map((quote) => (
              <tr key={quote.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">#{quote.number}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{quote.client}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{formatDate(quote.date)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  ${quote.amount.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      quote.status === 'converted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {quote.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <button
                    onClick={() => handleConvert(quote.id)}
                    disabled={quote.status === 'converted'}
                    className={`rounded-md px-3 py-1 text-sm font-medium ${
                      quote.status === 'converted'
                        ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    Convert
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default QuoteManagement
