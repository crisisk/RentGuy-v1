import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import {
  clearOnboardingState,
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
  storageAvailable,
} from '@core/storage'
import { env } from '@config/env'
import { mapUnknownToAppError } from '@core/errors'

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

let token = getLocalStorageItem('token', '')

export function setToken(newToken: string) {
  token = newToken
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
  (response: AxiosResponse) => response,
  (error: unknown) => {
    const appError = mapUnknownToAppError(error)
    if (appError.code === 'unauthorized') {
      removeLocalStorageItem('token')
      removeLocalStorageItem('user_email')
      clearOnboardingState()
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }
    return Promise.reject(appError)
  }
)
