import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import * as crmApi from '../../api/crm';
import { useCrmStore } from '../crmStore';
import type { Activity, DashboardSummary, Deal, Lead } from '../../types/crm';

vi.mock('../../api/crm');

const mockedApi = vi.mocked(crmApi);

const tenantId = 'mrdj';

const sampleLead: Lead = {
  id: 1,
  name: 'Bart',
  status: 'new',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const sampleDeal: Deal = {
  id: 1,
  title: 'Wedding Package',
  pipeline_id: 1,
  stage_id: 1,
  lead_id: 1,
  value: 2500,
  currency: 'EUR',
  expected_close: null,
  probability: 30,
  status: 'open',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  stage: {
    id: 1,
    name: 'Intake',
    order: 1,
    automation_flow: 'lead_intake',
  },
};

const sampleActivity: Activity = {
  id: 1,
  activity_type: 'call',
  summary: 'Introductiegesprek',
  payload: null,
  occurred_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const sampleDashboard: DashboardSummary = {
  generated_at: new Date().toISOString(),
  headline: {
    total_pipeline_value: 125000,
    weighted_pipeline_value: 64000,
    won_value_last_30_days: 32000,
    avg_deal_cycle_days: 18.5,
    automation_failure_rate: 0.01,
    active_workflows: 3,
  },
  lead_funnel: {
    total_leads: 240,
    leads_last_30_days: 32,
    leads_with_deals: 78,
    conversion_rate: 0.325,
  },
  pipeline: [
    {
      stage_id: 1,
      stage_name: 'Intake',
      deal_count: 12,
      total_value: 22000,
      weighted_value: 9500,
      avg_age_days: 3.2,
    },
  ],
  automation: [
    {
      workflow_id: 'lead_intake',
      run_count: 54,
      failed_runs: 1,
      avg_completion_minutes: 4.5,
      sla_breaches: 0,
      failure_rate: 0.018,
    },
  ],
  sales: {
    open_deals: 32,
    won_deals_last_30_days: 6,
    lost_deals_last_30_days: 3,
    total_deals: 120,
    bookings_last_30_days: 4,
    win_rate: 0.42,
    avg_deal_value: 5200,
    forecast_next_30_days: 18500,
    pipeline_velocity_per_day: 2100,
  },
  acquisition: {
    lookback_days: 30,
    ga_sessions: 4200,
    ga_new_users: 1800,
    ga_engaged_sessions: 3900,
    ga_conversions: 96,
    ga_conversion_value: 28500,
    gtm_conversions: 54,
    gtm_conversion_value: 18300,
    blended_conversion_rate: 0.032,
    active_connectors: ['ga4', 'gtm'],
  },
  source_performance: [
    {
      key: 'google_ads',
      label: 'Google Ads',
      dimension_type: 'channel',
      lead_count: 54,
      deal_count: 24,
      won_deal_count: 12,
      pipeline_value: 42000,
      won_value: 21000,
      ga_sessions: 1800,
      ga_conversions: 36,
      gtm_conversions: 18,
      ga_revenue: 12000,
      gtm_revenue: 6000,
    },
  ],
  provenance: {
    source: 'mock',
    upstream_systems: ['crm', 'ga4', 'gtm'],
    last_refreshed_at: new Date().toISOString(),
  },
};

beforeEach(() => {
  useCrmStore.setState((state) => {
    state.leads = {};
    state.deals = {};
    state.activities = {};
    state.isLoading = false;
    state.error = null;
  });

  mockedApi.listLeads.mockResolvedValue([sampleLead]);
  mockedApi.listDeals.mockResolvedValue([sampleDeal]);
  mockedApi.listActivities.mockResolvedValue([sampleActivity]);
  mockedApi.createLead.mockResolvedValue(sampleLead);
  mockedApi.createDeal.mockResolvedValue(sampleDeal);
  mockedApi.advanceDealStage.mockResolvedValue({
    ...sampleDeal,
    stage_id: 2,
    stage: { ...sampleDeal.stage, id: 2, name: 'Proposal' },
  });
  mockedApi.logActivity.mockResolvedValue(sampleActivity);
  mockedApi.getDashboardSummary.mockResolvedValue(sampleDashboard);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useCrmStore caching', () => {
  test('reuses cached leads until TTL expires', async () => {
    const store = useCrmStore.getState();

    const firstCall = await store.fetchLeads(tenantId);
    expect(firstCall).toHaveLength(1);
    expect(mockedApi.listLeads).toHaveBeenCalledTimes(1);

    const secondCall = await store.fetchLeads(tenantId);
    expect(secondCall).toHaveLength(1);
    expect(mockedApi.listLeads).toHaveBeenCalledTimes(1);

    // Force TTL expiry
    useCrmStore.setState((state) => {
      const cached = state.leads[tenantId];
      if (cached) {
        cached.fetchedAt = Date.now() - 3 * 60 * 1000;
      }
    });

    const thirdCall = await store.fetchLeads(tenantId);
    expect(thirdCall).toHaveLength(1);
    expect(mockedApi.listLeads).toHaveBeenCalledTimes(2);
  });

  test('createLead prepends lead into cache', async () => {
    const store = useCrmStore.getState();
    await store.fetchLeads(tenantId);
    await store.createLead(tenantId, { name: 'New Lead' });
    const cachedLeads = useCrmStore.getState().leads[tenantId];
    expect(cachedLeads?.data[0]).toEqual(sampleLead);
    expect(mockedApi.createLead).toHaveBeenCalledWith(tenantId, { name: 'New Lead' });
  });

  test('invalidateTenant clears caches', async () => {
    const store = useCrmStore.getState();
    await store.fetchLeads(tenantId);
    store.invalidateTenant(tenantId);
    expect(useCrmStore.getState().leads[tenantId]).toBeUndefined();
  });

  test('fetchDashboard caches per tenant and reuses until TTL expires', async () => {
    const store = useCrmStore.getState();
    const first = await store.fetchDashboard(tenantId);
    expect(first).toEqual(sampleDashboard);
    expect(mockedApi.getDashboardSummary).toHaveBeenCalledTimes(1);

    const second = await store.fetchDashboard(tenantId);
    expect(second).toEqual(sampleDashboard);
    expect(mockedApi.getDashboardSummary).toHaveBeenCalledTimes(1);

    useCrmStore.setState((state) => {
      const cached = state.analytics[tenantId];
      if (cached) {
        cached.fetchedAt = Date.now() - 5 * 60 * 1000;
      }
    });

    const third = await store.fetchDashboard(tenantId);
    expect(third).toEqual(sampleDashboard);
    expect(mockedApi.getDashboardSummary).toHaveBeenCalledTimes(2);
  });
});
