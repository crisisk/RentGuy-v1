declare module 'vite' {
  export interface ConfigEnv {
    mode: string
    command: 'build' | 'serve'
  }

  export interface UserConfig {
    plugins?: unknown[]
    resolve?: Record<string, unknown>
    server?: Record<string, unknown>
  }

  export function defineConfig(config: UserConfig | ((env: ConfigEnv) => UserConfig)): UserConfig
}
