declare module 'vitest' {
  export function describe(name: string, fn: () => void): void
  export function it(name: string, fn: () => void): void
  export function beforeEach(fn: () => void): void
  export function expect<T>(actual: T): {
    not: {
      toHaveBeenCalled(): void
      toHaveBeenCalledTimes(times: number): void
    }
    toEqual(expected: unknown): void
    toBe(expected: unknown): void
    toBeNull(): void
    toHaveBeenCalled(): void
    toHaveBeenCalledTimes(times: number): void
  }
  export const vi: {
    fn<T extends (...args: any[]) => any>(implementation?: T): T & {
      mock: { calls: Array<Parameters<T>> }
    }
  }
}
