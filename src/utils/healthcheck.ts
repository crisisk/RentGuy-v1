import axios from 'axios'

type CheckStatus = 'healthy' | 'degraded' | 'down'

interface CheckResult {
  name: string
  status: CheckStatus
  latency: number
  error?: unknown
}

interface SystemStatus {
  status: CheckStatus
  checks: CheckResult[]
  timestamp: Date
}

interface EndpointFailure {
  endpoint: string
  details: { type: 'http'; status: number; data: unknown } | { type: 'network'; reason: unknown }
}

const checkBackendHealth = async (): Promise<CheckResult> => {
  const startTime = Date.now()
  try {
    const response = await axios.get('/api/health')
    const latency = Date.now() - startTime
    return {
      name: 'backend',
      status: response.status >= 200 && response.status < 300 ? 'healthy' : 'down',
      latency,
    }
  } catch (error) {
    const latency = Date.now() - startTime
    return {
      name: 'backend',
      status: 'down',
      latency,
      error,
    }
  }
}

const checkDatabaseHealth = async (): Promise<CheckResult> => {
  const startTime = Date.now()
  try {
    const response = await axios.get('/api/health/database')
    const latency = Date.now() - startTime
    return {
      name: 'database',
      status: response.status >= 200 && response.status < 300 ? 'healthy' : 'down',
      latency,
    }
  } catch (error) {
    const latency = Date.now() - startTime
    return {
      name: 'database',
      status: 'down',
      latency,
      error,
    }
  }
}

const checkAPIEndpoints = async (): Promise<CheckResult> => {
  const endpoints = ['/api/users', '/api/products', '/api/orders']
  const startTime = Date.now()

  try {
    const results = await Promise.allSettled(endpoints.map((endpoint) => axios.get(endpoint)))

    const failures = results.reduce<EndpointFailure[]>((acc, result, index) => {
      const endpoint = endpoints[index] ?? 'unknown'

      if (result.status === 'fulfilled') {
        const { status, data } = result.value
        const isSuccess = status >= 200 && status < 300

        if (!isSuccess) {
          acc.push({
            endpoint,
            details: {
              type: 'http',
              status,
              data,
            },
          })
        }

        return acc
      }

      acc.push({
        endpoint,
        details: {
          type: 'network',
          reason: result.reason,
        },
      })
      return acc
    }, [])

    const successful = endpoints.length - failures.length
    const latency = Date.now() - startTime

    let status: CheckStatus = 'healthy'
    if (successful === 0) {
      status = 'down'
    } else if (failures.length > 0) {
      status = 'degraded'
    }

    const firstFailure = failures[0]
    const error = firstFailure
      ? {
          endpoint: firstFailure.endpoint,
          ...firstFailure.details,
        }
      : undefined

    return {
      name: 'api_endpoints',
      status,
      latency,
      error,
    }
  } catch (error) {
    const latency = Date.now() - startTime
    return {
      name: 'api_endpoints',
      status: 'down',
      latency,
      error,
    }
  }
}

const getSystemStatus = async (): Promise<SystemStatus> => {
  const checks = await Promise.all([
    checkBackendHealth(),
    checkDatabaseHealth(),
    checkAPIEndpoints(),
  ])

  let status: CheckStatus = 'healthy'
  if (checks.some((check) => check.status === 'down')) {
    status = 'down'
  } else if (checks.some((check) => check.status === 'degraded')) {
    status = 'degraded'
  }

  return {
    status,
    checks,
    timestamp: new Date(),
  }
}

export { checkBackendHealth, checkDatabaseHealth, checkAPIEndpoints, getSystemStatus }
