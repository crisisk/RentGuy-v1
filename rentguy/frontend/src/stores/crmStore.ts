import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type {
  Activity,
  ActivityPayload,
  DashboardSummary,
  Deal,
  DealPayload,
  Lead,
  LeadPayload,
} from '../types/crm';
import * as crmApi from '../api/crm';

const TENANT_CACHE_TTL = 2 * 60 * 1000; // 2 minuten

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

type ActivityCache = Record<number, CacheEntry<Activity[]>>;

type TenantCache<T> = Record<string, CacheEntry<T>>;

interface CrmState {
  leads: TenantCache<Lead[]>;
  deals: TenantCache<Deal[]>;
  activities: Record<string, ActivityCache>;
  analytics: TenantCache<DashboardSummary>;
  isLoading: boolean;
  error: string | null;
  fetchLeads: (tenantId: string, options?: { force?: boolean }) => Promise<Lead[]>;
  fetchDeals: (tenantId: string, options?: { force?: boolean }) => Promise<Deal[]>;
  fetchActivities: (
    tenantId: string,
    dealId: number,
    options?: { force?: boolean },
  ) => Promise<Activity[]>;
  fetchDashboard: (tenantId: string, options?: { force?: boolean }) => Promise<DashboardSummary>;
  createLead: (tenantId: string, payload: LeadPayload) => Promise<Lead>;
  createDeal: (tenantId: string, payload: DealPayload) => Promise<Deal>;
  logActivity: (tenantId: string, payload: ActivityPayload) => Promise<Activity>;
  advanceDealStage: (
    tenantId: string,
    dealId: number,
    stageId: number,
  ) => Promise<Deal>;
  invalidateTenant: (tenantId: string) => void;
}

const isExpired = (entry: CacheEntry<unknown> | undefined) => {
  if (!entry) {
    return true;
  }
  return Date.now() - entry.fetchedAt > TENANT_CACHE_TTL;
};

export const useCrmStore = create<CrmState>()(
  immer((set, get) => ({
    leads: {},
    deals: {},
    activities: {},
    analytics: {},
    isLoading: false,
    error: null,

    async fetchLeads(tenantId, options) {
      const { leads } = get();
      const cached = leads[tenantId];
      const force = options?.force ?? false;
      if (!force && cached && !isExpired(cached)) {
        return cached.data;
      }
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const data = await crmApi.listLeads(tenantId);
        set((state) => {
          state.leads[tenantId] = { data, fetchedAt: Date.now() };
          state.isLoading = false;
        });
        return data;
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.error = (error as Error).message;
        });
        throw error;
      }
    },

    async fetchDeals(tenantId, options) {
      const { deals } = get();
      const cached = deals[tenantId];
      const force = options?.force ?? false;
      if (!force && cached && !isExpired(cached)) {
        return cached.data;
      }
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const data = await crmApi.listDeals(tenantId);
        set((state) => {
          state.deals[tenantId] = { data, fetchedAt: Date.now() };
          state.isLoading = false;
        });
        return data;
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.error = (error as Error).message;
        });
        throw error;
      }
    },

    async fetchActivities(tenantId, dealId, options) {
      const tenantActivities = get().activities[tenantId];
      const cached = tenantActivities?.[dealId];
      const force = options?.force ?? false;
      if (!force && cached && !isExpired(cached)) {
        return cached.data;
      }
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const data = await crmApi.listActivities(tenantId, dealId);
        set((state) => {
          const map = state.activities[tenantId] ?? {};
          map[dealId] = { data, fetchedAt: Date.now() };
          state.activities[tenantId] = map;
          state.isLoading = false;
        });
        return data;
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.error = (error as Error).message;
        });
        throw error;
      }
    },

    async fetchDashboard(tenantId, options) {
      const { analytics } = get();
      const cached = analytics[tenantId];
      const force = options?.force ?? false;
      if (!force && cached && !isExpired(cached)) {
        return cached.data;
      }
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const data = await crmApi.getDashboardSummary(tenantId);
        set((state) => {
          state.analytics[tenantId] = { data, fetchedAt: Date.now() };
          state.isLoading = false;
        });
        return data;
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.error = (error as Error).message;
        });
        throw error;
      }
    },

    async createLead(tenantId, payload) {
      const lead = await crmApi.createLead(tenantId, payload);
      set((state) => {
        const existing = state.leads[tenantId];
        if (existing) {
          existing.data = [lead, ...existing.data];
          existing.fetchedAt = Date.now();
        } else {
          state.leads[tenantId] = { data: [lead], fetchedAt: Date.now() };
        }
      });
      return lead;
    },

    async createDeal(tenantId, payload) {
      const deal = await crmApi.createDeal(tenantId, payload);
      set((state) => {
        const existing = state.deals[tenantId];
        if (existing) {
          existing.data = [deal, ...existing.data];
          existing.fetchedAt = Date.now();
        } else {
          state.deals[tenantId] = { data: [deal], fetchedAt: Date.now() };
        }
      });
      return deal;
    },

    async logActivity(tenantId, payload) {
      const activity = await crmApi.logActivity(tenantId, payload);
      set((state) => {
        const tenantActivities = state.activities[tenantId] ?? {};
        const existing = tenantActivities[payload.deal_id];
        if (existing) {
          existing.data = [activity, ...existing.data];
          existing.fetchedAt = Date.now();
        } else {
          tenantActivities[payload.deal_id] = { data: [activity], fetchedAt: Date.now() };
        }
        state.activities[tenantId] = tenantActivities;
      });
      return activity;
    },

    async advanceDealStage(tenantId, dealId, stageId) {
      const deal = await crmApi.advanceDealStage(tenantId, dealId, stageId);
      set((state) => {
        const existing = state.deals[tenantId];
        if (existing) {
          existing.data = existing.data.map((d) => (d.id === deal.id ? deal : d));
          existing.fetchedAt = Date.now();
        }
      });
      return deal;
    },

    invalidateTenant(tenantId) {
      set((state) => {
        delete state.leads[tenantId];
        delete state.deals[tenantId];
        delete state.activities[tenantId];
        delete state.analytics[tenantId];
      });
    },
  })),
);
