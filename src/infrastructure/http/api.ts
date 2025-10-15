import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { clearOnboardingState, removeLocalStorageItem } from '@core/storage'
import { env } from '@config/env'
import { mapUnknownToApiError } from '@errors'
import {
  clearStoredToken,
  getStoredToken,
  persistToken,
  subscribeToTokenChanges,
  type TokenPersistenceOptions,
} from '@core/auth-token-storage'

const API_BASE_URL = env.apiUrl

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

type MaybeFormData = BodyInit | undefined

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isFormData = typeof FormData !== 'undefined' && (config.data as MaybeFormData) instanceof FormData
  if (!isFormData && config.method && config.method.toLowerCase() !== 'get') {
    config.headers = config.headers ?? {}
    if (!config.headers['Content-Type'] && !config.headers['content-type']) {
      config.headers['Content-Type'] = 'application/json'
    }
  }
  return config
})

function applyAuthorizationHeader(nextToken: string): void {
  if (nextToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${nextToken}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export function setToken(newToken: string, options?: TokenPersistenceOptions): void {
  const normalised = newToken.trim()
  if (normalised) {
    persistToken(normalised, options)
    applyAuthorizationHeader(normalised)
  } else {
    clearStoredToken()
    applyAuthorizationHeader('')
  }
}

const initialToken = getStoredToken()
if (initialToken) {
  applyAuthorizationHeader(initialToken)
}

subscribeToTokenChanges(nextToken => {
  applyAuthorizationHeader(nextToken)
})

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    const appError = mapUnknownToApiError(error)
    if (appError.code === 'unauthorized') {
      clearStoredToken()
      removeLocalStorageItem('user_email')
      clearOnboardingState()
    }
    return Promise.reject(appError)
  }
)
