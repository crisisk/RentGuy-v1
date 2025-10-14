import type { AxiosRequestConfig } from 'axios'
import { api } from '@infra/http/api'
import { err, ok, type Result } from '@core/result'
import { mapUnknownToAppError, type AppError } from '@core/errors'

export interface AuthUser {
  readonly id?: string
  readonly email?: string
  readonly role?: string
  readonly first_name?: string
  readonly last_name?: string
}

export interface LoginCredentials {
  readonly email: string
  readonly password: string
}

export interface LoginResponse {
  readonly access_token: string
  readonly email?: string
  readonly role?: string
}

export interface UpdateRolePayload {
  readonly role: string
}

type RequestConfig<T = unknown> = AxiosRequestConfig<T>

export type LoginResult = Result<{ token: string; user: AuthUser }>

export type CurrentUserResult = Result<AuthUser>

export type UpdateRoleResult = Result<AuthUser>

const FALLBACK_EMAIL = 'bart@rentguy.demo'

export function ensureAuthEmail(candidate?: string | null, fallback: string = FALLBACK_EMAIL): string {
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }
  return fallback
}

export async function login(
  credentials: LoginCredentials,
  config: RequestConfig<FormData> = {},
): Promise<LoginResult> {
  try {
    const form = new FormData()
    form.append('email', credentials.email)
    form.append('password', credentials.password)

    const { data } = await api.post<LoginResponse>('/api/v1/auth/login', form, config)

    const ensuredEmail = ensureAuthEmail(data.email ?? credentials.email)
    const user: AuthUser = {
      email: ensuredEmail,
      ...(typeof data.role === 'string' && data.role.length > 0 ? { role: data.role } : {}),
    }

    return ok({
      token: data.access_token,
      user,
    })
  } catch (error) {
    return err(mapUnknownToAppError(error))
  }
}

export async function getCurrentUser(config: RequestConfig = {}): Promise<CurrentUserResult> {
  try {
    const { data } = await api.get<AuthUser>('/api/v1/auth/me', config)
    return ok(data)
  } catch (error) {
    return err(mapUnknownToAppError(error))
  }
}

export async function updateRole(
  payload: UpdateRolePayload,
  config: RequestConfig = {},
): Promise<UpdateRoleResult> {
  try {
    const { data } = await api.post<AuthUser>('/api/v1/auth/role', payload, config)
    return ok(data)
  } catch (error) {
    return err(mapUnknownToAppError(error))
  }
}

export function deriveRoleErrorMessage(error: AppError): string {
  if (error.meta && typeof error.meta === 'object') {
    const detail = (error.meta as { response?: { detail?: unknown } }).response?.detail
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail
    }
  }

  switch (error.code) {
    case 'validation':
      return 'De opgegeven rol was ongeldig. Controleer de selectie en probeer opnieuw.'
    case 'forbidden':
      return 'Je hebt geen rechten om de rol te wijzigen. Neem contact op met een beheerder.'
    case 'network':
      return 'Er kon geen verbinding met de server worden gemaakt. Probeer het later opnieuw.'
    case 'timeout':
      return 'De rol kon niet worden opgeslagen omdat de aanvraag te lang duurde.'
    default:
      return 'Opslaan van rol is mislukt. Probeer het opnieuw.'
  }
}

export function deriveLoginErrorMessage(error: AppError): string {
  switch (error.code) {
    case 'unauthorized':
    case 'forbidden':
      return 'Onjuiste inloggegevens. Controleer je e-mail en wachtwoord.'
    case 'network':
      return 'Geen netwerkverbinding. Controleer je internetverbinding en probeer opnieuw.'
    case 'timeout':
      return 'De inlogaanvraag duurde te lang. Probeer het opnieuw.'
    default:
      return error.message || 'Login mislukt. Probeer het opnieuw.'
  }
}
