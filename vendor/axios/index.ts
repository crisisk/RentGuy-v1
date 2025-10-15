export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export interface AxiosRequestHeaders {
  [header: string]: string
}

export interface AxiosRequestConfig<T = unknown> {
  baseURL?: string
  headers?: AxiosRequestHeaders
  method?: Method | Lowercase<Method>
  params?: Record<string, unknown>
  data?: T
  signal?: AbortSignal
  url?: string
  timeout?: number
}

export interface InternalAxiosRequestConfig<T = unknown> extends AxiosRequestConfig<T> {
  url: string
  method: Method
  headers: AxiosRequestHeaders
}

export interface AxiosResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: InternalAxiosRequestConfig
}

export interface AxiosError<T = unknown> extends Error {
  isAxiosError: true
  config: AxiosRequestConfig<T>
  code?: string
  request?: unknown
  response?: AxiosResponse<T>
  toJSON(): Record<string, unknown>
}

export type RequestFulfilled<T> = (value: T) => T | Promise<T>
export type RequestRejected = (error: unknown) => unknown | Promise<unknown>

interface Interceptor<T> {
  fulfilled: RequestFulfilled<T>
  rejected?: RequestRejected
}

class InterceptorManager<T> {
  private handlers: Array<Interceptor<T> | null> = []

  use(fulfilled: RequestFulfilled<T>, rejected?: RequestRejected): number {
    this.handlers.push({ fulfilled, rejected })
    return this.handlers.length - 1
  }

  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null
    }
  }

  async run(value: T): Promise<T> {
    let current = value
    for (const handler of this.handlers) {
      if (!handler) continue
      try {
        current = await handler.fulfilled(current)
      } catch (error) {
        if (handler.rejected) {
          const maybeRecovered = await handler.rejected(error)
          if (maybeRecovered !== undefined) {
            current = maybeRecovered as T
            continue
          }
        }
        throw error
      }
    }
    return current
  }

  async runError(error: unknown): Promise<never> {
    let currentError: unknown = error
    for (const handler of this.handlers) {
      if (!handler?.rejected) continue
      currentError = await handler.rejected(currentError)
    }
    throw currentError
  }
}

interface AxiosDefaults {
  baseURL?: string
  headers: {
    common: AxiosRequestHeaders
  }
  timeout?: number
}

export interface AxiosInstance {
  <T = unknown>(config: AxiosRequestConfig<T>): Promise<AxiosResponse<T>>
  defaults: AxiosDefaults
  interceptors: {
    request: InterceptorManager<InternalAxiosRequestConfig>
    response: InterceptorManager<AxiosResponse>
  }
  request<T = unknown>(config: AxiosRequestConfig<T>): Promise<AxiosResponse<T>>
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
}

interface AxiosStatic extends AxiosInstance {
  create(config?: AxiosRequestConfig): AxiosInstance
  isAxiosError(value: unknown): value is AxiosError
}

class AxiosErrorImpl<T> extends Error implements AxiosError<T> {
  public readonly isAxiosError = true as const
  public readonly config: AxiosRequestConfig<T>
  public readonly code?: string
  public readonly request?: unknown
  public readonly response?: AxiosResponse<T>

  constructor(
    message: string,
    config: AxiosRequestConfig<T>,
    code?: string,
    request?: unknown,
    response?: AxiosResponse<T>,
  ) {
    super(message)
    this.name = 'AxiosError'
    this.config = config
    this.code = code
    this.request = request
    this.response = response
  }

  toJSON(): Record<string, unknown> {
    return {
      message: this.message,
      name: this.name,
      code: this.code,
      status: this.response?.status ?? null,
      config: {
        url: this.config.url,
        method: this.config.method,
      },
    }
  }
}

function isAxiosError(value: unknown): value is AxiosError {
  return Boolean(value && typeof value === 'object' && (value as { isAxiosError?: boolean }).isAxiosError)
}

function buildURL(baseURL: string | undefined, url: string, params?: Record<string, unknown>): string {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost'
  const combined = baseURL ? new URL(url, baseURL) : new URL(url, origin)
  if (params) {
    const searchParams = new URLSearchParams(combined.search)
    for (const [key, rawValue] of Object.entries(params)) {
      if (rawValue === undefined || rawValue === null) continue
      if (Array.isArray(rawValue)) {
        rawValue.forEach(value => searchParams.append(key, String(value)))
      } else if (typeof rawValue === 'object') {
        searchParams.set(key, JSON.stringify(rawValue))
      } else {
        searchParams.set(key, String(rawValue))
      }
    }
    combined.search = searchParams.toString()
  }
  return combined.toString()
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null)
  }
  if (contentType.includes('text/')) {
    return response.text()
  }
  if (contentType.includes('application/octet-stream')) {
    return response.arrayBuffer()
  }
  return response.blob().catch(() => null)
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value
  })
  return result
}

function mergeHeaders(base: AxiosRequestHeaders, next?: AxiosRequestHeaders): AxiosRequestHeaders {
  return { ...base, ...(next ?? {}) }
}

