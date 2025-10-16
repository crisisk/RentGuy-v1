import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import * as crmApi from '../../api/crm';
import { useCrmStore } from '../crmStore';
import type { Activity, Deal, Lead } from '../../types/crm';

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
});
