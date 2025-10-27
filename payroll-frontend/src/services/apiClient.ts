/**
 * Enhanced API Client with Retry Logic and Industry Best Practices
 * Integrates with backend following the API documentation exactly
 */

import axios, { type AxiosInstance, type AxiosResponse, type AxiosError, type AxiosRequestConfig } from 'axios';
import { config } from '../config';
import { createErrorResponse } from '../utils/errorHandler';

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retryConfig?: RetryConfig;
  interceptors?: {
    request?: Array<(config: AxiosRequestConfig) => AxiosRequestConfig>;
    response?: Array<(response: AxiosResponse) => AxiosResponse>;
  };
}

class APIClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(clientConfig: APIClientConfig) {
    this.retryConfig = clientConfig.retryConfig || {
      retries: 3,
      retryDelay: 1000,
      retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        return !error.response || (error.response.status >= 500 && error.response.status < 600);
      }
    };

    this.client = axios.create({
      baseURL: clientConfig.baseURL,
      timeout: clientConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Client-Version': config.APP_VERSION,
        'X-Environment': config.ENVIRONMENT,
      },
      withCredentials: false,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add JWT token
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add timestamp
        config.headers['X-Request-Time'] = new Date().toISOString();

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 [${config.headers['X-Request-ID']}] ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log successful response in development
        if (process.env.NODE_ENV === 'development') {
          const requestId = response.config.headers['X-Request-ID'];
          console.log(`✅ [${requestId}] Response:`, {
            status: response.status,
            data: response.data,
            duration: this.calculateDuration(response.config.headers['X-Request-Time'] as string)
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        const requestId = error.config?.headers?.['X-Request-ID'];
        
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ [${requestId}] API Error:`, {
            method: error.config?.method?.toUpperCase(),
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }

        // Handle retry logic
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
          this.handleAuthError();
        }

        return Promise.reject(error);
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateDuration(startTime: string): string {
    const start = new Date(startTime).getTime();
    const end = Date.now();
    return `${end - start}ms`;
  }

  private shouldRetry(error: AxiosError): boolean {
    const config = error.config as any;
    const currentRetryCount = config._retryCount || 0;
    
    return (
      currentRetryCount < this.retryConfig.retries &&
      this.retryConfig.retryCondition!(error)
    );
  }

  private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config as any;
    config._retryCount = (config._retryCount || 0) + 1;

    const delay = this.retryConfig.retryDelay * Math.pow(2, config._retryCount - 1); // Exponential backoff
    
    console.log(`🔄 Retrying request (${config._retryCount}/${this.retryConfig.retries}) after ${delay}ms`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return this.client.request(config);
  }

  private handleAuthError(): void {
    console.warn('🔒 Authentication error - clearing auth data');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Public methods matching API service interface
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<{ success: boolean; data: T }>(url, config);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error as AxiosError, `GET ${url}`);
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<{ success: boolean; data: T }>(url, data, config);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error as AxiosError, `POST ${url}`);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<{ success: boolean; data: T }>(url, data, config);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error as AxiosError, `PUT ${url}`);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<{ success: boolean; data: T }>(url, config);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error as AxiosError, `DELETE ${url}`);
    }
  }

  private handleError(error: AxiosError, context: string): Error {
    const errorResponse = createErrorResponse(error, context);
    
    // Create a more informative error object
    const enhancedError = new Error(errorResponse.userMessage);
    (enhancedError as any).code = errorResponse.error.code;
    (enhancedError as any).statusCode = errorResponse.error.statusCode;
    (enhancedError as any).details = errorResponse.error.details;
    (enhancedError as any).retryable = errorResponse.retryable;
    
    return enhancedError;
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError, 'Health Check');
    }
  }
}

// Create and export the configured API client
export const apiClient = new APIClient({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  retryConfig: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      // Don't retry authentication errors or client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        return false;
      }
      // Retry network errors and server errors (5xx)
      return !error.response || error.response.status >= 500;
    }
  }
});

export default apiClient;