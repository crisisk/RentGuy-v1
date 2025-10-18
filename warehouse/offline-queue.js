// @ts-check

const DB_NAME = 'rentguy-scanner'
const STORE_NAME = 'queued-scans'
const DB_VERSION = 1
const MAX_ATTEMPTS = 5
const BASE_BACKOFF_MS = 250

/**
 * @template TPayload
 * @typedef {{
 *   id: number
 *   payload: TPayload
 *   createdAt: number
 *   attempts: number
 * }} QueueRecord
 */

/**
 * @template TPayload
 * @typedef {{
 *   payload: TPayload
 *   createdAt: number
 *   attempts: number
 * }} NewQueueRecord
 */

/**
 * @typedef {{ processed: number; remaining: number }} FlushResult
 */

/**
 * @typedef {(ms: number) => Promise<void>} WaitFunction
 */

/**
 * @typedef {{
 *   wait?: WaitFunction | null
 *   indexedDB?: IDBFactory | null
 * }} QueueOverrides
 */

/** @type {WaitFunction} */
const defaultWait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/** @type {WaitFunction} */
let waitImpl = defaultWait

/** @type {IDBFactory | null} */
let idbFactory = typeof indexedDB !== 'undefined' ? indexedDB : null

/** @type {Array<QueueRecord<unknown>>} */
let memoryQueue = []

let memoryNextId = 1

function currentIndexedDB() {
  return idbFactory ?? (typeof indexedDB !== 'undefined' ? indexedDB : null)
}

function hasIndexedDB() {
  return currentIndexedDB() !== null
}

/**
 * @template TPayload
 * @param {QueueRecord<TPayload>} record
 * @returns {QueueRecord<TPayload>}
 */
function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record))
}

/**
 * @template TPayload
 * @param {NewQueueRecord<TPayload>} record
 * @param {number} id
 * @returns {QueueRecord<TPayload>}
 */
function ensureMemoryRecord(record, id) {
  return /** @type {QueueRecord<TPayload>} */ ({
    id,
    payload: record.payload,
    createdAt: record.createdAt,
    attempts: record.attempts,
  })
}

/**
 * @template TPayload
 * @param {NewQueueRecord<TPayload>} record
 */
async function persistInIndexedDB(record) {
  const factory = currentIndexedDB()
  if (!factory) {
    throw new Error('IndexedDB is niet beschikbaar')
  }
  const db = await openDatabase(factory)
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add(record)
    request.onsuccess = () => resolve(undefined)
    request.onerror = () => reject(request.error ?? new Error('Kon record niet opslaan'))
  })
}

/**
 * @template TPayload
 * @param {TPayload} payload
 */
export async function queueScan(payload) {
  const record = /** @type {NewQueueRecord<TPayload>} */ ({
    payload,
    createdAt: Date.now(),
    attempts: 0,
  })

  if (hasIndexedDB()) {
    await persistInIndexedDB(record)
    return
  }

  memoryQueue.push(ensureMemoryRecord(record, memoryNextId++))
}

/**
 * @template TPayload
 * @returns {Promise<Array<QueueRecord<TPayload>>>}
 */
export async function getQueuedScans() {
  if (hasIndexedDB()) {
    const factory = currentIndexedDB()
    if (!factory) {
      return []
    }
    const db = await openDatabase(factory)
    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()
      request.onsuccess = () => {
        const value = Array.isArray(request.result) ? request.result : []
        resolve(value)
      }
      request.onerror = () => reject(request.error ?? new Error('Kon wachtrij niet lezen'))
    })
    const rawRecords = /** @type {Array<Record<string, unknown>>} */ (records)
    return rawRecords.map((record, index) => {
      const identifier = typeof record.id === 'number' ? record.id : index + 1
      return /** @type {QueueRecord<TPayload>} */ ({
        id: identifier,
        payload: /** @type {TPayload} */ (record.payload),
        createdAt: typeof record.createdAt === 'number' ? record.createdAt : Date.now(),
        attempts: typeof record.attempts === 'number' ? record.attempts : 0,
      })
    })
  }

  const typedMemory = /** @type {Array<QueueRecord<TPayload>>} */ (memoryQueue)
  return typedMemory.map(item => cloneRecord(item))
}

/**
 * @param {number[]} ids
 */
export async function clearQueued(ids) {
  if (!ids.length) {
    return
  }

  if (hasIndexedDB()) {
    const factory = currentIndexedDB()
    if (!factory) {
      return
    }
    const db = await openDatabase(factory)
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      ids.forEach(id => {
        store.delete(id)
      })
      tx.oncomplete = () => resolve(undefined)
      tx.onerror = () => reject(tx.error ?? new Error('Kon wachtrijrecords niet verwijderen'))
    })
    return
  }

  memoryQueue = memoryQueue.filter(item => !ids.includes(item.id))
}

export async function getQueueCount() {
  if (hasIndexedDB()) {
    const factory = currentIndexedDB()
    if (!factory) {
      return memoryQueue.length
    }
    const db = await openDatabase(factory)
    const count = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.count()
      request.onsuccess = () => resolve(Number(request.result) || 0)
      request.onerror = () => reject(request.error ?? new Error('Kon wachtrijgrootte niet bepalen'))
    })
    return typeof count === 'number' ? count : 0
  }

  return memoryQueue.length
}

/**
 * @param {unknown} error
 */
function isRetryable(error) {
  if (!error) {
    return true
  }
  if (error && typeof error === 'object' && 'response' in error) {
    const response = /** @type {{ status?: number }} */ (error.response)
    if (typeof response.status === 'number') {
      return response.status >= 500 || response.status === 429
    }
  }
  return true
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function wait(ms) {
  return waitImpl(ms)
}

/**
 * @template TPayload
 * @param {(payload: TPayload) => Promise<void>} sendFn
 * @returns {Promise<FlushResult>}
 */
export async function flushQueue(sendFn) {
  const records = await getQueuedScans()
  const processedIds = []

  for (const record of records) {
    let attempts = record.attempts || 0
    let sent = false

    while (!sent && attempts < MAX_ATTEMPTS) {
      try {
        await sendFn(/** @type {TPayload} */ (record.payload))
        sent = true
      } catch (error) {
        attempts += 1
        if (!isRetryable(error) || attempts >= MAX_ATTEMPTS) {
          sent = true
        } else {
          await wait(2 ** attempts * BASE_BACKOFF_MS)
        }
      }
    }

    if (sent) {
      processedIds.push(record.id)
    }
  }

  await clearQueued(processedIds)
  const remaining = await getQueueCount()
  return { processed: processedIds.length, remaining }
}

/**
 * @param {QueueOverrides} [overrides]
 */
export function __setTestOverrides(overrides = {}) {
  if (Object.prototype.hasOwnProperty.call(overrides, 'wait')) {
    waitImpl = overrides.wait ?? defaultWait
  }
  if (Object.prototype.hasOwnProperty.call(overrides, 'indexedDB')) {
    idbFactory = overrides.indexedDB ?? null
  }
}

export function __resetTestOverrides() {
  waitImpl = defaultWait
  idbFactory = typeof indexedDB !== 'undefined' ? indexedDB : null
  memoryQueue = []
  memoryNextId = 1
}

/**
 * @param {IDBFactory} factory
 */
function openDatabase(factory) {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('Kon IndexedDB niet openen'))
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}
