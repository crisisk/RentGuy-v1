import axios from 'axios'
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from './storage.js'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: 'application/json',
  },
})

export function setToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setLocalStorageItem('token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    removeLocalStorageItem('token')
  }
}

const existingToken = getLocalStorageItem('token', '')
if (existingToken) {
  setToken(existingToken)
}

api.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      removeLocalStorageItem('token')
      removeLocalStorageItem('user_email')
      delete api.defaults.headers.common['Authorization']
    }
    return Promise.reject(error)
  },
)
