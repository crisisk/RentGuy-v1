export type AxiosRequestHeaders = Record<string, string>

export interface InternalAxiosRequestConfig {
  url?: string
  method?: string
  baseURL?: string
  headers?: Record<string, string>
  data?: unknown
  params?: Record<string, unknown>
  [key: string]: unknown
}

export interface AxiosResponse<T = unknown> {
  data: T
  status: number
  headers: Record<string, string>
  config: InternalAxiosRequestConfig
}

export type RequestFulfilled<T> = (value: T) => T | Promise<T>
export type RequestRejected = (error: unknown) => unknown | Promise<unknown>

class InterceptorManager<T> {
  private handlers: Array<{ fulfilled: RequestFulfilled<T>; rejected?: RequestRejected }> = []

  use(fulfilled: RequestFulfilled<T>, rejected?: RequestRejected): number {
    this.handlers.push({ fulfilled, rejected })
    return this.handlers.length - 1
  }

  async run(value: T): Promise<T> {
    let current = value
    for (const handler of this.handlers) {
      current = await handler.fulfilled(current)
    }
    return current
  }

  async runFailure(error: unknown): Promise<never> {
    let currentError = error
    for (const handler of this.handlers) {
      if (handler.rejected) {
        const maybeResolved = await handler.rejected(currentError)
        if (maybeResolved !== undefined) {
          currentError = maybeResolved
        }
      }
    }
    throw currentError
  }
}

export interface AxiosInstance {
  defaults: {
    baseURL?: string
    headers: {
      common: AxiosRequestHeaders
    }
  }
  interceptors: {
    request: InterceptorManager<InternalAxiosRequestConfig>
    response: InterceptorManager<AxiosResponse>
  }
  get<T = unknown>(url: string, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>>
  post<T = unknown>(url: string, data?: unknown, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>>
  put<T = unknown>(url: string, data?: unknown, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>>
}

interface AxiosStatic {
  create(config?: Partial<InternalAxiosRequestConfig>): AxiosInstance
}

function mergeHeaders(base: AxiosRequestHeaders, next?: Record<string, string>): Record<string, string> {
  return { ...base, ...(next ?? {}) }
}

class AxiosStub implements AxiosInstance {
  defaults: AxiosInstance['defaults']
  interceptors: AxiosInstance['interceptors']

  constructor(config: Partial<InternalAxiosRequestConfig> = {}) {
    this.defaults = {
      baseURL: config.baseURL,
      headers: { common: { ...(config.headers ?? {}) } },
    }
    this.interceptors = {
      request: new InterceptorManager<InternalAxiosRequestConfig>(),
      response: new InterceptorManager<AxiosResponse>(),
    }
  }

  private async execute<T>(request: InternalAxiosRequestConfig): Promise<AxiosResponse<T>> {
    const prepared = await this.interceptors.request.run(request)
    const response: AxiosResponse<T> = {
      data: undefined as T,
      status: 200,
      headers: {},
      config: prepared,
    }
    try {
      const processed = await this.interceptors.response.run(response)
      return processed as AxiosResponse<T>
    } catch (error) {
      await this.interceptors.response.runFailure(error)
      throw error
    }
  }

  async get<T = unknown>(url: string, config: Partial<InternalAxiosRequestConfig> = {}): Promise<AxiosResponse<T>> {
    const request: InternalAxiosRequestConfig = {
      url,
      method: 'get',
      baseURL: this.defaults.baseURL,
      headers: mergeHeaders(this.defaults.headers.common, config.headers),
      params: config.params,
    }
    return this.execute<T>(request)
  }

  async post<T = unknown>(url: string, data?: unknown, config: Partial<InternalAxiosRequestConfig> = {}): Promise<AxiosResponse<T>> {
    const request: InternalAxiosRequestConfig = {
      url,
      method: 'post',
      baseURL: this.defaults.baseURL,
      headers: mergeHeaders(this.defaults.headers.common, config.headers),
      data,
    }
    return this.execute<T>(request)
  }

  async put<T = unknown>(url: string, data?: unknown, config: Partial<InternalAxiosRequestConfig> = {}): Promise<AxiosResponse<T>> {
    const request: InternalAxiosRequestConfig = {
      url,
      method: 'put',
      baseURL: this.defaults.baseURL,
      headers: mergeHeaders(this.defaults.headers.common, config.headers),
      data,
    }
    return this.execute<T>(request)
  }
}

const axios: AxiosStatic = {
  create(config?: Partial<InternalAxiosRequestConfig>): AxiosInstance {
    return new AxiosStub(config)
  },
}

export { InterceptorManager }
export default axios
