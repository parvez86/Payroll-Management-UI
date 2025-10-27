/**
 * Backend Integration Test Suite
 * Comprehensive testing for API endpoints following industry best practices
 */

import { authService, employeeService, payrollService, companyService } from '../services/api';
import { validationService } from '../services/validationService';
import { apiClient } from '../services/apiClient';
import { config } from '../config';

export interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  error?: any;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  totalDuration: number;
}

class IntegrationTester {
  private testResults: TestSuite[] = [];

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<TestSuite[]> {
    console.log('🧪 Starting Backend Integration Tests...');
    
    this.testResults = [];
    
    // Test in logical order
    await this.runHealthCheckTests();
    await this.runAuthenticationTests();
    await this.runEmployeeTests();
    await this.runPayrollTests();
    await this.runCompanyTests();
    await this.runValidationTests();
    
    this.printTestSummary();
    return this.testResults;
  }

  /**
   * Test API health and connectivity
   */
  async runHealthCheckTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Health Check & Connectivity',
      results: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    // Test 1: Basic connectivity
    await this.runTest(suite, 'API Health Check', async () => {
      try {
        await apiClient.healthCheck();
        return 'Health check endpoint responded successfully';
      } catch (error) {
        // If mock API, skip this test
        if (config.USE_MOCK_API) {
          throw new Error('SKIP: Mock API mode - health check not available');
        }
        throw error;
      }
    });

    // Test 2: Base URL accessibility
    await this.runTest(suite, 'Base URL Accessibility', async () => {
      const response = await fetch(config.API_BASE_URL.replace('/pms/v1/api', ''));
      if (response.ok || response.status === 404) {
        return 'Base URL is accessible';
      }
      throw new Error(`Base URL returned status: ${response.status}`);
    });

