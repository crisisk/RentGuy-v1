import type { AppError } from '@core/errors'

export type Result<T, E extends AppError = AppError> = SuccessResult<T> | ErrorResult<E>

type SuccessResult<T> = {
  readonly ok: true
  readonly value: T
}

type ErrorResult<E> = {
  readonly ok: false
  readonly error: E
}

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err<E extends AppError>(error: E): Result<never, E> {
  return { ok: false, error }
}

export function isOk<T, E extends AppError>(result: Result<T, E>): result is SuccessResult<T> {
  return result.ok
}

export function isError<T, E extends AppError>(result: Result<T, E>): result is ErrorResult<E> {
  return !result.ok
}

export function unwrapOr<T, E extends AppError>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback
}

export function mapError<T, E extends AppError, R extends AppError>(
  result: Result<T, E>,
  mapper: (error: E) => R,
): Result<T, R> {
  return result.ok ? result : err(mapper(result.error))
}
