import { useEffect, useMemo } from 'react'
import crmStore from '../../stores/crmStore'
import type { CRMDashboardSummary, PipelineStageMetric } from '@rg-types/crmTypes'

type TaskStatus = 'planned' | 'in-progress' | 'complete'

interface SalesReadinessTask {
  id: string
  title: string
  description: string
  status: TaskStatus
  evidence: string
}

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return currencyFormatter.format(Math.max(0, value))
}

const formatCount = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return numberFormatter.format(Math.max(0, Math.trunc(value)))
}

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

const statusStyles: Record<TaskStatus, string> = {
  complete: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
  'in-progress': 'bg-amber-50 border border-amber-200 text-amber-800',
  planned: 'bg-slate-50 border border-slate-200 text-slate-700',
}

const statusLabels: Record<TaskStatus, string> = {
  complete: 'Afgerond',
  'in-progress': 'Bezig',
  planned: 'Gepland',
}

const CRMDashboard = () => {
  const { dashboard, loading, error, fetchDashboardSummary } = crmStore((state) => ({
    dashboard: state.dashboard,
    loading: state.loading,
    error: state.error,
    fetchDashboardSummary: state.fetchDashboardSummary,
  }))

  useEffect(() => {
    fetchDashboardSummary().catch(() => {
      /* error state is handled by store */
    })
  }, [fetchDashboardSummary])

  const summary = dashboard
  const totalPipelineDeals = useMemo(() => {
    if (!summary) {
      return 0
    }

    return summary.pipeline.reduce((total, stage) => total + (stage.dealCount ?? 0), 0)
  }, [summary])

  const lastRefreshLabel = useMemo(() => resolveLastRefresh(summary ?? null), [summary])
  const errorMessage = error

  const readinessTasks = useMemo<SalesReadinessTask[]>(() => {
    const tasks: SalesReadinessTask[] = []

    const pipelineReady = (summary?.pipeline.length ?? 0) > 0
    const hasRecentSync = Boolean(summary?.provenance.lastRefreshedAt)
    const openDeals = summary?.sales.openDeals ?? 0
    const weightedPipeline = summary?.headline.weightedPipelineValue ?? 0
    const automationActive = (summary?.headline.activeWorkflows ?? 0) > 0
    const automationHealthy = (summary?.headline.automationFailureRate ?? 0) <= 0.3
    const bookings = summary?.sales.bookingsLast30Days ?? 0
    const blendedConversion = summary?.acquisition.blendedConversionRate ?? 0

    tasks.push({
      id: 'crm-sync',
      title: 'CRM data synchroniseren',
      description:
        'Importeer leads en deals via de wizard zodat pipeline en forecast direct gevuld worden.',
      status: pipelineReady ? 'complete' : hasRecentSync ? 'in-progress' : 'planned',
      evidence: pipelineReady
        ? `${formatCount(totalPipelineDeals)} deals in de pipeline`
        : hasRecentSync
          ? 'Laatste import verwerkt, wacht op eerste deals'
          : 'Nog geen CRM-import uitgevoerd',
    })

    tasks.push({
      id: 'pipeline-review',
      title: 'Pipeline en forecast beoordelen',
      description: 'Controleer pipelinewaarden, wegingen en stel opvolgacties vast per fase.',
      status: weightedPipeline > 0 || openDeals > 0 ? 'in-progress' : 'planned',
      evidence:
        weightedPipeline > 0 || openDeals > 0
          ? `Gewogen waarde ${formatCurrency(weightedPipeline)} · ${formatCount(openDeals)} open deals`
          : 'Geen open deals of pipelinewaarde beschikbaar',
    })

    tasks.push({
      id: 'automation',
      title: 'Sales automation activeren',
      description:
        'Zorg dat opvolgworkflows draaien en monitor de failure-rate zodat afspraken niet blijven liggen.',
      status:
        automationActive && automationHealthy
          ? 'complete'
          : automationActive
            ? 'in-progress'
            : 'planned',
      evidence: automationActive
        ? `${formatCount(summary?.headline.activeWorkflows)} workflows actief · Failure-rate ${formatPercent(summary?.headline.automationFailureRate)}`
        : 'Nog geen actieve workflows',
    })

    tasks.push({
      id: 'acquisition',
      title: 'Marketing & acquisitie koppelen',
      description: 'Verbind GA4/GTM en beoordeel conversies zodat leads doorstromen naar sales.',
      status: blendedConversion > 0 ? 'in-progress' : 'planned',
      evidence:
        blendedConversion > 0
          ? `Blended conversion rate ${formatPercent(blendedConversion)} · ${formatCount(bookings)} boekingen 30d`
          : 'Nog geen conversiedata ontvangen',
    })

    tasks.push({
      id: 'handover',
      title: 'Sales enablement update verzenden',
      description:
        'Publiceer een update naar het salesteam met de belangrijkste highlights en volgende acties.',
      status:
        pipelineReady && automationActive && blendedConversion > 0
          ? 'complete'
          : pipelineReady
            ? 'in-progress'
            : 'planned',
      evidence:
        pipelineReady && automationActive && blendedConversion > 0
          ? 'Alle bouwstenen staan klaar — team kan live gaan'
          : pipelineReady
            ? 'Pipeline staat klaar, wacht op automation/marketing confirmatie'
            : 'Wacht op eerste pipeline vulling',
    })

    return tasks
  }, [summary, totalPipelineDeals])

  const readinessStats = useMemo(() => {
    const completed = readinessTasks.filter((task) => task.status === 'complete').length
    const inProgress = readinessTasks.filter((task) => task.status === 'in-progress').length
    const total = readinessTasks.length || 1
    const progress = Math.round((completed / total) * 100)

    let message = 'Plan staat klaar — start met de CRM-import om momentum te creëren.'
    if (progress === 100) {
      message = 'Alle stappen zijn afgerond. Het salesteam is 100% sales ready.'
    } else if (completed > 0 || inProgress > 0) {
      message =
        'Goede voortgang! Rond de lopende stappen af en stuur het salesteam een enablement-update.'
    }

    return {
      completed,
      inProgress,
      total,
      progress,
      message,
    }
  }, [readinessTasks])

  if (loading && !summary) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        data-testid="crm-dashboard-loading"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-blue-500" />
      </div>
    )
  }

  if (error && !summary) {
    return (
      <div
        className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
        role="alert"
        data-testid="crm-dashboard-error"
      >
        {errorMessage}
      </div>
    )
  }

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
            Tip: importeer minimaal 3 pipelinefases zodat het salesteam direct opvolgacties ziet.
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
            {formatCount(summary?.sales.wonDealsLast30Days)} deals gewonnen ·{' '}
            {formatCurrency(summary?.headline.wonValueLast30Days)} omzet
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

      <section
        className="mt-10 rounded-lg bg-white p-4 shadow md:p-6"
        data-testid="crm-dashboard-sales-readiness"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Plan &amp; uitvoering: 100% sales ready</h2>
            <p className="mt-1 text-sm text-gray-600">
              Volg de stappen hieronder om het team verkoopklaar te maken en de voortgang met het
              management te delen.
            </p>
          </div>
          <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            <p className="font-semibold">Voortgang {readinessStats.progress}%</p>
            <p>
              {readinessStats.completed} afgerond · {readinessStats.inProgress} bezig ·{' '}
              {readinessStats.total - readinessStats.completed - readinessStats.inProgress} gepland
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-700">{readinessStats.message}</p>
        <div
          className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
          data-testid="crm-dashboard-sales-readiness-tasks"
        >
          {readinessTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              data-testid={`crm-dashboard-readiness-task-${task.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[task.status]}`}
                >
                  {statusLabels[task.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{task.description}</p>
              <p className="mt-3 text-sm font-medium text-gray-800">{task.evidence}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="mt-10 rounded-lg bg-white p-4 shadow md:p-6"
        data-testid="crm-dashboard-pipeline-section"
        aria-labelledby="crm-dashboard-pipeline-title"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 id="crm-dashboard-pipeline-title" className="text-xl font-semibold">
              Pipeline per fase
            </h2>
            <p className="text-sm text-gray-500">
              Toon deals per fase inclusief waarde en gemiddelde doorlooptijd.
            </p>
          </div>
          {summary?.headline && (
            <span className="text-sm text-gray-500">
              Totaal: {formatCurrency(summary.headline.totalPipelineValue)} · Gewogen:{' '}
              {formatCurrency(summary.headline.weightedPipelineValue)}
            </span>
          )}
        </div>

        {(summary?.pipeline.length ?? 0) > 0 ? (
          <div className="mt-6 overflow-x-auto" data-testid="crm-dashboard-pipeline-table-wrapper">
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
                {(summary?.pipeline ?? []).map((stage: PipelineStageMetric) => (
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

      <section
        className="mt-10 rounded-lg bg-white p-4 shadow md:p-6"
        data-testid="crm-dashboard-sales-card"
      >
        <h2 className="text-xl font-semibold" data-testid="crm-dashboard-sales-title">
          Sales momentum
        </h2>
        <p className="text-sm text-gray-500">
          Inzicht in dealflow en doorlooptijden voor het salesteam.
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
              Automatiseringsfoutpercentage {formatPercent(summary?.headline.automationFailureRate)}
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
            Publiceer de pipeline widget in het demo-dashboard en stuur het team een update zodra de
            CRM sync is afgerond. Zo weten accountmanagers precies welke deals opvolging nodig
            hebben en ben je 100% sales ready.
          </p>
        </div>
      </section>
    </div>
  )
}

export default CRMDashboard
