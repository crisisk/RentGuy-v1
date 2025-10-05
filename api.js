import axios from 'axios'

// Use deployed backend URL
const API_BASE_URL = 'https://g8h3ilc3k6q1.manus.space'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let token = localStorage.getItem('token')

export function setToken(newToken) {
  token = newToken
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
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
      localStorage.removeItem('token')
      localStorage.removeItem('user_email')
      localStorage.removeItem('onb_seen')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)
