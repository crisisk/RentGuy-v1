declare module 'vite/client' {
  export interface ImportMetaEnv {
    readonly VITE_API_URL?: string
    readonly VITE_MODE?: string
  }

  export interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
