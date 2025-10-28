import type { GetState, SetState, StateCreator } from './zustand'

export function immer<
  State extends object,
  CustomSetState = SetState<State>,
  CustomGetState = GetState<State>,
  StoreApiExt = {},
>(
  initializer: StateCreator<State, CustomSetState, CustomGetState, StoreApiExt>,
): StateCreator<State, CustomSetState, CustomGetState, StoreApiExt> {
  return initializer
}
