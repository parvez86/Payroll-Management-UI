/**
 * Real Backend API Integration - Payroll Management System
 * Direct connection to backend API at http://localhost:20001/pms/api/v1
 * Matches exact API documentation response format
 */

import axios, { type AxiosResponse, type AxiosError } from 'axios';
import type { 
  Employee, 
  Company, 
  PayrollCalculationResponse,
  SalaryTransferRequest,
  SalaryTransferResponse,
  SalarySheetResponse,
  TransactionHistoryResponse,
  LoginRequest, 
  LoginResponse,
  TopUpRequest,
  TopUpResponse,
  UserProfile
} from '../types';

// API Response format from documentation
interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// Real Backend API Configuration
const api = axios.create({
  baseURL: 'http://localhost:20001/pms/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/refresh'];

// Request interceptor for JWT token and logging
api.interceptors.request.use(
  (config) => {
    console.log('🔍 Request interceptor triggered for:', config.url);
    
    // Check if this is a public endpoint (only login and refresh)
    const isLoginEndpoint = config.url === '/auth/login';
    const isRefreshEndpoint = config.url === '/auth/refresh';
    const isPublicEndpoint = isLoginEndpoint || isRefreshEndpoint;
    
    console.log('🔍 Endpoint analysis:', {
      url: config.url,
      isLogin: isLoginEndpoint,
      isRefresh: isRefreshEndpoint,
      isPublic: isPublicEndpoint,
      needsAuth: !isPublicEndpoint
    });
    
    // For ALL non-public endpoints, add Bearer token
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('accessToken');
      console.log('🔍 Token check for protected endpoint:', token ? `FOUND (${token.substring(0, 20)}...)` : 'NOT FOUND');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header added successfully');
      } else {
        console.error('❌ CRITICAL: No access token for protected endpoint:', config.url);
        console.error('❌ This request will likely fail with 401 Unauthorized');
        
        // Still proceed with request to get proper error handling
      }
    } else {
      console.log('🌐 Public endpoint - no auth required');
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log final headers for debugging
    const logHeaders = { ...config.headers };
    if (logHeaders.Authorization) {
      logHeaders.Authorization = `Bearer ${logHeaders.Authorization.substring(7, 27)}...`;
    }
    console.log('🔍 Final request headers:', logHeaders);
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error: AxiosError) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Unauthorized - clear auth tokens and redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // Forbidden
      console.warn('Access forbidden - insufficient permissions');
    } else if (error.response && error.response.status >= 500) {
      // Server error
      console.error('Server error - please try again later');
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.error('Request timeout - please check your connection');
    } else if (error.code === 'ERR_NETWORK') {
      // Network error
      console.error('Network error - please check backend server is running');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Authentication Service - Real Backend API
 * Public endpoints: login and refresh token
 */
export const authService = {
  /**
   * Login - Public endpoint (no auth token required)
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('🚀 Making login request...');
    
    const response: AxiosResponse<any> = await api.post('/auth/login', credentials);
    
    console.log('📡 Raw login response:', response.data);
    
    // Backend returns data directly (not wrapped in {success, data} format for login)
    const loginData = response.data;
    
    console.log('🔄 Processing login data:', loginData);
    
    try {
      // Test localStorage availability
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log('✅ localStorage is available');
      
      // 1. Store access token (CRITICAL - backend returns 'accessToken')
      if (loginData.accessToken) {
        localStorage.setItem('accessToken', loginData.accessToken);
        console.log('✅ Access token stored successfully');
        
        // Immediate verification
        const storedToken = localStorage.getItem('accessToken');
        console.log('🔍 Immediate verification - stored token:', storedToken ? 'SUCCESS' : 'FAILED');
      } else {
        console.error('❌ No accessToken in login response!');
      }
      
      // 2. Store refresh token
      if (loginData.refreshToken) {
        localStorage.setItem('refreshToken', loginData.refreshToken);
        console.log('✅ Refresh token stored successfully');
      }
      
      // 3. Store token type
      if (loginData.tokenType) {
        localStorage.setItem('tokenType', loginData.tokenType);
        console.log('✅ Token type stored:', loginData.tokenType);
      }
      
      // 4. Store expiration info
      if (loginData.expiresIn) {
        localStorage.setItem('tokenExpiration', loginData.expiresIn.toString());
        console.log('✅ Token expiration stored:', new Date(loginData.expiresIn).toLocaleString());
      }
      
      // 5. Store refresh expiration
      if (loginData.refreshExpiresIn) {
        localStorage.setItem('refreshTokenExpiration', loginData.refreshExpiresIn.toString());
        console.log('✅ Refresh token expiration stored');
      }
      
      // 6. Create a mock user object since backend doesn't return user info
      const mockUser = {
        id: 'admin-user',
        username: credentials.username,
        email: 'admin@example.com',
        role: 'ADMIN' as const
      };
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      console.log('✅ User data stored:', mockUser);
      
      // 7. Store complete login response for debugging
      localStorage.setItem('loginResponse', JSON.stringify(loginData));
      
      console.log('🎉 ALL LOGIN DATA STORED SUCCESSFULLY!');
      
      // Final verification
      console.log('🔍 Final localStorage check:', {
        hasAccessToken: !!localStorage.getItem('accessToken'),
        hasRefreshToken: !!localStorage.getItem('refreshToken'),
        hasUser: !!localStorage.getItem('user'),
        hasExpiration: !!localStorage.getItem('tokenExpiration')
      });

      // Verify token by calling /me endpoint
      try {
        console.log('🔍 Verifying token with /me endpoint...');
        const userFromAPI = await authService.getCurrentUserFromAPI();
        console.log('✅ Token verification successful, user from API:', userFromAPI);
        
        // Update stored user with real API data
        localStorage.setItem('user', JSON.stringify(userFromAPI));
      } catch (meError: any) {
        console.error('❌ Token verification failed:', meError);
        // Clear stored data if token is invalid
        authService.clearAuthData();
        throw new Error('User credentials invalid');
      }
      
      // Return compatible format
      return {
        token: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        user: mockUser,
        expiresIn: loginData.expiresIn,
        tokenType: loginData.tokenType
      };
      
    } catch (error) {
      console.error('❌ localStorage operation failed:', error);
      throw new Error('Failed to store authentication data');
    }
  },

  /**
   * Refresh Token - Public endpoint (no auth token required)
   */
  refreshToken: async (): Promise<LoginResponse> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response: AxiosResponse<APIResponse<LoginResponse>> = await api.post('/auth/refresh', {
      refreshToken
    });
    
    // Update stored tokens
    if (response.data.data) {
      const { token, user } = response.data.data;
      
      if (token) {
        localStorage.setItem('accessToken', token);
      }
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
    }
    
    return response.data.data;
  },

  /**
   * Logout - Protected endpoint (requires auth token)
   */
  logout: async (logoutFromAllDevices: boolean = false): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const payload = {
        refreshToken: refreshToken,
        logoutFromAllDevices: logoutFromAllDevices
      };
      
      await api.post('/auth/logout', payload);
      console.log('✅ Logout API call successful');
    } catch (error) {
      console.warn('⚠️ Logout API call failed, but clearing local data anyway:', error);
    } finally {
      // Always clear all auth data regardless of API response
      authService.clearAuthData();
      console.log('✅ All authentication data cleared');
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get current user profile from API - /me endpoint (requires Bearer token)
   */
  getCurrentProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get('/auth/me');
      // Backend returns data directly, not wrapped in { success, data }
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get current user profile from API:', error);
      if (error.response?.status === 401) {
        throw new Error('User credentials invalid');
      }
      throw error;
    }
  },

  /**
   * Check if user is authenticated (has valid access token)
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('accessToken');
    const expiration = localStorage.getItem('tokenExpiration');
    
    if (!token) {
      console.log('🔍 Authentication check: No access token');
      return false;
    }
    
    if (expiration) {
      const expirationTime = parseInt(expiration);
      const now = Date.now();
      
      if (now >= expirationTime) {
        console.log('🔍 Authentication check: Token expired');
        // Token expired - clear all auth data
        authService.clearAuthData();
        return false;
      }
    }
    
    console.log('🔍 Authentication check: Valid token found');
    return true;
  },

  /**
   * Get access token
   */
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  /**
   * Get refresh token
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  /**
   * Clear all authentication data
   */
  clearAuthData: (): void => {
    console.log('🧹 Clearing all authentication data');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('loginResponse');
  },

  /**
   * Check if token is about to expire (within 5 minutes)
   */
  isTokenExpiringSoon: (): boolean => {
    const expiration = localStorage.getItem('tokenExpiration');
    if (!expiration) return false;
    
    const expirationTime = parseInt(expiration);
    const now = Date.now();
    const fiveMinutesFromNow = now + (5 * 60 * 1000); // 5 minutes in ms
    
    return expirationTime <= fiveMinutesFromNow;
  },

  /**
   * Get all stored auth info for debugging
   */
  getAuthInfo: () => {
    return {
      hasAccessToken: !!localStorage.getItem('accessToken'),
      hasRefreshToken: !!localStorage.getItem('refreshToken'),
      hasUser: !!localStorage.getItem('user'),
      hasExpiration: !!localStorage.getItem('tokenExpiration'),
      tokenExpiration: localStorage.getItem('tokenExpiration'),
      user: authService.getCurrentUser(),
      isExpired: !authService.isAuthenticated(),
      isExpiringSoon: authService.isTokenExpiringSoon()
    };
  }
};

