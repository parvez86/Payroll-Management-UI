import axios, { type AxiosResponse } from 'axios';
import { mockAPI } from './mockAPI';
import { config } from '../config';
import type { 
  ApiResponse, 
  Employee, 
  Company, 
  PayrollBatch, 
  Transaction, 
  LoginRequest, 
  LoginResponse,
  TopUpRequest
} from '../types';

// Base API configuration
const BASE_URL = config.API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    if (config.USE_MOCK_API) {
      return mockAPI.auth.login(credentials);
    }
    
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post('/auth/login', credentials);
    return response.data.data!;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  }
};

// Employee Service
export const employeeService = {
  getAll: async (): Promise<Employee[]> => {
    if (config.USE_MOCK_API) {
      return mockAPI.employees.getAll();
    }
    
    const response: AxiosResponse<ApiResponse<Employee[]>> = await api.get('/employees');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Employee> => {
    if (config.USE_MOCK_API) {
      return mockAPI.employees.getById(id);
    }
    
    const response: AxiosResponse<ApiResponse<Employee>> = await api.get(`/employees/${id}`);
    return response.data.data!;
  },

  create: async (employee: Omit<Employee, 'id' | 'account'>): Promise<Employee> => {
    if (config.USE_MOCK_API) {
      return mockAPI.employees.create(employee);
    }
    
    const response: AxiosResponse<ApiResponse<Employee>> = await api.post('/employees', employee);
    return response.data.data!;
  },

  update: async (id: string, employee: Partial<Employee>): Promise<Employee> => {
    if (config.USE_MOCK_API) {
      return mockAPI.employees.update(id, employee);
    }
    
    const response: AxiosResponse<ApiResponse<Employee>> = await api.put(`/employees/${id}`, employee);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    if (config.USE_MOCK_API) {
      return mockAPI.employees.delete(id);
    }
    
    await api.delete(`/employees/${id}`);
  },

  getByGrade: async (grade: number): Promise<Employee[]> => {
    if (config.USE_MOCK_API) {
      const allEmployees = await mockAPI.employees.getAll();
      return allEmployees.filter(emp => emp.grade === grade);
    }
    
    const response: AxiosResponse<ApiResponse<Employee[]>> = await api.get(`/employees/grade/${grade}`);
    return response.data.data || [];
  }
};

// Payroll Service
export const payrollService = {
  calculateSalaries: async (): Promise<PayrollBatch> => {
    if (config.USE_MOCK_API) {
      return mockAPI.payroll.calculateSalaries();
    }
    
    const response: AxiosResponse<ApiResponse<PayrollBatch>> = await api.get('/payroll/calculate');
    return response.data.data!;
  },

  createBatch: async (): Promise<PayrollBatch> => {
    if (config.USE_MOCK_API) {
      return mockAPI.payroll.createBatch();
    }
    
    const response: AxiosResponse<ApiResponse<PayrollBatch>> = await api.post('/payroll/batches');
    return response.data.data!;
  },

  processBatch: async (batchId: string): Promise<PayrollBatch> => {
    if (config.USE_MOCK_API) {
      return mockAPI.payroll.processBatch(batchId);
    }
    
    const response: AxiosResponse<ApiResponse<PayrollBatch>> = await api.post(`/payroll/batches/${batchId}/process`);
    return response.data.data!;
  },

  getBatch: async (batchId: string): Promise<PayrollBatch> => {
    const response: AxiosResponse<ApiResponse<PayrollBatch>> = await api.get(`/payroll/batches/${batchId}`);
    return response.data.data!;
  },

  getBatches: async (): Promise<PayrollBatch[]> => {
    const response: AxiosResponse<ApiResponse<PayrollBatch[]>> = await api.get('/payroll/batches');
    return response.data.data || [];
  }
};

// Company Service
export const companyService = {
  getAccount: async (): Promise<Company> => {
    if (config.USE_MOCK_API) {
      return mockAPI.company.getAccount();
    }
    
    const response: AxiosResponse<ApiResponse<Company>> = await api.get('/company/account');
    return response.data.data!;
  },

  topUp: async (request: TopUpRequest): Promise<Transaction> => {
    if (config.USE_MOCK_API) {
      return mockAPI.company.topUp(request);
    }
    
    const response: AxiosResponse<ApiResponse<Transaction>> = await api.post('/company/topup', request);
    return response.data.data!;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    if (config.USE_MOCK_API) {
      return mockAPI.company.getTransactions();
    }
    
    const response: AxiosResponse<ApiResponse<Transaction[]>> = await api.get('/company/transactions');
    return response.data.data || [];
  }
};

export default api;
