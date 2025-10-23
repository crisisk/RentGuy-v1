declare module 'vitest' {
  export function describe(name: string, fn: () => void): void
  export function it(name: string, fn: () => void): void
  export function beforeEach(fn: () => void): void

  export interface Expectation<T> {
    not: Expectation<T>
    toEqual(expected: unknown): void
    toBe(expected: unknown): void
    toBeNull(): void
    toBeTruthy(): void
    toBeFalsy(): void
    toHaveBeenCalled(): void
    toHaveBeenCalledTimes(times: number): void
    toContain(expected: unknown): void
  }

  export function expect<T>(actual: T): Expectation<T>

  export type Mock<T extends (...args: any[]) => any> = T & {
    mock: { calls: Array<Parameters<T>> }
    mockReset(): Mock<T>
    mockResolvedValue(value: ReturnType<T>): Mock<T>
    mockResolvedValueOnce(value: ReturnType<T>): Mock<T>
    mockRejectedValue(value: unknown): Mock<T>
    mockRejectedValueOnce(value: unknown): Mock<T>
    mockReturnValue(value: ReturnType<T>): Mock<T>
    mockReturnValueOnce(value: ReturnType<T>): Mock<T>
  }

  export const vi: {
    fn<T extends (...args: any[]) => any>(implementation?: T): Mock<T>
    mock<T>(path: string, factory: () => T): void
    mocked<T>(item: T): T extends (...args: any[]) => any ? Mock<T> : T
    restoreAllMocks(): void
    clearAllMocks(): void
    resetAllMocks(): void
  }
}
