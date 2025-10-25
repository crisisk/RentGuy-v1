import { useEffect, useMemo, useState } from 'react'
import { useFinanceStore, type Quote } from '@stores/financeStore'

const currency = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const percent = (value: number) => `${(value * 100).toFixed(1)}%`

interface BundlePlaybookItem {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly basePrice: number
  readonly suggestedDiscount: string
  readonly attachRateTarget: string
}

const bundlePlaybook: readonly BundlePlaybookItem[] = [
  {
    id: 'wedding-deluxe',
    name: 'Wedding Deluxe Kit',
    description: 'Pioneer deck, uplights, sparkulars en MC-pakket voor premium bruiloften.',
    basePrice: 3295,
    suggestedDiscount: 'Max 8% korting',
    attachRateTarget: '≥ 75% bij bruiloft aanvragen',
  },
  {
    id: 'club-essentials',
    name: 'Club Essentials',
    description: 'Technics draaitafels, CO₂-jets, visuals en monitoring voor dance events.',
    basePrice: 2795,
    suggestedDiscount: 'Max 5% korting',
    attachRateTarget: '≥ 60% voor dance events',
  },
  {
    id: 'corporate-hybrid',
    name: 'Corporate Hybrid',
    description: 'LED-wall, livestream set-up, talkback en host-support.',
    basePrice: 3890,
    suggestedDiscount: 'Alleen staffelkorting, max 7%',
    attachRateTarget: '≥ 40% bij corporate aanvragen',
  },
]

function calculateQuoteToBook(quotes: Quote[]): number {
  if (!quotes.length) {
    return 0
  }
  const converted = quotes.filter((quote) => quote.status === 'converted').length
  const sent = quotes.filter((quote) => quote.status === 'sent').length
  const denominator = converted + sent
  if (denominator === 0) {
    return 0
  }
  return converted / denominator
}

export default function SalesOfferPlaybook(): JSX.Element {
  const [quoteToBookRate, setQuoteToBookRate] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quotes = useFinanceStore((state) => state.quotes)
  const fetchQuotes = useFinanceStore((state) => state.fetchQuotes)
  const loading = useFinanceStore((state) => state.loading)
  const storeError = useFinanceStore((state) => state.error)
  const clearError = useFinanceStore((state) => state.clearError)

  useEffect(() => {
    let cancelled = false

    const loadQuotes = async () => {
      setIsLoading(true)
      setError(null)
      try {
        await fetchQuotes()
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Kon offertes niet laden.'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadQuotes()

    return () => {
      cancelled = true
      clearError()
    }
  }, [clearError, fetchQuotes, quotes])

  useEffect(() => {
    if (!loading && !storeError) {
      setQuoteToBookRate(calculateQuoteToBook(quotes))
    }
  }, [loading, storeError, quotes])

  const convertedQuotes = useMemo(
    () => quotes.filter((quote) => quote.status === 'converted'),
    [quotes],
  )
  const sentQuotes = useMemo(() => quotes.filter((quote) => quote.status === 'sent'), [quotes])

  const avgConvertedValue = useMemo(() => {
    if (!convertedQuotes.length) {
      return 0
    }
    const total = convertedQuotes.reduce((sum, quote) => sum + quote.amount, 0)
    return total / convertedQuotes.length
  }, [convertedQuotes])

  const totalUpsellPotential = useMemo(() => {
    return bundlePlaybook.reduce((sum, item) => sum + item.basePrice, 0)
  }, [])

  const showLoadingState = isLoading || loading
  const resolvedError = error ?? storeError

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" data-testid="sales-offer-playbook-root">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
            Sales enablement
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Pricing playbook &amp; upsells</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Gebruik deze bundels en guardrails om een consistente marge te behouden, upsell-items te
            activeren en de quote-to-book ratio te verhogen. Alle cijfers zijn gebaseerd op de
            laatste 30 dagen.
          </p>
        </div>
        <div
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm"
          data-testid="sales-offer-playbook-metrics"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quote-to-book
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{percent(quoteToBookRate)}</p>
          <p className="text-xs text-slate-500">
            {convertedQuotes.length} conversies • {sentQuotes.length} open offertes
          </p>
        </div>
      </header>

      {showLoadingState ? (
        <div
          className="mt-10 flex min-h-[40vh] items-center justify-center"
          role="status"
          data-testid="sales-offer-playbook-loading"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : resolvedError ? (
        <div
          className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
          data-testid="sales-offer-playbook-error"
        >
          {resolvedError}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            data-testid="sales-offer-playbook-bundles"
          >
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Aanbevolen bundels</h2>
                <p className="text-sm text-slate-600">
                  Toepassen bij nieuwe aanvragen of als upsell op bestaande deals.
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                Totale upsell-waarde: {currency.format(totalUpsellPotential)}
              </span>
            </header>
            <div className="mt-6 grid gap-4">
              {bundlePlaybook.map((bundle) => (
                <article
                  key={bundle.id}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5"
                  data-testid={`sales-offer-playbook-bundle-${bundle.id}`}
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{bundle.name}</h3>
                      <p className="text-sm text-slate-600">{bundle.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-500">Basistarief</p>
                      <p className="text-xl font-bold text-slate-900">
                        {currency.format(bundle.basePrice)}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                        Discount guardrail
                      </span>
                      <p className="mt-1 font-semibold text-slate-900">
                        {bundle.suggestedDiscount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                        Attach-rate target
                      </span>
                      <p className="mt-1 font-semibold text-slate-900">{bundle.attachRateTarget}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="grid gap-4">
            <section
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              data-testid="sales-offer-playbook-analytics"
            >
              <h2 className="text-lg font-semibold text-slate-900">Aanvullende KPI&apos;s</h2>
              <dl className="mt-3 space-y-3 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Gemiddelde waarde conversies
                  </dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {currency.format(avgConvertedValue)}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Actieve offertes
                  </dt>
                  <dd className="text-lg font-semibold text-slate-900">{sentQuotes.length}</dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Margebehoud</dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    Guardrails toegepast op elke bundel
                  </dd>
                </div>
              </dl>
            </section>

            <section
              className="rounded-2xl border border-slate-200 bg-indigo-600 p-5 text-white shadow-md"
              data-testid="sales-offer-playbook-actions"
            >
              <h2 className="text-lg font-semibold">Volgende acties</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    className="underline decoration-white/60 decoration-2 underline-offset-4 hover:decoration-white"
                    href="/finance/quotes"
                  >
                    Open offertebeheer en pas bundels toe
                  </a>
                </li>
                <li>
                  <a
                    className="underline decoration-white/60 decoration-2 underline-offset-4 hover:decoration-white"
                    href="/sales/handoff"
                  >
                    Automatiseer offerte → factuur workflow
                  </a>
                </li>
                <li>
                  <a
                    className="underline decoration-white/60 decoration-2 underline-offset-4 hover:decoration-white"
                    href="/sales/crm-sync"
                  >
                    Controleer pipeline data na elke import
                  </a>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
