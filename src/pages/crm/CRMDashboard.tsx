import React, { useEffect, useState } from 'react'
import crmStore, {
  type CRMDashboardSummary,
  type CRMCustomerStats,
  type CRMRecentActivity,
  type CRMPipelineStageKPI,
  type CRMSalesKPIs,
} from '../../stores/crmStore'

const numberFormatter = new Intl.NumberFormat('nl-NL')
const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

function formatRelativeTime(timestampMs: number): string {
  const now = Date.now()
  const diff = Math.max(0, now - timestampMs)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'zojuist'
  if (minutes < 60) return `${minutes} min geleden`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} uur geleden`
  const days = Math.floor(hours / 24)
  return `${days} dag${days > 1 ? 'en' : ''} geleden`
}

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—'
  }
  return currencyFormatter.format(value)
}

function formatNumber(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0'
  }
  return numberFormatter.format(value)
}

function formatPercent(value: number | null | undefined, fractionDigits = 1): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—'
  }
  return `${(value * 100).toFixed(fractionDigits)}%`
}

function activityLabel(type: CRMRecentActivity['type']): string {
  if (type === 'support') return 'Support'
  if (type === 'signup') return 'Signup'
  return 'Sales'
}

const CRMDashboard: React.FC = () => {
  const [customerStats, setCustomerStats] = useState<CRMCustomerStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<CRMRecentActivity[]>([])
  const [dashboardSummary, setDashboardSummary] = useState<CRMDashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const [stats, activities, summary] = await Promise.all([
          crmStore.getCustomerStats(),
          crmStore.getRecentActivities(),
          crmStore.getDashboardSummary(),
        ])
        if (cancelled) return
        setCustomerStats(stats)
        setRecentActivities(activities)
        setDashboardSummary(summary)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      cancelled = true
    }
  }, [])

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

  const stats: CRMCustomerStats = customerStats ?? {
    total: 0,
    newThisMonth: 0,
    activeCustomers: 0,
  }

  const pipeline: CRMPipelineStageKPI[] = dashboardSummary?.pipeline ?? []
  const sales: CRMSalesKPIs | null = dashboardSummary?.sales ?? null

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8" data-testid="crm-dashboard-root">
      <header>
        <h1 className="text-3xl font-bold mb-2" data-testid="crm-dashboard-title">
          CRM Dashboard
        </h1>
        <p className="text-gray-600">
          Overzicht van pipeline, salesprestaties en de laatste klantactiviteiten.
        </p>
      </header>

      <section
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        data-testid="crm-dashboard-stats-grid"
      >
        <article className="bg-white shadow rounded-lg p-4" data-testid="crm-dashboard-card-total">
          <h2 className="text-sm text-gray-500">Totaal klanten</h2>
          <p className="text-3xl font-bold text-blue-600">{formatNumber(stats.total)}</p>
        </article>
        <article className="bg-white shadow rounded-lg p-4" data-testid="crm-dashboard-card-new">
          <h2 className="text-sm text-gray-500">Nieuwe deze maand</h2>
          <p className="text-3xl font-bold text-green-600">{formatNumber(stats.newThisMonth)}</p>
        </article>
        <article className="bg-white shadow rounded-lg p-4" data-testid="crm-dashboard-card-active">
          <h2 className="text-sm text-gray-500">Actieve klanten</h2>
          <p className="text-3xl font-bold text-purple-600">
            {formatNumber(stats.activeCustomers)}
          </p>
        </article>
      </section>

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

      {sales && (
        <section
          className="bg-white shadow rounded-lg p-4 md:p-6"
          data-testid="crm-dashboard-sales-section"
          aria-labelledby="crm-dashboard-sales-title"
        >
          <h2 id="crm-dashboard-sales-title" className="text-lg font-semibold mb-4">
            Sales prestaties
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <article
              className="border border-gray-200 rounded-lg p-4"
              data-testid="crm-dashboard-sales-open-deals"
            >
              <h3 className="text-sm text-gray-500">Open deals</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(sales.openDeals)}
              </p>
            </article>
            <article
              className="border border-gray-200 rounded-lg p-4"
              data-testid="crm-dashboard-sales-win-rate"
            >
              <h3 className="text-sm text-gray-500">Win-rate</h3>
              <p className="text-2xl font-semibold text-gray-900">{formatPercent(sales.winRate)}</p>
            </article>
            <article
              className="border border-gray-200 rounded-lg p-4"
              data-testid="crm-dashboard-sales-avg-value"
            >
              <h3 className="text-sm text-gray-500">Gem. dealwaarde</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(sales.avgDealValue)}
              </p>
            </article>
            <article
              className="border border-gray-200 rounded-lg p-4"
              data-testid="crm-dashboard-sales-forecast"
            >
              <h3 className="text-sm text-gray-500">Forecast 30 dagen</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(sales.forecastNext30Days)}
              </p>
            </article>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
            <p data-testid="crm-dashboard-sales-bookings">
              <span className="font-medium text-gray-900">
                {formatNumber(sales.bookingsLast30Days)}
              </span>{' '}
              boekingen afgelopen 30 dagen
            </p>
            <p data-testid="crm-dashboard-sales-total">
              <span className="font-medium text-gray-900">{formatNumber(sales.totalDeals)}</span>{' '}
              deals in totaal
            </p>
            <p data-testid="crm-dashboard-sales-velocity">
              Pipeline snelheid:{' '}
              <span className="font-medium text-gray-900">
                {formatCurrency(sales.pipelineVelocityPerDay)} / dag
              </span>
            </p>
          </div>
        </section>
      )}

      <section
        className="bg-white shadow rounded-lg p-4"
        data-testid="crm-dashboard-activities-card"
      >
        <h2 className="text-lg font-semibold mb-4" data-testid="crm-dashboard-activities-title">
          Recente activiteiten
        </h2>
        {recentActivities.length === 0 ? (
          <p className="text-gray-500" data-testid="crm-dashboard-activities-empty">
            Nog geen activiteiten geregistreerd. Log een call, meeting of follow-up om deze tijdlijn
            te vullen.
          </p>
        ) : (
          <table className="w-full text-left" data-testid="crm-dashboard-activities-table">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Type</th>
                <th className="p-2">Klant</th>
                <th className="p-2">Wanneer</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity) => (
                <tr
                  key={activity.id}
                  className="border-b"
                  data-testid={`crm-dashboard-activity-${activity.id}`}
                >
                  <td className="p-2 capitalize">{activityLabel(activity.type)}</td>
                  <td className="p-2">{activity.customerName}</td>
                  <td className="p-2">{formatRelativeTime(activity.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default CRMDashboard
