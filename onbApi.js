import { api } from './api.js'

export async function getSteps(config = {}) {
  const { data } = await api.get('/api/v1/onboarding/steps', config)
  return data
}

export async function getProgress(email, config = {}) {
  const { params, ...rest } = config
  const finalConfig = {
    ...rest,
    params: {
      ...(params || {}),
      user_email: email,
    },
  }
  const { data } = await api.get('/api/v1/onboarding/progress', finalConfig)
  return data
}

export async function completeStep(email, step_code, config = {}) {
  return api.post('/api/v1/onboarding/complete', { user_email: email, step_code }, config)
}

export async function getTips(module, config = {}) {
  const { params, ...rest } = config
  const nextParams = { ...(params || {}) }
  if (module) nextParams.module = module
  const { data } = await api.get('/api/v1/onboarding/tips', { ...rest, params: nextParams })
  return data
}
