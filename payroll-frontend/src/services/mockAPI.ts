// Mock data service for development and testing
import type { 
  Employee, 
  Company, 
  User, 
  PayrollBatch, 
  Transaction, 
  LoginRequest, 
  LoginResponse,
  TopUpRequest
} from '../types';

// Mock data storage
let mockEmployees: Employee[] = [
  {
    id: '1',
    bizId: '1001',
    name: 'John Smith',
    address: '123 Main St, Dhaka',
    mobile: '01712345678',
    grade: 1,
    account: {
      id: 'acc1',
      accountType: 'SAVINGS',
      accountName: 'John Smith',
      accountNumber: 'ACC10011001',
      currentBalance: 0,
      bankName: 'Sonali Bank',
      branchName: 'Dhaka Main Branch'
    }
  },
  {
    id: '2',
    bizId: '2001',
    name: 'Sarah Johnson',
    address: '456 Oak Ave, Chittagong',
    mobile: '01812345678',
    grade: 2,
    account: {
      id: 'acc2',
      accountType: 'CURRENT',
      accountName: 'Sarah Johnson',
      accountNumber: 'ACC20012001',
      currentBalance: 0,
      bankName: 'Dutch Bangla Bank',
      branchName: 'Chittagong Branch'
    }
  }
];

let mockCompany: Company = {
  id: 'company1',
  name: 'TechCorp Ltd',
  currentBalance: 150000,
  account: {
    id: 'company-acc',
    accountType: 'CURRENT',
    accountName: 'TechCorp Ltd',
    accountNumber: 'COMP00011001',
    currentBalance: 150000,
    bankName: 'Standard Chartered',
    branchName: 'Gulshan Branch'
  }
};

let mockTransactions: Transaction[] = [];

let nextEmployeeId = 3;
let nextTransactionId = 1;

