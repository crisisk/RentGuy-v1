export * from './adminTypes'
export * from './crmTypes'
export * from './crewTypes'
export * from './financeTypes'
export * from './projectTypes'

export type ApiResponse<T> = {
  data: T
  message?: string
  success: boolean
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ErrorResponse = {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
