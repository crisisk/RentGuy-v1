export type AppErrorCode =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'server'
  | 'cancelled'
  | 'unknown'

export interface AppErrorOptions {
  readonly cause?: unknown
  readonly httpStatus?: number
  readonly meta?: Record<string, unknown>
}

import type { AxiosError } from 'axios'

export class AppError extends Error {
  public static readonly nameSymbol = 'AppError'

  public readonly code: AppErrorCode

  public readonly httpStatus?: number

  public readonly meta?: Record<string, unknown>

  constructor(code: AppErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message)
    this.name = AppError.nameSymbol
    this.code = code
    if (options.httpStatus !== undefined) {
      this.httpStatus = options.httpStatus
    }
    if (options.meta !== undefined) {
      this.meta = options.meta
    }
    if (options.cause !== undefined) {
      this.cause = options.cause
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      httpStatus: this.httpStatus,
      meta: this.meta,
    }
  }

  public static isAppError(value: unknown): value is AppError {
    return value instanceof AppError || Boolean((value as { name?: string } | null)?.name === AppError.nameSymbol)
  }

  public static fromAxiosError(error: AxiosError<unknown>): AppError {
    const status = error.response?.status
    const code = resolveCodeFromStatus(status, error.code)
    const message = resolveMessage(code, status, error.message)
    const meta = buildMeta(error)
    const options: AppErrorOptions = {
      cause: error,
      ...(typeof status === 'number' ? { httpStatus: status } : {}),
      ...(meta ? { meta } : {}),
    }
    return new AppError(code, message, options)
  }

  public static fromUnknown(error: unknown): AppError {
    if (AppError.isAppError(error)) {
      return error as AppError
    }
    if (isAxiosErrorLike(error)) {
      return AppError.fromAxiosError(error)
    }
    if (error instanceof Error) {
      const fallbackMessage = error.message || 'Onbekende fout opgetreden'
      return new AppError('unknown', fallbackMessage, { cause: error })
    }
    return new AppError('unknown', 'Onbekende fout opgetreden', { meta: { error } })
  }
}

function resolveCodeFromStatus(status?: number, axiosCode?: string | null): AppErrorCode {
  if (axiosCode === 'ECONNABORTED') return 'timeout'
  if (axiosCode === 'ERR_CANCELED') return 'cancelled'
  if (status === undefined) return 'network'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status >= 500) return 'server'
  if (status >= 400) return 'validation'
  return 'unknown'
}

function resolveMessage(code: AppErrorCode, status?: number, fallback?: string | null): string {
  if (fallback && fallback.trim().length > 0) {
    return fallback
  }
  switch (code) {
    case 'unauthorized':
      return 'Je sessie is verlopen. Log opnieuw in om verder te gaan.'
    case 'forbidden':
      return 'Je hebt geen rechten om deze actie uit te voeren.'
    case 'not_found':
      return 'De gevraagde resource kon niet worden gevonden.'
    case 'validation':
      return 'De server accepteerde de invoer niet. Controleer en probeer opnieuw.'
    case 'server':
      return 'De server reageerde met een fout. Probeer het later opnieuw.'
    case 'timeout':
      return 'De aanvraag duurde te lang en is afgebroken.'
    case 'network':
      return 'Er kon geen verbinding met de server worden gemaakt.'
    case 'cancelled':
      return 'De actie is geannuleerd.'
    default:
      return status ? `Onbekende fout (${status})` : 'Onbekende fout opgetreden.'
  }
}

function buildMeta(error: AxiosError<unknown>): Record<string, unknown> | undefined {
  const meta: Record<string, unknown> = {}
  if (error.response?.data && typeof error.response.data === 'object') {
    meta.response = error.response.data
  }
  if (error.config?.url) {
    meta.url = error.config.url
  }
  if (error.config?.method) {
    meta.method = error.config.method
  }
  return Object.keys(meta).length ? meta : undefined
}

function isAxiosErrorLike(error: unknown): error is AxiosError<unknown> {
  return Boolean(error && typeof error === 'object' && (error as { isAxiosError?: boolean }).isAxiosError)
}

export function mapUnknownToAppError(error: unknown): AppError {
  return AppError.fromUnknown(error)
}

export function assertAppError(error: unknown): AppError {
  return AppError.fromUnknown(error)
}
