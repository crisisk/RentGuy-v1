Here's a comprehensive TypeScript types index file that meets the requirements:

```typescript
// src/types/index.ts

// Admin Types
export * from './adminTypes';

// CRM Types
export * from './crmTypes';

// Crew Types
export * from './crewTypes';

// Finance Types
export * from './financeTypes';

// Project Types
export * from './projectTypes';

// Common Utility Types
export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ErrorResponse = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

// Optional: Generic type for optional properties
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
```

This index file:
- Exports all types from specified modules
- Includes common utility types for API responses
- Provides generic types for optional and nullable values
- Uses TypeScript best practices for type definitions
