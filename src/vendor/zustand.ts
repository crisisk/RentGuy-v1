import { useCallback, useRef, useSyncExternalStore } from 'react'

export type SetState<State> = (
  update: Partial<State> | State | ((draft: State) => void),
) => void

export type GetState<State> = () => State

export type StateCreator<State extends object> = (
  set: SetState<State>,
  get: GetState<State>,
) => State

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

const identitySelector = <State,>(value: State): State => value

function ensureSelector<State extends object, Selected>(
  selector?: (state: State) => Selected,
): (state: State) => Selected {
  if (selector) {
    return selector
  }
  return identitySelector as unknown as (state: State) => Selected
}

export function create<State extends object>(
  initializer: StateCreator<State>,
): Store<State> {
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
      ;(update as (draft: State) => void)(draft)
      nextState = draft
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

  state = initializer(setState, getState)

  function useBoundStore<Selected>(
    selector?: (state: State) => Selected,
  ): Selected {
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
