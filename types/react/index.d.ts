// Lightweight React type declarations to allow strict builds without the official @types/react package.
declare module 'react' {
  export type ReactNode = ReactElement | string | number | boolean | null | undefined

  export interface ReactElement<P = any> {
    type: any
    props: P
    key: string | number | null
  }

  export type PropsWithChildren<P = {}> = P & { children?: ReactNode }

  export interface FunctionComponent<P = {}> {
    (props: PropsWithChildren<P>): ReactElement | null
    displayName?: string
  }

  export type FC<P = {}> = FunctionComponent<P>

  export interface CSSProperties {
    [key: string]: string | number | undefined
  }

  export interface SyntheticEvent<T = Element> {
    target: T
    currentTarget: T
    preventDefault(): void
    stopPropagation(): void
  }

  export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {}
  export interface FormEvent<T = Element> extends SyntheticEvent<T> {}

  export type Dispatch<A> = (value: A) => void
  export type SetStateAction<S> = S | ((prevState: S) => S)
  export interface RefObject<T> {
    current: T | null
  }

  export function createElement<P>(type: any, props?: P, ...children: ReactNode[]): ReactElement<P>
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>]
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void
  export function useMemo<T>(factory: () => T, deps: unknown[]): T
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: unknown[]): T
  export function useRef<T>(initialValue: T | null): RefObject<T>
  export function useReducer<R extends (state: any, action: any) => any, I>(
    reducer: R,
    initialArg: I,
    init?: (arg: I) => any
  ): [ReturnType<R>, Dispatch<Parameters<R>[1]>]

  export const Fragment: unique symbol
}

declare global {
  namespace JSX {
    type Element = import('react').ReactElement
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

export {}
