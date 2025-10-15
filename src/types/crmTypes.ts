export type LeadStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

export interface LeadRecord {
  id: string
  name: string
  company: string
  email?: string
  phone?: string
  owner: string
  stage: LeadStage
  value: number
  currency: string
  probability: number
  expectedCloseDate?: string | null
  updatedAt: string
  source?: string
}

export interface CustomerActivity {
  id: string
  customerId: string
  type: 'note' | 'call' | 'email' | 'meeting'
  message: string
  createdAt: string
  createdBy: string
  relatedProjectId?: string
}

export interface PipelineSummary {
  stage: LeadStage
  count: number
  totalValue: number
  conversionRate?: number
}

export interface CrmSyncState {
  lastSyncedAt: string | null
  isSyncing: boolean
  error: string | null
}
