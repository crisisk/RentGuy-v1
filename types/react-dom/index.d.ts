declare module 'react-dom' {
  import type { ReactNode } from 'react'

  export function createPortal(children: ReactNode, container: Element | DocumentFragment): ReactNode
  export function render(children: ReactNode, container: Element | DocumentFragment): void
  export function hydrate(children: ReactNode, container: Element | Document): void
}
