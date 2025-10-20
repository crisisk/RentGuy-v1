export type InvoiceStatus = 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface InvoiceRecord {
  id: string
  clientName: string
  issuedAt: string
  dueAt: string
  status: InvoiceStatus
  currency: string
  lineItems: InvoiceLineItem[]
  totalNet: number
  totalVat: number
  totalGross: number
  reference?: string | null
  projectId?: number | null
}

export interface InvoiceDraftInput {
  clientName: string
  invoiceDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  total: number
  reference?: string | null
  projectId?: number | null
  currency?: string
}

export type QuoteStatus = 'draft' | 'sent' | 'converted'

export interface QuoteRecord {
  id: string
  number: string
  clientName: string
  amount: number
  issuedAt: string
  status: QuoteStatus
}

export type PaymentMethod = 'bank_transfer' | 'card' | 'cash'

export interface PaymentRecord {
  id: string
  invoiceId: string
  amount: number
  method: PaymentMethod
  processedAt: string
  status: 'pending' | 'settled'
  reference?: string | null
}

export interface PaymentDraft {
  invoiceId: string
  amount: number
  method: PaymentMethod
  reference?: string | null
}

export interface FinanceDashboardMetrics {
  monthlyRevenue: number
  pendingInvoicesTotal: number
  paidInvoicesTotal: number
}

export interface FinanceDashboardData {
  invoices: InvoiceRecord[]
  metrics: FinanceDashboardMetrics
}
