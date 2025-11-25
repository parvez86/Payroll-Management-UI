import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, type Employee, type SalaryDetails, type BankAccount } from './mock-data.service';
import { formatCurrency, calculateBasicSalary, calculateTotalSalary } from './salary-calculator';

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.css']
})
export class SimulatorComponent {
  private mockDataService = new MockDataService();
  
  // State signals - Pure client-side, NO backend calls
  isLoggedIn = signal(false);
  employees = signal<Employee[]>([]);
  companyAccountBalance = signal(500000);
  grade6Basic = signal(25000);
  view = signal<'employees' | 'salarySheet' | 'addEdit'>('employees');
  editEmployee = signal<Employee | null>(null);
  message = signal('');
  topUpAmount = signal(0);
  isTopUpModalOpen = signal(false);
  sortConfig = signal<{key: string, direction: 'asc' | 'desc'} | null>(null);
  
  // Payment status
  paymentStatus = signal({ totalPaid: 0, requiredTopUp: 0 });
  
  // Login credentials (simulated only)
  loginUsername = signal('admin');
  loginPassword = signal('admin@123');
  
  // Form data for employee edit
  formData = signal<Employee | null>(null);
  
  // Pagination state
  employeePage = signal(0);
  employeePageSize = signal(5);
  
  // Constants
  GRADE_LEVELS = [6, 5, 4, 3, 2, 1];
  
