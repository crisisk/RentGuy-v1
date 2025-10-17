// File: crmTypes.ts

/**
 * Enum for Customer Status
 */
export enum CustomerStatus {
  LEAD = 'LEAD',
  PROSPECT = 'PROSPECT', 
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/**
 * Enum for Activity Types
 */
export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL', 
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  TASK = 'TASK'
}

/**
 * Customer Interface representing core customer data
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  status: CustomerStatus;
  createdAt: Date;
}

/**
 * Contact Interface representing individual contacts within a customer organization
 */
export interface Contact {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  isPrimary: boolean;
}

/**
 * Activity Interface representing interactions and tasks related to a customer
 */
export interface Activity {
  id: string;
  customerId: string;
  type: ActivityType;
  description: string;
  date: Date;
  userId: string;
}
```

Key design considerations:
- Used TypeScript enums for predefined status and activity types
- Optional properties for less critical fields (company, address, position)
- Strongly typed interfaces with clear, descriptive properties
- Date types for timestamp fields
- Included relationships via foreign keys (customerId, userId)
- Comprehensive type definitions following enterprise-grade standards
