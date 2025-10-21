import { useCallback, useRef, useSyncExternalStore } from 'react'

type Listener = () => void

export type StoreSelector<State extends object, Selected> = (
  state: State,
) => Selected

export type StoreRecipe<State extends object> = (draft: State) => void

export type StoreUpdater<State extends object> =
  | Partial<State>
  | State
  | StoreRecipe<State>

export interface StoreApi<State extends object> {
  getState(): State
  setState(update: StoreUpdater<State>): void
  subscribe(listener: Listener): () => void
}

export interface Store<State extends object> extends StoreApi<State> {
  useStore<Selected = State>(selector?: StoreSelector<State, Selected>): Selected
}

export type StoreInitializer<State extends object> = (
  set: Store<State>['setState'],
  get: Store<State>['getState'],
) => State

function cloneState<State extends object>(state: State): State {
  if (Array.isArray(state)) {
    return ([...state] as unknown) as State
  }

  return { ...(state as Record<string, unknown>) } as State
}

function shallowEqual<State extends object>(a: State, b: State): boolean {
  if (Object.is(a, b)) {
    return true
  }

  const aKeys = Reflect.ownKeys(a as Record<string, unknown>)
  const bKeys = Reflect.ownKeys(b as Record<string, unknown>)

  if (aKeys.length !== bKeys.length) {
    return false
  }

  for (const key of aKeys) {
    const aValue = (a as Record<PropertyKey, unknown>)[key]
    const bValue = (b as Record<PropertyKey, unknown>)[key]

    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false
    }

    if (!Object.is(aValue, bValue)) {
      return false
    }
  }

  return true
}

function ensureSelector<State extends object, Selected>(
  selector?: StoreSelector<State, Selected>,
): StoreSelector<State, Selected> {
  if (selector) {
    return selector
  }

  return ((value: State) => value) as unknown as StoreSelector<State, Selected>
}

export function createStore<State extends object>(
  initializer: StoreInitializer<State>,
): Store<State> {
  let state: State
  const listeners = new Set<Listener>()

  const notify = () => {
    for (const listener of listeners) {
      try {
        listener()
      } catch (error) {
        console.warn('Store listener failed', error)
      }
    }
  }

  const getState: Store<State>['getState'] = () => state

  const subscribe: Store<State>['subscribe'] = (listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const setState: Store<State>['setState'] = (update) => {
    const currentState = state
    let nextState: State

    if (typeof update === 'function') {
      const draft = cloneState(currentState)
      ;(update as StoreRecipe<State>)(draft)
      nextState = draft
    } else {
      const partial = update as Partial<State>
      let changed = false
      const draft = cloneState(currentState)

      for (const key of Reflect.ownKeys(partial as Record<string, unknown>)) {
        const typedKey = key as keyof State
        const nextValue = (partial as State)[typedKey]
        if (!Object.is(draft[typedKey], nextValue)) {
          changed = true
        }
        draft[typedKey] = nextValue
      }

      if (!changed) {
        return
      }

      nextState = draft
    }

    if (shallowEqual(currentState, nextState)) {
      return
    }

    state = nextState
    notify()
  }

  state = initializer(setState, getState)

  const useStore: Store<State>['useStore'] = (selector) => {
    const selectorRef = useRef(ensureSelector(selector))
    selectorRef.current = ensureSelector(selector)

    const getSnapshot = useCallback(
      () => selectorRef.current(getState()),
      [],
    )

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  }

  return {
    getState,
    setState,
    subscribe,
    useStore,
  }
}

export type { StoreInitializer as CreateStoreInitializer }
