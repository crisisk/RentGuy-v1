export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired'

export interface InvoiceRecord {
  id: string
  customer: string
  projectId?: string
  amount: number
  currency: string
  status: InvoiceStatus
  issuedOn: string
  dueOn: string
  paidOn?: string | null
  createdBy: string
}

export interface QuoteRecord {
  id: string
  customer: string
  name: string
  amount: number
  currency: string
  status: QuoteStatus
  validUntil: string
  createdBy: string
}

export interface FinanceSnapshot {
  cashOnHand: number
  outstandingInvoices: number
  overdueInvoices: number
  forecastedRevenue: number
  mollieStatus: 'connected' | 'disconnected' | 'pending'
  nextPayoutDate?: string | null
}

export interface FinanceAlert {
  id: string
  type: 'payment_failure' | 'payout' | 'vat' | 'forecast'
  message: string
  severity: 'info' | 'warning' | 'critical'
  createdAt: string
}
