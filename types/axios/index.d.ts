declare module 'axios' {
  export interface AxiosRequestConfig<T = any> {
    baseURL?: string
    headers?: Record<string, string>
    method?: string
    params?: Record<string, unknown>
    data?: T
    signal?: AbortSignal
    url?: string
  }

  export interface AxiosResponse<T = any> {
    data: T
    status: number
    statusText: string
    headers: Record<string, string>
    config: AxiosRequestConfig
  }

  export interface AxiosInterceptorManager<V> {
    use(onFulfilled: (value: V) => V | Promise<V>, onRejected?: (error: any) => any): number
  }

  export interface InternalAxiosRequestConfig<T = any> extends AxiosRequestConfig<T> {}

  export interface AxiosError<T = any> extends Error {
    isAxiosError: true
    config?: AxiosRequestConfig<T>
    code?: string
    request?: unknown
    response?: AxiosResponse<T>
    toJSON(): Record<string, unknown>
  }

  export interface AxiosInstance {
    defaults: { headers: { common: Record<string, string> } }
    interceptors: {
      request: AxiosInterceptorManager<InternalAxiosRequestConfig>
      response: AxiosInterceptorManager<AxiosResponse>
    }
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  }

  export interface AxiosStatic extends AxiosInstance {
    create(config?: AxiosRequestConfig): AxiosInstance
  }

  const axios: AxiosStatic

  export default axios
}
