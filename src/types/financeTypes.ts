export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type QuoteStatus = 'draft' | 'sent' | 'converted';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'mollie';

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface InvoiceSummary {
  id: string;
  number?: string;
  clientName: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  invoiceDate?: string;
}

export interface InvoiceDetails extends InvoiceSummary {
  lineItems: InvoiceLineItem[];
  total: number;
  notes?: string;
}

export interface InvoiceDraft {
  clientName: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  total: number;
}

export interface Quote {
  id: string;
  number: string;
  client: string;
  amount: number;
  date: string;
  status: QuoteStatus;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  date: string;
  reference?: string;
}

export interface FinanceStats {
  monthlyRevenue: number;
  pendingInvoicesTotal: number;
  paidInvoicesTotal: number;
}

export interface DashboardData {
  invoices: InvoiceSummary[];
  stats: FinanceStats | null;
}

export const isInvoiceDetails = (value: unknown): value is InvoiceDetails => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<InvoiceDetails>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.clientName === 'string' &&
    typeof candidate.dueDate === 'string' &&
    typeof candidate.total === 'number' &&
    Array.isArray(candidate.lineItems)
  );
};
