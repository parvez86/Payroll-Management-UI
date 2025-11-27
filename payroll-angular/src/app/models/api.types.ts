// API Response format matching backend
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// Company types
export interface BackendCompany {
  id: string;
  name: string;
  description: string;
  salaryFormulaId: string;
  mainAccount: BankAccount;
  createdAt: string;
  createdBy: any;
}

// Bank Account
export interface BankAccount {
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
}

// Grade
export interface Grade {
  id: string;
  name: string;
  rank: number;
}

// Employee
export interface Employee {
  id: string;
  code: string;
  name: string;
  address: string;
  mobile: string;
  username?: string;
  email?: string;
  password?: string;
  grade: Grade;
  account: BankAccount;
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

// Salary
export interface EmployeeSalary {
  basic: number;
  houseRent: number;
  medicalAllowance: number;
  gross: number;
  isPaid?: boolean;
}

// Auth
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
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
  description?: string;
  companyId: string;
  bizId?: string;
}

// Payroll
export interface PayrollCalculationResponse {
  companyId: string;
  employeeCount: number;
  grade6BasicSalary: number;
  totalPay: number;
  salaries: Array<{
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    grade: number;
    basicSalary: number;
    houseRentAllowance: number;
    medicalAllowance: number;
    grossSalary: number;
  }>;
}

export interface SalaryTransferRequest {
  companyId: string;
  salaries: Array<{
    employeeId: string;
    amount: number;
  }>;
}

export interface SalaryTransferResponse {
  success: boolean;
  message: string;
  batchId: string;
  batchName: string;
  processedCount: number;
  totalAmount: number;
  timestamp: string;
  transfers: Array<{
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    amount: number;
    status: string;
  }>;
}

export interface SalarySheetResponse {
  batchId: string;
  batchName: string;
  status: string;
  processedDate: string;
  totalPaid: number;
  companyBalance: number;
  salaries: Array<{
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    grade: number;
    basic: number;
    hra: number;
    medical: number;
    gross: number;
    netAmount: number;
    status: string;
  }>;
}

// Company/Transaction
export interface TopUpRequest {
  amount: number;
  description?: string;
}

export interface TopUpResponse {
  transactionId: string;
  companyId: string;
  amount: number;
  newBalance: number;
  timestamp: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  timestamp: string;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  currentBalance: number;
}

// Generic transaction transfer (new API)
export interface TransactionTransferRequest {
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  payrollBatchId?: string;
  payrollItemId?: string;
  transactionType: 'SALARY_DISBURSEMENT' | string;
  transactionCategory: 'PAYROLL' | string;
  referenceId?: string;
}

export interface TransactionTransferResponse {
  transactionId?: string;
  status?: string;
  message?: string;
  success?: boolean;
}
