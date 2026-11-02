export interface RequestConfig {
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'text';
  body?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class ApiError extends Error {
  isAxiosError = true;
  response?: {
    status: number;
    statusText: string;
    data: any;
    headers: Record<string, string>;
  };
  config?: any;

  constructor(message: string, response?: ApiError['response'], config?: any) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
    this.config = config;
  }
}

export function isAxiosError(error: any): error is ApiError {
  return Boolean(error && (error.isAxiosError === true || error instanceof ApiError));
}

type RequestInterceptor = (config: {
  url: string;
  headers: Record<string, string>;
  params?: Record<string, any>;
  [key: string]: any;
}) => any | Promise<any>;

class ApiClient {
  baseURL: string;
  defaultHeaders: Record<string, string>;

  interceptors = {
    request: {
      handlers: [] as RequestInterceptor[],
      use(fn: RequestInterceptor) {
        this.handlers.push(fn);
      },
    },
    response: {
      handlers: [] as ((response: any) => any)[],
      use(fn: (response: any) => any) {
        this.handlers.push(fn);
      },
    },
  };

  constructor(defaults?: { baseURL?: string; headers?: Record<string, string> }) {
    this.baseURL = defaults?.baseURL ?? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...(defaults?.headers || {}),
    };
  }

  create(defaults?: { baseURL?: string; headers?: Record<string, string> }) {
    return new ApiClient(defaults);
  }

  private async request<T = any>(
    endpoint: string,
    method: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    let reqConfig = {
      url: endpoint,
      headers: { ...this.defaultHeaders, ...(config?.headers || {}) },
      params: config?.params,
      responseType: config?.responseType || 'json',
      body: data,
    };

    // Run request interceptors
    for (const handler of this.interceptors.request.handlers) {
      const result = await handler(reqConfig);
      if (result) {
        reqConfig = result;
      }
    }

    // Build URL with query params
    let fullUrl = reqConfig.url.startsWith('http')
      ? reqConfig.url
      : `${this.baseURL.replace(/\/$/, '')}/${reqConfig.url.replace(/^\//, '')}`;

    if (reqConfig.params) {
      const urlObj = new URL(fullUrl);
      Object.entries(reqConfig.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          urlObj.searchParams.append(key, String(val));
        }
      });
      fullUrl = urlObj.toString();
    }

    const fetchOptions: RequestInit = {
      method,
      headers: reqConfig.headers,
    };

    if (data !== undefined && method !== 'GET' && method !== 'HEAD') {
      if (typeof data === 'string' || data instanceof FormData || data instanceof Blob) {
        fetchOptions.body = data;
      } else {
        fetchOptions.body = JSON.stringify(data);
      }
    }

    const response = await fetch(fullUrl, fetchOptions);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key.toLowerCase()] = val;
    });

    let resData: any;
    if (reqConfig.responseType === 'blob') {
      resData = await response.blob();
    } else if (reqConfig.responseType === 'text') {
      resData = await response.text();
    } else {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        resData = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => '');
        try {
          resData = JSON.parse(text);
        } catch {
          resData = text;
        }
      }
    }

    if (!response.ok) {
      throw new ApiError(
        `Request failed with status code ${response.status}`,
        {
          status: response.status,
          statusText: response.statusText,
          data: resData,
          headers: responseHeaders,
        },
        reqConfig
      );
    }

    const apiResponse: ApiResponse<T> = {
      data: resData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    };

    for (const handler of this.interceptors.response.handlers) {
      return await handler(apiResponse);
    }

    return apiResponse;
  }

  get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'GET', undefined, config);
  }

  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'POST', data, config);
  }

  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'PUT', data, config);
  }

  delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'DELETE', undefined, config);
  }
}

export const api = new ApiClient();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mmspg_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
