/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_APP_MODE?: 'planner' | 'scanner'
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE?: string
  readonly VITE_WS_BASE_URL?: string
  readonly VITE_WS_URL?: string
  readonly VITE_WS_BASE?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
