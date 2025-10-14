declare module 'react-dom/client' {
  import type { ReactNode } from 'react'

  export interface Root {
    render(children: ReactNode): void
    unmount(): void
  }

  export interface RootOptions {
    identifierPrefix?: string
    onRecoverableError?(error: unknown): void
  }

  export function createRoot(container: Element | DocumentFragment, options?: RootOptions): Root
  export function hydrateRoot(
    container: Element | Document | DocumentFragment,
    initialChildren: ReactNode,
    options?: RootOptions
  ): Root
}
