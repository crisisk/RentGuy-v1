import { useCallback, useRef, useSyncExternalStore } from 'react'

export type SetState<State extends object> = (
  update: Partial<State> | State | ((draft: State) => void | Partial<State> | State),
) => void

export type GetState<State> = () => State

export type StateCreator<
  State extends object,
  CustomSetState = SetState<State>,
  CustomGetState = GetState<State>,
  StoreApiExt = unknown,
> = (set: CustomSetState, get: CustomGetState, api: StoreApiExt) => State

export interface StoreApi<State extends object> {
  getState: GetState<State>
  setState: SetState<State>
  subscribe(listener: () => void): () => void
}

export type Store<State extends object> = StoreApi<State> & {
  <Selected>(selector?: (state: State) => Selected): Selected
}

function cloneState<State extends object>(state: State): State {
  return { ...(state as Record<string, unknown>) } as State
}

const identitySelector = <State>(value: State): State => value

function ensureSelector<State extends object, Selected>(
  selector?: (state: State) => Selected,
): (state: State) => Selected {
  if (selector) {
    return selector
  }
  return identitySelector as unknown as (state: State) => Selected
}

type BoundStore<State extends object> = Store<State>

function initialiseStore<
  State extends object,
  CustomSetState = SetState<State>,
  CustomGetState = GetState<State>,
  StoreApiExt = unknown,
>(
  initializer: StateCreator<State, CustomSetState, CustomGetState, StoreApiExt>,
): BoundStore<State> {
  let state = {} as State
  const listeners = new Set<() => void>()

  const getState: GetState<State> = () => state

  const subscribe: StoreApi<State>['subscribe'] = (listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const setState: StoreApi<State>['setState'] = (update) => {
    const currentState = state
    let nextState: State

    if (typeof update === 'function') {
      const draft = cloneState(currentState)
      const result = (update as (draft: State) => void | Partial<State> | State)(draft)
      if (result && typeof result === 'object') {
        nextState = {
          ...(currentState as Record<string, unknown>),
          ...(result as Record<string, unknown>),
        } as State
      } else {
        nextState = draft
      }
    } else {
      nextState = {
        ...(currentState as Record<string, unknown>),
        ...(update as Record<string, unknown>),
      } as State
    }

    if (Object.is(currentState, nextState)) {
      return
    }

    state = nextState

    listeners.forEach((listener) => {
      try {
        listener()
      } catch (error) {
        console.warn('Zustand listener error', error)
      }
    })
  }

  const api = undefined as unknown as StoreApiExt
  state = initializer(setState as CustomSetState, getState as CustomGetState, api)

  function useBoundStore<Selected>(selector?: (state: State) => Selected): Selected {
    const selectorRef = useRef(ensureSelector(selector))
    selectorRef.current = ensureSelector(selector)

    const getSnapshot = useCallback(() => selectorRef.current(getState()), [])

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  }

  ;(useBoundStore as Store<State>).getState = getState
  ;(useBoundStore as Store<State>).setState = (update) => {
    setState(update)
  }
  ;(useBoundStore as Store<State>).subscribe = subscribe

  return useBoundStore as Store<State>
}

export function create<State extends object>(): <CustomSetState, CustomGetState, StoreApiExt>(
  initializer: StateCreator<State, CustomSetState, CustomGetState, StoreApiExt>,
) => BoundStore<State>
export function create<State extends object, CustomSetState, CustomGetState, StoreApiExt>(
  initializer: StateCreator<State, CustomSetState, CustomGetState, StoreApiExt>,
): BoundStore<State>
export function create<State extends object, CustomSetState, CustomGetState, StoreApiExt>(
  initializer?: StateCreator<State, CustomSetState, CustomGetState, StoreApiExt>,
):
  | BoundStore<State>
  | ((
      initializer: StateCreator<State, CustomSetState, CustomGetState, StoreApiExt>,
    ) => BoundStore<State>) {
  if (!initializer) {
    return (
      initialiserArgument: StateCreator<State, CustomSetState, CustomGetState, StoreApiExt>,
    ) => initialiseStore(initialiserArgument)
  }

  return initialiseStore(initializer)
}

// Default export for backward compatibility
export default create
