import { useEffect, useMemo, useState } from 'react'
import crmStore from '../../stores/crmStore'
import type {
  AutomationWorkflowMetric,
  CRMDashboardSummary,
  PipelineStageMetric,
  SourcePerformanceMetric,
} from '@rg-types/crmTypes'

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })

const formatCurrency = (value?: number | null) => currencyFormatter.format(Math.max(0, value ?? 0))

const formatPercent = (value?: number | null, fractionDigits = 1) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return `${(0).toFixed(fractionDigits)}%`
  }

  const normalised = value > 1 ? value : value * 100
  return `${normalised.toFixed(fractionDigits)}%`
}

const formatCount = (value?: number | null) =>
  numberFormatter.format(Math.max(0, Math.trunc(value ?? 0)))

const formatDays = (value?: number | null) => {
  if (value === null || value === undefined) return '—'
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10
  return `${rounded.toFixed(1)} d`
}

const formatMinutes = (value?: number | null) => {
  if (value === null || value === undefined) return '—'
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10
  return `${rounded.toFixed(1)} min`
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

type ReadinessInsight = {
  id: string
  title: string
  detail: string
  status: 'complete' | 'attention'
}

const READINESS_AUTOMATION_THRESHOLD = 0.02
const READINESS_WINRATE_TARGET = 0.3

const CRMDashboard = () => {
  const [summary, setSummary] = useState<CRMDashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchDashboard = async () => {
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
          setIsLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const totalPipelineDeals = useMemo(() => {
    if (!summary) return 0
    return summary.pipeline.reduce((total, stage) => total + (stage.dealCount ?? 0), 0)
  }, [summary])

  const lastRefreshLabel = useMemo(() => resolveLastRefresh(summary), [summary])

  const readinessInsights = useMemo<ReadinessInsight[]>(() => {
    if (!summary) return []

    const hasPipelineData = summary.pipeline.some((stage) => (stage.dealCount ?? 0) > 0)
    const connectors = summary.acquisition.activeConnectors.length
    const failureRate = summary.headline.automationFailureRate ?? 0
    const winRate = summary.sales.winRate ?? 0

    return [
      {
        id: 'pipeline-sync',
        title: hasPipelineData ? 'Pipeline gevuld' : 'Vul pipeline met deals',
        detail: hasPipelineData
          ? `${formatCount(totalPipelineDeals)} deals verdeeld over ${summary.pipeline.length} fasen.`
          : 'Importeer deals via de CRM wizard om alle pipelinefasen te activeren.',
        status: hasPipelineData ? 'complete' : 'attention',
      },
      {
        id: 'marketing-connectors',
        title: connectors ? 'Marketingkanalen gekoppeld' : 'Activeer marketingconnectoren',
        detail: connectors
          ? `${connectors} actieve connector${connectors === 1 ? '' : 'en'} voor leadbrontracking.`
          : 'Koppel GA4 of GTM zodat leadbronnen automatisch worden bijgewerkt.',
        status: connectors ? 'complete' : 'attention',
      },
      {
        id: 'automation-health',
        title:
          failureRate <= READINESS_AUTOMATION_THRESHOLD
            ? 'Automation SLA op niveau'
            : 'Analyseer automation SLA',
        detail:
          failureRate <= READINESS_AUTOMATION_THRESHOLD
            ? `Foutrate ${formatPercent(failureRate)} — binnen norm (≤ ${formatPercent(
                READINESS_AUTOMATION_THRESHOLD,
              )}).`
            : `Foutrate ${formatPercent(failureRate)} overschrijdt de norm (≤ ${formatPercent(
                READINESS_AUTOMATION_THRESHOLD,
              )}).`,
        status: failureRate <= READINESS_AUTOMATION_THRESHOLD ? 'complete' : 'attention',
      },
      {
        id: 'win-rate',
        title: winRate >= READINESS_WINRATE_TARGET ? 'Winrate gezond' : 'Plan winrate review',
        detail:
          winRate >= READINESS_WINRATE_TARGET
            ? `Huidige winrate ${formatPercent(winRate)} — boven target (${formatPercent(
                READINESS_WINRATE_TARGET,
              )}).`
            : `Winrate is ${formatPercent(winRate)} — plan een dealreview met het salesteam.`,
        status: winRate >= READINESS_WINRATE_TARGET ? 'complete' : 'attention',
      },
    ]
  }, [summary, totalPipelineDeals])

  const topSources = useMemo<SourcePerformanceMetric[]>(() => {
    if (!summary) return []
    return [...summary.sourcePerformance]
      .sort((a, b) => (b.pipelineValue ?? 0) - (a.pipelineValue ?? 0))
      .slice(0, 5)
  }, [summary])

  const topAutomations = useMemo<AutomationWorkflowMetric[]>(() => {
    if (!summary) return []
    return [...summary.automation]
      .sort((a, b) => b.failureRate - a.failureRate || b.runCount - a.runCount)
      .slice(0, 3)
  }, [summary])

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

  if (!summary) {
    return (
      <div className="p-8 text-center text-gray-600" data-testid="crm-dashboard-empty">
        Geen CRM analytics data beschikbaar. Probeer het later opnieuw.
      </div>
    )
  }

  const totalLeads = summary.leadFunnel.totalLeads ?? 0
  const convertedLeads = summary.leadFunnel.leadsWithDeals ?? 0
  const leadProgressPercent = totalLeads
    ? Math.min(100, Math.round((convertedLeads / totalLeads) * 100))
    : 0

  return (
    <div className="container mx-auto p-4 md:p-8" data-testid="crm-dashboard-root">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold" data-testid="crm-dashboard-title">
          Sales &amp; CRM Dashboard
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
            {formatCurrency(summary.headline.totalPipelineValue)}
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
            {formatCurrency(summary.headline.weightedPipelineValue)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Kansgewogen forecast voor lopende deals</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-kpi-winrate">
          <p className="text-sm font-medium text-gray-500">Winrate laatste 30 dagen</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatPercent(summary.sales.winRate)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatCount(summary.sales.wonDealsLast30Days)} deals gewonnen •{' '}
            {formatCurrency(summary.headline.wonValueLast30Days)} omzet
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-kpi-forecast">
          <p className="text-sm font-medium text-gray-500">Forecast komende 30 dagen</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(summary.sales.forecastNext30Days)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Pipeline velocity: {formatCurrency(summary.sales.pipelineVelocityPerDay)} per dag
          </p>
        </div>
      </div>

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
              {formatCount(summary.sales.openDeals)} open deals
            </div>
          </div>

          {summary.pipeline.length > 0 ? (
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
                {formatCount(summary.sales.openDeals)}
              </dd>
              <p className="mt-1 text-xs text-gray-500">
                {formatCount(summary.sales.totalDeals)} totaal geregistreerde deals
              </p>
            </div>
            <div
              className="rounded-md border border-gray-100 p-4"
              data-testid="crm-dashboard-sales-bookings"
            >
              <dt className="text-sm font-medium text-gray-500">Boekingen laatste 30 dagen</dt>
              <dd className="mt-2 text-2xl font-bold text-gray-900">
                {formatCount(summary.sales.bookingsLast30Days)}
              </dd>
              <p className="mt-1 text-xs text-gray-500">
                Gemiddelde dealwaarde {formatCurrency(summary.sales.avgDealValue)}
              </p>
            </div>
            <div
              className="rounded-md border border-gray-100 p-4"
              data-testid="crm-dashboard-sales-cycle"
            >
              <dt className="text-sm font-medium text-gray-500">Gemiddelde doorlooptijd</dt>
              <dd className="mt-2 text-2xl font-bold text-gray-900">
                {formatDays(summary.headline.avgDealCycleDays)}
              </dd>
              <p className="mt-1 text-xs text-gray-500">Inclusief gewonnen én verloren deals</p>
            </div>
            <div
              className="rounded-md border border-gray-100 p-4"
              data-testid="crm-dashboard-sales-automation"
            >
              <dt className="text-sm font-medium text-gray-500">Actieve workflows</dt>
              <dd className="mt-2 text-2xl font-bold text-gray-900">
                {formatCount(summary.headline.activeWorkflows)}
              </dd>
              <p className="mt-1 text-xs text-gray-500">
                Automatiseringsfoutpercentage{' '}
                {formatPercent(summary.headline.automationFailureRate)}
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

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-lead-funnel">
          <h2 className="text-xl font-semibold">Lead funnel</h2>
          <p className="text-sm text-gray-500">Overzicht van leadgroei en conversie naar deals</p>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Totaal aantal leads</dt>
              <dd className="text-base font-semibold text-gray-900">{formatCount(totalLeads)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Leads laatste 30 dagen</dt>
              <dd className="text-base font-semibold text-gray-900">
                {formatCount(summary.leadFunnel.leadsLast30Days)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Leads met deal</dt>
              <dd className="text-base font-semibold text-gray-900">
                {formatCount(convertedLeads)}
              </dd>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Conversie lead → deal</span>
                <span className="font-semibold text-gray-900">
                  {formatPercent(summary.leadFunnel.conversionRate)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${leadProgressPercent}%` }}
                  aria-label={`Conversie ${leadProgressPercent}%`}
                />
              </div>
            </div>
          </dl>
        </section>

        <section className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-acquisition">
          <h2 className="text-xl font-semibold">Marketing &amp; acquisitie</h2>
          <p className="text-sm text-gray-500">
            Blended GA4/GTM prestaties voor het huidige venster
          </p>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Sessies</dt>
              <dd className="text-base font-semibold text-gray-900">
                {formatCount(summary.acquisition.gaSessions)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Nieuwe gebruikers</dt>
              <dd className="text-base font-semibold text-gray-900">
                {formatCount(summary.acquisition.gaNewUsers)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Conversies (GA4 + GTM)</dt>
              <dd className="text-base font-semibold text-gray-900">
                {formatCount(
                  summary.acquisition.gaConversions + summary.acquisition.gtmConversions,
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Totale omzetwaarde</dt>
              <dd className="text-base font-semibold text-gray-900">
                {formatCurrency(
                  summary.acquisition.gaConversionValue + summary.acquisition.gtmConversionValue,
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Blended conversiepercentage</dt>
              <dd className="text-base font-semibold text-gray-900">
                {formatPercent(summary.acquisition.blendedConversionRate, 2)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-gray-500">
            Actieve connectoren:{' '}
            {summary.acquisition.activeConnectors.join(', ') || 'geen gekoppelde kanalen'}
          </p>
        </section>

        <section className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-automation">
          <h2 className="text-xl font-semibold">Automation health</h2>
          <p className="text-sm text-gray-500">
            Belangrijkste workflows op basis van run-count en foutrate
          </p>
          {topAutomations.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Nog geen workflow runs geregistreerd.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topAutomations.map((workflow) => (
                <li
                  key={workflow.workflowId}
                  className="rounded-md border border-gray-100 p-3"
                  data-testid={`crm-dashboard-automation-${workflow.workflowId}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{workflow.workflowId}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        workflow.failureRate > READINESS_AUTOMATION_THRESHOLD
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {formatPercent(workflow.failureRate)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {formatCount(workflow.runCount)} runs • {formatCount(workflow.failedRuns)}{' '}
                    failures • {formatMinutes(workflow.avgCompletionMinutes)} doorlooptijd
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-sources">
          <h2 className="text-xl font-semibold">Top bronnen</h2>
          <p className="text-sm text-gray-500">
            Belangrijkste leadbronnen op basis van pipelinewaarde
          </p>
          {topSources.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Nog geen brondata beschikbaar.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table
                className="min-w-full divide-y divide-gray-200"
                data-testid="crm-dashboard-sources-table"
              >
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Bron
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Leads
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Deals
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Gewonnen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Pipelinewaarde
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {topSources.map((source) => (
                    <tr key={source.key} data-testid={`crm-dashboard-source-${source.key}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {source.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatCount(source.leadCount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatCount(source.dealCount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatCount(source.wonDealCount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatCurrency(source.pipelineValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg bg-white p-4 shadow" data-testid="crm-dashboard-readiness">
          <h2 className="text-xl font-semibold">Sales readiness checklist</h2>
          <p className="text-sm text-gray-500">
            Realtime status van de belangrijkste enablement-taken
          </p>
          <ul className="mt-4 space-y-3">
            {readinessInsights.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-md border border-gray-100 p-3"
                data-testid={`crm-dashboard-readiness-${item.id}`}
              >
                <span
                  className={`mt-0.5 inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    item.status === 'complete'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {item.status === 'complete' ? 'Klaar' : 'Actie'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default CRMDashboard
