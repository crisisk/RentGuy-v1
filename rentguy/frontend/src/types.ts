export type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  required_crew_count: number;
  required_skills: string[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'crew';
  skills: string[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

export interface TimeEntry {
  id: string;
  crewId: string;
  projectId: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  status: 'pending' | 'approved' | 'rejected';
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  warehouseId: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  date: string;
  notes: string;
}

export interface Invoice {
  // Assuming Payment is a simple type or an alias for a type that is not yet defined.
  // Adding a placeholder for Payment and Schedule/Task/Role for now.
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: string;
}

export interface Schedule {
  id: string;
  teamMemberId: string;
  date: string;
  shift: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  status: 'todo' | 'in_progress' | 'done';
}

export interface Role {
  id: string;
  name: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'sent';
  dueDate: string;
}

export interface Quote {
  id: string;
  customerId: string;
  amount: number;
  status: 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
}

export interface FinancialMetrics {
  totalRevenue: number;
  outstandingInvoices: number;
  profitMargin: number;
  period: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  segment: 'vip' | 'regular' | 'new';
}

export interface Interaction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  timestamp: string;
  content: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'finance' | 'crew';
}

export type UserRole = User['role'];

