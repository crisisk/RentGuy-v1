import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import {
  clearOnboardingState,
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
  storageAvailable,
} from '../storage/localStorage'
import { env } from '../../config/env'

type RequestConfig = InternalAxiosRequestConfig & { data?: unknown }

type ResponseInterceptorFulfilled = <T = unknown>(value: AxiosResponse<T>) => AxiosResponse<T>
type ResponseInterceptorRejected = (error: unknown) => Promise<never>

type RequestInterceptorFulfilled = (config: RequestConfig) => RequestConfig

export const api: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config => {
  const requestConfig = config
  const data = requestConfig.data
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
  if (!isFormData && requestConfig.method && requestConfig.method.toLowerCase() !== 'get') {
    requestConfig.headers = requestConfig.headers ?? {}
    if (!requestConfig.headers['Content-Type'] && !requestConfig.headers['content-type']) {
      requestConfig.headers['Content-Type'] = 'application/json'
    }
  }
  return requestConfig
}) as RequestInterceptorFulfilled)

let token: string = getLocalStorageItem('token', '')

export function setToken(newToken: string | null | undefined): void {
  token = newToken ?? ''
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    if (storageAvailable) {
      setLocalStorageItem('token', token)
    }
  } else {
    delete api.defaults.headers.common['Authorization']
    if (storageAvailable) {
      removeLocalStorageItem('token')
    }
  }
}

if (token) {
  setToken(token)
}

api.interceptors.response.use(
  ((response: AxiosResponse) => response) as ResponseInterceptorFulfilled,
  (async (error: any) => {
    if (error?.response?.status === 401) {
      removeLocalStorageItem('token')
      removeLocalStorageItem('user_email')
      clearOnboardingState()
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }
    return Promise.reject(error)
  }) as ResponseInterceptorRejected,
)

export type ApiClient = typeof api

export function withAuth<T>(config: AxiosRequestConfig<T> = {}): AxiosRequestConfig<T> {
  if (!token) return config
  return {
    ...config,
    headers: {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  }
}
