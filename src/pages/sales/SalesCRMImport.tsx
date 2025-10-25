import { useEffect, useMemo, useState } from 'react'
import crmStore from '@stores/crmStore'
import type { CRMDashboardSummary, PipelineStageMetric } from '@rg-types/crmTypes'

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })

const formatCurrency = (value?: number | null) => currencyFormatter.format(Math.max(0, value ?? 0))

const formatNumber = (value?: number | null) =>
  numberFormatter.format(Math.max(0, Math.trunc(value ?? 0)))

const formatPercent = (value?: number | null) => `${((value ?? 0) * 100).toFixed(1)}%`

const formatDays = (value?: number | null) => {
  if (value === null || value === undefined) {
    return '—'
  }
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10
  return `${rounded.toFixed(1)} d`
}

function groupPipelineByStage(stages: PipelineStageMetric[]): PipelineStageMetric[] {
  return [...stages].sort((left, right) => (left.stageId ?? 0) - (right.stageId ?? 0))
}

export default function SalesCRMImport(): JSX.Element {
  const [summary, setSummary] = useState<CRMDashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadSummary = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const analytics = await crmStore.fetchDashboardSummary({ lookbackDays: 30 })
        if (!cancelled) {
          setSummary(analytics)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Kon CRM-analytics niet laden.'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadSummary()

    return () => {
      cancelled = true
    }
  }, [])

  const hasPipelineData = Boolean(summary?.pipeline.length)
  const groupedPipeline = useMemo(() => groupPipelineByStage(summary?.pipeline ?? []), [summary])

  const openDeals = summary?.sales.openDeals ?? 0
  const totalDeals = summary?.sales.totalDeals ?? 0
  const crmSyncStatus = hasPipelineData ? 'Gereed' : 'Openstaand'
  const crmSyncTone = hasPipelineData ? 'text-emerald-600' : 'text-amber-600'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" data-testid="sales-crm-import-root">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
            Sales enablement
          </p>
          <h1 className="text-3xl font-bold text-slate-900">CRM import wizard</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Synchroniseer pipeline data, activeer conversie-inzichten en zorg dat accountmanagers
            direct kunnen opvolgen. De wizard begeleidt je door CSV-import, API-koppelingen en
            validatie van velden zoals probability, forecast en marge.
          </p>
        </div>
        <div
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          data-testid="sales-crm-import-status"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            CRM sync status
          </span>
          <p className={`mt-2 text-lg font-bold ${crmSyncTone}`}>{crmSyncStatus}</p>
          <p className="text-xs text-slate-500">
            {formatNumber(openDeals)} actieve deals • {formatNumber(totalDeals)} totaal
          </p>
        </div>
      </header>

      {isLoading ? (
        <div
          className="mt-10 flex min-h-[40vh] items-center justify-center"
          role="status"
          data-testid="sales-crm-import-loading"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : error ? (
        <div
          className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
          data-testid="sales-crm-import-error"
        >
          {error}
        </div>
      ) : (
        <section
          className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]"
          aria-labelledby="sales-crm-import-overview"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 id="sales-crm-import-overview" className="text-xl font-semibold text-slate-900">
                Pipeline overzicht
              </h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                Laatste refresh:{' '}
                {summary?.provenance.lastRefreshedAt
                  ? new Date(summary.provenance.lastRefreshedAt).toLocaleString('nl-NL')
                  : 'n.t.b.'}
              </span>
            </div>
            {hasPipelineData ? (
              <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
                <table
                  className="min-w-full divide-y divide-slate-100"
                  data-testid="sales-crm-import-pipeline-table"
                >
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Fase
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Deals
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Totale waarde
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Gewogen
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Gem. leeftijd
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {groupedPipeline.map((stage) => (
                      <tr
                        key={stage.stageId}
                        data-testid={`sales-crm-import-stage-${stage.stageId}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {stage.stageName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatNumber(stage.dealCount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatCurrency(stage.totalValue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatCurrency(stage.weightedValue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDays(stage.avgAgeDays)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="mt-6 rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center text-indigo-700"
                data-testid="sales-crm-import-empty"
              >
                <h3 className="text-lg font-semibold">Nog geen pipeline data</h3>
                <p className="mt-2 text-sm">
                  Importeer minimaal drie pipelinefases om forecasting en automatiseringen te
                  activeren. Gebruik de CSV-template of koppel rechtstreeks met HubSpot, Teamleader
                  of Salesforce.
                </p>
              </div>
            )}
          </div>

          <aside className="grid gap-4">
            <div
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm"
              data-testid="sales-crm-import-steps"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                Stappen voor 100% sales ready
              </h3>
              <ol className="mt-3 space-y-3 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="mt-0.5 h-6 w-6 rounded-full bg-indigo-600 text-center text-xs font-semibold text-white">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">CSV-template vullen</p>
                    <p>
                      Gebruik de standaardkolommen (dealnaam, probability, marge) en controleer
                      valuta op EUR.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 h-6 w-6 rounded-full bg-indigo-600 text-center text-xs font-semibold text-white">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">API-koppeling activeren</p>
                    <p>
                      Genereer een API-token voor HubSpot of Teamleader en koppel via{' '}
                      <code className="rounded bg-slate-100 px-1">/api/v1/crm/import</code>.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 h-6 w-6 rounded-full bg-indigo-600 text-center text-xs font-semibold text-white">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">Validatie &amp; forecasting</p>
                    <p>
                      Controleer winrate, pipeline velocity en open deals. Corrigeer afwijkingen
                      &gt;10% t.o.v. de referentie.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              data-testid="sales-crm-import-kpis"
            >
              <h3 className="text-lg font-semibold text-slate-900">Belangrijkste KPI&apos;s</h3>
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Gewogen pipeline
                  </dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {formatCurrency(summary?.headline.weightedPipelineValue)}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Winrate 30 dagen
                  </dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {formatPercent(summary?.sales.winRate)}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Pipeline velocity
                  </dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {formatCurrency(summary?.sales.pipelineVelocityPerDay)} / dag
                  </dd>
                </div>
              </dl>
            </div>

            <div
              className="rounded-2xl border border-slate-200 bg-indigo-600 p-5 text-white shadow-md"
              data-testid="sales-crm-import-actions"
            >
              <h3 className="text-lg font-semibold">Snelle acties</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    className="underline decoration-white/60 decoration-2 underline-offset-4 hover:decoration-white"
                    href="/sales/offers"
                  >
                    Open pricing playbook en upsell-sjablonen
                  </a>
                </li>
                <li>
                  <a
                    className="underline decoration-white/60 decoration-2 underline-offset-4 hover:decoration-white"
                    href="/sales/handoff"
                  >
                    Controleer sales → operations overdracht
                  </a>
                </li>
                <li>
                  <a
                    className="underline decoration-white/60 decoration-2 underline-offset-4 hover:decoration-white"
                    href="/finance/quotes"
                  >
                    Zet gewonnen deals direct om naar facturen
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </section>
      )}
    </div>
  )
}
