/**
 * Real Backend API Integration - Payroll Management System
 * Direct connection to backend API at http://localhost:20001/pms/v1/api
 * No mock data - only real database integration
 */

import axios, { type AxiosResponse, type AxiosError } from 'axios';
import { config } from '../config';
import type { 
  ApiResponse, 
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
  TopUpResponse
} from '../types';

// Real Backend API Configuration
const BASE_URL = config.API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: false,
});

// Request interceptor for JWT token and logging
api.interceptors.request.use(
  (config) => {
    // Add JWT token from localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        headers: config.headers
      });
    }
    
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
      // Unauthorized - clear auth and redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
      console.error('Network error - please check backend server is running on port 20001');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Authentication Service - Real Backend API
 */
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post('/auth/login', credentials);
    
    // Store token and user data in localStorage
    if (response.data.data?.token) {
      localStorage.setItem('accessToken', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  }
};

/**
 * Employee Management Service - Real Backend API
 */
export const employeeService = {
  getAll: async (): Promise<Employee[]> => {
    const response: AxiosResponse<ApiResponse<Employee[]>> = await api.get('/employees');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Employee> => {
    const response: AxiosResponse<ApiResponse<Employee>> = await api.get(`/employees/${id}`);
    return response.data.data!;
  },

  create: async (employee: Omit<Employee, 'createdAt' | 'updatedAt' | 'salary'>): Promise<Employee> => {
    const response: AxiosResponse<ApiResponse<Employee>> = await api.post('/employees', employee);
    return response.data.data!;
  },

  update: async (id: string, employee: Partial<Employee>): Promise<Employee> => {
    const response: AxiosResponse<ApiResponse<Employee>> = await api.put(`/employees/${id}`, employee);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  }
};

/**
 * Payroll Management Service - Real Backend API
 */
export const payrollService = {
  calculateSalaries: async (grade6Basic: number): Promise<PayrollCalculationResponse> => {
    const response: AxiosResponse<ApiResponse<PayrollCalculationResponse>> = await api.post('/payroll/calculate', { grade6Basic });
    return response.data.data!;
  },

  getSalaryCalculation: async (grade6Basic: number): Promise<PayrollCalculationResponse> => {
    const response: AxiosResponse<ApiResponse<PayrollCalculationResponse>> = await api.get(`/payroll/calculate?grade6Basic=${grade6Basic}`);
    return response.data.data!;
  },

  processSalaryTransfer: async (request: SalaryTransferRequest): Promise<SalaryTransferResponse> => {
    const response: AxiosResponse<ApiResponse<SalaryTransferResponse>> = await api.post('/payroll/transfer', request);
    return response.data.data!;
  },

  getSalarySheet: async (grade6Basic: number): Promise<SalarySheetResponse> => {
    const response: AxiosResponse<ApiResponse<SalarySheetResponse>> = await api.get(`/payroll/salary-sheet?grade6Basic=${grade6Basic}`);
    return response.data.data!;
  }
};

/**
 * Company Account Service - Real Backend API
 */
export const companyService = {
  getAccount: async (): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> = await api.get('/company/account');
    return response.data.data!;
  },

  topUp: async (request: TopUpRequest): Promise<TopUpResponse> => {
    const response: AxiosResponse<ApiResponse<TopUpResponse>> = await api.post('/company/topup', request);
    return response.data.data!;
  },

  getTransactions: async (limit?: number, offset?: number): Promise<TransactionHistoryResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response: AxiosResponse<ApiResponse<TransactionHistoryResponse>> = await api.get(`/company/transactions?${params.toString()}`);
    return response.data.data!;
  }
};

export default api;