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
  return {
    ...(appError.httpStatus !== undefined ? { httpStatus: appError.httpStatus } : {}),
    ...(appError.meta !== undefined ? { meta: appError.meta } : {}),
    ...(appError.cause !== undefined ? { cause: appError.cause } : {}),
  }
}

export class APIError extends AppError {
  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(code, message, options)
    this.name = API_ERROR_NAME
  }

  public static isApiError(value: unknown): value is APIError {
    if (value instanceof APIError) {
      return true
    }

    if (!(value instanceof AppError)) {
      return false
    }

    return value.name === API_ERROR_NAME
  }

  private static fromAppError(appError: AppError): APIError {
    if (APIError.isApiError(appError)) {
      return appError
    }

    const baseError: AppError = appError
    const options = extractOptionsFromAppError(baseError)
    return new APIError(baseError.code, baseError.message, options)
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

export function assertApiError(error: unknown): asserts error is APIError {
  if (!APIError.isApiError(error)) {
    throw APIError.from(error)
  }
}

export {
  AppError,
  assertAppErrorLegacy,
  mapUnknownToAppError,
  type AppErrorCode,
  type AppErrorOptions,
}
