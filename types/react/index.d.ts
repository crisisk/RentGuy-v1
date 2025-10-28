// Lightweight React type declarations to allow strict builds without the official @types/react package.
declare module 'react' {
  export type ReactNode = ReactElement | string | number | boolean | null | undefined | ReactNode[]

  export interface ReactElement<P = any> {
    type: any
    props: P
    key: string | number | null
  }

  export type PropsWithChildren<P = {}> = P & { children?: ReactNode }

  export type ComponentType<P = {}> = (props: PropsWithChildren<P>) => ReactElement | null

  export interface FunctionComponent<P = {}> {
    (props: PropsWithChildren<P>): ReactElement | null
    displayName?: string
  }

  export type FC<P = {}> = FunctionComponent<P>

  export interface LazyExoticComponent<T extends ComponentType<any>>
    extends FunctionComponent<Parameters<T>[0]> {
    readonly _payload?: unknown
    readonly _init?: unknown
  }

  export function lazy<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>,
  ): LazyExoticComponent<T>

  export interface SuspenseProps {
    readonly fallback?: ReactNode
    readonly children?: ReactNode
  }

  export const Suspense: FunctionComponent<SuspenseProps>

  export interface Context<T> {
    Provider: FunctionComponent<{ value: T }>
    Consumer: FunctionComponent<{ children: (value: T) => ReactNode }>
    _currentValue?: T
  }

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
  export interface MouseEvent<T = Element> extends SyntheticEvent<T> {}
  export interface DragEvent<T = Element> extends SyntheticEvent<T> {
    dataTransfer: DataTransfer | null
  }
  export interface KeyboardEvent<T = Element> extends SyntheticEvent<T> {
    key: string
  }

  export interface DataTransfer {
    setData(format: string, data: string): void
    getData(format: string): string
    effectAllowed: string
    dropEffect: string
    setDragImage(image: Element, x: number, y: number): void
  }

  export type Dispatch<A> = (value: A) => void
  export type SetStateAction<S> = S | ((prevState: S) => S)
  export interface RefObject<T> {
    current: T | null
  }
  export interface MutableRefObject<T> {
    current: T
  }
  export type RefCallback<T> = (instance: T | null) => void
  export type ForwardedRef<T> = RefObject<T> | RefCallback<T> | null

  export function createElement<P>(type: any, props?: P, ...children: ReactNode[]): ReactElement<P>
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
  export function useState<S = undefined>(): [
    S | undefined,
    Dispatch<SetStateAction<S | undefined>>,
  ]
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void
  export function useLayoutEffect(effect: () => void | (() => void), deps?: unknown[]): void
  export function useMemo<T>(factory: () => T, deps: unknown[]): T
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: unknown[]): T
  export function useRef<T>(initialValue: T): MutableRefObject<T>
  export function useRef<T>(initialValue: T | null): RefObject<T>
  export function useImperativeHandle<T>(
    ref: ForwardedRef<T>,
    init: () => T,
    deps?: unknown[],
  ): void
  export function useReducer<R extends (state: any, action: any) => any, I>(
    reducer: R,
    initialArg: I,
    init?: (arg: I) => any,
  ): [ReturnType<R>, Dispatch<Parameters<R>[1]>]
  export function useContext<T>(context: Context<T>): T
  export function useId(): string
  export function useSyncExternalStore<T>(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => T,
    getServerSnapshot?: () => T,
  ): T

  export function createContext<T>(defaultValue: T): Context<T>
  export function createRef<T>(): RefObject<T>
  export function forwardRef<T, P = {}>(
    render: (props: PropsWithChildren<P>, ref: ForwardedRef<T>) => ReactElement | null,
  ): FunctionComponent<P & { ref?: ForwardedRef<T> }>
  export function memo<T>(
    component: FunctionComponent<T>,
    propsAreEqual?: (prev: T, next: T) => boolean,
  ): FunctionComponent<T>

  export const Fragment: FunctionComponent<{ children?: ReactNode; key?: string | number }>
  export const StrictMode: FunctionComponent

  export const Children: {
    only(children: ReactNode): ReactElement
    count(children: ReactNode): number
    toArray(children: ReactNode): ReactElement[]
  }
}

declare global {
  namespace JSX {
    type Element = any
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

export {}
