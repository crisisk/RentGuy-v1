import apiClient from './client';
import type {
  Activity,
  ActivityPayload,
  AutomationRun,
  DashboardSummary,
  Deal,
  DealPayload,
  Lead,
  LeadPayload,
} from '../types/crm';

const withTenant = (tenantId: string) => ({
  headers: {
    'X-Tenant-ID': tenantId,
  },
});

export const listLeads = async (tenantId: string): Promise<Lead[]> => {
  const response = await apiClient.get('/api/v1/crm/leads', withTenant(tenantId));
  return response.data as Lead[];
};

export const createLead = async (tenantId: string, payload: LeadPayload): Promise<Lead> => {
  const response = await apiClient.post('/api/v1/crm/leads', payload, withTenant(tenantId));
  return response.data as Lead;
};

export const listDeals = async (tenantId: string): Promise<Deal[]> => {
  const response = await apiClient.get('/api/v1/crm/deals', withTenant(tenantId));
  return response.data as Deal[];
};

export const createDeal = async (tenantId: string, payload: DealPayload): Promise<Deal> => {
  const response = await apiClient.post('/api/v1/crm/deals', payload, withTenant(tenantId));
  return response.data as Deal;
};

export const advanceDealStage = async (
  tenantId: string,
  dealId: number,
  stageId: number,
): Promise<Deal> => {
  const response = await apiClient.post(
    `/api/v1/crm/deals/${dealId}/advance`,
    { stage_id: stageId },
    withTenant(tenantId),
  );
  return response.data as Deal;
};

export const listActivities = async (tenantId: string, dealId: number): Promise<Activity[]> => {
  const response = await apiClient.get(
    `/api/v1/crm/deals/${dealId}/activities`,
    withTenant(tenantId),
  );
  return response.data as Activity[];
};

export const logActivity = async (
  tenantId: string,
  payload: ActivityPayload,
): Promise<Activity> => {
  const response = await apiClient.post('/api/v1/crm/activities', payload, withTenant(tenantId));
  return response.data as Activity;
};

export const listAutomationRuns = async (
  tenantId: string,
  dealId: number,
): Promise<AutomationRun[]> => {
  const response = await apiClient.get(
    `/api/v1/crm/deals/${dealId}/automation`,
    withTenant(tenantId),
  );
  return response.data as AutomationRun[];
};

export const getDashboardSummary = async (
  tenantId: string,
  options?: { abortSignal?: AbortSignal },
): Promise<DashboardSummary> => {
  const response = await apiClient.get('/api/v1/crm/analytics/dashboard', {
    ...withTenant(tenantId),
    signal: options?.abortSignal,
  });
  return response.data as DashboardSummary;
};
