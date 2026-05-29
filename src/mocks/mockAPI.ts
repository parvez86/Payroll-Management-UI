/**
 * Mock API Services - Payroll Management System
 * Simulates backend API responses for development and testing
 */

import type { 
  Employee, 
  Company, 
  PayrollCalculationResponse,
  SalaryTransferRequest,
  SalaryTransferResponse,
  SalarySheetResponse,
  Transaction,
  TransactionHistoryResponse,
  LoginRequest, 
  LoginResponse,
  TopUpRequest,
  TopUpResponse
} from '../types';

import { 
  mockEmployees, 
  mockCompany, 
  mockTransactions, 
  mockUsers,
  DEMO_CREDENTIALS,
  calculateSalaryForGrade,
  BUSINESS_RULES
} from './mockData';

// In-memory storage (simulates database)
let employees = [...mockEmployees];
let company = { ...mockCompany };
let transactions = [...mockTransactions];
let nextEmployeeId = 1011;
let nextTransactionId = Date.now();

// Utility function to simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock error simulation
const shouldSimulateError = (probability: number = 0.1) => Math.random() < probability;

/**
 * Mock Authentication Service
 */
export const mockAuthService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    await delay(500);
    
    if (credentials.username === DEMO_CREDENTIALS.username && 
        credentials.password === DEMO_CREDENTIALS.password) {
      
      const user = mockUsers[0];
      return {
        token: `mock-jwt-token-${Date.now()}`,
        user,
        expiresIn: 86400000 // 24 hours
      };
    }
    
    throw new Error('Invalid credentials');
  },

  logout: async (): Promise<void> => {
    await delay(200);
    // Simulate logout success
  }
};

/**
 * Mock Employee Service
 */
