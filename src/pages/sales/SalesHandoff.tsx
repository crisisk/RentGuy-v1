import { useEffect, useMemo } from 'react'
import crmStore from '../../stores/crmStore'

const number = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })

const formatDuration = (value?: number | null) => {
  if (value === null || value === undefined) return '—'
  const rounded = Math.round(value)
  return `${rounded} min`
}

const formatCount = (value?: number | null) => number.format(Math.max(0, Math.trunc(value ?? 0)))

const SalesHandoff = () => {
  const summary = crmStore((state) => state.dashboard)
  const loading = crmStore((state) => state.loading)
  const error = crmStore((state) => state.error)
  const fetchSummary = crmStore((state) => state.fetchDashboardSummary)

  useEffect(() => {
    if (!summary) {
      void fetchSummary({ lookbackDays: 60 }).catch(() => undefined)
    }
  }, [fetchSummary, summary])

  const automationMetrics = summary?.automation ?? []

  const slaBreaches = useMemo(() => {
    return automationMetrics.reduce((total, workflow) => total + (workflow.slaBreaches ?? 0), 0)
  }, [automationMetrics])

  const failedRuns = useMemo(() => {
    return automationMetrics.reduce((total, workflow) => total + (workflow.failedRuns ?? 0), 0)
  }, [automationMetrics])

  const totalRuns = useMemo(() => {
    return automationMetrics.reduce((total, workflow) => total + (workflow.runCount ?? 0), 0)
  }, [automationMetrics])

  const readinessScore = useMemo(() => {
    if (!automationMetrics.length) return 0
    const successRate = totalRuns ? (totalRuns - failedRuns) / totalRuns : 0
    const slaScore = totalRuns ? Math.max(0, 1 - slaBreaches / totalRuns) : 0
    return Math.round((successRate * 0.7 + slaScore * 0.3) * 100)
  }, [automationMetrics.length, failedRuns, slaBreaches, totalRuns])

  const isReady = readinessScore >= 90 && slaBreaches === 0

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6" data-testid="sales-handoff-root">
      <header className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-500 p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-100">Sales readiness</p>
            <h1 className="text-3xl font-semibold" data-testid="sales-handoff-title">
              Sales → Operations overdracht automatiseren
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-100">
              Zorg dat gewonnen deals automatisch projectbriefings, crewtaken en transporttaken
              triggeren. De laatste stap om sales en operations volledig te alignen.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
            <span className="font-semibold">Automation readiness</span>
            <p className="text-2xl font-semibold" data-testid="sales-handoff-score">
              {readinessScore}%
            </p>
            <p className="text-xs text-emerald-100">
              {totalRuns} runs · {failedRuns} fouten · {slaBreaches} SLA-breaches
            </p>
          </div>
        </div>
      </header>

      {error && !loading ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          role="alert"
          data-testid="sales-handoff-error"
        >
          {error}
        </div>
      ) : null}

      <section
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
        data-testid="sales-handoff-metrics"
      >
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Overdrachtsworkflows</h2>
          <p
            className="mt-3 text-3xl font-semibold text-gray-900"
            data-testid="sales-handoff-workflows"
          >
            {formatCount(summary?.headline.activeWorkflows)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Workflow studio synchroniseert crew, warehouse en finance
          </p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Gemiddelde afhandelduur</h2>
          <p
            className="mt-3 text-3xl font-semibold text-gray-900"
            data-testid="sales-handoff-avg-duration"
          >
            {formatDuration(
              automationMetrics.length
                ? automationMetrics.reduce((total, workflow) => {
                    if (!workflow.avgCompletionMinutes) return total
                    return total + workflow.avgCompletionMinutes
                  }, 0) / automationMetrics.length
                : null,
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Inclusief checklists voor crew, transport en facturatie
          </p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">SLA naleving</h2>
          <p
            className={`mt-3 text-3xl font-semibold ${slaBreaches ? 'text-amber-600' : 'text-gray-900'}`}
            data-testid="sales-handoff-sla"
          >
            {slaBreaches ? `${slaBreaches} open` : '100%'}
          </p>
          <p className="mt-1 text-xs text-gray-500">SLA ingesteld op 10 minuten per run</p>
        </article>
      </section>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        data-testid="sales-handoff-workflow-table"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Workflow status</h2>
            <p className="text-sm text-gray-600">
              Controleer of alle overdrachtsstappen gezond zijn.
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
            data-testid="sales-handoff-readiness-chip"
          >
            {isReady ? 'Klaar voor go-live' : 'Nog actie vereist'}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            data-testid="sales-handoff-table-grid"
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Workflow
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Runs
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fouten
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Gemiddelde tijd
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  SLA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {automationMetrics.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                    data-testid="sales-handoff-empty"
                  >
                    Nog geen automations actief. Configureer de Sales → Ops checklist om
                    doorlooptijden te bewaken.
                  </td>
                </tr>
              ) : (
                automationMetrics.map((workflow) => (
                  <tr
                    key={workflow.workflowId}
                    data-testid={`sales-handoff-row-${workflow.workflowId}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {workflow.workflowId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCount(workflow.runCount)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${workflow.failedRuns ? 'text-amber-600' : 'text-emerald-600'}`}
                    >
                      {formatCount(workflow.failedRuns)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDuration(workflow.avgCompletionMinutes)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          workflow.slaBreaches
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                        data-testid={`sales-handoff-sla-${workflow.workflowId}`}
                      >
                        {workflow.slaBreaches
                          ? `${workflow.slaBreaches} overschrijdingen`
                          : 'Binnen SLA'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        data-testid="sales-handoff-playbook"
      >
        <h2 className="text-lg font-semibold text-gray-900">Playbook voor overdracht</h2>
        <ol className="mt-4 space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-3" data-testid="sales-handoff-step-briefing">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
              1
            </span>
            Synchroniseer gewonnen deal → project template → crew briefings. Controleer dat
            draaiboeken automatisch verstuurd worden.
          </li>
          <li className="flex items-start gap-3" data-testid="sales-handoff-step-warehouse">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
              2
            </span>
            Koppel voorraadblokkades en transportplanning zodat logistiek direct start na
            deal-signing.
          </li>
          <li className="flex items-start gap-3" data-testid="sales-handoff-step-finance">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
              3
            </span>
            Trigger deposit factuur en Mollie-betaling zodra status ‘gewonnen’ bereikt is. Bevestig
            webhook logs.
          </li>
        </ol>
      </section>
    </div>
  )
}

export default SalesHandoff
