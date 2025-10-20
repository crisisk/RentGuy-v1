import type { AxiosRequestConfig } from 'axios'
import { api } from '@infra/http/api'
import { err, ok, type Result } from '@core/result'
import { mapUnknownToApiError, type ApiError } from '@errors'

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

export type VoidResult = Result<void>

const FALLBACK_EMAIL = 'bart@rentguy.demo'

interface OfflineDemoAccount {
  readonly email: string
  readonly password: string
  readonly token: string
  readonly user: AuthUser
}

const OFFLINE_DEMO_ACCOUNTS: readonly OfflineDemoAccount[] = [
  {
    email: 'bart@rentguy.demo',
    password: 'mr-dj',
    token: 'offline-demo-bart',
    user: {
      id: 'offline-bart',
      email: 'bart@rentguy.demo',
      role: 'planner',
      first_name: 'Bart',
      last_name: 'Jansen',
    },
  },
  {
    email: 'rentguy@demo.local',
    password: 'rentguy',
    token: 'offline-demo-rentguy',
    user: {
      id: 'offline-rentguy',
      email: 'rentguy@demo.local',
      role: 'finance',
      first_name: 'Rent',
      last_name: 'Guy',
    },
  },
]

function normaliseEmail(value: string): string {
  return ensureAuthEmail(value).toLowerCase()
}

function findOfflineDemoAccount(email: string, password: string): OfflineDemoAccount | undefined {
  const normalisedEmail = normaliseEmail(email)
  return OFFLINE_DEMO_ACCOUNTS.find(
    account => account.email === normalisedEmail && account.password === password,
  )
}

export function isOfflineDemoToken(candidate: string | null | undefined): boolean {
  if (!candidate) {
    return false
  }
  const trimmed = candidate.trim()
  if (!trimmed) {
    return false
  }
  return OFFLINE_DEMO_ACCOUNTS.some(account => account.token === trimmed)
}

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
    const apiError = mapUnknownToApiError(error)
    if (apiError.code === 'network' || apiError.code === 'timeout') {
      const offlineAccount = findOfflineDemoAccount(credentials.email, credentials.password)
      if (offlineAccount) {
        return ok({
          token: offlineAccount.token,
          user: offlineAccount.user,
        })
      }
    }
    return err(apiError)
  }
}

export async function getCurrentUser(config: RequestConfig = {}): Promise<CurrentUserResult> {
  try {
    const { data } = await api.get<AuthUser>('/api/v1/auth/me', config)
    return ok(data)
  } catch (error) {
    return err(mapUnknownToApiError(error))
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
    return err(mapUnknownToApiError(error))
  }
}

export interface RegisterPayload {
  readonly email: string
  readonly password: string
  readonly acceptTerms: boolean
}

export interface PasswordResetRequestPayload {
  readonly email: string
}

export interface PasswordResetConfirmPayload {
  readonly token: string
  readonly password: string
  readonly confirmPassword: string
}

export async function registerUser(
  payload: RegisterPayload,
  config: RequestConfig = {},
): Promise<VoidResult> {
  try {
    await api.post('/api/register', payload, config)
    return ok(undefined)
  } catch (error) {
    return err(mapUnknownToApiError(error))
  }
}

export async function requestPasswordReset(
  payload: PasswordResetRequestPayload,
  config: RequestConfig = {},
): Promise<VoidResult> {
  try {
    await api.post('/api/password-reset', payload, config)
    return ok(undefined)
  } catch (error) {
    return err(mapUnknownToApiError(error))
  }
}

export async function confirmPasswordReset(
  payload: PasswordResetConfirmPayload,
  config: RequestConfig = {},
): Promise<VoidResult> {
  try {
    await api.post('/api/password-reset/confirm', payload, config)
    return ok(undefined)
  } catch (error) {
    return err(mapUnknownToApiError(error))
  }
}

export function deriveRoleErrorMessage(error: ApiError): string {
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

export function deriveLoginErrorMessage(error: ApiError): string {
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

export function deriveRegisterErrorMessage(error: ApiError): string {
  if (error.meta && typeof error.meta === 'object') {
    const detail = (error.meta as { response?: { detail?: unknown } }).response?.detail
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail
    }
  }

  switch (error.code) {
    case 'conflict':
      return 'Dit e-mailadres is al geregistreerd. Gebruik een ander adres of log in.'
    case 'validation':
      return 'Registratie mislukt door ongeldige invoer. Controleer de velden en probeer opnieuw.'
    case 'network':
      return 'Er kon geen verbinding met de server worden gemaakt. Probeer het later opnieuw.'
    case 'timeout':
      return 'De registratieaanvraag duurde te lang. Probeer het opnieuw.'
    default:
      return error.message || 'Account aanmaken is mislukt. Probeer het opnieuw.'
  }
}

export function derivePasswordResetErrorMessage(error: ApiError): string {
  switch (error.code) {
    case 'not_found':
      return 'We hebben geen account met dit e-mailadres gevonden.'
    case 'validation':
      return 'De opgegeven gegevens waren ongeldig. Controleer de velden en probeer opnieuw.'
    case 'network':
      return 'Geen netwerkverbinding. Controleer je internetverbinding en probeer opnieuw.'
    case 'timeout':
      return 'De aanvraag duurde te lang. Probeer het opnieuw.'
    default:
      return error.message || 'Wachtwoord resetten is mislukt. Probeer het opnieuw.'
  }
}
