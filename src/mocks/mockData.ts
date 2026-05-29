/**
 * Mock Data - Payroll Management System
 * Organized mock data for development and testing
 */

import type { Employee, Company, User, Transaction } from '../types';

// Demo Credentials (matching API documentation)
export const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Mock User Data
export const mockUsers: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@company.com',
    role: 'ADMIN'
  }
];

// Mock Employee Data (Following exact API documentation structure)
export const mockEmployees: Employee[] = [
  {
    id: '1001',
    name: 'John A',
    grade: 1,
    address: 'Dhaka',
    mobile: '01700000001',
    bankAccount: {
      type: 'Current',
      name: 'John A',
      number: '1234567890',
      balance: 5000,
      bank: 'Global Bank',
      branch: 'Main'
    },
    salary: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '1002',
    name: 'Jane B',
    grade: 2,
    address: 'Chittagong',
    mobile: '01700000002',
    bankAccount: {
      type: 'Savings',
      name: 'Jane B',
      number: '1234567891',
      balance: 3000,
      bank: 'Global Bank',
      branch: 'Chittagong'
    },
    salary: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '1003',
    name: 'Mike C',
    grade: 3,
    address: 'Sylhet',
    mobile: '01700000003',
    bankAccount: {
      type: 'Current',
      name: 'Mike C',
      number: '1234567892',
      balance: 2000,
      bank: 'Standard Bank',
      branch: 'Sylhet'
    },
    salary: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '1004',
    name: 'Sarah D',
    grade: 3,
    address: 'Rajshahi',
    mobile: '01700000004',
    bankAccount: {
      type: 'Savings',
      name: 'Sarah D',
      number: '1234567893',
      balance: 1500,
      bank: 'Trust Bank',
      branch: 'Rajshahi'
    },
    salary: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '1005',
    name: 'David E',
    grade: 4,
    address: 'Khulna',
    mobile: '01700000005',
    bankAccount: {
      type: 'Current',
      name: 'David E',
      number: '1234567894',
      balance: 1000,
      bank: 'City Bank',
      branch: 'Khulna'
    },
    salary: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '1006',
    name: 'Lisa F',
    grade: 4,
    address: 'Barisal',
    mobile: '01700000006',
    bankAccount: {
      type: 'Savings',
      name: 'Lisa F',
      number: '1234567895',
      balance: 800,
      bank: 'Prime Bank',
      branch: 'Barisal'
    },
    salary: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '1007',
    name: 'Tom G',
    grade: 5,
    address: 'Rangpur',
    mobile: '01700000007',
    bankAccount: {
      type: 'Current',
      name: 'Tom G',
      number: '1234567896',
      balance: 600,
      bank: 'BRAC Bank',
      branch: 'Rangpur'
    },
    salary: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '1008',
    name: 'Anna H',
    grade: 5,
    address: 'Mymensingh',
    mobile: '01700000008',
    bankAccount: {
      type: 'Savings',
      name: 'Anna H',
      number: '1234567897',
      balance: 500,
      bank: 'AB Bank',
      branch: 'Mymensingh'
    },
    salary: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '1009',
    name: 'Chris I',
    grade: 6,
    address: 'Comilla',
    mobile: '01700000009',
    bankAccount: {
      type: 'Current',
      name: 'Chris I',
      number: '1234567898',
      balance: 400,
      bank: 'Eastern Bank',
      branch: 'Comilla'
    },
    salary: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '1010',
    name: 'Emma J',
    grade: 6,
    address: 'Jessore',
    mobile: '01700000010',
    bankAccount: {
      type: 'Savings',
      name: 'Emma J',
      number: '1234567899',
      balance: 300,
      bank: 'Mutual Trust Bank',
      branch: 'Jessore'
    },
    salary: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];

// Mock Company Data (Following API documentation structure)
export const mockCompany: Company = {
  accountNumber: 'COMP-001',
  accountName: 'Company Main Account',
  currentBalance: 500000,
  bank: 'Central Bank',
  branch: 'Head Office',
  lastUpdated: '2025-01-01T12:00:00Z'
};

// Mock Transaction Data
export const mockTransactions: Transaction[] = [
  {
    id: 'TXN-20250101120000',
    type: 'TOPUP',
    amount: 100000,
    description: 'Monthly fund allocation',
    balanceAfter: 600000,
    timestamp: '2025-01-01T12:00:00Z'
  },
  {
    id: 'TXN-20250101110000',
    type: 'SALARY_TRANSFER',
    amount: -67500,
    description: 'Salary transfer to John A (1001)',
    balanceAfter: 500000,
    timestamp: '2025-01-01T11:00:00Z'
  },
  {
    id: 'TXN-20250101100000',
    type: 'TOPUP',
    amount: 50000,
    description: 'Initial fund deposit',
    balanceAfter: 567500,
    timestamp: '2025-01-01T10:00:00Z'
  }
];

// Grade Distribution for validation (matches business rules)
export const GRADE_DISTRIBUTION = {
  1: 1, // Grade 1: 1 employee (highest)
  2: 1, // Grade 2: 1 employee
  3: 2, // Grade 3: 2 employees
  4: 2, // Grade 4: 2 employees
  5: 2, // Grade 5: 2 employees
  6: 2  // Grade 6: 2 employees (lowest)
};

// Business Rules Constants
export const BUSINESS_RULES = {
  MAX_EMPLOYEES: 10,
  DEFAULT_BASE_SALARY_GRADE_6: 25000,
  HRA_PERCENTAGE: 0.20, // 20%
  MEDICAL_PERCENTAGE: 0.15, // 15%
  GRADE_INCREMENT: 5000
};

// Salary Calculation Helper
export function calculateSalaryForGrade(grade: number, grade6Basic: number = BUSINESS_RULES.DEFAULT_BASE_SALARY_GRADE_6) {
  const basic = grade6Basic + (6 - grade) * BUSINESS_RULES.GRADE_INCREMENT;
  const houseRent = basic * BUSINESS_RULES.HRA_PERCENTAGE;
  const medicalAllowance = basic * BUSINESS_RULES.MEDICAL_PERCENTAGE;
  const gross = basic + houseRent + medicalAllowance;
  
  return { basic, houseRent, medicalAllowance, gross };
}