export const mockEmployeeService = {
  getAll: async (): Promise<Employee[]> => {
    await delay(300);
    return [...employees];
  },

  getById: async (id: string): Promise<Employee> => {
    await delay(200);
    const employee = employees.find(emp => emp.id === id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    return { ...employee };
  },

  create: async (employeeData: Omit<Employee, 'createdAt' | 'updatedAt' | 'salary'>): Promise<Employee> => {
    await delay(600);
    
    // Simulate validation errors
    if (employees.some(emp => emp.id === employeeData.id)) {
      throw new Error('Employee ID already exists');
    }
    
    if (employees.some(emp => emp.mobile === employeeData.mobile)) {
      throw new Error('Mobile number already exists');
    }
    
    if (employees.length >= BUSINESS_RULES.MAX_EMPLOYEES) {
      throw new Error(`Maximum ${BUSINESS_RULES.MAX_EMPLOYEES} employees allowed`);
    }
    
    // Check grade distribution
    const gradeCount = employees.filter(emp => emp.grade === employeeData.grade).length;
    const maxAllowed = [1, 1, 2, 2, 2, 2][employeeData.grade - 1]; // Grade distribution limits
    if (gradeCount >= maxAllowed) {
      throw new Error(`Maximum ${maxAllowed} employee(s) allowed for Grade ${employeeData.grade}`);
    }
    
    const newEmployee: Employee = {
      ...employeeData,
      salary: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    employees.push(newEmployee);
    return { ...newEmployee };
  },

  update: async (id: string, employeeData: Partial<Employee>): Promise<Employee> => {
    await delay(500);
    
    const index = employees.findIndex(emp => emp.id === id);
    if (index === -1) {
      throw new Error('Employee not found');
    }
    
    // Validate uniqueness if ID or mobile is being updated
    if (employeeData.id && employeeData.id !== id) {
      if (employees.some(emp => emp.id === employeeData.id)) {
        throw new Error('Employee ID already exists');
      }
    }
    
    if (employeeData.mobile && employeeData.mobile !== employees[index].mobile) {
      if (employees.some(emp => emp.mobile === employeeData.mobile && emp.id !== id)) {
        throw new Error('Mobile number already exists');
      }
    }
    
    employees[index] = {
      ...employees[index],
      ...employeeData,
      updatedAt: new Date().toISOString()
    };
    
    return { ...employees[index] };
  },

  delete: async (id: string): Promise<void> => {
    await delay(400);
    
    const index = employees.findIndex(emp => emp.id === id);
    if (index === -1) {
      throw new Error('Employee not found');
    }
    
    employees.splice(index, 1);
  }
};

/**
 * Mock Payroll Service
 */
export const mockPayrollService = {
  calculateSalaries: async (grade6Basic: number): Promise<PayrollCalculationResponse> => {
    await delay(400);
    
    const calculatedEmployees = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      grade: emp.grade,
      salary: calculateSalaryForGrade(emp.grade, grade6Basic)
    }));
    
    const totalSalaryRequired = calculatedEmployees.reduce((sum, emp) => sum + emp.salary.gross, 0);
    
    return {
      employees: calculatedEmployees,
      totalSalaryRequired,
      calculatedAt: new Date().toISOString()
    };
  },

  processSalaryTransfer: async (request: SalaryTransferRequest): Promise<SalaryTransferResponse> => {
    await delay(2000); // Simulate processing time
    
    const { employeeIds, grade6Basic } = request;
    const transferResults = [];
    let totalTransferred = 0;
    let totalFailed = 0;
    
    for (const empId of employeeIds) {
      const employee = employees.find(emp => emp.id === empId);
      if (!employee) {
        transferResults.push({
          employeeId: empId,
          name: 'Unknown',
          salaryAmount: 0,
          status: 'FAILED' as const,
          reason: 'Employee not found'
        });
        continue;
      }
      
      const salary = calculateSalaryForGrade(employee.grade, grade6Basic);
      
      // Check company balance
      if (company.currentBalance < salary.gross) {
        transferResults.push({
          employeeId: empId,
          name: employee.name,
          salaryAmount: salary.gross,
          status: 'FAILED' as const,
          reason: 'Insufficient company balance'
        });
        totalFailed += salary.gross;
        continue;
      }
      
      // Process successful transfer
      company.currentBalance -= salary.gross;
      employee.bankAccount.balance += salary.gross;
      
      transferResults.push({
        employeeId: empId,
        name: employee.name,
        salaryAmount: salary.gross,
        status: 'SUCCESS' as const,
        transferredAt: new Date().toISOString()
      });
      
      totalTransferred += salary.gross;
      
      // Record transaction
      const transaction: Transaction = {
        id: `TXN-${nextTransactionId++}`,
        type: 'SALARY_TRANSFER',
        amount: -salary.gross,
        description: `Salary transfer to ${employee.name} (${employee.id})`,
        balanceAfter: company.currentBalance,
        timestamp: new Date().toISOString()
      };
      transactions.unshift(transaction);
    }
    
    return {
      transferResults,
      totalTransferred,
      totalFailed,
      companyBalanceAfter: company.currentBalance
    };
  },

  getSalarySheet: async (grade6Basic: number): Promise<SalarySheetResponse> => {
    await delay(300);
    
    const employeesWithSalary = employees.map(emp => {
      const salary = calculateSalaryForGrade(emp.grade, grade6Basic);
      return {
        id: emp.id,
        name: emp.name,
        grade: emp.grade,
        salary: {
          ...salary,
          isPaid: Math.random() > 0.3, // Mock 70% as paid
          paidAt: Math.random() > 0.3 ? new Date().toISOString() : undefined
        }
      };
    });
    
    const totalSalaryRequired = employeesWithSalary.reduce((sum, emp) => sum + emp.salary.gross, 0);
    const totalPaid = employeesWithSalary
      .filter(emp => emp.salary.isPaid)
      .reduce((sum, emp) => sum + emp.salary.gross, 0);
    
    return {
      employees: employeesWithSalary,
      summary: {
        totalEmployees: employees.length,
        totalSalaryRequired,
        totalPaid,
        totalPending: totalSalaryRequired - totalPaid,
        companyBalance: company.currentBalance
      },
      generatedAt: new Date().toISOString()
    };
  }
};

/**
 * Mock Company Service
 */
export const mockCompanyService = {
  getAccount: async (): Promise<Company> => {
    await delay(200);
    return { ...company };
  },

  topUp: async (request: TopUpRequest): Promise<TopUpResponse> => {
    await delay(800);
    
    const previousBalance = company.currentBalance;
    company.currentBalance += request.amount;
    
    const transaction: Transaction = {
      id: `TXN-${nextTransactionId++}`,
      type: 'TOPUP',
      amount: request.amount,
      description: request.description,
      balanceAfter: company.currentBalance,
      timestamp: new Date().toISOString()
    };
    
    transactions.unshift(transaction);
    
    return {
      previousBalance,
      topupAmount: request.amount,
      newBalance: company.currentBalance,
      transactionId: transaction.id,
      timestamp: transaction.timestamp
    };
  },

  getTransactions: async (limit: number = 50, offset: number = 0): Promise<TransactionHistoryResponse> => {
    await delay(300);
    
    const paginatedTransactions = transactions.slice(offset, offset + limit);
    
    return {
      transactions: paginatedTransactions,
      totalCount: transactions.length,
      hasMore: offset + limit < transactions.length
    };
  }
};

/**
 * Combined Mock API
 */
export const mockAPI = {
  auth: mockAuthService,
  employees: mockEmployeeService,
  payroll: mockPayrollService,
  company: mockCompanyService
};