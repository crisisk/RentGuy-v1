declare module '@infra/offline-queue' {
  export type BundleMode = 'explode' | 'book_all'

  export interface QueueRecord<TPayload = unknown> {
    id: number
    payload: TPayload
    createdAt: number
    attempts: number
  }

  export interface FlushResult {
    processed: number
    remaining: number
  }

  export type SendFunction<TPayload> = (payload: TPayload) => Promise<void>

  export interface QueueOverrides {
    wait?: ((ms: number) => Promise<void>) | null
    indexedDB?: IDBFactory | null
  }

  export function queueScan<TPayload>(payload: TPayload): Promise<void>
  export function getQueuedScans<TPayload = unknown>(): Promise<Array<QueueRecord<TPayload>>>
  export function clearQueued(ids: number[]): Promise<void>
  export function getQueueCount(): Promise<number>
  export function flushQueue<TPayload>(sendFn: SendFunction<TPayload>): Promise<FlushResult>
  export function __setTestOverrides(overrides?: QueueOverrides): void
  export function __resetTestOverrides(): void
}