/**
 * Employee Management Service - Paginated API
 */
export const employeeService = {
  getAll: async (page: number = 0, size: number = 20, sort: string = 'grade.rank'): Promise<{content: Employee[], totalElements: number, totalPages: number, first: boolean, last: boolean}> => {
    const response: AxiosResponse<APIResponse<{content: Employee[], totalElements: number, totalPages: number, first: boolean, last: boolean}>> = await api.get(`/employees?page=${page}&size=${size}&sort=${sort}`);
    return response.data.data || response.data; // Handle both wrapped and direct response
  },

  getById: async (id: string): Promise<Employee> => {
    const response: AxiosResponse<APIResponse<Employee>> = await api.get(`/employees/${id}`);
    return response.data.data || response.data; // Handle both wrapped and direct response
  },

  create: async (employee: Omit<Employee, 'createdAt' | 'updatedAt' | 'salary'>): Promise<Employee> => {
    const response: AxiosResponse<APIResponse<Employee>> = await api.post('/employees', employee);
    return response.data.data || response.data;
  },

  update: async (id: string, employee: Partial<Employee>): Promise<Employee> => {
    const response: AxiosResponse<APIResponse<Employee>> = await api.put(`/employees/${id}`, employee);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  }
};

/**
 * Payroll Management Service - Real Backend API ONLY
 * Endpoints: GET/POST /payroll/calculate, POST /payroll/transfer, GET /payroll/salary-sheet
 */
