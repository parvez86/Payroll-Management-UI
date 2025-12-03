import { Component, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { EmployeeService } from './services/employee.service';
import { PayrollService } from './services/payroll.service';
import { CompanyService } from './services/company.service';
import { formatCurrency, calculateBasicSalary, calculateTotalSalary } from './simulator/salary-calculator';
import type { Employee, PayrollCalculationResponse, UserProfile } from './models/api.types';

@Component({
  selector: 'app-real-backend',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './real-backend.component.html',
  styleUrls: ['./real-backend.component.css']
})
export class RealBackendComponent {
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private payrollService = inject(PayrollService);
  private companyService = inject(CompanyService);

  // State signals
  isLoggedIn = signal(false);
  userProfile = signal<UserProfile | null>(null);
  employees = signal<Employee[]>([]);
  companyAccountBalance = signal(0);
  companyId = signal('');
  primaryCompanyId = computed(() => {
    const profile = this.userProfile();
    return profile?.companyId || '';
  });
  grade6Basic = signal(25000);
  view = signal<'employees' | 'salarySheet' | 'addEdit'>('employees');
  editEmployee = signal<Employee | null>(null);
  message = signal('');
  topUpAmount = signal(0);
  isTopUpModalOpen = signal(false);
  sortConfig = signal<{key: string, direction: 'asc' | 'desc'} | null>(null);
  loading = signal(false);
  
  // Payment status
  paymentStatus = signal({ totalPaid: 0, requiredTopUp: 0 });
  
  // Login credentials
  loginUsername = signal('');
  loginPassword = signal('');
  
  // Form data for employee edit
  formData = signal<Employee | null>(null);
  
  // Pagination state
  employeePage = signal(0);
  employeePageSize = signal(5);
  
  // Constants
  GRADE_LEVELS = [6, 5, 4, 3, 2, 1];
  
  // Auto-dismiss toast and check auth on init
  constructor() {
    effect(() => {
      const msg = this.message();
      if (msg) {
        setTimeout(() => this.message.set(''), 5000);
      }
    });
    
    // Check if already logged in (SSR-safe)
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = window.localStorage.getItem('accessToken');
      const userProfileStr = window.localStorage.getItem('userProfile');
      
      if (token && userProfileStr) {
        try {
          const profile = JSON.parse(userProfileStr);
          this.userProfile.set(profile);
          this.isLoggedIn.set(true);
          this.loadInitialData();
        } catch (e) {
          console.error('Failed to parse stored user profile:', e);
          this.authService.logout();
        }
      }
    }
  }
  
  // Computed values
  basicSalariesByGrade = computed(() => {
    const grade6 = this.grade6Basic();
    const result: Record<number, number> = {};
    this.GRADE_LEVELS.forEach(grade => {
      result[grade] = calculateBasicSalary(grade, grade6);
    });
    return result;
  });
  
  totalSalaryRequired = computed(() => {
    return this.employees().reduce((total, emp) => {
      return total + (emp.salary?.gross || 0);
    }, 0);
  });
  
  sortedEmployees = computed(() => {
    const emps = [...this.employees()];
    const config = this.sortConfig();
    
    if (!config) return emps;
    
    return emps.sort((a, b) => {
      const { key, direction } = config;
      let aValue: any;
      let bValue: any;
      
      switch(key) {
        case 'grade':
          aValue = a.grade.rank;
          bValue = b.grade.rank;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'id':
          aValue = a.code;
          bValue = b.code;
          break;
        case 'balance':
          aValue = a.account.currentBalance;
          bValue = b.account.currentBalance;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });
  
  paginatedEmployees = computed(() => {
    const sorted = this.sortedEmployees();
    const page = this.employeePage();
    const size = this.employeePageSize();
    const startIndex = page * size;
    return sorted.slice(startIndex, startIndex + size);
  });
  
  totalEmployeePages = computed(() => {
    return Math.ceil(this.sortedEmployees().length / this.employeePageSize());
  });
  
  getNextEmployeeId(): string {
    const ids = this.employees().map(e => parseInt(e.code)).filter(id => !isNaN(id));
    return String(Math.max(1000, ...ids) + 1);
  }
  
  // API Methods
  loadInitialData(): void {
    this.loading.set(true);
    // Use primaryCompanyId for all employee API calls
    const companyId = this.primaryCompanyId();
    this.employeeService.getAll('ACTIVE', companyId, 0, 5).subscribe({
      next: (data) => {
        this.employees.set(data);
        
        // Get company from first employee
        if (data.length > 0 && data[0].company) {
          this.companyId.set(data[0].company.id);
          this.loadCompanyData(data[0].company.id);
        }
        
        this.loading.set(false);
        this.message.set(`✅ Loaded ${data.length} employees successfully`);
      },
      error: (error) => {
        console.error('Failed to load employees:', error);
        this.message.set('❌ Failed to load employees. Please try again.');
        this.loading.set(false);
        
        // If 401, logout
        if (error.status === 401) {
          this.handleLogout();
        }
      }
    });
  }
  
  loadCompanyData(id: string): void {
    this.companyService.getCompany(id).subscribe({
      next: (company) => {
        this.companyAccountBalance.set(company.mainAccount.currentBalance);
      },
      error: (error) => {
        console.error('Failed to load company:', error);
        this.message.set('⚠️ Failed to load company balance');
      }
    });
  }
  
  handleLogin(event: Event): void {
    event.preventDefault();
    
    const username = this.loginUsername();
    const password = this.loginPassword();
    
    if (!username || !password) {
      this.message.set('⚠️ Please enter both username and password');
      return;
    }
    
    this.loading.set(true);
    
    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        // Create full UserProfile structure
        const fullProfile: UserProfile = {
          user: response.user,
          account: {
            id: 'temp',
            accountName: 'Main Account',
            accountNumber: 'ACC001',
            currentBalance: 0,
            accountType: 'EMPLOYEE',
            branchName: 'Main'
          },
          fullName: response.user.username,
          companyId: 'temp'
        };
        
        this.userProfile.set(fullProfile);
        this.isLoggedIn.set(true);
        this.message.set(`✅ Welcome, ${response.user.username}!`);
        
        // Load initial data
        this.loadInitialData();
      },
      error: (error) => {
        console.error('Login failed:', error);
        const errorMsg = error.error?.message || 'Login failed. Please check your credentials.';
        this.message.set(`❌ ${errorMsg}`);
        this.loading.set(false);
      }
    });
  }
  
  handleLogout(): void {
    this.authService.logout();
    
    // Clear user profile from localStorage (SSR-safe)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('userProfile');
    }
    
    this.userProfile.set(null);
    this.isLoggedIn.set(false);
    this.employees.set([]);
    this.companyAccountBalance.set(0);
    this.view.set('employees');
    this.message.set('👋 Logged out successfully');
  }
  
  calculateSalaries(): void {
    this.loading.set(true);
    
    this.payrollService.calculateSalaries(this.grade6Basic()).subscribe({
      next: (response) => {
        // Update employees with calculated salaries
        const updatedEmps = this.employees().map(emp => {
          const salaryInfo = response.salaries.find(s => s.employeeId === emp.id);
          if (salaryInfo) {
            return {
              ...emp,
              salary: {
                basic: salaryInfo.basicSalary,
                houseRent: salaryInfo.houseRentAllowance,
                medicalAllowance: salaryInfo.medicalAllowance,
                gross: salaryInfo.grossSalary,
                isPaid: false
              }
            };
          }
          return emp;
        });
        
        this.employees.set(updatedEmps);
        this.loading.set(false);
        this.message.set(`✅ Calculated salaries for ${response.employeeCount} employees. Total: ${formatCurrency(response.totalPay)}`);
      },
      error: (error) => {
        console.error('Failed to calculate salaries:', error);
        this.message.set('❌ Failed to calculate salaries. Please try again.');
        this.loading.set(false);
      }
    });
  }
  
  transferSalaries(): void {
    const totalRequired = this.totalSalaryRequired();
    const balance = this.companyAccountBalance();
    
    if (totalRequired === 0) {
      this.message.set('⚠️ Please calculate salaries first');
      return;
    }
    
    if (balance < totalRequired) {
      const shortfall = totalRequired - balance;
      this.paymentStatus.set({
        totalPaid: 0,
        requiredTopUp: shortfall
      });
      this.isTopUpModalOpen.set(true);
      this.message.set(`❌ Insufficient funds! Need ${formatCurrency(shortfall)} more to complete transfer`);
      return;
    }
    
    this.loading.set(true);
    
    const transferData = {
      companyId: this.companyId(),
      salaries: this.employees()
        .filter(emp => emp.salary && !emp.salary.isPaid)
        .map(emp => ({
          employeeId: emp.id,
          amount: emp.salary!.gross
        }))
    };
    
    this.payrollService.transferSalaries(transferData).subscribe({
      next: (response) => {
        // Mark all as paid
        const updatedEmps = this.employees().map(emp => {
          if (emp.salary) {
            return {
              ...emp,
              salary: { ...emp.salary, isPaid: true }
            };
          }
          return emp;
        });
        
        this.employees.set(updatedEmps);
        this.paymentStatus.set({
          totalPaid: response.totalAmount,
          requiredTopUp: 0
        });
        
        // Reload company balance
        this.loadCompanyData(this.companyId());
        
        this.loading.set(false);
        this.message.set(`✅ Successfully transferred salaries to ${response.processedCount} employees! Total: ${formatCurrency(response.totalAmount)}`);
      },
      error: (error) => {
        console.error('Failed to transfer salaries:', error);
        const errorMsg = error.error?.message || 'Salary transfer failed';
        this.message.set(`❌ ${errorMsg}`);
        this.loading.set(false);
      }
    });
  }
  
  handleTopUp(): void {
    const amount = this.topUpAmount();
    
    if (amount <= 0) {
      this.message.set('⚠️ Please enter a valid top-up amount (minimum 1,000 BDT)');
      return;
    }
    
    if (amount < 1000) {
      this.message.set('⚠️ Minimum top-up amount is 1,000 BDT');
      return;
    }
    
    if (amount > 1000000) {
      this.message.set('⚠️ Maximum top-up amount is 10,00,000 BDT');
      return;
    }
    
    this.loading.set(true);
    
    this.companyService.topUp(this.companyId(), {
      amount: amount,
      description: 'Account top-up for payroll processing'
    }).subscribe({
      next: (response) => {
        this.companyAccountBalance.set(response.newBalance);
        this.topUpAmount.set(0);
        this.isTopUpModalOpen.set(false);
        this.loading.set(false);
        this.message.set(`✅ Added ${formatCurrency(amount)}. New balance: ${formatCurrency(response.newBalance)}`);
        
        // If there was a pending transfer, show option to retry
        if (this.paymentStatus().requiredTopUp > 0) {
          const shortfall = this.totalSalaryRequired() - response.newBalance;
          if (shortfall <= 0) {
            this.message.set('✅ Funds added successfully! You can now transfer salaries.');
            this.paymentStatus.set({ totalPaid: 0, requiredTopUp: 0 });
          } else {
            this.message.set(`⚠️ Still need ${formatCurrency(shortfall)} more for complete transfer`);
          }
        }
      },
      error: (error) => {
        console.error('Failed to top up:', error);
        const errorMsg = error.error?.message || 'Top-up failed';
        this.message.set(`❌ ${errorMsg}`);
        this.loading.set(false);
      }
    });
  }
  
  // UI Methods
  handleSort(key: string): void {
    const current = this.sortConfig();
    if (current?.key === key) {
      this.sortConfig.set({
        key,
        direction: current.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      this.sortConfig.set({ key, direction: 'asc' });
    }
  }
  
  getSortIcon(key: string): string {
    const config = this.sortConfig();
    if (config?.key !== key) return '↕️';
    return config.direction === 'asc' ? '↑' : '↓';
  }
  
  startAddEmployee(): void {
    const nextCode = this.getNextEmployeeId();
    const newEmp: Partial<Employee> = {
      code: nextCode,
      name: '',
      address: '',
      mobile: '',
      username: '',
      email: '',
      password: ''
    };
    this.formData.set(newEmp as Employee);
    this.editEmployee.set(null);
    this.view.set('addEdit');
  }
  
  handleEditEmployee(emp: Employee): void {
    this.formData.set({ ...emp });
    this.editEmployee.set(emp);
    this.view.set('addEdit');
  }
  
  handleCancelEdit(): void {
    this.formData.set(null);
    this.editEmployee.set(null);
    this.view.set('employees');
  }
  
  handleSaveEmployee(): void {
    const data = this.formData();
    if (!data) return;
    
    // Basic validation
    if (!data.name || !data.mobile || !data.address) {
      this.message.set('⚠️ Please fill in all required fields');
      return;
    }
    
    this.loading.set(true);
    
    if (this.editEmployee()) {
      // Update existing
      this.employeeService.update(data.id, data, this.primaryCompanyId()).subscribe({
        next: () => {
          this.loadInitialData();
          this.handleCancelEdit();
          this.message.set(`✅ Employee ${data.code} updated successfully`);
        },
        error: (error) => {
          console.error('Failed to update employee:', error);
          const errorMsg = error.error?.message || 'Failed to update employee';
          this.message.set(`❌ ${errorMsg}`);
          this.loading.set(false);
        }
      });
    } else {
      // Create new
      this.employeeService.create(data, this.primaryCompanyId()).subscribe({
        next: () => {
          this.loadInitialData();
          this.handleCancelEdit();
          this.message.set(`✅ Employee ${data.code} added successfully`);
        },
        error: (error) => {
          console.error('Failed to add employee:', error);
          const errorMsg = error.error?.message || 'Failed to add employee';
          this.message.set(`❌ ${errorMsg}`);
          this.loading.set(false);
        }
      });
    }
  }
  
  handleDeleteEmployee(id: string): void {
    const emp = this.employees().find(e => e.id === id);
    if (!emp) return;
    
    if (!confirm(`Are you sure you want to delete employee ${emp.code} - ${emp.name}?`)) {
      return;
    }
    
    this.loading.set(true);
    
    this.employeeService.delete(id, this.primaryCompanyId()).subscribe({
      next: () => {
        this.loadInitialData();
        this.message.set(`✅ Employee ${emp.code} deleted successfully`);
      },
      error: (error) => {
        console.error('Failed to delete employee:', error);
        const errorMsg = error.error?.message || 'Failed to delete employee';
        this.message.set(`❌ ${errorMsg}`);
        this.loading.set(false);
      }
    });
  }
  
  updateFormField(field: string, value: any): void {
    const current = this.formData();
    if (current) {
      this.formData.set({ ...current, [field]: value });
    }
  }
  
  updateBankField(field: string, value: any): void {
    const current = this.formData();
    if (current && current.account) {
      this.formData.set({
        ...current,
        account: { ...current.account, [field]: value }
      });
    }
  }
  
  setEmployeePage(page: number): void {
    const maxPage = this.totalEmployeePages() - 1;
    if (page >= 0 && page <= maxPage) {
      this.employeePage.set(page);
    }
  }
  
  setEmployeePageSize(size: number): void {
    this.employeePageSize.set(size);
    this.employeePage.set(0);
  }
  
  openTopUpModal(): void {
    this.paymentStatus.set({ totalPaid: 0, requiredTopUp: 0 });
    this.isTopUpModalOpen.set(true);
  }
  
  closeTopUpModal(): void {
    this.isTopUpModalOpen.set(false);
  }
  
  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }
}
