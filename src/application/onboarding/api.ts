import type { AxiosRequestConfig } from 'axios'
import { api } from '@infra/http/api'
import { AppError, mapUnknownToAppError } from '@core/errors'
import { err, ok, type Result } from '@core/result'

export interface OnboardingStep {
  code: string
  title: string
  description: string
  module?: string
  status?: 'pending' | 'complete' | 'blocked' | string
}

export interface OnboardingProgressRecord {
  step_code: string
  status: 'pending' | 'complete' | 'blocked' | string
  updated_at?: string
  completed_at?: string
}

export interface OnboardingTip {
  id?: string
  module?: string
  message: string
  cta?: string
}

type RequestConfig<T = unknown> = AxiosRequestConfig<T>

type TipsResponse = OnboardingTip[]

type StepsResponse = OnboardingStep[]

type ProgressResponse = OnboardingProgressRecord[]

export type StepsResult = Result<StepsResponse>

export type TipsResult = Result<TipsResponse>

export type ProgressResult = Result<ProgressResponse>

export async function getSteps(config: RequestConfig = {}): Promise<StepsResult> {
  try {
    const { data } = await api.get<StepsResponse>('/api/v1/onboarding/steps', config)
    return ok(data)
  } catch (error) {
    return err(resolveError(error))
  }
}

export async function getProgress(
  email: string,
  config: RequestConfig = {},
): Promise<ProgressResult> {
  try {
    const { params, ...rest } = config
    const finalConfig: RequestConfig = {
      ...rest,
      params: {
        ...(params as Record<string, unknown> | undefined),
        user_email: email,
      },
    }
    const { data } = await api.get<ProgressResponse>('/api/v1/onboarding/progress', finalConfig)
    return ok(data)
  } catch (error) {
    return err(resolveError(error))
  }
}

export async function completeStep(
  email: string,
  stepCode: string,
  config: RequestConfig = {},
): Promise<Result<void>> {
  try {
    await api.post('/api/v1/onboarding/complete', { user_email: email, step_code: stepCode }, config)
    return ok(undefined)
  } catch (error) {
    return err(resolveError(error))
  }
}

export async function getTips(module?: string, config: RequestConfig = {}): Promise<TipsResult> {
  try {
    const { params, ...rest } = config
    const nextParams: Record<string, unknown> = { ...(params as Record<string, unknown> | undefined) }
    if (module) nextParams.module = module
    const { data } = await api.get<TipsResponse>('/api/v1/onboarding/tips', { ...rest, params: nextParams })
    return ok(data)
  } catch (error) {
    return err(resolveError(error))
  }
}

function resolveError(error: unknown): AppError {
  return mapUnknownToAppError(error)
}
