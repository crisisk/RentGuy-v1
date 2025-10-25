import { useEffect, useMemo, useState } from 'react'
import crmStore from '@stores/crmStore'
import { useFinanceStore } from '@stores/financeStore'
import type { CRMDashboardSummary } from '@rg-types/crmTypes'

const currency = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const percent = (value: number | null | undefined) => `${((value ?? 0) * 100).toFixed(1)}%`

interface HandoffChecklistItem {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly status: 'done' | 'in-progress' | 'todo'
}

const statusColors: Record<HandoffChecklistItem['status'], string> = {
  done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'in-progress': 'bg-amber-100 text-amber-700 border-amber-200',
  todo: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function SalesHandoffPlaybook(): JSX.Element {
  const [summary, setSummary] = useState<CRMDashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const payments = useFinanceStore((state) => state.payments)
  const fetchPayments = useFinanceStore((state) => state.fetchPayments)
  const financeLoading = useFinanceStore((state) => state.loading)
  const financeError = useFinanceStore((state) => state.error)
  const clearFinanceError = useFinanceStore((state) => state.clearError)

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const analytics = await crmStore.fetchDashboardSummary({ lookbackDays: 30 })
        if (!cancelled) {
          setSummary(analytics)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Kon CRM-hand-off gegevens niet laden.'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    const loadPayments = async () => {
      try {
        await fetchPayments()
      } catch (err) {
        if (!cancelled) {
          console.warn('Kon betalingen niet laden', err)
        }
      }
    }

    void loadDashboard()
    void loadPayments()

    return () => {
      cancelled = true
      clearFinanceError()
    }
  }, [clearFinanceError, fetchPayments])

  const resolvedFinanceError = financeError
  const totalBookings = summary?.sales.bookingsLast30Days ?? 0
  const automationRuns = summary?.automation ?? []
  const activeAutomation = automationRuns.filter((run) => run.failureRate < 0.05)
  const failedAutomation = automationRuns.filter((run) => run.failureRate >= 0.05)

  const depositPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          (payment.method ?? '').toLowerCase().includes('mollie') ||
          (payment.method ?? '').toLowerCase().includes('deposit'),
      ),
    [payments],
  )
  const depositCaptureRate = useMemo(() => {
    if (!payments.length) {
      return 0
    }
    return depositPayments.length / payments.length
  }, [depositPayments.length, payments.length])

  const checklist: readonly HandoffChecklistItem[] = [
    {
      id: 'automation-sync',
      title: 'Workflow & triggers actief',
      description: 'Automatisering voor quote → factuur draait en faalt minder dan 5% van de runs.',
      status: activeAutomation.length > 0 && failedAutomation.length === 0 ? 'done' : 'in-progress',
    },
    {
      id: 'deposit-capture',
      title: 'Voorschot incasso via Mollie',
      description: 'Depositbetalingen worden automatisch verwerkt zodra een quote geaccepteerd is.',
      status:
        depositCaptureRate >= 0.8 ? 'done' : depositCaptureRate > 0.4 ? 'in-progress' : 'todo',
    },
    {
      id: 'handoff-playbook',
      title: 'Operations hand-off checklist verzonden',
      description:
        'Projectbriefing, warehouse taken en transport staan klaar in het secrets-dashboard.',
      status: totalBookings > 0 ? 'in-progress' : 'todo',
    },
    {
      id: 'crm-feedback-loop',
      title: 'Feedback naar CRM teruggekoppeld',
      description: 'Updates op dealstatus en opvolgtaken synchroniseren terug naar CRM.',
      status:
        summary?.leadFunnel.conversionRate && summary.leadFunnel.conversionRate >= 0.35
          ? 'done'
          : 'in-progress',
    },
  ]

  const showLoading = isLoading || financeLoading
  const resolvedError = error ?? resolvedFinanceError

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" data-testid="sales-handoff-playbook-root">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
            Sales enablement
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Sales → operations hand-off</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Borg dat elke gewonnen deal automatisch doorstroomt naar planning, finance en warehouse.
            Deze checklist toont de status van automatiseringen, deposit capture en terugkoppeling
            naar CRM.
          </p>
        </div>
        <div
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          data-testid="sales-handoff-summary"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bookings laatste 30 dagen
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalBookings}</p>
          <p className="text-xs text-slate-500">
            Automatisering actief: {activeAutomation.length} workflows
          </p>
        </div>
      </header>

      {showLoading ? (
        <div
          className="mt-10 flex min-h-[40vh] items-center justify-center"
          role="status"
          data-testid="sales-handoff-loading"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : resolvedError ? (
        <div
          className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
          data-testid="sales-handoff-error"
        >
          {resolvedError}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            data-testid="sales-handoff-checklist"
          >
            <h2 className="text-xl font-semibold text-slate-900">Checklist 100% sales ready</h2>
            <div className="mt-6 grid gap-4">
              {checklist.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-xl border px-4 py-4 text-sm shadow-sm ${statusColors[item.status]}`}
                  data-testid={`sales-handoff-item-${item.id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.status === 'done'
                        ? '✅ Gereed'
                        : item.status === 'in-progress'
                          ? '▶ In uitvoering'
                          : '⏱️ Nog te doen'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="grid gap-4">
            <section
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              data-testid="sales-handoff-metrics"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                Automatisering &amp; betalingen
              </h2>
              <dl className="mt-3 space-y-3 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Deposit capture rate
                  </dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {percent(depositCaptureRate)}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Forecast komende 30 dagen
                  </dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {currency.format(summary?.sales.forecastNext30Days ?? 0)}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Automation failure-rate
                  </dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {percent(summary?.headline.automationFailureRate ?? 0)}
                  </dd>
                </div>
              </dl>
            </section>

            <section
              className="rounded-2xl border border-slate-200 bg-indigo-600 p-5 text-white shadow-md"
              data-testid="sales-handoff-actions"
            >
              <h2 className="text-lg font-semibold">Volgende acties</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    className="underline decoration-white/60 decoration-2 underline-offset-4 hover:decoration-white"
                    href="/sales/crm-sync"
                  >
                    Controleer of nieuwe deals automatisch worden toegewezen
                  </a>
                </li>
                <li>
                  <a
                    className="underline decoration-white/60 decoration-2 underline-offset-4 hover:decoration-white"
                    href="/sales/offers"
                  >
                    Valideer dat pricing guardrails overeenkomen met finance
                  </a>
                </li>
                <li>
                  <a
                    className="underline decoration-white/60 decoration-2 underline-offset-4 hover:decoration-white"
                    href="/planner"
                  >
                    Open planner hand-off voor crew en transport
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
