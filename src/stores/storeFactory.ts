import { useCallback, useRef, useSyncExternalStore } from 'react'

export type Listener = () => void

export interface StoreApi<State> {
  getState(): State
  setState(update: Partial<State> | ((draft: State) => void)): void
  subscribe(listener: Listener): () => void
}

export interface Store<State> extends StoreApi<State> {
  useStore(): State
  useStore<Selected>(selector: (state: State) => Selected): Selected
}

type Selector<State, Selected> = (state: State) => Selected

const defaultSelector = <State,>(state: State): State => state

function cloneState<State extends object>(state: State): State {
  return { ...(state as Record<string, unknown>) } as State
}

export function createStore<State extends object>(
  initializer: (
    set: StoreApi<State>['setState'],
    get: StoreApi<State>['getState'],
  ) => State,
): Store<State> {
  let state: State = {} as State
  const listeners = new Set<Listener>()

  const getState: StoreApi<State>['getState'] = () => state

  const notify = () => {
    listeners.forEach((listener) => {
      try {
        listener()
      } catch (error) {
        console.warn('Store listener failed', error)
      }
    })
  }

  const setState: StoreApi<State>['setState'] = (update) => {
    const currentState = state
    let nextState: State

    if (typeof update === 'function') {
      const draft = cloneState(currentState)
      ;(update as (draft: State) => void)(draft)
      nextState = draft
    } else {
      nextState = { ...(currentState as Record<string, unknown>), ...(update as Record<string, unknown>) } as State
    }

    if (Object.is(currentState, nextState)) {
      return
    }

    state = nextState
    notify()
  }

  const subscribe: StoreApi<State>['subscribe'] = (listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  state = initializer(setState, getState)

  function useStore(): State
  function useStore<Selected>(selector: Selector<State, Selected>): Selected
  function useStore<Selected>(selector: Selector<State, Selected> = defaultSelector as Selector<State, Selected>): Selected {
    const selectorRef = useRef(selector)
    selectorRef.current = selector

    const getSnapshot = useCallback(() => selectorRef.current(getState()), [])

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  }

  return {
    getState,
    setState,
    subscribe,
    useStore,
  }
}
