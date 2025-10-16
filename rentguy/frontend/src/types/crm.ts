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
