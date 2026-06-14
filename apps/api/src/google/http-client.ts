export const HTTP_CLIENT = Symbol("HTTP_CLIENT");

interface HttpResponse<T> {
  status: number;
  data: T;
}

export interface HttpRequestConfig {
  params?: Record<string, string>;
}

export interface HttpClient {
  get<T>(url: string): Promise<HttpResponse<T>>;
  post<T>(
    url: string,
    body: unknown,
    config?: HttpRequestConfig,
  ): Promise<HttpResponse<T>>;
}
