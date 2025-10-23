declare module 'uuid' {
  export function v4(options?: {
    random?: readonly number[]
    rng?: () => readonly number[]
  }): string
}
