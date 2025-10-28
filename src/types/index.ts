export * from './adminTypes'
export * from './crmTypes'
export * from './crewTypes'
export * from './financeTypes'
export * from './projectTypes'
export * from './equipmentTypes'
export * from './platform'
export * from './supplierDashboard'

export interface ApiResponse<T> {
  readonly data: T
  readonly message?: string
  readonly success: boolean
}

export interface PaginatedResponse<T> {
  readonly items: T[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
  readonly totalPages: number
}

export interface ErrorResponse {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, unknown>
}

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
