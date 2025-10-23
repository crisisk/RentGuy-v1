declare module 'vite' {
  export interface TransformResult {
    code: string
    map?: unknown
  }

  export interface ModuleNode {
    id: string
    url: string
  }

  export interface AliasOptions {
    entries?: Array<{ find: string; replacement: string }>
  }

  export interface DepOptimizationConfig {
    entries?: string[]
  }

  export interface ServerOptions {
    port?: number
    host?: string | boolean
    strictPort?: boolean
    middlewareMode?: boolean | 'ssr' | 'html'
  }

  export interface ConfigEnv {
    mode: string
    command: 'build' | 'serve'
  }

  export interface UserConfig {
    plugins?: unknown[]
    resolve?: Record<string, unknown>
    server?: ServerOptions
    optimizeDeps?: DepOptimizationConfig
    define?: Record<string, string>
    base?: string
    root?: string
    build?: Record<string, unknown>
    logLevel?: 'info' | 'warn' | 'error' | 'silent'
  }

  export interface ViteDevServer {
    config: UserConfig
    transformRequest(url: string): Promise<TransformResult | null>
    listen(port?: number, isRestart?: boolean): Promise<ViteDevServer>
    close(): Promise<void>
    ws: { send(payload: unknown): void }
  }

  export function defineConfig(config: UserConfig | ((env: ConfigEnv) => UserConfig)): UserConfig
}
