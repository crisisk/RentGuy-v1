import { useEffect, useMemo, useState } from 'react'
import { useFinanceStore } from '../../stores/financeStore'

const currency = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const formatCurrency = (value: number) => currency.format(Math.max(0, value))

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Onbekend'
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const computeConversionRate = (converted: number, sent: number) => {
  if (!sent) return 0
  return Math.round((converted / sent) * 100)
}

const QUOTE_TEMPLATES = [
  {
    id: 'wedding-showcase',
    name: 'Bruiloft premium showcase',
    segment: 'B2C',
    avgValue: 7400,
    winRate: 62,
  },
  {
    id: 'corporate-experience',
    name: 'Corporate experience (Mr. DJ)',
    segment: 'B2B',
    avgValue: 12800,
    winRate: 55,
  },
  {
    id: 'festival-lighting',
    name: 'Festival lighting & stage',
    segment: 'Events',
    avgValue: 18200,
    winRate: 48,
  },
]

const SalesOffers = () => {
  const quotes = useFinanceStore((state) => state.quotes)
  const loading = useFinanceStore((state) => state.loading)
  const error = useFinanceStore((state) => state.error)
  const fetchQuotes = useFinanceStore((state) => state.fetchQuotes)
  const clearError = useFinanceStore((state) => state.clearError)
  const [filter, setFilter] = useState<'all' | 'sent' | 'converted'>('all')

  useEffect(() => {
    if (!quotes.length) {
      void fetchQuotes().catch(() => undefined)
    }
  }, [fetchQuotes, quotes.length])

  useEffect(() => {
    if (!error) return
    const timeout = setTimeout(() => {
      clearError()
    }, 4000)
    return () => clearTimeout(timeout)
  }, [clearError, error])

  const segmentedQuotes = useMemo(() => {
    const sent = quotes.filter((quote) => quote.status !== 'draft')
    const converted = sent.filter((quote) => quote.converted || quote.status === 'converted')
    const drafts = quotes.filter((quote) => quote.status === 'draft')

    return {
      sent,
      converted,
      drafts,
    }
  }, [quotes])

  const filteredQuotes = useMemo(() => {
    if (filter === 'sent') return segmentedQuotes.sent
    if (filter === 'converted') return segmentedQuotes.converted
    return quotes
  }, [filter, quotes, segmentedQuotes])

  const conversionRate = computeConversionRate(
    segmentedQuotes.converted.length,
    segmentedQuotes.sent.length,
  )

  const totalPipeline = segmentedQuotes.sent.reduce((total, quote) => total + quote.amount, 0)
  const convertedValue = segmentedQuotes.converted.reduce((total, quote) => total + quote.amount, 0)

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6" data-testid="sales-offers-root">
      <header className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-purple-100">Sales readiness</p>
            <h1 className="text-3xl font-semibold" data-testid="sales-offers-title">
              Offerte templates & AI-personalisatie
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-purple-100">
              Houd controle over alle quote-varianten, activeer AI-personalisatie en automatiseer de
              stap van voorstel naar contract. Dit is de tweede stap richting 100% sales ready.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
            <span className="font-semibold">Winrate verzonden offertes</span>
            <p className="text-2xl font-semibold" data-testid="sales-offers-winrate">
              {conversionRate}%
            </p>
            <p className="text-xs text-purple-100">
              {segmentedQuotes.converted.length} van {segmentedQuotes.sent.length} offertes gewonnen
            </p>
          </div>
        </div>
      </header>

      {error && !loading ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          role="alert"
          data-testid="sales-offers-error"
        >
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3" data-testid="sales-offers-metrics">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Pipeline (draft + verzonden)</h2>
          <p
            className="mt-3 text-3xl font-semibold text-gray-900"
            data-testid="sales-offers-total-pipeline"
          >
            {formatCurrency(totalPipeline)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{quotes.length} offertes in totaal</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Gewonnen waarde</h2>
          <p
            className="mt-3 text-3xl font-semibold text-gray-900"
            data-testid="sales-offers-converted-value"
          >
            {formatCurrency(convertedValue)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Inclusief automatisch geconverteerde facturen
          </p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Concepten klaar voor review</h2>
          <p
            className="mt-3 text-3xl font-semibold text-gray-900"
            data-testid="sales-offers-drafts"
          >
            {segmentedQuotes.drafts.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Werk AI-aanbevelingen bij voordat je verstuurt
          </p>
        </article>
      </section>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        data-testid="sales-offers-templates"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Aanbevolen templates</h2>
            <p className="text-sm text-gray-600">
              Gebruik deze presets als vertrekpunt voor AI-copy en pricing guardrails.
            </p>
          </div>
          <a
            href="/templates/offers"
            className="inline-flex items-center justify-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            data-testid="sales-offers-open-templates"
          >
            Open templatebeheer
          </a>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {QUOTE_TEMPLATES.map((template) => (
            <article
              key={template.id}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              data-testid={`sales-offers-template-${template.id}`}
            >
              <h3 className="text-base font-semibold text-gray-900">{template.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                {template.segment}
              </p>
              <dl className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <dt>Gemiddelde waarde</dt>
                  <dd className="font-medium">{formatCurrency(template.avgValue)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Winrate</dt>
                  <dd className="font-medium">{template.winRate}%</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        data-testid="sales-offers-table"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Offerteoverzicht</h2>
            <p className="text-sm text-gray-600">
              Filter op status en stuur direct door naar contract.
            </p>
          </div>
          <div
            className="flex items-center gap-2 rounded-full bg-gray-100 p-1 text-sm"
            role="group"
            aria-label="Filter offertes"
            data-testid="sales-offers-filter"
          >
            <button
              type="button"
              className={`rounded-full px-3 py-1 font-medium transition ${filter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              onClick={() => setFilter('all')}
              data-testid="sales-offers-filter-all"
            >
              Alles
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 font-medium transition ${filter === 'sent' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              onClick={() => setFilter('sent')}
              data-testid="sales-offers-filter-sent"
            >
              Verzonden
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 font-medium transition ${filter === 'converted' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              onClick={() => setFilter('converted')}
              data-testid="sales-offers-filter-converted"
            >
              Gewonnen
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            data-testid="sales-offers-table-grid"
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Quote
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Klant
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Bedrag
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Laatst bijgewerkt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                    data-testid="sales-offers-empty"
                  >
                    Geen offertes in deze categorie. Activeer AI-suggesties om nieuwe voorstellen te
                    genereren.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} data-testid={`sales-offers-row-${quote.id}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{quote.number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{quote.client}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(quote.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          quote.status === 'converted' || quote.converted
                            ? 'bg-emerald-100 text-emerald-700'
                            : quote.status === 'sent'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-600'
                        }`}
                        data-testid={`sales-offers-status-${quote.id}`}
                      >
                        {quote.status === 'converted' || quote.converted
                          ? 'Gewonnen'
                          : quote.status === 'sent'
                            ? 'Verzonden'
                            : 'Concept'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(quote.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        data-testid="sales-offers-next-steps"
      >
        <h2 className="text-lg font-semibold text-gray-900">Volgende acties</h2>
        <ul className="mt-4 space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-3" data-testid="sales-offers-next-ai">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
              1
            </span>
            Activeer AI-personalisatie voor alle templates en borg tone-of-voice per segment.
          </li>
          <li className="flex items-start gap-3" data-testid="sales-offers-next-pricing">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
              2
            </span>
            Stel discount guardrails in zodat marges bewaakt blijven tijdens onderhandelingen.
          </li>
          <li className="flex items-start gap-3" data-testid="sales-offers-next-contract">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
              3
            </span>
            Automatiseer contractgeneratie en digitale ondertekening via de offerte CTA.
          </li>
        </ul>
      </section>
    </div>
  )
}

export default SalesOffers
