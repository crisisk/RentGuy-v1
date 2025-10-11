import axios from 'axios'
import {
  clearOnboardingState,
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
  storageAvailable,
} from './storage.js'

// Backend endpoint can be configured through Vite env files or process envs.
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  process.env?.VITE_API_URL ||
  'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use(config => {
  const isFormData =
    typeof FormData !== 'undefined' && config.data instanceof FormData
  if (!isFormData && config.method && config.method !== 'get') {
    config.headers = config.headers || {}
    if (!config.headers['Content-Type'] && !config.headers['content-type']) {
      config.headers['Content-Type'] = 'application/json'
    }
  }
  return config
})

let token = getLocalStorageItem('token', '')

export function setToken(newToken) {
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

// Set initial token if exists
if (token) {
  setToken(token)
}

// Add response interceptor for token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeLocalStorageItem('token')
      removeLocalStorageItem('user_email')
      clearOnboardingState()
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }
    return Promise.reject(error)
  }
)
