import { useCallback, useEffect, useMemo, useState } from 'react'
import crmStore from '../../stores/crmStore'
import type {
  AutomationWorkflowMetric,
  CRMDashboardSummary,
  PipelineStageMetric,
  SourcePerformanceMetric,
} from '@rg-types/crmTypes'

const integerFormatter = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })

const formatCurrency = (value?: number | null, fractionDigits = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

const formatCurrency = (value?: number | null) => currencyFormatter.format(Math.max(0, value ?? 0))

const formatPercent = (value?: number | null, fractionDigits = 1) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  const normalized = Math.abs(value) <= 1 ? value * 100 : value
  return `${normalized.toFixed(fractionDigits)}%`
}

const formatDays = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return `${value.toFixed(1)} d`
}

const formatMinutes = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return `${value.toFixed(1)} min`
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

const lookbackOptions = [7, 30, 90]

const CRMDashboard = () => {
  const [selectedLookback, setSelectedLookback] = useState<number>(30)
  const dashboard = crmStore((state) => state.dashboard)
  const isLoading = crmStore((state) => state.loading)
  const storeError = crmStore((state) => state.error)
  const fetchDashboardSummary = crmStore((state) => state.fetchDashboardSummary)
  const [hasRequested, setHasRequested] = useState(false)
  const [transientError, setTransientError] = useState<string | null>(null)

  const summary = dashboard

  useEffect(() => {
    let cancelled = false

    const fetchDashboard = async () => {
      setIsLoading(true)
      setError(null)
      if (!cancelled) {
        setSummary(null)
      }

      try {
        const analytics = await crmStore.fetchDashboardSummary()
        if (!cancelled) {
          setSummary(analytics)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load CRM analytics data. Please retry later.',
          )
        }
      } finally {
        if (!cancelled) {
          console.error('Kon CRM-dashboardgegevens niet laden', error)
          setTransientError(
            error instanceof Error
              ? error.message
              : 'Kon CRM-dashboardgegevens niet laden. Probeer het opnieuw.',
          )
          setHasRequested(true)
        }
      }
    }

    fetchDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const handleRefresh = useCallback(() => {
    fetchDashboardSummary({ lookbackDays: selectedLookback }).catch((error) => {
      console.error('Fout tijdens handmatige refresh van CRM-dashboard', error)
      setTransientError(
        error instanceof Error
          ? error.message
          : 'Kon CRM-dashboardgegevens niet verversen. Probeer het opnieuw.',
      )
    })
  }, [fetchDashboardSummary, selectedLookback])

  const totalPipelineDeals = useMemo(() => {
    if (!summary) {
      return 0
    }

    return summary.pipeline.reduce((total, stage) => total + (stage.dealCount ?? 0), 0)
  }, [summary])

  const funnelSteps = useMemo(() => {
    if (!summary) {
      return []
    }

    const { leadFunnel } = summary
    const { totalLeads } = leadFunnel

    const percentage = (value: number) =>
      totalLeads > 0 ? Math.round((value / totalLeads) * 100) : 0

    return [
      {
        id: 'total-leads',
        label: 'Leads totaal',
        value: leadFunnel.totalLeads,
        percentage: 100,
      },
      {
        id: 'recent-leads',
        label: 'Leads laatste 30 dagen',
        value: leadFunnel.leadsLast30Days,
        percentage: percentage(leadFunnel.leadsLast30Days),
      },
      {
        id: 'leads-with-deals',
        label: 'Leads met deal',
        value: leadFunnel.leadsWithDeals,
        percentage: percentage(leadFunnel.leadsWithDeals),
      },
    ]
  }, [summary])

  const automationRows = useMemo(() => summary?.automation ?? [], [summary])
  const sourceRows = useMemo(() => summary?.sourcePerformance ?? [], [summary])
  const lastRefreshLabel = useMemo(() => resolveLastRefresh(summary ?? null), [summary])
  const errorMessage = transientError ?? storeError

  if (isLoading && !summary) {
    return (
      <div
        className="flex justify-center items-center h-screen"
        data-testid="crm-dashboard-loading"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
      </div>
    )
  }

  if (errorMessage && !summary) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
        data-testid="crm-dashboard-error"
      >
        {errorMessage}
      </div>
    )
  }

  const pipeline = summary?.pipeline ?? []
  const headline = summary?.headline

  return (
    <div className="container mx-auto p-4 md:p-8" data-testid="crm-dashboard-root">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="crm-dashboard-title">
            Sales & CRM Dashboard
          </h1>
          {lastRefreshLabel && (
            <p className="text-sm text-gray-500" data-testid="crm-dashboard-last-refresh">
              Laatste update: {lastRefreshLabel}
            </p>
          )}
          {summary && (
            <p className="text-xs text-gray-400 mt-1" data-testid="crm-dashboard-provenance">
              Bron: {summary.provenance.source} · Upstream:{' '}
              {summary.provenance.upstreamSystems.join(', ') || 'onbekend'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <span>Lookback</span>
            <select
              value={selectedLookback}
              onChange={handleLookbackChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              data-testid="crm-dashboard-lookback-select"
            >
              {lookbackOptions.map((days) => (
                <option key={days} value={days}>
                  {days} dagen
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            data-testid="crm-dashboard-refresh"
          >
            {isLoading ? 'Vernieuwen…' : 'Vernieuwen'}
          </button>
        </div>
      </div>

      {errorMessage && summary && (
        <div
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          data-testid="crm-dashboard-error"
        >
          {errorMessage}
        </div>
      )}

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
            Tip: importeer minimaal 3 pipeline fases zodat het salesteam direct opvolgacties ziet.
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
            {formatCount(summary?.sales.wonDealsLast30Days)} deals gewonnen ·{' '}
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
          {headline && (
            <span className="text-sm text-gray-500">
              Totaal pipeline: {formatCurrency(headline.totalPipelineValue)} · Gewogen:{' '}
              {formatCurrency(headline.weightedPipelineValue)}
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
            {pipeline.map((stage: PipelineStageMetric) => (
              <article
                key={stage.stageId}
                className="border border-gray-200 rounded-lg p-4"
                data-testid={`crm-dashboard-pipeline-stage-${stage.stageId}`}
              >
                <h3 className="text-base font-semibold text-gray-800">{stage.stageName}</h3>
                <dl className="mt-3 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <dt>Deals</dt>
                    <dd className="font-medium text-gray-900">{formatCount(stage.dealCount)}</dd>
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
          data-testid="crm-dashboard-funnel"
          aria-label="Lead funnel"
        >
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Lead funnel</h2>
              <p className="text-sm text-gray-500">
                Conversieratio: {formatPercent(summary?.leadFunnel.conversionRate)}
              </p>
            </div>
            <span className="text-sm text-gray-500">
              {formatCount(summary?.leadFunnel.leadsLast30Days)} nieuwe leads (30 dagen)
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {funnelSteps.map((step) => (
              <div key={step.id} data-testid={`crm-dashboard-funnel-step-${step.id}`}>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{step.label}</span>
                  <span>
                    {formatCount(step.value)} · {step.percentage}%
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-indigo-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${Math.min(step.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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

      <section
        className="mt-8 rounded-lg bg-white p-4 shadow"
        data-testid="crm-dashboard-pipeline-section"
        aria-labelledby="crm-dashboard-pipeline-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="crm-dashboard-pipeline-title" className="text-lg font-semibold">
            Pipeline per fase
          </h2>
          {summary && (
            <span className="text-sm text-gray-500">
              Totaal: {formatCurrency(summary.headline.totalPipelineValue)} · Gewogen:{' '}
              {formatCurrency(summary.headline.weightedPipelineValue)}
            </span>
          )}
        </div>
        {summary && summary.pipeline.length > 0 ? (
          <div className="mt-4 overflow-x-auto" data-testid="crm-dashboard-pipeline-table-wrapper">
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
              Start de CRM import om deals in te lezen of maak handmatig een eerste opportunity aan.
            </p>
          </div>
        )}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section
          className="rounded-lg bg-white p-4 shadow"
          data-testid="crm-dashboard-automation"
          aria-label="Automation health"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Automation health</h2>
            <span className="text-sm text-gray-500">
              {formatPercent(summary?.headline.automationFailureRate, 2)} failure rate totaal
            </span>
          </div>
          <div className="overflow-x-auto" data-testid="crm-dashboard-automation-table">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Workflow
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Runs
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Failure rate
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    SLA breaches
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Gem. duur
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {automationRows.map((workflow: AutomationWorkflowMetric) => (
                  <tr
                    key={workflow.workflowId}
                    data-testid={`crm-dashboard-automation-${workflow.workflowId}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {workflow.workflowId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCount(workflow.runCount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatPercent(workflow.failureRate, 2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCount(workflow.slaBreaches)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatMinutes(workflow.avgCompletionMinutes)}
                    </td>
                  </tr>
                ))}
                {automationRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                      Geen automationruns geregistreerd.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="rounded-lg bg-white p-4 shadow"
          data-testid="crm-dashboard-acquisition"
          aria-label="Marketing acquisitie"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Marketing & acquisitie</h2>
            <span className="text-sm text-gray-500">
              Lookback {formatCount(summary?.acquisition.lookbackDays)} dagen
            </span>
          </div>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              className="rounded-lg border border-gray-100 p-4"
              data-testid="crm-dashboard-acquisition-ga-sessions"
            >
              <dt className="text-xs uppercase tracking-wide text-gray-500">GA4 sessies</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {formatCount(summary?.acquisition.gaSessions)}
              </dd>
            </div>
            <div
              className="rounded-lg border border-gray-100 p-4"
              data-testid="crm-dashboard-acquisition-new-users"
            >
              <dt className="text-xs uppercase tracking-wide text-gray-500">Nieuwe gebruikers</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {formatCount(summary?.acquisition.gaNewUsers)}
              </dd>
            </div>
            <div
              className="rounded-lg border border-gray-100 p-4"
              data-testid="crm-dashboard-acquisition-ga-conversions"
            >
              <dt className="text-xs uppercase tracking-wide text-gray-500">GA4 conversies</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {formatCount(summary?.acquisition.gaConversions)}
              </dd>
            </div>
            <div
              className="rounded-lg border border-gray-100 p-4"
              data-testid="crm-dashboard-acquisition-ga-value"
            >
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Conversiewaarde (GA4)
              </dt>
              <dd className="text-lg font-semibold text-gray-900">
                {formatCurrency(summary?.acquisition.gaConversionValue)}
              </dd>
            </div>
            <div
              className="rounded-lg border border-gray-100 p-4"
              data-testid="crm-dashboard-acquisition-gtm-conversions"
            >
              <dt className="text-xs uppercase tracking-wide text-gray-500">GTM conversies</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {formatCount(summary?.acquisition.gtmConversions)}
              </dd>
            </div>
            <div
              className="rounded-lg border border-gray-100 p-4"
              data-testid="crm-dashboard-acquisition-gtm-value"
            >
              <dt className="text-xs uppercase tracking-wide text-gray-500">GTM omzet</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {formatCurrency(summary?.acquisition.gtmConversionValue)}
              </dd>
            </div>
            <div
              className="rounded-lg border border-gray-100 p-4"
              data-testid="crm-dashboard-acquisition-blended"
            >
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Blended conversion rate
              </dt>
              <dd className="text-lg font-semibold text-gray-900">
                {formatPercent(summary?.acquisition.blendedConversionRate, 2)}
              </dd>
            </div>
            <div
              className="rounded-lg border border-gray-100 p-4"
              data-testid="crm-dashboard-acquisition-connectors"
            >
              <dt className="text-xs uppercase tracking-wide text-gray-500">Actieve connectors</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {summary?.acquisition.activeConnectors?.join(', ') ?? '—'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-8 rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-sources">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Bron performance</h2>
          <span className="text-sm text-gray-500">
            {formatCount(summary?.sourcePerformance.length)} actieve bronnen
          </span>
        </div>
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            data-testid="crm-dashboard-sources-table"
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Bron
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Leads
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Deals
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Gewonnen
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pipeline waarde
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Gewonnen waarde
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  GA sessies
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  GA conversies
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  GTM conversies
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sourceRows.map((row: SourcePerformanceMetric) => (
                <tr key={row.key} data-testid={`crm-dashboard-source-${row.key}`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.label}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatCount(row.leadCount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatCount(row.dealCount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatCount(row.wonDealCount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatCurrency(row.pipelineValue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatCurrency(row.wonValue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatCount(row.gaSessions)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatCount(row.gaConversions)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatCount(row.gtmConversions)}
                  </td>
                </tr>
              ))}
              {sourceRows.length === 0 && hasRequested && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                    data-testid="crm-dashboard-sources-empty"
                  >
                    Nog geen brongegevens beschikbaar.
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

export default CRMDashboard
