import { z } from 'zod'

export const EnvSchema = z
  .object({
    VITE_APP_MODE: z.string().optional(),
    VITE_API_BASE: z.string().optional(),
    VITE_API_URL: z.string().optional(),
  })
  .strip()

export type RawEnv = z.infer<typeof EnvSchema>
