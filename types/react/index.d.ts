// Minimal React type declarations to unblock strict type-checking in constrained environments.
declare namespace React {
  type Key = string | number

  interface Attributes {
    key?: Key | null
  }

  interface ClassAttributes<T> extends Attributes {
    ref?: React.Ref<T>
  }

  type ReactText = string | number
  type ReactNode = ReactElement | ReactText | boolean | null | undefined | Iterable<ReactNode>

  interface ReactElement<P = any, T extends React.ElementType = React.ElementType> {
    type: T
    props: P
    key: Key | null
  }

  type ElementType<P = any> =
    | string
    | ((props: P, context?: any) => ReactElement<any, any> | null)
    | (new (props: P, context?: any) => React.Component<any>)

  interface Component<P = {}, S = {}> {
    props: Readonly<P>
    state: Readonly<S>
    setState<K extends keyof S>(
      state: Pick<S, K> | S | ((prevState: Readonly<S>, props: Readonly<P>) => Pick<S, K> | S | null)
    ): void
    forceUpdate(callback?: () => void): void
  }

  interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): ReactElement | null
    displayName?: string
    defaultProps?: Partial<P>
  }

  type FC<P = {}> = FunctionComponent<P>
  type PropsWithChildren<P = {}> = P & { children?: ReactNode }
  type Dispatch<A> = (value: A) => void
  type SetStateAction<S> = S | ((prevState: S) => S)

  interface RefObject<T> {
    readonly current: T | null
  }

  type MutableRefObject<T> = { current: T }
  type RefCallback<T> = (instance: T | null) => void
  type Ref<T> = RefCallback<T> | MutableRefObject<T> | null

  interface SyntheticEvent<T = Element> {
    target: T
    currentTarget: T
    preventDefault(): void
    stopPropagation(): void
  }

  interface FormEvent<T = Element> extends SyntheticEvent<T> {}

  interface ChangeEvent<T = Element> extends SyntheticEvent<T> {}

  interface CSSProperties {
    [key: string]: string | number | undefined
  }

  function createElement<P>(type: ElementType<P>, props?: P, ...children: ReactNode[]): ReactElement
  function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
  function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>]
  function useEffect(effect: () => void | (() => void), deps?: any[]): void
  function useMemo<T>(factory: () => T, deps: any[]): T
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T
  function useRef<T>(initialValue: T): MutableRefObject<T>
  function useRef<T>(initialValue: T | null): RefObject<T>
  function useReducer<R extends (state: any, action: any) => any, I>(
    reducer: R,
    initialArg: I,
    init?: (arg: I) => any
  ): [ReturnType<R>, Dispatch<Parameters<R>[1]>]

  const Fragment: unique symbol
}

declare module 'react' {
  export = React
  export as namespace React

  export const createElement: typeof React.createElement
  export const useState: typeof React.useState
  export const useEffect: typeof React.useEffect
  export const useMemo: typeof React.useMemo
  export const useCallback: typeof React.useCallback
  export const useRef: typeof React.useRef

  export type FC<P = {}> = React.FC<P>
  export type PropsWithChildren<P = {}> = React.PropsWithChildren<P>
  export type ReactNode = React.ReactNode
  export type ReactElement<P = any, T extends React.ElementType = React.ElementType> = React.ReactElement<P, T>
  export type FormEvent<T = Element> = React.FormEvent<T>
  export type ChangeEvent<T = Element> = React.ChangeEvent<T>
  export type CSSProperties = React.CSSProperties
}

declare namespace JSX {
  interface Element extends React.ReactElement {}
  interface ElementClass extends React.Component<any> {}
  interface IntrinsicElements {
    [elemName: string]: any
  }
}
