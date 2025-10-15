import type { StateCreator } from './zustand'

export function immer<State extends object>(
  initializer: StateCreator<State>,
): StateCreator<State> {
  return initializer
}
