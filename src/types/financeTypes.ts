export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | (string & {})

export interface InvoiceLineItemInput {
  readonly description: string
  readonly quantity?: number
  readonly unitPrice: number
  readonly vatRate?: number | null
}

export interface InvoiceCreatePayload {
  readonly projectId: number
  readonly clientName: string
  readonly currency?: string
  readonly issuedAt: string
  readonly dueAt: string
  readonly reference?: string | null
  readonly vatRate?: number | null
  readonly lineItems: InvoiceLineItemInput[]
  readonly totalNetOverride?: number | null
  readonly totalVatOverride?: number | null
  readonly syncWithFinanceBridge?: boolean
}

export interface Invoice {
  readonly id: number
  readonly projectId: number
  readonly clientName: string
  readonly currency: string
  readonly totalNet: number
  readonly totalVat: number
  readonly totalGross: number
  readonly vatRate: number
  readonly status: InvoiceStatus
  readonly issuedAt: string
  readonly dueAt: string
  readonly reference?: string | null
}

export interface CheckoutRequestPayload {
  readonly invoiceId: number
  readonly successUrl: string
  readonly cancelUrl: string
  readonly customerEmail?: string | null
}

export type CheckoutProvider = 'stripe' | 'mollie'

export interface CheckoutSession {
  readonly provider: CheckoutProvider
  readonly externalId: string
  readonly checkoutUrl: string
}

export interface Payment {
  readonly id: number
  readonly provider: string
  readonly externalId: string
  readonly amount: number
  readonly status: string
}

export interface FinanceDashboardMetrics {
  readonly monthlyRevenue: number
  readonly pendingInvoicesTotal: number
  readonly paidInvoicesTotal: number
}

export interface FinanceDashboardData {
  readonly invoices: Invoice[]
  readonly metrics: FinanceDashboardMetrics
}
