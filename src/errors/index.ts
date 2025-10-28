import {
  AppError,
  assertAppError as assertAppErrorLegacy,
  mapUnknownToAppError,
  type AppErrorCode,
  type AppErrorOptions,
} from '@core/errors'

const API_ERROR_NAME = 'APIError' as const

export type ApiErrorCode = AppErrorCode
export type ApiErrorOptions = AppErrorOptions

function extractOptionsFromAppError(appError: AppError): ApiErrorOptions {
  const options: ApiErrorOptions = {}
  if (appError.httpStatus !== undefined) {
    options.httpStatus = appError.httpStatus
  }
  if (appError.meta !== undefined) {
    options.meta = appError.meta
  }
  if (appError.cause !== undefined) {
    options.cause = appError.cause
  }
  return options
}

export class APIError extends AppError {
  public static readonly nameSymbol = API_ERROR_NAME

  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(code, message, options)
    this.name = API_ERROR_NAME
  }

  public static isApiError(value: unknown): value is APIError {
    if (value instanceof APIError) {
      return true
    }

    if (!value || typeof value !== 'object') {
      return false
    }

    return (value as { name?: string }).name === API_ERROR_NAME
  }

  private static fromAppError(appError: AppError): APIError {
    if (APIError.isApiError(appError)) {
      return appError
    }

    const options = extractOptionsFromAppError(appError)
    return new APIError(appError.code, appError.message, options)
  }

  public static from(error: unknown): APIError {
    if (APIError.isApiError(error)) {
      return error
    }

    if (error instanceof AppError) {
      return APIError.fromAppError(error)
    }

    const appError = mapUnknownToAppError(error)
    return APIError.fromAppError(appError)
  }
}

export type ApiError = APIError

export function isApiError(error: unknown): error is APIError {
  return APIError.isApiError(error)
}

export function mapUnknownToApiError(error: unknown): APIError {
  return APIError.from(error)
}

export function assertApiError(error: unknown): APIError {
  return APIError.from(error)
}

export {
  AppError,
  assertAppErrorLegacy,
  mapUnknownToAppError,
  type AppErrorCode,
  type AppErrorOptions,
}
