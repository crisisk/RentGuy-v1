export interface PipelineStage {
  id: number;
  name: string;
  order: number;
  automation_flow?: string | null;
}

export interface Lead {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status: string;
  external_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadPayload {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  external_id?: string;
}

export interface Deal {
  id: number;
  title: string;
  pipeline_id: number;
  stage_id: number;
  lead_id?: number | null;
  value: number;
  currency: string;
  expected_close?: string | null;
  probability: number;
  status: string;
  created_at: string;
  updated_at: string;
  stage: PipelineStage;
}

export interface DealPayload {
  title: string;
  pipeline_id: number;
  stage_id: number;
  lead_id?: number | null;
  value?: number;
  currency?: string;
  expected_close?: string;
  probability?: number;
}

export interface Activity {
  id: number;
  activity_type: string;
  summary: string;
  payload?: string | null;
  occurred_at: string;
  created_at: string;
}

export interface ActivityPayload {
  deal_id: number;
  activity_type: string;
  summary: string;
  payload?: string;
  occurred_at?: string;
}

export interface AutomationRun {
  id: number;
  trigger: string;
  workflow_id: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
}

export interface HeadlineKPIs {
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  won_value_last_30_days: number;
  avg_deal_cycle_days?: number | null;
  automation_failure_rate: number;
  active_workflows: number;
}

export interface LeadFunnelKPIs {
  total_leads: number;
  leads_last_30_days: number;
  leads_with_deals: number;
  conversion_rate: number;
}

export interface PipelineStageKPI {
  stage_id: number;
  stage_name: string;
  deal_count: number;
  total_value: number;
  weighted_value: number;
  avg_age_days?: number | null;
}

export interface AutomationWorkflowKPI {
  workflow_id: string;
  run_count: number;
  failed_runs: number;
  avg_completion_minutes?: number | null;
  sla_breaches: number;
  failure_rate: number;
}

export interface SalesKPIs {
  open_deals: number;
  won_deals_last_30_days: number;
  lost_deals_last_30_days: number;
  total_deals: number;
  bookings_last_30_days: number;
  win_rate: number;
  avg_deal_value?: number | null;
  forecast_next_30_days: number;
  pipeline_velocity_per_day: number;
}

export interface AcquisitionKPIs {
  lookback_days: number;
  ga_sessions: number;
  ga_new_users: number;
  ga_engaged_sessions: number;
  ga_conversions: number;
  ga_conversion_value: number;
  gtm_conversions: number;
  gtm_conversion_value: number;
  blended_conversion_rate: number;
  active_connectors: string[];
}

export interface SourcePerformanceKPI {
  key: string;
  label: string;
  dimension_type: string;
  lead_count: number;
  deal_count: number;
  won_deal_count: number;
  pipeline_value: number;
  won_value: number;
  ga_sessions: number;
  ga_conversions: number;
  gtm_conversions: number;
  ga_revenue: number;
  gtm_revenue: number;
}

export interface DashboardSummary {
  generated_at: string;
  headline: HeadlineKPIs;
  lead_funnel: LeadFunnelKPIs;
  pipeline: PipelineStageKPI[];
  automation: AutomationWorkflowKPI[];
  sales: SalesKPIs;
  acquisition: AcquisitionKPIs;
  source_performance: SourcePerformanceKPI[];
}
