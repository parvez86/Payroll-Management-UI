// Application configuration
// Change USE_MOCK_API to false when backend is ready
export const config = {
  USE_MOCK_API: true, // Set to false for production API
  API_BASE_URL: 'http://localhost:8080/pms/v1/api',
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