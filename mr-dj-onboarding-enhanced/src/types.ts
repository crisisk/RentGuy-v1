// RentGuy TypeScript Type Definitions

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'finance' | 'crew';
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  date: string;
  value: number;
  margin: number;
  status: 'active' | 'planned' | 'completed' | 'warning';
  crewAssigned: number;
  crewRequired: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  availability: number;
  performance: number;
  upcomingProjects: number;
}

export interface Equipment {
  id: string;
  name: string;
  category: 'audio' | 'video' | 'lighting' | 'stage';
  total: number;
  available: number;
  status: 'available' | 'limited' | 'critical';
  icon: string;
}

export interface Invoice {
  id: string;
  projectName: string;
  client: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  invoiceNumber: string;
}

export interface TimeEntry {
  id: string;
  crewMember: string;
  project: string;
  date: string;
  hours: number;
  plannedHours: number;
  status: 'approved' | 'pending' | 'rejected';
  deviation: number;
}

export interface KPI {
  label: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'destructive';
}

export interface Alert {
  id: string;
  type: 'equipment' | 'crew' | 'invoice' | 'general';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  action?: string;
}

export interface MaintenanceTask {
  id: string;
  equipmentName: string;
  scheduledDate: string;
  type: 'routine' | 'repair' | 'inspection';
}

export interface NavigationModule {
  id: string;
  name: string;
  icon: string;
  path: string;
  description: string;
  badge?: number;
}

