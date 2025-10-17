Here's a comprehensive `financeTypes.ts` file with the specified requirements:

```typescript
// financeTypes.ts

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  MOLLIE = 'MOLLIE'
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  projectId?: string;
  number: string;
  date: Date;
  dueDate: Date;
  amount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
}

export interface Quote {
  id: string;
  customerId: string;
  number: string;
  date: Date;
  validUntil: Date;
  amount: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  date: Date;
  reference?: string;
  status: string;
}

export interface FinanceDashboard {
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  recentPayments: Payment[];
}

// Optional: Type guard for type checking
export function isInvoice(obj: any): obj is Invoice {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.customerId === 'string' &&
    obj.date instanceof Date &&
    obj.dueDate instanceof Date &&
    Array.isArray(obj.items)
  );
}
```

This TypeScript file provides:
- Comprehensive interfaces for financial entities
- Enums for statuses and payment methods
- Optional type guard for Invoice validation
- Strongly typed properties with appropriate types
- Flexibility with optional fields (e.g., `projectId`, `reference`)
