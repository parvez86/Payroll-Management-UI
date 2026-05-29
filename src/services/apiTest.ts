/**
 * Simple API Connection Test
 * Test the real backend connection without any mock data
 */

import { authService, employeeService, payrollService, companyService } from './api';

export const testRealAPIConnection = async () => {
  console.log('🧪 Testing Real Backend API Connection...');
  
  try {
    // Test 1: Login
    console.log('1️⃣ Testing Login...');
    const loginResult = await authService.login({
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Login Success:', loginResult);

    // Test 2: Get All Employees  
    console.log('2️⃣ Testing Get Employees...');
    const employees = await employeeService.getAll();
    console.log('✅ Employees Retrieved:', employees.length, 'employees');

    // Test 3: Get Company Account
    console.log('3️⃣ Testing Company Account...');
    const companyAccount = await companyService.getAccount();
    console.log('✅ Company Account:', companyAccount);

    // Test 4: Calculate Salaries
    console.log('4️⃣ Testing Salary Calculation...');
    const salaryCalc = await payrollService.calculateSalaries(25000);
    console.log('✅ Salary Calculation:', salaryCalc);

    console.log('🎉 ALL TESTS PASSED - Backend API Connection Working!');
    return true;

  } catch (error) {
    console.error('❌ API Connection Test Failed:', error);
    
    if (error.code === 'ERR_NETWORK') {
      console.error('🔥 Backend server is not running on http://localhost:20001');
    } else if (error.response?.status === 401) {
      console.error('🔐 Authentication failed - check credentials');
    } else {
      console.error('🚨 Unexpected error:', error.message);
    }
    
    return false;
  }
};

// Auto-run test when imported
export const runAPITest = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    setTimeout(() => testRealAPIConnection(), 1000);
  }
};