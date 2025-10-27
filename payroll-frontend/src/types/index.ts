// Core business entities matching development.md domain model

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYER' | 'EMPLOYEE';
}

export interface Employee {
  id: string;
  code: string; // Employee code like "1001"
  name: string;
  address: string;
  mobile: string;
  grade: {
    id: string;
    name: string;
    rank: number;
  };
  account: {
    id: string;
    ownerType: string;
    ownerId: string;
    accountType: string;
    accountName: string;
    accountNumber: string;
    currentBalance: number;
    overdraftLimit: number;
    branchId: string;
    branchName: string;
    status: string;
    createdAt: string;
    createdBy: any;
  };
  company: {
    id: string;
    name: string;
    description: string;
    salaryFormulaId: string;
    mainAccount: any;
    createdAt: string;
    createdBy: any;
  };
  status: string;
  salary?: EmployeeSalary | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankAccount {
  type: 'Savings' | 'Current';
  name: string;
  number: string; // 10-20 digits
  balance: number;
  bank: string;
  branch: string;
}

export interface EmployeeSalary {
  basic: number;
  houseRent: number;
  medicalAllowance: number;
  gross: number;
  isPaid?: boolean;
  paidAt?: string;
}

export interface Company {
  accountNumber: string;
  accountName: string;
  currentBalance: number;
  bank: string;
  branch: string;
  lastUpdated: string;
}

export interface UserProfile {
  user: User;
  account: {
    id: string;
    accountName: string;
    accountNumber: string;
    currentBalance: number;
    accountType: string;
    branchName: string;
  };
  fullName: string;
  description: string;
  companyId: string;
}

export interface PayrollCalculationResponse {
  employees: Array<{
    id: string;
    name: string;
    grade: number;
    salary: {
      basic: number;
      houseRent: number;
      medicalAllowance: number;
      gross: number;
    };
  }>;
  totalSalaryRequired: number;
  calculatedAt: string;
}

export interface SalaryTransferRequest {
  employeeIds: string[];
  grade6Basic: number;
}

export interface SalaryTransferResponse {
  transferResults: Array<{
    employeeId: string;
    name: string;
    salaryAmount: number;
    status: 'SUCCESS' | 'FAILED';
    reason?: string;
    transferredAt?: string;
  }>;
  totalTransferred: number;
  totalFailed: number;
  companyBalanceAfter: number;
}

export interface SalarySheetResponse {
  employees: Array<{
    id: string;
    name: string;
    grade: number;
    salary: EmployeeSalary;
  }>;
  summary: {
    totalEmployees: number;
    totalSalaryRequired: number;
    totalPaid: number;
    totalPending: number;
    companyBalance: number;
  };
  generatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'TOPUP' | 'SALARY_TRANSFER';
  amount: number;
  description: string;
  balanceAfter: number;
  timestamp: string;
}

export interface TopUpRequest {
  amount: number;
  description: string;
}

export interface TopUpResponse {
  previousBalance: number;
  topupAmount: number;
  newBalance: number;
  transactionId: string;
  timestamp: string;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  totalCount: number;
  hasMore: boolean;
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

// PayrollBatch interface for batch processing
export interface PayrollBatch {
  id: string;
  companyId: string;
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  executedAt?: string;
  items: PayrollItem[];
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
  token: string;          // Access token (JWT)
  refreshToken?: string;  // Refresh token (optional)
  user: User;
  expiresIn: number;      // Token expiration in seconds
  tokenType?: string;     // Usually "Bearer"
}

// Company top-up request (duplicate removed - using the one above)