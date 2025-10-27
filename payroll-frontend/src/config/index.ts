// Application configuration
// Environment-based configuration following industry standards
export const config = {
  // API Configuration
  USE_MOCK_API: false, // Set to false for backend integration
  API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:20001/pms/v1/api',
  API_TIMEOUT: 30000, // 30 seconds timeout
  
  // Environment detection
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  
  // App metadata
  APP_NAME: 'Payroll Management System',
  APP_VERSION: '1.0.0',
  
  // Business rules
  MAX_EMPLOYEES: 10,
  GRADE_DISTRIBUTION: {
    1: 1, // Grade 1: 1 employee (highest)
    2: 1, // Grade 2: 1 employee
    3: 2, // Grade 3: 2 employees
    4: 2, // Grade 4: 2 employees
    5: 2, // Grade 5: 2 employees
    6: 2  // Grade 6: 2 employees (lowest)
  },
  
  // Salary calculation
  DEFAULT_BASE_SALARY_GRADE_6: 30000,
  HRA_PERCENTAGE: 0.20, // 20%
  MEDICAL_PERCENTAGE: 0.15, // 15%
  GRADE_INCREMENT: 5000,
  
  // UI settings
  CURRENCY: 'BDT',
  DATE_FORMAT: 'yyyy-MM-dd',
  
  // Demo credentials
  DEMO_CREDENTIALS: {
    username: 'admin',
    password: 'admin123'
  }
};