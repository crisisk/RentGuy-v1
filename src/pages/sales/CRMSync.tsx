import { useEffect, useMemo } from 'react'
import crmStore from '../../stores/crmStore'

const currency = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const number = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })

const formatCurrency = (value?: number | null) => currency.format(Math.max(0, value ?? 0))
const formatCount = (value?: number | null) => number.format(Math.max(0, Math.trunc(value ?? 0)))

const resolveLastSync = (timestamp?: string | null) => {
  if (!timestamp) return 'Nooit'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'Onbekend'
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const connectorDescriptions: Record<string, string> = {
  hubspot: 'HubSpot (API v3)',
  pipedrive: 'Pipedrive (API token)',
  salesforce: 'Salesforce (Bulk API)',
  dynamics: 'Microsoft Dynamics 365',
}

const connectorHints: Record<string, string> = {
  hubspot: 'Velden gematcht via HubSpot pipeline mapping',
  pipedrive: 'Offertewaarde gesynchroniseerd elke 30 minuten',
  salesforce: 'Sync gebruikt nightly incremental loads',
  dynamics: 'Sync draait op 02:30 CET via Azure Function',
}

const CRMConnectorBadges = ({ connectors }: { connectors: string[] }) => {
  if (!connectors.length) {
    return (
      <div
        className="rounded-md border border-dashed border-indigo-200 bg-indigo-50 p-4 text-indigo-700"
        data-testid="sales-crm-sync-no-connectors"
      >
        <p className="text-sm font-medium">Nog geen CRM-koppeling actief</p>
        <p className="mt-1 text-xs">
          Start de wizard hieronder om je bronsysteem te koppelen en pipeline data te
          synchroniseren.
        </p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="sales-crm-sync-connectors">
      {connectors.map((key) => (
        <li
          key={key}
          className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          data-testid={`sales-crm-sync-connector-${key}`}
        >
          <span className="text-sm font-semibold text-gray-900">
            {connectorDescriptions[key] ?? key}
          </span>
          <span className="mt-1 text-xs text-gray-500">
            {connectorHints[key] ?? 'Realtime sync geactiveerd'}
          </span>
        </li>
      ))}
    </ul>
  )
}

const CRMSync = () => {
  const summary = crmStore((state) => state.dashboard)
  const loading = crmStore((state) => state.loading)
  const error = crmStore((state) => state.error)
  const fetchSummary = crmStore((state) => state.fetchDashboardSummary)

  useEffect(() => {
    if (!summary) {
      void fetchSummary({ lookbackDays: 90 }).catch(() => undefined)
    }
  }, [fetchSummary, summary])

  const connectors = summary?.acquisition.activeConnectors ?? []
  const pipeline = summary?.pipeline ?? []
  const headline = summary?.headline
  const lastRefresh = resolveLastSync(summary?.provenance.lastRefreshedAt ?? summary?.generatedAt)

  const totalDeals = useMemo(() => {
    if (!pipeline.length) return 0
    return pipeline.reduce((total, stage) => total + (stage.dealCount ?? 0), 0)
  }, [pipeline])

  const weightedValue = headline?.weightedPipelineValue ?? 0
  const totalValue = headline?.totalPipelineValue ?? 0

  const pipelineReadiness = pipeline.length > 0 && totalDeals > 0

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6" data-testid="sales-crm-sync-root">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-100">Sales readiness</p>
            <h1 className="text-3xl font-semibold" data-testid="sales-crm-sync-title">
              CRM synchronisatie en pipeline mapping
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-indigo-100">
              Koppel je bronsysteem, valideer veldmapping en zorg dat sales dezelfde pipeline ziet
              als operations. Zodra alle stappen groen zijn ben je 100% sales ready.
            </p>
          </div>
          <div className="flex flex-col items-start rounded-2xl bg-white/15 px-4 py-3 text-sm md:items-end">
            <span className="font-semibold">Laatste synchronisatie</span>
            <span className="text-indigo-100" data-testid="sales-crm-sync-last-refresh">
              {lastRefresh}
            </span>
            <span className="mt-2 inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
              {pipelineReadiness ? 'Pipeline actief' : 'Wacht op eerste dataset'}
            </span>
          </div>
        </div>
      </header>

      {error && !loading ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          role="alert"
          data-testid="sales-crm-sync-error"
        >
          {error}
        </div>
      ) : null}

      <section
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
        data-testid="sales-crm-sync-metrics"
      >
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Totale pipelinewaarde</h2>
          <p
            className="mt-3 text-3xl font-semibold text-gray-900"
            data-testid="sales-crm-sync-total-value"
          >
            {formatCurrency(totalValue)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Gewogen: {formatCurrency(weightedValue)}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Actieve deals</h2>
          <p
            className="mt-3 text-3xl font-semibold text-gray-900"
            data-testid="sales-crm-sync-deals"
          >
            {formatCount(totalDeals)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Stages met data: {formatCount(pipeline.length)}
          </p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Automatiseringen actief</h2>
          <p
            className="mt-3 text-3xl font-semibold text-gray-900"
            data-testid="sales-crm-sync-automations"
          >
            {formatCount(summary?.headline.activeWorkflows)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Foutpercentage: {(summary?.headline.automationFailureRate ?? 0).toFixed(1)}%
          </p>
        </article>
      </section>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        data-testid="sales-crm-sync-connectors-section"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Actieve connectors</h2>
            <p className="text-sm text-gray-600">Controleer welke CRM-bronnen data aanleveren.</p>
          </div>
          <a
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            href="/sales/crm-sync"
            data-testid="sales-crm-sync-open-wizard"
          >
            Open import wizard
          </a>
        </div>

        <div className="mt-4">
          <CRMConnectorBadges connectors={connectors} />
        </div>
      </section>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        data-testid="sales-crm-sync-field-mapping"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Veldmapping & datakwaliteit</h2>
            <p className="text-sm text-gray-600">
              Verifieer dat alle verplichte velden gevuld worden in RentGuy.
            </p>
          </div>
          <span
            className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
            data-testid="sales-crm-sync-field-mapping-status"
          >
            {pipelineReadiness ? 'Mapping volledig' : 'Mapping vereist'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article
            className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            data-testid="sales-crm-sync-required-fields"
          >
            <h3 className="text-sm font-semibold text-gray-700">Verplichte velden</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• Dealwaarde, probabiliteit en expected close datum</li>
              <li>• Accountnaam gekoppeld aan projecttemplate</li>
              <li>• Pipeline fase + stage order</li>
            </ul>
          </article>
          <article
            className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            data-testid="sales-crm-sync-validation"
          >
            <h3 className="text-sm font-semibold text-gray-700">Validaties</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• Dubbele deals gededupliceerd op e-mail + stage</li>
              <li>• Onvolledige records gemarkeerd in importlog</li>
              <li>• Sync rapport verstuurd naar sales@rentguy.nl</li>
            </ul>
          </article>
        </div>
      </section>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        data-testid="sales-crm-sync-next-steps"
      >
        <h2 className="text-lg font-semibold text-gray-900">Volgende stappen</h2>
        <ol className="mt-4 space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-3" data-testid="sales-crm-sync-step-import">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              1
            </span>
            <span>
              Importeer minimaal 3 pipeline fases en check de mapping preview. Hiermee activeer je
              de sales readiness badge in het dashboard.
            </span>
          </li>
          <li className="flex items-start gap-3" data-testid="sales-crm-sync-step-validate">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              2
            </span>
            <span>
              Valideer velden met operations: template, crewbehoefte en budget worden automatisch
              ingevuld zodra deals gewonnen zijn.
            </span>
          </li>
          <li className="flex items-start gap-3" data-testid="sales-crm-sync-step-announce">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              3
            </span>
            <span>
              Communiceer naar het salesteam dat de pipeline widget live staat in het demo-dashboard
              en plan een korte enablement call.
            </span>
          </li>
        </ol>
      </section>
    </div>
  )
}

export default CRMSync
