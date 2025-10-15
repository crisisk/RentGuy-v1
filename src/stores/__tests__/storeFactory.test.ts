import { describe, expect, it, vi } from 'vitest'

import { createStore } from '../storeFactory'

interface CounterStore {
  count: number
  history: number[]
  setCount(value: number): void
  addHistory(value: number): void
}

interface StringStore {
  value: string
  setValue(next: string): void
}

describe('createStore', () => {
  it('updates state with partial objects and recipes', () => {
    const store = createStore<CounterStore>((set) => ({
      count: 1,
      history: [1],
      setCount: (value: number) => {
        set({ count: value })
      },
      addHistory: (value: number) => {
        set((draft) => {
          draft.history = [...draft.history, value]
        })
      },
    }))

    const initial = store.getState()
    expect(initial.count).toBe(1)

    initial.setCount(5)
    expect(store.getState().count).toBe(5)

    initial.addHistory(5)
    expect(store.getState().history).toEqual([1, 5])
  })

  it('notifies subscribers on change', () => {
    const store = createStore<StringStore>((set) => ({
      value: 'initial',
      setValue: (next: string) => set({ value: next }),
    }))

    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    expect(listener).not.toHaveBeenCalled()

    store.getState().setValue('updated')
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    store.getState().setValue('again')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
