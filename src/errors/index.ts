import { AppError, mapUnknownToAppError, type AppErrorCode, type AppErrorOptions } from '@core/errors'

export type ApiErrorCode = AppErrorCode
export type ApiErrorOptions = AppErrorOptions

export class APIError extends AppError {
  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(code, message, options)
    this.name = 'APIError'
  }

  public static isApiError(value: unknown): value is APIError {
    return value instanceof APIError
  }

  public static from(error: unknown): APIError {
    if (error instanceof APIError) {
      return error
    }

    const appError = mapUnknownToAppError(error)
    if (appError instanceof APIError) {
      return appError
    }

    const options: ApiErrorOptions = {
      ...(appError.httpStatus !== undefined ? { httpStatus: appError.httpStatus } : {}),
      ...(appError.meta !== undefined ? { meta: appError.meta } : {}),
      ...(appError.cause !== undefined ? { cause: appError.cause } : {}),
    }

    return new APIError(appError.code, appError.message, options)
  }
}

export type ApiError = APIError

export function mapUnknownToApiError(error: unknown): APIError {
  return APIError.from(error)
}

export function assertApiError(error: unknown): APIError {
  return APIError.from(error)
}

export {
  AppError,
  assertAppError as assertAppErrorLegacy,
  mapUnknownToAppError,
  type AppErrorCode,
  type AppErrorOptions,
} from '@core/errors'
