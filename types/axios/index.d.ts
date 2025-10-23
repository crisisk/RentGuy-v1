declare module 'axios' {
  export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

  export interface AxiosRequestConfig<T = any> {
    baseURL?: string
    headers?: Record<string, string>
    method?: Method | Lowercase<Method>
    params?: Record<string, unknown>
    data?: T
    signal?: AbortSignal
    url?: string
    timeout?: number
  }

  export interface AxiosResponse<T = any> {
    data: T
    status: number
    statusText: string
    headers: Record<string, string>
    config: InternalAxiosRequestConfig<T>
  }

  export interface InternalAxiosRequestConfig<T = any> extends AxiosRequestConfig<T> {
    url: string
    method: Method
    headers: Record<string, string>
  }

  export interface AxiosInterceptorManager<V> {
    use(onFulfilled: (value: V) => V | Promise<V>, onRejected?: (error: any) => any): number
    eject(id: number): void
  }

  export class AxiosError<T = any> extends Error {
    constructor(
      message?: string,
      code?: string,
      config?: AxiosRequestConfig<T>,
      request?: unknown,
      response?: AxiosResponse<T>,
    )
    isAxiosError: true
    config: AxiosRequestConfig<T>
    code?: string
    request?: unknown
    response?: AxiosResponse<T>
    toJSON(): Record<string, unknown>
  }

  export interface AxiosInstance {
    <T = any>(config: AxiosRequestConfig<T>): Promise<AxiosResponse<T>>
    defaults: {
      baseURL?: string
      headers: { common: Record<string, string> }
      timeout?: number
    }
    interceptors: {
      request: AxiosInterceptorManager<InternalAxiosRequestConfig>
      response: AxiosInterceptorManager<AxiosResponse>
    }
    request<T = any>(config: AxiosRequestConfig<T>): Promise<AxiosResponse<T>>
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  }

  export interface AxiosStatic extends AxiosInstance {
    create(config?: AxiosRequestConfig): AxiosInstance
    isAxiosError(value: unknown): value is AxiosError
  }

  const axios: AxiosStatic

  export function isAxiosError(value: unknown): value is AxiosError
  export { axios as default }
}