// Utility function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API implementations
export const mockAPI = {
  // Auth endpoints
  auth: {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
      await delay(500);
      
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        const user: User = {
          id: 'user1',
          username: 'admin',
          email: 'admin@techcorp.com',
          role: 'ADMIN'
        };
        
        return {
          token: 'mock-jwt-token-' + Date.now(),
          user,
          expiresIn: 3600000
        };
      }
      
      throw new Error('Invalid credentials');
    }
  },

  // Employee endpoints
  employees: {
    getAll: async (): Promise<Employee[]> => {
      await delay(300);
      return [...mockEmployees];
    },

    getById: async (id: string): Promise<Employee> => {
      await delay(200);
      const employee = mockEmployees.find(emp => emp.id === id);
      if (!employee) throw new Error('Employee not found');
      return employee;
    },

    create: async (employeeData: Omit<Employee, 'id' | 'account'>): Promise<Employee> => {
      await delay(500);
      
      // Validate business rules
      if (mockEmployees.some(emp => emp.bizId === employeeData.bizId)) {
        throw new Error('Employee ID already exists');
      }
      
      if (mockEmployees.length >= 10) {
        throw new Error('Maximum 10 employees allowed');
      }
      
      const newEmployee: Employee = {
        ...employeeData,
        id: nextEmployeeId.toString(),
        account: {
          id: `acc${nextEmployeeId}`,
          accountType: 'SAVINGS',
          accountName: employeeData.name,
          accountNumber: `ACC${employeeData.bizId}${Date.now().toString().slice(-4)}`,
          currentBalance: 0,
          bankName: 'Sonali Bank',
          branchName: 'Main Branch'
        }
      };
      
      nextEmployeeId++;
      mockEmployees.push(newEmployee);
      return newEmployee;
    },

    update: async (id: string, updates: Partial<Employee>): Promise<Employee> => {
      await delay(400);
      
      const index = mockEmployees.findIndex(emp => emp.id === id);
      if (index === -1) throw new Error('Employee not found');
      
      // Validate bizId uniqueness if it's being updated
      if (updates.bizId && updates.bizId !== mockEmployees[index].bizId) {
        if (mockEmployees.some(emp => emp.bizId === updates.bizId && emp.id !== id)) {
          throw new Error('Employee ID already exists');
        }
      }
      
      mockEmployees[index] = { ...mockEmployees[index], ...updates };
      return mockEmployees[index];
    },

    delete: async (id: string): Promise<void> => {
      await delay(300);
      
      const index = mockEmployees.findIndex(emp => emp.id === id);
      if (index === -1) throw new Error('Employee not found');
      
      mockEmployees.splice(index, 1);
    }
  },

  // Payroll endpoints
  payroll: {
    calculateSalaries: async (): Promise<PayrollBatch> => {
      await delay(400);
      
      // This would normally calculate based on current employees
      return {
        id: 'preview-batch',
        companyId: mockCompany.id,
        totalAmount: 0, // Calculated on frontend
        status: 'PENDING',
        items: []
      };
    },

    createBatch: async (): Promise<PayrollBatch> => {
      await delay(600);
      
      const batchId = `batch-${Date.now()}`;
      return {
        id: batchId,
        companyId: mockCompany.id,
        totalAmount: 0,
        status: 'PENDING',
        items: []
      };
    },

    processBatch: async (batchId: string): Promise<PayrollBatch> => {
      await delay(2000); // Simulate processing time
      
      // Calculate total payroll
      const baseSalary = 30000;
      let totalAmount = 0;
      
      const items = mockEmployees.map(emp => {
        const basic = baseSalary + (6 - emp.grade) * 5000;
        const hra = basic * 0.20;
        const medical = basic * 0.15;
        const gross = basic + hra + medical;
        totalAmount += gross;
        
        return {
          id: `item-${emp.id}`,
          employeeId: emp.id,
          employee: emp,
          basic,
          hra,
          medical,
          gross,
          status: 'PAID' as const,
          executedAt: new Date().toISOString()
        };
      });
      
      // Check if company has sufficient funds
      if (mockCompany.currentBalance < totalAmount) {
        throw new Error(`Insufficient funds. Required: ${totalAmount}, Available: ${mockCompany.currentBalance}`);
      }
      
      // Update company balance
      mockCompany.currentBalance -= totalAmount;
      mockCompany.account.currentBalance = mockCompany.currentBalance;
      
      // Update employee balances
      items.forEach(item => {
        const employee = mockEmployees.find(emp => emp.id === item.employeeId);
        if (employee) {
          employee.account.currentBalance += item.gross;
        }
      });
      
      // Record transaction
      const transaction: Transaction = {
        id: nextTransactionId.toString(),
        debitAccountId: mockCompany.account.id,
        creditAccountId: 'multiple', // Multiple employee accounts
        amount: totalAmount,
        type: 'PAYROLL_DISBURSEMENT',
        status: 'SUCCESS',
        requestedAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      };
      
      mockTransactions.unshift(transaction);
      nextTransactionId++;
      
      return {
        id: batchId,
        companyId: mockCompany.id,
        totalAmount,
        status: 'COMPLETED',
        executedAt: new Date().toISOString(),
        items
      };
    }
  },

  // Company endpoints
  company: {
    getAccount: async (): Promise<Company> => {
      await delay(200);
      return { ...mockCompany };
    },

    topUp: async (request: TopUpRequest): Promise<Transaction> => {
      await delay(800);
      
      // Update company balance
      mockCompany.currentBalance += request.amount;
      mockCompany.account.currentBalance = mockCompany.currentBalance;
      
      // Record transaction
      const transaction: Transaction = {
        id: nextTransactionId.toString(),
        debitAccountId: 'external', // External funding source
        creditAccountId: mockCompany.account.id,
        amount: request.amount,
        type: 'TOP_UP',
        status: 'SUCCESS',
        requestedAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      };
      
      mockTransactions.unshift(transaction);
      nextTransactionId++;
      
      return transaction;
    },

    getTransactions: async (): Promise<Transaction[]> => {
      await delay(300);
      return [...mockTransactions];
    }
  }
};

// Mock API for development and testing