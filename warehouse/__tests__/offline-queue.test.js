import test from 'node:test'
import assert from 'node:assert/strict'

import {
  queueScan,
  getQueuedScans,
  clearQueued,
  flushQueue,
  __setTestOverrides,
  __resetTestOverrides,
} from '../offline-queue.js'

const immediateWait = () => Promise.resolve()

async function resetQueue() {
  __resetTestOverrides()
  __setTestOverrides({ wait: immediateWait })
  const items = await getQueuedScans()
  if (items.length) {
    await clearQueued(items.map(item => item.id))
  }
}

test('queueScan persists payloads with generated identifiers', async () => {
  await resetQueue()
  const payload = { tag: 'ABC123', qty: 2 }
  await queueScan(payload)
  const entries = await getQueuedScans()
  assert.equal(entries.length, 1)
  assert.ok(entries[0].id, 'record has an id assigned')
  assert.deepEqual(entries[0].payload, payload)
})

test('flushQueue retries transient failures and clears processed records', async () => {
  await resetQueue()
  await queueScan({ id: 1 })
  await queueScan({ id: 2 })

  let attempts = 0
  const sendFn = async payload => {
    attempts += 1
    if (payload.id === 1 && attempts < 2) {
      const error = new Error('temporary failure')
      error.response = { status: 500 }
      throw error
    }
  }

  const result = await flushQueue(sendFn)
  assert.equal(result.processed, 2)
  assert.equal(result.remaining, 0)
  assert.equal(attempts, 3, 'first payload retried once before success')
})

test('flushQueue treats non-retryable errors as processed to avoid infinite loops', async () => {
  await resetQueue()
  await queueScan({ id: 3 })

  const sendFn = async () => {
    const error = new Error('bad request')
    error.response = { status: 400 }
    throw error
  }

  const result = await flushQueue(sendFn)
  assert.equal(result.processed, 1)
  assert.equal(result.remaining, 0)
})
