const DB_NAME = 'rentguy-scanner'
const STORE_NAME = 'queued-scans'
const DB_VERSION = 1

const defaultWait = ms => new Promise(resolve => setTimeout(resolve, ms))
let waitImpl = defaultWait

let idbFactory = typeof indexedDB !== 'undefined' ? indexedDB : null
let memoryIndexedDB = null

function microTask(fn) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(fn)
  } else {
    Promise.resolve().then(fn)
  }
}

function createMemoryIndexedDB() {
  const stores = new Map()

  class MemoryObjectStore {
    constructor(options = {}) {
      this.records = new Map()
      this.keyPath = options.keyPath || 'id'
      this.autoIncrement = Boolean(options.autoIncrement)
      this.nextId = 1
    }

    add(value) {
      const record = { ...value }
      if (this.autoIncrement && record[this.keyPath] == null) {
        record[this.keyPath] = this.nextId++
      }
      this.records.set(record[this.keyPath], record)
      return record[this.keyPath]
    }

    delete(id) {
      this.records.delete(id)
    }

    getAll() {
      return createRequest(Array.from(this.records.values()).map(clone))
    }

    count() {
      return createRequest(this.records.size)
    }
  }

  class MemoryDB {
    constructor() {
      this.objectStoreNames = {
        contains: name => stores.has(name),
      }
    }

    createObjectStore(name, options) {
      if (!stores.has(name)) {
        stores.set(name, new MemoryObjectStore(options))
      }
      return stores.get(name)
    }

    transaction(name) {
      if (!stores.has(name)) {
        throw new Error(`Object store ${name} ontbreekt`)
      }
      const store = stores.get(name)
      const tx = {
        objectStore: () => store,
        oncomplete: null,
        onerror: null,
      }
      microTask(() => {
        if (tx.oncomplete) tx.oncomplete()
      })
      return tx
    }
  }

  const dbInstance = new MemoryDB()

  return {
    open() {
      const request = {
        result: dbInstance,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      }
      microTask(() => {
        if (request.onupgradeneeded) {
          request.onupgradeneeded({ target: { result: dbInstance } })
        }
        if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
          dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        }
        if (request.onsuccess) {
          request.onsuccess({ target: { result: dbInstance } })
        }
      })
      return request
    },
  }
}

function ensureIndexedDB() {
  if (idbFactory) return idbFactory
  if (!memoryIndexedDB) {
    memoryIndexedDB = createMemoryIndexedDB()
  }
  return memoryIndexedDB
}

function createRequest(result) {
  const request = {
    result: undefined,
    onsuccess: null,
    onerror: null,
  }
  microTask(() => {
    request.result = result
    if (request.onsuccess) {
      request.onsuccess({ target: { result } })
    }
  })
  return request
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const factory = ensureIndexedDB()
    const request = factory.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

function runTransaction(mode, fn) {
  return openDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode)
      const store = tx.objectStore(STORE_NAME)
      const result = fn(store)
      tx.oncomplete = () => resolve(result)
      tx.onerror = () => reject(tx.error)
    })
  })
}

export function queueScan(payload) {
  return runTransaction('readwrite', store => {
    store.add({ payload, createdAt: Date.now(), attempts: 0 })
  })
}

export function getQueuedScans() {
  return runTransaction('readonly', store => {
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  })
}

export function clearQueued(ids) {
  if (!ids.length) return Promise.resolve()
  return runTransaction('readwrite', store => {
    ids.forEach(id => store.delete(id))
  })
}

export function getQueueCount() {
  return runTransaction('readonly', store => {
    return new Promise((resolve, reject) => {
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  })
}

function wait(ms) {
  return waitImpl(ms)
}

function isRetryable(error) {
  if (!error) return true
  if (error.response) {
    return error.response.status >= 500 || error.response.status === 429
  }
  return true
}

export async function flushQueue(sendFn) {
  const records = await getQueuedScans()
  const processedIds = []
  for (const record of records) {
    let attempts = record.attempts || 0
    let sent = false
    while (!sent && attempts < 5) {
      try {
        await sendFn(record.payload)
        sent = true
      } catch (err) {
        attempts += 1
        if (!isRetryable(err) || attempts >= 5) {
          sent = true
        } else {
          await wait(2 ** attempts * 250)
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

export function __setTestOverrides(overrides = {}) {
  if (Object.prototype.hasOwnProperty.call(overrides, 'wait')) {
    waitImpl = overrides.wait ?? defaultWait
  }
  if (Object.prototype.hasOwnProperty.call(overrides, 'indexedDB')) {
    idbFactory = overrides.indexedDB
  }
}

export function __resetTestOverrides() {
  waitImpl = defaultWait
  idbFactory = typeof indexedDB !== 'undefined' ? indexedDB : null
  memoryIndexedDB = null
}
