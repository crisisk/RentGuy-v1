/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_API_URL?: string
    readonly VITE_APP_MODE?: string
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_APP_MODE?: 'planner' | 'scanner' | 'marketing'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