    this.testResults.push(suite);
    return suite;
  }

  /**
   * Test authentication endpoints
   */
  async runAuthenticationTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Authentication',
      results: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    // Test 1: Valid login
    await this.runTest(suite, 'Valid Login', async () => {
      const response = await authService.login({
        username: config.DEMO_CREDENTIALS.username,
        password: config.DEMO_CREDENTIALS.password
      });
      
      if (!response.token || !response.user) {
        throw new Error('Login response missing token or user data');
      }
      
      return `Login successful - token: ${response.token.substring(0, 20)}...`;
    });

    // Test 2: Invalid login
    await this.runTest(suite, 'Invalid Login Handling', async () => {
      try {
        await authService.login({
          username: 'invalid',
          password: 'wrong'
        });
        throw new Error('Invalid login should have failed');
      } catch (error: any) {
        if (error.message.includes('should have failed')) {
          throw error;
        }
        return 'Invalid credentials correctly rejected';
      }
    });

    // Test 3: Token persistence
    await this.runTest(suite, 'Token Persistence', async () => {
      const isAuth = authService.isAuthenticated();
      if (!isAuth) {
        throw new Error('Token not persisted after login');
      }
      return 'Authentication token correctly persisted';
    });

    this.testResults.push(suite);
    return suite;
  }

  /**
   * Test employee management endpoints
   */
  async runEmployeeTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Employee Management',
      results: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    let testEmployeeId: string | null = null;

    // Test 1: Get all employees
    await this.runTest(suite, 'Get All Employees', async () => {
      const employees = await employeeService.getAll();
      if (!Array.isArray(employees)) {
        throw new Error('Employees response is not an array');
      }
      return `Retrieved ${employees.length} employees`;
    });

    // Test 2: Create employee
    await this.runTest(suite, 'Create Employee', async () => {
      testEmployeeId = '9999'; // Test ID
      const newEmployee = {
        id: testEmployeeId,
        name: 'Test Employee',
        grade: 6,
        address: 'Test Address',
        mobile: '01700000999',
        bankAccount: {
          type: 'Savings' as const,
          name: 'Test Employee',
          number: '1234567890123',
          balance: 0,
          bank: 'Test Bank',
          branch: 'Test Branch'
        }
      };

      const created = await employeeService.create(newEmployee);
      if (created.id !== testEmployeeId) {
        throw new Error('Created employee ID mismatch');
      }
      return `Employee created with ID: ${created.id}`;
    });

    // Test 3: Get employee by ID
    await this.runTest(suite, 'Get Employee by ID', async () => {
      if (!testEmployeeId) {
        throw new Error('SKIP: No test employee created');
      }
      
      const employee = await employeeService.getById(testEmployeeId);
      if (employee.id !== testEmployeeId) {
        throw new Error('Retrieved employee ID mismatch');
      }
      return `Retrieved employee: ${employee.name}`;
    });

    // Test 4: Update employee
    await this.runTest(suite, 'Update Employee', async () => {
      if (!testEmployeeId) {
        throw new Error('SKIP: No test employee created');
      }
      
      const updated = await employeeService.update(testEmployeeId, {
        name: 'Updated Test Employee'
      });
      
      if (updated.name !== 'Updated Test Employee') {
        throw new Error('Employee update failed');
      }
      return 'Employee successfully updated';
    });

    // Test 5: Delete employee
    await this.runTest(suite, 'Delete Employee', async () => {
      if (!testEmployeeId) {
        throw new Error('SKIP: No test employee created');
      }
      
      await employeeService.delete(testEmployeeId);
      
      // Verify deletion
      try {
        await employeeService.getById(testEmployeeId);
        throw new Error('Employee still exists after deletion');
      } catch (error: any) {
        if (error.message.includes('not found') || error.message.includes('404')) {
          return 'Employee successfully deleted';
        }
        throw error;
      }
    });

    this.testResults.push(suite);
    return suite;
  }

  /**
   * Test payroll endpoints
   */
  async runPayrollTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Payroll Management',
      results: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    const testGrade6Basic = 25000;

    // Test 1: Calculate salaries
    await this.runTest(suite, 'Calculate Salaries', async () => {
      const calculation = await payrollService.calculateSalaries(testGrade6Basic);
      
      if (!calculation.employees || !Array.isArray(calculation.employees)) {
        throw new Error('Salary calculation response invalid');
      }
      
      return `Calculated salaries for ${calculation.employees.length} employees, total: ${calculation.totalSalaryRequired}`;
    });

    // Test 2: Get salary sheet
    await this.runTest(suite, 'Get Salary Sheet', async () => {
      const sheet = await payrollService.getSalarySheet(testGrade6Basic);
      
      if (!sheet.employees || !sheet.summary) {
        throw new Error('Salary sheet response invalid');
      }
      
      return `Generated salary sheet with ${sheet.summary.totalEmployees} employees`;
    });

    // Test 3: Process salary transfer (mock only for safety)
    await this.runTest(suite, 'Process Salary Transfer', async () => {
      if (!config.USE_MOCK_API) {
        throw new Error('SKIP: Only testing with mock API for safety');
      }
      
      const transferRequest = {
        employeeIds: ['1001', '1002'],
        grade6Basic: testGrade6Basic
      };
      
      const result = await payrollService.processSalaryTransfer(transferRequest);
      
      if (!result.transferResults || !Array.isArray(result.transferResults)) {
        throw new Error('Transfer result response invalid');
      }
      
      return `Processed transfers: ${result.transferResults.length} employees`;
    });

    this.testResults.push(suite);
    return suite;
  }

  /**
   * Test company account endpoints
   */
  async runCompanyTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Company Account',
      results: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    // Test 1: Get company account
    await this.runTest(suite, 'Get Company Account', async () => {
      const account = await companyService.getAccount();
      
      if (typeof account.currentBalance !== 'number') {
        throw new Error('Account balance is not a number');
      }
      
      return `Account balance: ${account.currentBalance}`;
    });

    // Test 2: Get transaction history
    await this.runTest(suite, 'Get Transaction History', async () => {
      const history = await companyService.getTransactions();
      
      if (!history.transactions || !Array.isArray(history.transactions)) {
        throw new Error('Transaction history response invalid');
      }
      
      return `Retrieved ${history.transactions.length} transactions`;
    });

    // Test 3: Top-up account (mock only for safety)
    await this.runTest(suite, 'Top-up Account', async () => {
      if (!config.USE_MOCK_API) {
        throw new Error('SKIP: Only testing with mock API for safety');
      }
      
      const topupRequest = {
        amount: 10000,
        description: 'Test top-up'
      };
      
      const result = await companyService.topUp(topupRequest);
      
      if (result.topupAmount !== topupRequest.amount) {
        throw new Error('Top-up amount mismatch');
      }
      
      return `Top-up successful: ${result.topupAmount}`;
    });

    this.testResults.push(suite);
    return suite;
  }

  /**
   * Test validation service
   */
  async runValidationTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Data Validation',
      results: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    // Test 1: Employee ID validation
    await this.runTest(suite, 'Employee ID Validation', async () => {
      const validResult = await validationService.validateEmployeeId('1234');
      const invalidResult = await validationService.validateEmployeeId('12');
      
      if (!validResult.isValid || invalidResult.isValid) {
        throw new Error('Employee ID validation logic incorrect');
      }
      
      return 'Employee ID validation working correctly';
    });

    // Test 2: Grade distribution
    await this.runTest(suite, 'Grade Distribution Check', async () => {
      const distribution = await validationService.getGradeDistribution();
      
      if (typeof distribution !== 'object') {
        throw new Error('Grade distribution response invalid');
      }
      
      const totalEmployees = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      return `Grade distribution retrieved: ${totalEmployees} total employees`;
    });

    // Test 3: Mobile number validation
    await this.runTest(suite, 'Mobile Number Validation', async () => {
      const validResult = await validationService.validateMobile('01700000000');
      const invalidResult = await validationService.validateMobile('12345');
      
      if (!validResult.isValid || invalidResult.isValid) {
        throw new Error('Mobile number validation logic incorrect');
      }
      
      return 'Mobile number validation working correctly';
    });

    this.testResults.push(suite);
    return suite;
  }

  /**
   * Run individual test with timing and error handling
   */
  private async runTest(suite: TestSuite, name: string, testFn: () => Promise<string>): Promise<void> {
    const startTime = Date.now();
    let result: TestResult;

    try {
      const message = await testFn();
      const duration = Date.now() - startTime;
      
      result = {
        name,
        status: 'PASS',
        message,
        duration
      };
      
      suite.passed++;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error.message.startsWith('SKIP:')) {
        result = {
          name,
          status: 'SKIP',
          message: error.message.replace('SKIP:', '').trim(),
          duration
        };
        suite.skipped++;
      } else {
        result = {
          name,
          status: 'FAIL',
          message: error.message || 'Unknown error',
          duration,
          error
        };
        suite.failed++;
      }
    }

    suite.results.push(result);
    suite.totalDuration += result.duration;
    
    // Log result
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'SKIP' ? '⏭️' : '❌';
    console.log(`${statusIcon} ${name}: ${result.message} (${result.duration}ms)`);
  }

  /**
   * Print comprehensive test summary
   */
  private printTestSummary(): void {
    console.log('\n📊 Backend Integration Test Summary');
    console.log('=' .repeat(50));
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;

    this.testResults.forEach(suite => {
      console.log(`\n📁 ${suite.name}`);
      console.log(`   ✅ Passed: ${suite.passed}`);
      console.log(`   ❌ Failed: ${suite.failed}`);
      console.log(`   ⏭️ Skipped: ${suite.skipped}`);
      console.log(`   ⏱️ Duration: ${suite.totalDuration}ms`);
      
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalSkipped += suite.skipped;
      totalDuration += suite.totalDuration;
    });

    console.log('\n🎯 Overall Results');
    console.log(`   Total Tests: ${totalPassed + totalFailed + totalSkipped}`);
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   ⏭️ Skipped: ${totalSkipped}`);
    console.log(`   ⏱️ Total Duration: ${totalDuration}ms`);
    console.log(`   📈 Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! Backend integration is working correctly.');
    } else {
      console.log(`\n⚠️ ${totalFailed} test(s) failed. Please check the backend configuration.`);
    }
  }
}

// Export singleton instance
export const integrationTester = new IntegrationTester();
export default integrationTester;