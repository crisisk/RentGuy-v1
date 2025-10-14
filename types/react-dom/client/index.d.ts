import type { ReactNode } from 'react'

declare interface Root {
  render(children: ReactNode): void
  unmount(): void
}

declare function createRoot(container: Element | DocumentFragment): Root

declare module 'react-dom/client' {
  export { createRoot }
  export type { Root }
}
