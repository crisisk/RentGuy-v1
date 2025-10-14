declare module 'react' {
  export type ReactNode = any
  export interface Attributes {
    key?: string | number
  }
  export interface CSSProperties {
    [key: string]: string | number | undefined
  }
  export interface FC<P = {}> {
    (props: P): ReactNode | null
  }
  export function useState<T>(initial: T): [T, (value: T) => void]
  export function useEffect(effect: (...args: any[]) => void, deps?: any[]): void
  export function useRef<T>(value: T): { current: T }
  export function useMemo<T>(factory: () => T, deps: any[]): T
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps: any[]): T
  export const Fragment: any
  const React: { Fragment: any }
  export default React
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): { render(children: any): void }
}

declare module 'react/jsx-runtime' {
  export const jsx: any
  export const jsxs: any
  export const Fragment: any
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
}
