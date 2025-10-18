/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
  readonly RENTGUY_API_URL: string
  readonly VITE_DEFAULT_TENANT?: string
  readonly VITE_ANALYTICS_DEFAULT_TENANT?: string
  readonly VITE_ANALYTICS_TENANTS?: string
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

