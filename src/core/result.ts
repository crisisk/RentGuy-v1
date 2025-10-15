import type { ApiError } from '@errors'

export type Result<T, E extends ApiError = ApiError> = SuccessResult<T> | ErrorResult<E>

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

export function err<E extends ApiError>(error: E): Result<never, E> {
  return { ok: false, error }
}

export function isOk<T, E extends ApiError>(result: Result<T, E>): result is SuccessResult<T> {
  return result.ok
}

export function isError<T, E extends ApiError>(result: Result<T, E>): result is ErrorResult<E> {
  return !result.ok
}

export function unwrapOr<T, E extends ApiError>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback
}

export function mapError<T, E extends ApiError, R extends ApiError>(
  result: Result<T, E>,
  mapper: (error: E) => R,
): Result<T, R> {
  return result.ok ? result : err(mapper(result.error))
}
