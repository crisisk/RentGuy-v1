import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinanceStore, type Quote } from '@stores/financeStore'

type QuoteStatusFilter = 'all' | Quote['status']

const quoteStatusLabels: Record<string, string> = {
  draft: 'Concept',
  sent: 'Verzonden',
  converted: 'Geconverteerd',
}

const quoteBadgeVariants: Record<string, string> = {
  converted: 'bg-emerald-100 text-emerald-800',
  sent: 'bg-blue-100 text-blue-800',
  draft: 'bg-slate-100 text-slate-700',
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

export default function QuoteManagement(): JSX.Element {
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const navigate = useNavigate()

  const quotes = useFinanceStore((state) => state.quotes)
  const loading = useFinanceStore((state) => state.loading)
  const error = useFinanceStore((state) => state.error)
  const fetchQuotes = useFinanceStore((state) => state.fetchQuotes)
  const convertQuoteToInvoice = useFinanceStore((state) => state.convertQuoteToInvoice)
  const clearError = useFinanceStore((state) => state.clearError)

  useEffect(() => {
    let cancelled = false

    const loadQuotes = async () => {
      try {
        await fetchQuotes()
      } catch (err) {
        if (!cancelled) {
          console.warn('Kon offertes niet laden', err)
        }
      }
    }

    void loadQuotes()

    return () => {
      cancelled = true
      clearError()
    }
  }, [fetchQuotes, clearError])

  const handleConvert = async (quoteId: string) => {
    setConvertingId(quoteId)
    clearError()
    try {
      const invoiceId = await convertQuoteToInvoice(quoteId)
      navigate(`/invoices/${invoiceId}`)
    } catch (err) {
      console.warn('Omzetten van offerte is mislukt', err)
    } finally {
      setConvertingId((current) => (current === quoteId ? null : current))
    }
  }

  const visibleQuotes = useMemo(() => {
    const filter = statusFilter.toLowerCase()
    const term = searchTerm.trim().toLowerCase()

    return quotes.filter((quote) => {
      const quoteStatus = (quote.status ?? 'draft').toLowerCase()
      const matchesStatus = filter === 'all' || quoteStatus === filter

      const clientLabel = (quote.client ?? '').toLowerCase()
      const numberLabel = (quote.number ?? '').toLowerCase()
      const matchesSearch = !term || clientLabel.includes(term) || numberLabel.includes(term)

      return matchesStatus && matchesSearch
    })
  }, [quotes, statusFilter, searchTerm])

  const showLoadingState = loading && quotes.length === 0

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
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offertes</h1>
          <p className="text-sm text-slate-500">
            Beheer verzonden offertes en zet succesvolle voorstellen direct om naar een factuur.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <input
            type="text"
            placeholder="Zoek op klant of nummer"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-60"
            value={searchTerm}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
          />
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-48"
            value={statusFilter}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setStatusFilter(event.target.value as QuoteStatusFilter)
            }
          >
            <option value="all">Alle statussen</option>
            <option value="draft">Concept</option>
            <option value="sent">Verzonden</option>
            <option value="converted">Geconverteerd</option>
          </select>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Offertenummer
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Klant
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Datum
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bedrag
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Acties
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleQuotes.map((quote) => {
              const status = (quote.status ?? 'draft').toLowerCase()
              const badgeClass = quoteBadgeVariants[status] ?? 'bg-slate-100 text-slate-700'
              const translatedStatus = quoteStatusLabels[status] ?? quote.status ?? 'Onbekend'

              return (
                <tr key={quote.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{quote.number}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{quote.client}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(quote.date)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {currencyFormatter.format(quote.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                    >
                      {translatedStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => handleConvert(quote.id)}
                      disabled={status === 'converted' || convertingId === quote.id}
                      className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        status === 'converted'
                          ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } ${convertingId === quote.id ? 'opacity-70' : ''}`}
                    >
                      {convertingId === quote.id ? 'Bezig…' : 'Converteer naar factuur'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {visibleQuotes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-sm text-slate-500">
                  Er zijn geen offertes die voldoen aan de geselecteerde filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