  // Constructor - Load mock data immediately (NO API calls)
  constructor() {
    // Load initial mock employees from service
    this.employees.set(this.mockDataService.getInitialEmployees());
    this.companyAccountBalance.set(this.mockDataService.getCompanyAccountBalance());
    
    // Auto-dismiss messages after 5 seconds
    effect(() => {
      const msg = this.message();
      if (msg) {
        setTimeout(() => {
          if (this.message() === msg) {
            this.message.set('');
          }
        }, 5000);
      }
    });
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
    return this.employees().reduce((total, emp) => total + (emp.salary?.gross || 0), 0);
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
          aValue = a.grade;
          bValue = b.grade;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'balance':
          aValue = a.bankAccount.balance;
          bValue = b.bankAccount.balance;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });
  
  paginatedEmployees = computed(() => {
    const sorted = this.sortedEmployees();
    const start = this.employeePage() * this.employeePageSize();
    return sorted.slice(start, start + this.employeePageSize());
  });
  
  totalEmployeePages = computed(() => {
    return Math.ceil(this.sortedEmployees().length / this.employeePageSize());
  });
  
  // Utility functions
  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }
  
  getSortIcon(columnKey: string): string {
    const config = this.sortConfig();
    if (!config || config.key !== columnKey) return '↕️';
    return config.direction === 'asc' ? '↑' : '↓';
  }
  
  // Auth functions - Pure simulation (NO backend call)
  handleLogin(event: Event): void {
    event.preventDefault();
    this.message.set('✅ Login successful. Simulating JWT authorization.');
    this.isLoggedIn.set(true);
  }
  
  handleLogout(): void {
    this.message.set('✅ Logged out successfully.');
    this.isLoggedIn.set(false);
    this.view.set('employees');
  }
  
  // Sorting
  handleSort(key: string): void {
    const current = this.sortConfig();
    let direction: 'asc' | 'desc' = 'asc';
    
    if (current && current.key === key && current.direction === 'asc') {
      direction = 'desc';
    }
    
    this.sortConfig.set({ key, direction });
  }
  
  // Employee CRUD - Pure client-side (NO backend calls)
  getNextEmployeeId(): string {
    const emps = this.employees();
    const maxId = emps.reduce((max, emp) => Math.max(max, parseInt(emp.id)), 0);
    return (maxId + 1).toString().padStart(4, '0');
  }
  
  startAddEmployee(): void {
    const newId = this.getNextEmployeeId();
    const newEmp: Employee = {
      id: newId,
      name: '',
      grade: 6,
      address: '',
      mobile: '',
      salary: null,
      bankAccount: {
        type: 'Savings',
        name: '',
        number: '',
        balance: 0,
        bank: '',
        branch: ''
      }
    };
    this.formData.set(newEmp);
    this.editEmployee.set(null);
    this.view.set('addEdit');
  }
  
  handleEditEmployee(emp: Employee): void {
    this.editEmployee.set(emp);
    this.formData.set({ ...emp, bankAccount: { ...emp.bankAccount } });
    this.view.set('addEdit');
  }
  
  handleCancelEdit(): void {
    this.formData.set(null);
    this.editEmployee.set(null);
    this.view.set('employees');
  }
  
  updateField(field: keyof Employee, value: any): void {
    const current = this.formData();
    if (!current) return;
    
    this.formData.set({
      ...current,
      [field]: value
    });
  }
  
  updateBankField(field: string, value: any): void {
    const current = this.formData();
    if (!current) return;
    
    this.formData.set({
      ...current,
      bankAccount: {
        ...current.bankAccount,
        [field]: value
      }
    });
  }
  
  handleSaveEmployee(): void {
    // Pure client-side save - NO backend call, just update local array
    const data = this.formData();
    if (!data) return;

    if (!data.name || !data.mobile || !data.address) {
      this.message.set('⚠️ Please fill in all required fields.');
      return;
    }

    if (this.editEmployee()) {
      // Update existing employee in memory
      const updated = this.employees().map(emp => emp.id === data.id ? data : emp);
      this.employees.set(updated);
      this.message.set(`✅ Employee ${data.id} updated successfully.`);
    } else {
      // Add new employee to memory
      this.employees.set([...this.employees(), data]);
      this.message.set(`✅ Employee ${data.id} added successfully.`);
    }

    this.handleCancelEdit();
  }
  
  handleDeleteEmployee(id: string): void {
    // Pure client-side delete - NO backend call, just filter local array
    const emp = this.employees().find(e => e.id === id);
    if (!emp) return;

    if (!confirm(`Are you sure you want to delete employee ${emp.id} - ${emp.name}?`)) {
      return;
    }

    const filtered = this.employees().filter(e => e.id !== id);
    this.employees.set(filtered);
    this.message.set(`✅ Employee ${emp.id} deleted successfully.`);
  }
  
  // Salary calculation and payment - Pure client-side (NO backend calls)
  calculateSalaries(): void {
    // Pure client-side calculation - NO backend call
    const updatedEmployees = this.employees().map(emp => {
      const basic = this.basicSalariesByGrade()[emp.grade];
      const salaryDetails = calculateTotalSalary(basic);
      return {
        ...emp,
        salary: salaryDetails
      };
    });
    this.employees.set(updatedEmployees);
    this.paymentStatus.set({ totalPaid: 0, requiredTopUp: 0 });
    this.message.set('✅ Salaries calculated successfully. Ready for transfer.');
  }
  
  handleTopUp(): void {
    // Pure client-side top-up - NO backend call, just update local balance
    if (this.topUpAmount() <= 0) {
      this.message.set('⚠️ Please enter a valid top-up amount.');
      return;
    }
    const newBalance = this.companyAccountBalance() + this.topUpAmount();
    this.companyAccountBalance.set(newBalance);
    this.message.set(`✅ ${formatCurrency(this.topUpAmount())} added to company account. New balance: ${formatCurrency(newBalance)}.`);
    this.topUpAmount.set(0);
    this.isTopUpModalOpen.set(false);
    if (this.paymentStatus().requiredTopUp > 0) {
      this.transferSalaries(true);
    }
  }
  
  transferSalaries(isContinuing: boolean = false): void {
    // Pure client-side transfer - NO backend call, just update local state
    let currentBalance = this.companyAccountBalance();
    let paidCount = 0;
    let paidAmount = 0;
    let requiredTopUp = 0;
    let allPaid = true;

    const employeesToPay = isContinuing
      ? this.employees().filter(e => e.salary && e.salary.gross > 0 && !e.salary.isPaid)
      : this.employees().filter(e => e.salary && e.salary.gross > 0);

    const updatedEmployees = this.employees().map(emp => {
      if (emp.salary?.isPaid || !employeesToPay.find(e => e.id === emp.id)) {
        return emp;
      }

      if (!emp.salary) return emp;
      
      const grossSalary = emp.salary.gross;

      if (currentBalance >= grossSalary) {
        currentBalance -= grossSalary;
        paidAmount += grossSalary;
        paidCount++;
        return {
          ...emp,
          salary: { ...emp.salary, isPaid: true },
          bankAccount: { ...emp.bankAccount, balance: emp.bankAccount.balance + grossSalary }
        };
      } else {
        requiredTopUp = grossSalary - currentBalance;
        allPaid = false;
        return emp;
      }
    }).sort((a, b) => a.grade - b.grade);

    this.companyAccountBalance.set(currentBalance);
    this.employees.set(updatedEmployees);

    const newTotalPaid = this.paymentStatus().totalPaid + paidAmount;

    if (!allPaid) {
      this.paymentStatus.set({ totalPaid: newTotalPaid, requiredTopUp });
      this.message.set(`⚠️ Company account ran out of money! ${employeesToPay.length - paidCount} employees remain unpaid. Need ${formatCurrency(requiredTopUp)} minimum to continue.`);
      this.isTopUpModalOpen.set(true);
    } else {
      this.paymentStatus.set({ totalPaid: newTotalPaid, requiredTopUp: 0 });
      this.message.set(`✅ Salary transfer complete. Paid ${paidCount} employees successfully!`);
    }

    if (isContinuing && allPaid) {
      this.isTopUpModalOpen.set(false);
    }
  }
  
  closeTopUpModal(): void {
    this.isTopUpModalOpen.set(false);
  }
  
  openTopUpModal(): void {
    this.paymentStatus.set({ totalPaid: 0, requiredTopUp: 0 });
    this.isTopUpModalOpen.set(true);
  }
  
  // Pagination methods
  setEmployeePage(page: number): void {
    const maxPage = this.totalEmployeePages() - 1;
    if (page >= 0 && page <= maxPage) {
      this.employeePage.set(page);
    }
  }
  
  setEmployeePageSize(size: number): void {
    this.employeePageSize.set(size);
    this.employeePage.set(0); // Reset to first page
  }
  
  // Form field update (alias for template compatibility)
  updateFormField(field: keyof Employee, value: any): void {
    this.updateField(field, value);
  }
  
  // View switching
  showEmployees(): void {
    this.view.set('employees');
  }
  
  showSalarySheet(): void {
    this.view.set('salarySheet');
  }
}
