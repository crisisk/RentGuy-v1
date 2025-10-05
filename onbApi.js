import { api } from './api.js'

export async function getSteps() {
  const { data } = await api.get('/api/v1/onboarding/steps')
  return data
}

export async function getProgress(email) {
  const { data } = await api.get('/api/v1/onboarding/progress', { params: { user_email: email } })
  return data
}

export async function completeStep(email, step_code) {
  return api.post('/api/v1/onboarding/complete', { user_email: email, step_code })
}

export async function getTips(module) {
  const { data } = await api.get('/api/v1/onboarding/tips', { params: { module } })
  return data
}
