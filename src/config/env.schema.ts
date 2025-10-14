import { z } from 'zod'

export const clientEnvSchema = z.object({
  VITE_APP_MODE: z.enum(['planner', 'scanner']).default('planner'),
  VITE_API_BASE_URL: z.string().url().default('http://localhost:8000'),
  VITE_WS_BASE_URL: z.string().url().default('ws://localhost:8000'),
})

export type ClientEnvSchema = z.input<typeof clientEnvSchema>
export type ClientEnv = z.output<typeof clientEnvSchema> & {
  readonly mode: 'planner' | 'scanner'
  readonly isPlannerMode: boolean
  readonly isScannerMode: boolean
}
