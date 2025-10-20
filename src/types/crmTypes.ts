export enum CustomerStatus {
  LEAD = 'LEAD',
  PROSPECT = 'PROSPECT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  TASK = 'TASK',
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  address?: Address
  status: CustomerStatus
  createdAt: string
}

export interface Contact {
  id: string
  customerId: string
  name: string
  email: string
  phone: string
  position?: string
  isPrimary: boolean
}

export interface Activity {
  id: string
  customerId: string
  type: ActivityType
  description: string
  date: string
  userId: string
}

export interface CustomerTimelineEntry {
  id: string
  customerId: string
  occurredAt: string
  summary: string
  activityType: ActivityType
  metadata?: Record<string, unknown>
}

export interface CustomerSegment {
  id: string
  name: string
  description?: string
  status: CustomerStatus
  size: number
}

export type CustomerWithContacts = Customer & { contacts: Contact[] }
