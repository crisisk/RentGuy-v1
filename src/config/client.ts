import { clientEnvSchema, type ClientEnv } from './env.schema'

const buildRawEnv = (env: ImportMetaEnv): Record<string, string | undefined> => ({
  VITE_APP_MODE: env.VITE_APP_MODE,
  VITE_API_BASE_URL: env.VITE_API_BASE_URL ?? env.VITE_API_URL ?? env.VITE_API_BASE,
  VITE_WS_BASE_URL: env.VITE_WS_BASE_URL ?? env.VITE_WS_URL ?? env.VITE_WS_BASE,
})

const normalise = (data: ClientEnv): ClientEnv => ({
  ...data,
  mode: data.VITE_APP_MODE,
  isPlannerMode: data.VITE_APP_MODE === 'planner',
  isScannerMode: data.VITE_APP_MODE === 'scanner',
})

export const loadClientEnv = (): ClientEnv => {
  const raw = buildRawEnv(import.meta.env)
  const parsed = clientEnvSchema.safeParse(raw)

  if (!parsed.success) {
    const flattened = parsed.error.flatten()
    const fieldErrors = Object.entries(flattened.fieldErrors)
      .map(([key, issues]) => `${key}: ${issues?.join(', ') ?? 'unknown error'}`)
      .join('; ')

    const message = `Invalid Vite environment configuration → ${fieldErrors}`
    console.error(message)
    throw new Error(message)
  }

  return normalise(parsed.data)
}
