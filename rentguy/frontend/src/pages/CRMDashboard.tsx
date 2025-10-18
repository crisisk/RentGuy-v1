import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp,
  faBolt,
  faChartLine,
  faClock,
  faEuroSign,
  faGauge,
  faLink,
  faPlayCircle,
  faSync,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

import { config } from '../config/env';
import { useCrmStore } from '../stores/crmStore';
import type { DashboardSummary } from '../types/crm';

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('nl-NL');

const formatPercent = (value: number | null | undefined, digits = 1) => {
  if (value === null || value === undefined) {
    return '–';
  }
  return `${(value * 100).toFixed(digits)}%`;
};

const formatCurrency = (value: number | null | undefined, fractionDigits = 0) => {
  if (value === null || value === undefined) {
    return '–';
  }
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '–';
  }
  return numberFormatter.format(value);
};

const formatMinutes = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '–';
  }
  return `${value.toFixed(1)} min`;
};

const formatDays = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '–';
  }
  return `${value.toFixed(1)} dagen`;
};

const formatDateTime = (isoDate: string | undefined) => {
  if (!isoDate) {
    return 'Onbekend';
  }
  try {
    return new Intl.DateTimeFormat('nl-NL', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(isoDate));
  } catch (error) {
    console.warn('Kon datum niet formatteren', error);
    return isoDate;
  }
};

const tenantOptions = config.analytics.tenants;