export const payrollService = {
  calculateSalaries: async (grade6Basic: number): Promise<PayrollCalculationResponse> => {
    const response: AxiosResponse<APIResponse<PayrollCalculationResponse>> = await api.post('/payroll/calculate', { grade6Basic });
    return response.data.data;
  },

  getSalaryCalculation: async (grade6Basic: number): Promise<PayrollCalculationResponse> => {
    const response: AxiosResponse<APIResponse<PayrollCalculationResponse>> = await api.get(`/payroll/calculate?grade6Basic=${grade6Basic}`);
    return response.data.data;
  },

  processSalaryTransfer: async (request: SalaryTransferRequest): Promise<SalaryTransferResponse> => {
    const response: AxiosResponse<APIResponse<SalaryTransferResponse>> = await api.post('/payroll/transfer', request);
    return response.data.data;
  },

  getSalarySheet: async (grade6Basic: number): Promise<SalarySheetResponse> => {
    const response: AxiosResponse<APIResponse<SalarySheetResponse>> = await api.get(`/payroll/salary-sheet?grade6Basic=${grade6Basic}`);
    return response.data.data;
  }
};

/**
 * Company Account Service - Real Backend API ONLY
 * Endpoints: GET /company/account, POST /company/topup, GET /company/transactions
 */
export const companyService = {
  getAccount: async (): Promise<Company> => {
    const response: AxiosResponse<APIResponse<Company>> = await api.get('/company/account');
    return response.data.data;
  },

  topUp: async (request: TopUpRequest): Promise<TopUpResponse> => {
    const response: AxiosResponse<APIResponse<TopUpResponse>> = await api.post('/company/topup', request);
    return response.data.data;
  },

  getTransactions: async (limit?: number, offset?: number): Promise<TransactionHistoryResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response: AxiosResponse<APIResponse<TransactionHistoryResponse>> = await api.get(`/company/transactions?${params.toString()}`);
    return response.data.data;
  }
};

export default api;