function hasHeader(headers: AxiosRequestHeaders, name: string): boolean {
  const target = name.toLowerCase()
  return Object.keys(headers).some(header => header.toLowerCase() === target)
}

function inheritConfig(defaults: AxiosDefaults, config?: AxiosRequestConfig): AxiosRequestConfig {
  const headers = mergeHeaders(defaults.headers.common, config?.headers)
  const inherited: AxiosRequestConfig = {
    ...(config ?? {}),
    headers,
  }
  if (defaults.baseURL && !inherited.baseURL) {
    inherited.baseURL = defaults.baseURL
  }
  if (defaults.timeout && inherited.timeout === undefined) {
    inherited.timeout = defaults.timeout
  }
  return inherited
}

async function dispatchRequest<T>(config: InternalAxiosRequestConfig<T>): Promise<AxiosResponse<T>> {
  const controller = new AbortController()
  const linkedSignal = config.signal
  if (linkedSignal) {
    if (linkedSignal.aborted) {
      throw new AxiosErrorImpl('Request aborted', config, 'ERR_CANCELED')
    }
    linkedSignal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  if (typeof config.timeout === 'number' && config.timeout > 0) {
    timeoutId = setTimeout(() => controller.abort(), config.timeout)
  }

  const headers = { ...config.headers }
  let body: BodyInit | undefined
  if (config.data !== undefined) {
    if (config.data instanceof FormData || config.data instanceof URLSearchParams || config.data instanceof Blob) {
      body = config.data as BodyInit
    } else if (typeof config.data === 'string') {
      body = config.data
      if (!hasHeader(headers, 'content-type')) {
        headers['content-type'] = 'text/plain'
      }
    } else {
      body = JSON.stringify(config.data)
      if (!hasHeader(headers, 'content-type')) {
        headers['content-type'] = 'application/json'
      }
    }
  }

  const requestInit: RequestInit = {
    method: config.method,
    headers,
    body,
    signal: controller.signal,
  }

  try {
    const url = buildURL(config.baseURL ?? undefined, config.url, config.params)
    const response = await fetch(url, requestInit)
    if (timeoutId) clearTimeout(timeoutId)
    const data = (await parseBody(response)) as T
    const axiosResponse: AxiosResponse<T> = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: headersToObject(response.headers),
      config,
    }
    if (!response.ok) {
      throw new AxiosErrorImpl(`Request failed with status code ${response.status}`, config, undefined, undefined, axiosResponse)
    }
    return axiosResponse
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId)
    if (isAxiosError(error)) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AxiosErrorImpl('Request aborted', config, linkedSignal?.aborted ? 'ERR_CANCELED' : 'ECONNABORTED')
    }
    const message = error instanceof Error ? error.message : 'Network Error'
    throw new AxiosErrorImpl(message, config, 'ERR_NETWORK')
  }
}

function mergeConfig(defaults: AxiosDefaults, config: AxiosRequestConfig): InternalAxiosRequestConfig {
  const method = (config.method ?? 'GET').toString().toUpperCase() as Method
  const url = config.url ?? '/'
  const headers = mergeHeaders(defaults.headers.common, config.headers)
  return {
    ...config,
    url,
    method,
    headers,
    baseURL: config.baseURL ?? defaults.baseURL,
    timeout: config.timeout ?? defaults.timeout,
  }
}

class AxiosClient {
  public readonly defaults: AxiosDefaults
  public readonly interceptors: AxiosInstance['interceptors']

  constructor(config: AxiosRequestConfig = {}) {
    this.defaults = {
      baseURL: config.baseURL,
      headers: { common: { ...(config.headers ?? {}) } },
      timeout: config.timeout,
    }
    this.interceptors = {
      request: new InterceptorManager<InternalAxiosRequestConfig>(),
      response: new InterceptorManager<AxiosResponse>(),
    }
  }

  async request<T = unknown>(config: AxiosRequestConfig<T>): Promise<AxiosResponse<T>> {
    const merged = mergeConfig(this.defaults, config)
    const prepared = await this.interceptors.request.run(merged)
    try {
      const response = await dispatchRequest<T>(prepared)
      return (await this.interceptors.response.run(response)) as AxiosResponse<T>
    } catch (error) {
      if (isAxiosError(error)) {
        await this.interceptors.response.runError(error)
      }
      throw error
    }
  }

  get<T = unknown>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  post<T = unknown>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data })
  }

  put<T = unknown>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data })
  }

  delete<T = unknown>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }
}

function createInstance(config?: AxiosRequestConfig): AxiosStatic {
  const client = new AxiosClient(config)
  const instance = client.request.bind(client) as unknown as AxiosStatic

  Object.assign(instance, {
    defaults: client.defaults,
    interceptors: client.interceptors,
    request: client.request.bind(client),
    get: client.get.bind(client),
    post: client.post.bind(client),
    put: client.put.bind(client),
    delete: client.delete.bind(client),
    create: (cfg?: AxiosRequestConfig) => createInstance(inheritConfig(client.defaults, cfg)),
    isAxiosError,
  })

  return instance
}

const axios = createInstance()

export { InterceptorManager, isAxiosError, AxiosErrorImpl as AxiosError }
export default axios as AxiosStatic
