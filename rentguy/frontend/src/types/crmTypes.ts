// FILE: rentguy/frontend/src/types/adminTypes.ts
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
  AUDITOR = 'AUDITOR',
}

export type Permission = {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: Permission[];
  lastLogin?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
}

// FILE: rentguy/frontend/src/types/crmTypes.ts
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: 'lead' | 'active' | 'inactive' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface ContactHistory {
  id: string;
  customerId: string;
  date: string;
  type: 'email' | 'call' | 'meeting';
  summary: string;
}

export interface CommunicationLog {
  id: string;
  customerId: string;
  timestamp: string;
  method: 'email' | 'sms' | 'phone';
  details: string;
  userId: string;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

// FILE: rentguy/frontend/src/types/crewTypes.ts
export interface CrewMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'technician' | 'supervisor' | 'driver';
  skills: string[];
  availability: 'available' | 'assigned' | 'unavailable';
  currentAssignment?: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  status: 'available' | 'in_use' | 'maintenance';
  lastMaintenance?: string;
}

export interface Assignment {
  id: string;
  projectId: string;
  crewIds: string[];
  equipmentIds: string[];
  startDate: string;
  endDate: string;
}

export interface WorkShift {
  id: string;
  crewId: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  projectId: string;
}

// FILE: rentguy/frontend/src/types/financeTypes.ts
export interface Invoice {
  id: string;
  projectId: string;
  amount: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'cash';
  transactionDate: string;
  processedBy: string;
  transactionId: string;
}

export interface FinancialReport {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  generatedBy: string;
  generatedAt: string;
}

export interface Budget {
  id: string;
  projectId: string;
  totalAmount: number;
  amountUsed: number;
  allocatedTo: string[];
  fiscalYear: number;
}

// FILE: rentguy/frontend/src/types/projectTypes.ts
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  clientId: string;
  projectManagerId: string;
  timeline: {
    phase: string;
    start: string;
    end: string;
  }[];
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  assignedTo: string[];
  dueDate: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface ChangeOrder {
  id: string;
  projectId: string;
  description: string;
  reason: string;
  approved: boolean;
  costImpact: number;
  timeImpact: number;
  requestedBy: string;
  approvedBy?: string;
}

// FILE: rentguy/frontend/src/types/index.ts
export * from './adminTypes';
export * from './crmTypes';
export * from './crewTypes';
export * from './financeTypes';
export * from './projectTypes';