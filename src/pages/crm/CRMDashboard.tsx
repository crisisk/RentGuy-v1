import { useEffect, useMemo, useState } from 'react'
import crmStore from '../../stores/crmStore'
import type { CRMDashboardSummary, PipelineStageMetric } from '@rg-types/crmTypes'

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })

const formatCurrency = (value?: number | null) => currencyFormatter.format(Math.max(0, value ?? 0))

const formatPercent = (value?: number | null) => `${(value ?? 0).toFixed(1)}%`

const formatCount = (value?: number | null) =>
  numberFormatter.format(Math.max(0, Math.trunc(value ?? 0)))

const formatDays = (value?: number | null) => {
  if (value === null || value === undefined) return '—'
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10
  return `${rounded.toFixed(1)} d`
}

const resolveLastRefresh = (summary: CRMDashboardSummary | null) => {
  if (!summary) return null
  const source = summary.provenance.lastRefreshedAt ?? summary.generatedAt
  if (!source) return null
  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CRMDashboard = () => {
  const [summary, setSummary] = useState<CRMDashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const analytics = await crmStore.fetchDashboardSummary()
        setSummary(analytics)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load CRM analytics data. Please retry later.',
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchDashboard()
  }, [])

  const totalPipelineDeals = useMemo(() => {
    if (!summary) return 0
    return summary.pipeline.reduce((total, stage) => total + (stage.dealCount ?? 0), 0)
  }, [summary])

  const lastRefreshLabel = useMemo(() => resolveLastRefresh(summary), [summary])

  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center h-screen"
        data-testid="crm-dashboard-loading"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
        data-testid="crm-dashboard-error"
      >
        {error}
      </div>
    )
  }

  const pipeline: CRMPipelineStageKPI[] = dashboardSummary?.pipeline ?? []

  return (
    <div className="container mx-auto p-4 md:p-8" data-testid="crm-dashboard-root">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold" data-testid="crm-dashboard-title">
          Sales & CRM Dashboard
        </h1>
        {lastRefreshLabel && (
          <span className="text-sm text-gray-500" data-testid="crm-dashboard-last-refresh">
            Laatste update: {lastRefreshLabel}
          </span>
        )}
      </div>

      <div
        className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4 md:p-6"
        data-testid="crm-dashboard-crm-sync"
      >
        <h2 className="text-lg font-semibold text-indigo-900">CRM sync klaar voor gebruik</h2>
        <p className="mt-2 text-sm text-indigo-800">
          Importeer leads en deals vanuit je bronsysteem om de pipeline hieronder te vullen en het
          sales-team 100% sales ready te maken. De import wizard synchroniseert velden als
          dealwaarde, fase en verwachtte sluitingsdatum.
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <a
            href="/sales/crm-sync"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            data-testid="crm-dashboard-crm-sync-cta"
          >
            Open CRM import wizard
          </a>
          <span className="text-sm text-indigo-700" data-testid="crm-dashboard-crm-sync-hint">
            Tip: importeer minimaal 3 pipeline fases zodat het sales-team direct opvolgacties ziet.
          </span>
        </div>
      </div>

      <div
        className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        data-testid="crm-dashboard-kpis"
      >
        <div className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-kpi-total-value">
          <p className="text-sm font-medium text-gray-500">Totale pipelinewaarde</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(summary?.headline.totalPipelineValue)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatCount(totalPipelineDeals)} deals in actieve pipeline
          </p>
        </div>
        <div
          className="rounded-lg bg-white p-4 shadow"
          data-testid="crm-dashboard-kpi-weighted-value"
        >
          <p className="text-sm font-medium text-gray-500">Gewogen pipeline</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(summary?.headline.weightedPipelineValue)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Kansgewogen forecast voor lopende deals</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-kpi-winrate">
          <p className="text-sm font-medium text-gray-500">Winrate laatste 30 dagen</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatPercent(summary?.sales.winRate)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatCount(summary?.sales.wonDealsLast30Days)} deals gewonnen •{' '}
            {formatCurrency(summary?.headline.wonValueLast30Days)} omzet
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-kpi-forecast">
          <p className="text-sm font-medium text-gray-500">Forecast komende 30 dagen</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(summary?.sales.forecastNext30Days)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Pipeline velocity: {formatCurrency(summary?.sales.pipelineVelocityPerDay)} per dag
          </p>
        </div>
      </div>

      <section
        className="bg-white shadow rounded-lg p-4 md:p-6"
        data-testid="crm-dashboard-pipeline-section"
        aria-labelledby="crm-dashboard-pipeline-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="crm-dashboard-pipeline-title" className="text-lg font-semibold">
            Pipeline per fase
          </h2>
          {dashboardSummary?.headline && (
            <span className="text-sm text-gray-500">
              Totaal pipeline: {formatCurrency(dashboardSummary.headline.totalPipelineValue)} ·
              Gewogen: {formatCurrency(dashboardSummary.headline.weightedPipelineValue)}
            </span>
          )}
        </div>
        {pipeline.length === 0 ? (
          <p className="text-gray-500" data-testid="crm-dashboard-pipeline-empty">
            Nog geen pipeline data beschikbaar. Synchroniseer je CRM of voeg deals toe om de fasen
            te vullen.
          </p>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            data-testid="crm-dashboard-pipeline-grid"
          >
            {pipeline.map((stage) => (
              <article
                key={stage.stageId}
                className="border border-gray-200 rounded-lg p-4"
                data-testid={`crm-dashboard-pipeline-stage-${stage.stageId}`}
              >
                <h3 className="text-base font-semibold text-gray-800">{stage.stageName}</h3>
                <dl className="mt-3 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <dt>Deals</dt>
                    <dd className="font-medium text-gray-900">{formatNumber(stage.dealCount)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Totale waarde</dt>
                    <dd className="font-medium text-gray-900">
                      {formatCurrency(stage.totalValue)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Gewogen</dt>
                    <dd className="font-medium text-gray-900">
                      {formatCurrency(stage.weightedValue)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Gem. leeftijd</dt>
                    <dd className="font-medium text-gray-900">
                      {typeof stage.avgAgeDays === 'number'
                        ? `${stage.avgAgeDays.toFixed(1)} dagen`
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section
          className="rounded-lg bg-white p-4 shadow"
          data-testid="crm-dashboard-pipeline-card"
        >
          <div className="flex flex-col gap-2 border-b pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold" data-testid="crm-dashboard-pipeline-title">
                Pipeline per fase
              </h2>
              <p className="text-sm text-gray-500">
                Toon deals per fase inclusief waarde en gemiddelde doorlooptijd
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              {formatCount(summary?.sales.openDeals)} open deals
            </div>
          </div>

          {summary && summary.pipeline.length > 0 ? (
            <div
              className="mt-4 overflow-x-auto"
              data-testid="crm-dashboard-pipeline-table-wrapper"
            >
              <table
                className="min-w-full divide-y divide-gray-200"
                data-testid="crm-dashboard-pipeline-table"
              >
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Fase
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Deals
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Waarde
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Gewogen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Gem. leeftijd
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {summary.pipeline.map((stage: PipelineStageMetric) => (
                    <tr
                      key={stage.stageId}
                      data-testid={`crm-dashboard-pipeline-stage-${stage.stageId}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {stage.stageName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatCount(stage.dealCount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatCurrency(stage.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatCurrency(stage.weightedValue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDays(stage.avgAgeDays)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="mt-6 rounded-lg border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center text-indigo-800"
              data-testid="crm-dashboard-pipeline-empty"
            >
              <h3 className="text-lg font-semibold">Nog geen pipeline data</h3>
              <p className="mt-2 text-sm">
                Start de CRM import om deals in te lezen of maak handmatig een eerste opportunity
                aan.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-sales-card">
          <h2 className="text-xl font-semibold" data-testid="crm-dashboard-sales-title">
            Sales momentum
          </h2>
          <p className="text-sm text-gray-500">
            Inzicht in dealflow en doorlooptijden voor het salesteam
          </p>

          <dl
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
            data-testid="crm-dashboard-sales-metrics"
          >
            <div
              className="rounded-md border border-gray-100 p-4"
              data-testid="crm-dashboard-sales-open-deals"
            >
              <dt className="text-sm font-medium text-gray-500">Openstaande deals</dt>
              <dd className="mt-2 text-2xl font-bold text-gray-900">
                {formatCount(summary?.sales.openDeals)}
              </dd>
              <p className="mt-1 text-xs text-gray-500">
                {formatCount(summary?.sales.totalDeals)} totaal geregistreerde deals
              </p>
            </div>
            <div
              className="rounded-md border border-gray-100 p-4"
              data-testid="crm-dashboard-sales-bookings"
            >
              <dt className="text-sm font-medium text-gray-500">Boekingen laatste 30 dagen</dt>
              <dd className="mt-2 text-2xl font-bold text-gray-900">
                {formatCount(summary?.sales.bookingsLast30Days)}
              </dd>
              <p className="mt-1 text-xs text-gray-500">
                Gemiddelde dealwaarde {formatCurrency(summary?.sales.avgDealValue)}
              </p>
            </div>
            <div
              className="rounded-md border border-gray-100 p-4"
              data-testid="crm-dashboard-sales-cycle"
            >
              <dt className="text-sm font-medium text-gray-500">Gemiddelde doorlooptijd</dt>
              <dd className="mt-2 text-2xl font-bold text-gray-900">
                {formatDays(summary?.headline.avgDealCycleDays)}
              </dd>
              <p className="mt-1 text-xs text-gray-500">Inclusief gewonnen én verloren deals</p>
            </div>
            <div
              className="rounded-md border border-gray-100 p-4"
              data-testid="crm-dashboard-sales-automation"
            >
              <dt className="text-sm font-medium text-gray-500">Actieve workflows</dt>
              <dd className="mt-2 text-2xl font-bold text-gray-900">
                {formatCount(summary?.headline.activeWorkflows)}
              </dd>
              <p className="mt-1 text-xs text-gray-500">
                Automatiseringsfoutpercentage{' '}
                {formatPercent(summary?.headline.automationFailureRate)}
              </p>
            </div>
          </dl>

          <div
            className="mt-6 rounded-md border border-dashed border-gray-200 p-4"
            data-testid="crm-dashboard-sales-guidance"
          >
            <h3 className="text-sm font-semibold text-gray-700">
              Volgende stap voor sales enablement
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Publiceer de pipeline widget in het demo-dashboard en stuur het team een update zodra
              de CRM sync is afgerond. Zo weten accountmanagers precies welke deals opvolging nodig
              hebben en ben je 100% sales ready.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CRMDashboard
