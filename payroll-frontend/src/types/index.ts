// Core business entities matching development.md domain model

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYER' | 'EMPLOYEE';
}

export interface Employee {
  id: string;
  bizId: string; // 4-digit unique business ID
  name: string;
  address: string;
  mobile: string;
  grade: number; // 1-6, Grade 1 = highest
  account: BankAccount;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankAccount {
  id: string;
  accountType: 'SAVINGS' | 'CURRENT';
  accountName: string;
  accountNumber: string;
  currentBalance: number;
  bankName: string;
  branchName: string;
}

export interface Company {
  id: string;
  name: string;
  account: BankAccount;
  currentBalance: number;
}

export interface PayrollBatch {
  id: string;
  companyId: string;
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  executedAt?: string;
  items: PayrollItem[];
}

export interface PayrollItem {
  id: string;
  employeeId: string;
  employee: Employee;
  basic: number;
  hra: number;
  medical: number;
  gross: number;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'PAID';
  failureReason?: string;
  executedAt?: string;
}

export interface Transaction {
  id: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  type: 'PAYROLL_DISBURSEMENT' | 'TOP_UP';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  requestedAt: string;
  processedAt?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

// Company top-up request
export interface TopUpRequest {
  amount: number;
  description?: string;
}