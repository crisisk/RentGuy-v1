const GLOBAL_KEY = '__vitestRuntime'

function createSuite(name, parent = null) {
  return {
    name,
    parent,
    beforeEach: [],
    tests: [],
    children: [],
  }
}

function clonePath(suite) {
  const segments = []
  let current = suite
  while (current && current.parent) {
    segments.unshift(current.name)
    current = current.parent
  }
  return segments
}

function isMockFunction(fn) {
  return typeof fn === 'function' && fn.mock && Array.isArray(fn.mock.calls)
}

function deepEqual(a, b) {
  if (a === b) {
    return true
  }
  if (typeof a !== typeof b) {
    return false
  }
  if (typeof a !== 'object' || a === null || b === null) {
    return false
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false
    }
    return a.every((value, index) => deepEqual(value, b[index]))
  }
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every(key => deepEqual(a[key], b[key]))
}

function formatPath(pathSegments, testName) {
  if (!pathSegments.length) {
    return testName
  }
  return `${pathSegments.join(' › ')} › ${testName}`
}

function createRuntime() {
  return {
    root: createSuite('[root]'),
    stack: [],
    reset() {
      this.root = createSuite('[root]')
      this.stack = [this.root]
    },
    current() {
      const currentSuite = this.stack[this.stack.length - 1]
      if (!currentSuite) {
        throw new Error('No active test suite. Did you forget to wrap tests in describe()?')
      }
      return currentSuite
    },
    describe(name, fn) {
      const parent = this.current()
      const suite = createSuite(name, parent)
      parent.children.push(suite)
      this.stack.push(suite)
      try {
        fn()
      } finally {
        this.stack.pop()
      }
    },
    beforeEach(fn) {
      this.current().beforeEach.push(fn)
    },
    it(name, fn) {
      this.current().tests.push({ name, fn })
    },
    async run() {
      const results = []
      await runSuite(this.root, [], results)
      return { tests: results }
    },
  }
}

async function runSuite(suite, inheritedBeforeEach, results) {
  const pathSegments = clonePath(suite)
  const beforeEachFns = [...inheritedBeforeEach, ...suite.beforeEach]
  for (const test of suite.tests) {
    try {
      for (const hook of beforeEachFns) {
        await hook()
      }
      await test.fn()
      results.push({ status: 'passed', title: formatPath(pathSegments, test.name) })
    } catch (error) {
      results.push({ status: 'failed', title: formatPath(pathSegments, test.name), error })
    }
  }
  for (const child of suite.children) {
    await runSuite(child, beforeEachFns, results)
  }
}

function ensureRuntime() {
  const globalObject = globalThis
  if (!globalObject[GLOBAL_KEY]) {
    const runtime = createRuntime()
    runtime.reset()
    globalObject[GLOBAL_KEY] = runtime
  }
  return globalObject[GLOBAL_KEY]
}

function createExpectation(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`)
      }
    },
    toEqual(expected) {
      if (!deepEqual(actual, expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`)
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected ${actual} to be null`)
      }
    },
    toHaveBeenCalled() {
      if (!isMockFunction(actual) || actual.mock.calls.length === 0) {
        throw new Error('Expected mock function to have been called')
      }
    },
    toHaveBeenCalledTimes(times) {
      if (!isMockFunction(actual) || actual.mock.calls.length !== times) {
        throw new Error(`Expected mock to have been called ${times} times but was called ${isMockFunction(actual) ? actual.mock.calls.length : 0} times`)
      }
    },
    get not() {
      return {
        toHaveBeenCalled: () => {
          if (isMockFunction(actual) && actual.mock.calls.length > 0) {
            throw new Error('Expected mock not to have been called')
          }
        },
        toHaveBeenCalledTimes: times => {
          if (isMockFunction(actual) && actual.mock.calls.length === times) {
            throw new Error(`Expected mock not to have been called ${times} times`)
          }
        },
      }
    },
  }
}

export function describe(name, fn) {
  ensureRuntime().describe(name, fn)
}

export function it(name, fn) {
  ensureRuntime().it(name, fn)
}

export function beforeEach(fn) {
  ensureRuntime().beforeEach(fn)
}

export function expect(actual) {
  return createExpectation(actual)
}

export const vi = {
  fn(implementation) {
    const mockFn = function (...args) {
      mockFn.mock.calls.push(args)
      return implementation ? implementation.apply(this, args) : undefined
    }
    mockFn.mock = { calls: [] }
    return mockFn
  },
}

export function resetSuites() {
  ensureRuntime().reset()
}

export async function runSuites() {
  return ensureRuntime().run()
}

export function getRuntime() {
  return ensureRuntime()
}

ensureRuntime()