export const CRMDashboard: React.FC = () => {
  const [tenantId, setTenantId] = useState<string>(config.analytics.defaultTenant);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const fetchDashboard = useCrmStore((state) => state.fetchDashboard);
  const invalidateTenant = useCrmStore((state) => state.invalidateTenant);
  const isLoading = useCrmStore((state) => state.isLoading);
  const storeError = useCrmStore((state) => state.error);

  const loadDashboard = useCallback(
    async (selectedTenant: string, options?: { force?: boolean }) => {
      try {
        const data = await fetchDashboard(selectedTenant, options);
        setSummary(data);
        setLocalError(null);
      } catch (error) {
        console.error('Kon dashboardgegevens niet laden', error);
        setLocalError('Kon CRM-dashboardgegevens niet laden. Probeer het opnieuw.');
      }
    },
    [fetchDashboard],
  );

  useEffect(() => {
    let cancelled = false;
    loadDashboard(tenantId).catch((error) => {
      if (!cancelled) {
        console.error('Initiële dashboardload mislukt', error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId, loadDashboard]);

  const headlineItems = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      {
        label: 'Totale pipeline waarde',
        value: currencyFormatter.format(summary.headline.total_pipeline_value),
        icon: faEuroSign,
        accent: 'bg-rentguy-primary',
      },
      {
        label: 'Gewogen pipeline',
        value: currencyFormatter.format(summary.headline.weighted_pipeline_value),
        icon: faChartLine,
        accent: 'bg-rentguy-secondary',
      },
      {
        label: 'Gewonnen (30 dagen)',
        value: currencyFormatter.format(summary.headline.won_value_last_30_days),
        icon: faArrowTrendUp,
        accent: 'bg-rentguy-success',
      },
      {
        label: 'Gem. dealcyclus',
        value: formatDays(summary.headline.avg_deal_cycle_days),
        icon: faClock,
        accent: 'bg-rentguy-surface',
      },
      {
        label: 'Automation failure rate',
        value: formatPercent(summary.headline.automation_failure_rate, 2),
        icon: faBolt,
        accent: 'bg-destructive/80',
      },
      {
        label: 'Actieve workflows',
        value: formatNumber(summary.headline.active_workflows),
        icon: faPlayCircle,
        accent: 'bg-rentguy-warning',
      },
    ];
  }, [summary]);

  const funnelProgress = useMemo(() => {
    if (!summary) {
      return [];
    }
    const { lead_funnel } = summary;
    return [
      {
        label: 'Leads totaal',
        value: lead_funnel.total_leads,
        percentage: 100,
      },
      {
        label: 'Leads laatste 30 dagen',
        value: lead_funnel.leads_last_30_days,
        percentage: lead_funnel.total_leads
          ? Math.round((lead_funnel.leads_last_30_days / lead_funnel.total_leads) * 100)
          : 0,
      },
      {
        label: 'Leads met deal',
        value: lead_funnel.leads_with_deals,
        percentage: lead_funnel.total_leads
          ? Math.round((lead_funnel.leads_with_deals / lead_funnel.total_leads) * 100)
          : 0,
      },
    ];
  }, [summary]);

  const acquisitionCards = useMemo(() => {
    if (!summary) {
      return [];
    }
    const { acquisition } = summary;
    return [
      {
        label: 'GA4 sessies',
        value: formatNumber(acquisition.ga_sessions),
      },
      {
        label: 'Nieuwe gebruikers',
        value: formatNumber(acquisition.ga_new_users),
      },
      {
        label: 'Conversies (GA4)',
        value: formatNumber(acquisition.ga_conversions),
      },
      {
        label: 'Conversiewaarde (GA4)',
        value: formatCurrency(acquisition.ga_conversion_value, 0),
      },
      {
        label: 'GTM conversies',
        value: formatNumber(acquisition.gtm_conversions),
      },
      {
        label: 'GTM omzet',
        value: formatCurrency(acquisition.gtm_conversion_value, 0),
      },
      {
        label: 'Blended conversion rate',
        value: formatPercent(acquisition.blended_conversion_rate, 2),
      },
      {
        label: 'Actieve connectors',
        value: acquisition.active_connectors.join(', '),
      },
    ];
  }, [summary]);

  const errorMessage = localError || storeError;

  const handleTenantSwitch = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newTenant = event.target.value;
      setTenantId(newTenant);
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    invalidateTenant(tenantId);
    loadDashboard(tenantId, { force: true }).catch((error) => {
      console.error('Refresh van dashboard mislukt', error);
    });
  }, [invalidateTenant, loadDashboard, tenantId]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-rentguy text-3xl">CRM KPI Dashboard</h1>
            {summary && (
              <p className="text-sm text-foreground/70">
                Laatste update: {formatDateTime(summary.generated_at)}
              </p>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              <FontAwesomeIcon icon={faUsers} className="text-rentguy-primary" />
              <span>Tenant</span>
              <select
                className="card-rentguy border border-border bg-background px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={tenantId}
                onChange={handleTenantSwitch}
              >
                {tenantOptions.map((tenant) => (
                  <option key={tenant} value={tenant}>
                    {tenant === 'mrdj' ? 'Mr. DJ' : tenant}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-rentguy-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rentguy-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentguy-primary"
            >
              <FontAwesomeIcon icon={faSync} spin={isLoading} />
              <span>Vernieuwen</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="card-rentguy border border-destructive/60 bg-destructive/10 p-4 text-destructive">
            {errorMessage}
          </div>
        )}

        {isLoading && !summary ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="mr-dj-spinner" aria-label="Dashboard wordt geladen" />
          </div>
        ) : null}

        {summary && (
          <>
            <section aria-label="Headline KPI's" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {headlineItems.map((item) => (
                <div key={item.label} className="card-rentguy p-6 flex items-start justify-between">
                  <div>
                    <p className="text-sm text-foreground/70">{item.label}</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">{item.value}</p>
                  </div>
                  <div className={`${item.accent} text-white p-3 rounded-full`}> 
                    <FontAwesomeIcon icon={item.icon} className="text-xl" />
                  </div>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Lead funnel en sales prestaties">
              <div className="card-rentguy p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Lead funnel</h2>
                  <div className="text-sm text-foreground/60">Conversie: {formatPercent(summary.lead_funnel.conversion_rate, 1)}</div>
                </div>
                <div className="space-y-4">
                  {funnelProgress.map((step) => (
                    <div key={step.label}>
                      <div className="flex justify-between text-sm text-foreground/80">
                        <span>{step.label}</span>
                        <span>{formatNumber(step.value)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-rentguy-primary transition-all"
                          style={{ width: `${Math.min(step.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-rentguy p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Sales velocity</h2>
                  <FontAwesomeIcon icon={faGauge} className="text-rentguy-secondary" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-foreground/70">Open deals</p>
                    <p className="text-xl font-semibold">{formatNumber(summary.sales.open_deals)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/70">Gewonnen (30 dagen)</p>
                    <p className="text-xl font-semibold">{formatNumber(summary.sales.won_deals_last_30_days)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/70">Verloren (30 dagen)</p>
                    <p className="text-xl font-semibold">{formatNumber(summary.sales.lost_deals_last_30_days)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/70">Winrate</p>
                    <p className="text-xl font-semibold">{formatPercent(summary.sales.win_rate, 1)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/70">Gem. dealwaarde</p>
                    <p className="text-xl font-semibold">{formatCurrency(summary.sales.avg_deal_value ?? null, 0)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/70">Pipeline velocity</p>
                    <p className="text-xl font-semibold">{formatCurrency(summary.sales.pipeline_velocity_per_day, 0)}/dag</p>
                  </div>
                </div>
                <div className="border-t border-border pt-4 text-sm text-foreground/80">
                  <span className="font-medium">Forecast 30 dagen:</span> {formatCurrency(summary.sales.forecast_next_30_days, 0)}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6" aria-label="Pipeline en automation">
              <div className="card-rentguy p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Pipeline stages</h2>
                  <FontAwesomeIcon icon={faChartLine} className="text-rentguy-primary" />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-foreground/70">
                        <th className="py-2 pr-4 font-medium">Stage</th>
                        <th className="py-2 pr-4 font-medium">Deals</th>
                        <th className="py-2 pr-4 font-medium">Totale waarde</th>
                        <th className="py-2 pr-4 font-medium">Gewogen</th>
                        <th className="py-2 pr-4 font-medium">Gem. leeftijd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.pipeline.map((stage) => (
                        <tr key={stage.stage_id} className="border-t border-border/60">
                          <td className="py-2 pr-4 text-foreground">{stage.stage_name}</td>
                          <td className="py-2 pr-4">{formatNumber(stage.deal_count)}</td>
                          <td className="py-2 pr-4">{currencyFormatter.format(stage.total_value)}</td>
                          <td className="py-2 pr-4">{currencyFormatter.format(stage.weighted_value)}</td>
                          <td className="py-2 pr-4">{formatDays(stage.avg_age_days ?? null)}</td>
                        </tr>
                      ))}
                      {summary.pipeline.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-foreground/70">
                            Geen pipeline gegevens beschikbaar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card-rentguy p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Automation health</h2>
                  <FontAwesomeIcon icon={faBolt} className="text-destructive" />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-foreground/70">
                        <th className="py-2 pr-4 font-medium">Workflow</th>
                        <th className="py-2 pr-4 font-medium">Runs</th>
                        <th className="py-2 pr-4 font-medium">Failure rate</th>
                        <th className="py-2 pr-4 font-medium">SLA breaches</th>
                        <th className="py-2 pr-4 font-medium">Gem. duur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.automation.map((workflow) => (
                        <tr key={workflow.workflow_id} className="border-t border-border/60">
                          <td className="py-2 pr-4 text-foreground font-medium">{workflow.workflow_id}</td>
                          <td className="py-2 pr-4">{formatNumber(workflow.run_count)}</td>
                          <td className="py-2 pr-4">{formatPercent(workflow.failure_rate, 2)}</td>
                          <td className="py-2 pr-4">{formatNumber(workflow.sla_breaches)}</td>
                          <td className="py-2 pr-4">{formatMinutes(workflow.avg_completion_minutes)}</td>
                        </tr>
                      ))}
                      {summary.automation.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-foreground/70">
                            Geen automationruns geregistreerd.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6" aria-label="Marketing en acquisitie">
              <div className="card-rentguy p-6 xl:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Marketing acquisitie</h2>
                  <FontAwesomeIcon icon={faLink} className="text-rentguy-secondary" />
                </div>
                <p className="text-sm text-foreground/70 mb-4">
                  Lookback {summary.acquisition.lookback_days} dagen – geïntegreerde GA4 en GTM metrics voor {tenantId}.
                </p>
                <dl className="grid grid-cols-1 gap-3">
                  {acquisitionCards.map((card) => (
                    <div key={card.label} className="border border-border/60 rounded-lg px-3 py-2">
                      <dt className="text-xs uppercase tracking-wide text-foreground/60">{card.label}</dt>
                      <dd className="text-lg font-semibold text-foreground">{card.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="card-rentguy p-6 xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Bron performance</h2>
                  <FontAwesomeIcon icon={faArrowTrendUp} className="text-rentguy-success" />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-foreground/70">
                        <th className="py-2 pr-4 font-medium">Bron</th>
                        <th className="py-2 pr-4 font-medium">Leads</th>
                        <th className="py-2 pr-4 font-medium">Deals</th>
                        <th className="py-2 pr-4 font-medium">Gewonnen</th>
                        <th className="py-2 pr-4 font-medium">Pipeline waarde</th>
                        <th className="py-2 pr-4 font-medium">Gewonnen waarde</th>
                        <th className="py-2 pr-4 font-medium">GA sessies</th>
                        <th className="py-2 pr-4 font-medium">GA conversies</th>
                        <th className="py-2 pr-4 font-medium">GTM conversies</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.source_performance.map((row) => (
                        <tr key={row.key} className="border-t border-border/60">
                          <td className="py-2 pr-4 text-foreground font-medium">{row.label}</td>
                          <td className="py-2 pr-4">{formatNumber(row.lead_count)}</td>
                          <td className="py-2 pr-4">{formatNumber(row.deal_count)}</td>
                          <td className="py-2 pr-4">{formatNumber(row.won_deal_count)}</td>
                          <td className="py-2 pr-4">{currencyFormatter.format(row.pipeline_value)}</td>
                          <td className="py-2 pr-4">{currencyFormatter.format(row.won_value)}</td>
                          <td className="py-2 pr-4">{formatNumber(row.ga_sessions)}</td>
                          <td className="py-2 pr-4">{formatNumber(row.ga_conversions)}</td>
                          <td className="py-2 pr-4">{formatNumber(row.gtm_conversions)}</td>
                        </tr>
                      ))}
                      {summary.source_performance.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-4 text-center text-foreground/70">
                            Nog geen brongegevens beschikbaar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default CRMDashboard;
