import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../services/payroll.service';
import { CompanyService } from '../../services/company.service';
import { EmployeeService } from '../../services/employee.service';
import { formatCurrency, calculateBasicSalary } from '../../simulator/salary-calculator';
import { ToastMessageComponent } from '../shared/toast-message.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import type { Employee } from '../../models/api.types';

@Component({
  selector: 'app-payroll-process',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payroll-process.component.html',
  styleUrls: ['./payroll-process.component.css']
})
export class PayrollProcessComponent implements OnInit {
  private payrollService = inject(PayrollService);
  private companyService = inject(CompanyService);
  private employeeService = inject(EmployeeService);

  employees = signal<Employee[]>([]);
  companyId = signal('');
  companyBalance = signal(0);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.employeeService.getAll().subscribe({
      next: (data) => {
        this.employees.set(data);
        if (data.length > 0 && data[0].company) {
          this.companyId.set(data[0].company.id);
          this.loadCompany(data[0].company.id);
          // Get logged-in user info
          let employeeId: string | undefined = undefined;
          const userStr = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('userProfile') : null;
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              if (user && user.user && user.user.role === 'EMPLOYEE') {
                employeeId = user.user.id;
              }
            } catch {}
          }
          this.loadLastBatch(data[0].company.id, employeeId);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load:', error);
        this.message.set('❌ Failed to load data');
        this.loading.set(false);
      }
    });
  }

  loadLastBatch(companyId: string, employeeId?: string) {
    this.payrollService.getLastBatch(companyId).subscribe({
      next: (batch: any) => {
        if (batch && batch.id) {
          this.batchData.set(batch);
          this.batchId.set(batch.id);
          this.batchName.set(batch.name || 'N/A');
          this.batchStatus.set(batch.status || 'PENDING');
          this.payrollMonth.set(batch.payrollMonth || 'N/A');
          this.paymentStatus.set({ totalPaid: batch.totalPaid || 0, requiredTopUp: 0 });
          // Load payroll items for batch
          this.payrollService.getPayrollItems(batch.id, employeeId).subscribe({
            next: (items: any[]) => {
              this.batchItems.set(items || []);
            },
            error: (err: any) => {
              this.batchItems.set([]);
              console.error('Failed to load payroll items:', err);
            }
          });
        } else {
          this.resetBatchInfo();
        }
      },
      error: (error: any) => {
        console.log('ℹ️ No last batch found:', error);
        this.resetBatchInfo();
      }
    });
  }

  resetBatchInfo() {
    this.batchData.set(null);
    this.batchId.set('');
    this.batchName.set('');
    this.batchStatus.set('');
    this.payrollMonth.set('');
    this.paymentStatus.set({ totalPaid: 0, requiredTopUp: 0 });
    this.batchItems.set([]);
  }

  loadCompany(id: string) {
    this.companyService.getCompany(id).subscribe({
      next: (company) => {
        this.companyBalance.set(company.mainAccount.currentBalance);
      },
      error: (error) => console.error('Failed to load company:', error)
    });
  }

  grade6Basic = signal(25000);
  loading = signal(false);
  message = signal('');
  isTopUpModalOpen = signal(false);
  topUpAmount = signal(0);
  paymentStatus = signal({ totalPaid: 0, requiredTopUp: 0 });
  
  // Pagination
  currentPage = signal(0);
  pageSize = signal(5);
  
  // Batch Information
  batchId = signal('');
  batchName = signal('');
  batchStatus = signal('');
  payrollMonth = signal('');
  batchMonth = signal('');

  GRADE_LEVELS = [6, 5, 4, 3, 2, 1];


  // Salary summary and items are based on last payroll batch, not live input
  // All payroll info comes from backend batch APIs only
  batchData = signal<any>(null);
  batchItems = signal<any[]>([]);

  basicSalariesByGrade = computed(() => {
    // Use backend batch info only
    if (!this.batchData()) return {};
    const grade6 = this.batchData().grade6BasicSalary || 25000;
    const result: Record<number, number> = {};
    this.GRADE_LEVELS.forEach(grade => {
      result[grade] = calculateBasicSalary(grade, grade6);
    });
    return result;
  });

  employeesWithSalaries = computed(() => {
    // Use backend batch items only
    return this.batchItems();
  });

  totalSalaryRequired = computed(() => {
    // Use backend batch info only
    return this.batchData()?.totalPay || 0;
  });

  paginatedEmployees = computed(() => {
    const sorted = this.employeesWithSalaries();
    const page = this.currentPage();
    const size = this.pageSize();
    const startIndex = page * size;
    return sorted.slice(startIndex, startIndex + size);
  });

  totalPages = computed(() => {
    return Math.ceil(this.employeesWithSalaries().length / this.pageSize());
  });

  calculateSalaries() {
    this.loading.set(true);
    
    this.payrollService.calculateSalaries(this.grade6Basic()).subscribe({
      next: (response: any) => {
        console.log('✅ Calculate response:', response);
        this.loading.set(false);
        this.message.set(`✅ Payroll batch created successfully`);
        // Reload last batch to get updated info
        let employeeId: string | undefined = undefined;
        const userStr = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('userProfile') : null;
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user && user.user && user.user.role === 'EMPLOYEE') {
              employeeId = user.user.id;
            }
          } catch {}
        }
        this.loadLastBatch(this.companyId(), employeeId);
      },
      error: (error: any) => {
        console.error('Failed to calculate salaries:', error);
        this.message.set('❌ Failed to create payroll. Please try again.');
        this.loading.set(false);
      }
    });
  }

  processPayroll() {
    if (!this.batchId()) {
      this.message.set('⚠️ No payroll batch to process');
      return;
    }
    this.loading.set(true);
    this.payrollService.processPayrollBatch(this.batchId()).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        this.message.set(`✅ Payroll processed successfully!`);
        // Reload last batch to get updated info
        let employeeId: string | undefined = undefined;
        const userStr = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('userProfile') : null;
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user && user.user && user.user.role === 'EMPLOYEE') {
              employeeId = user.user.id;
            }
          } catch {}
        }
        this.loadLastBatch(this.companyId(), employeeId);
      },
      error: (error: any) => {
        console.error('Failed to process payroll:', error);
        const errorMsg = error.error?.message || 'Payroll process failed';
        this.message.set(`❌ ${errorMsg}`);
        this.loading.set(false);
      }
    });
  }

  setPage(page: number) {
    const maxPage = this.totalPages() - 1;
    if (page >= 0 && page <= maxPage) {
      this.currentPage.set(page);
    }
  }

  setPageSize(size: number | string) {
    const n = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSize.set(isNaN(n as number) ? 5 : (n as number));
    this.currentPage.set(0);
  }

  handleTopUp() {
    const amount = this.topUpAmount();
    
    if (amount <= 0 || amount < 1000) {
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
      next: (response: any) => {
        // If API didn't return newBalance, refresh company data
        if (!('newBalance' in (response || {}))) {
          this.loadCompany(this.companyId());
        } else {
          const newBal = (response as any).newBalance;
          this.companyBalance.set(newBal);
        }
        this.topUpAmount.set(0);
        this.isTopUpModalOpen.set(false);
        this.loading.set(false);
        this.message.set(`✅ Added ${formatCurrency(amount)}. Balance updated.`);
        this.paymentStatus.set({ totalPaid: 0, requiredTopUp: 0 });
      },
      error: (error: any) => {
        console.error('Failed to top up:', error);
        const errorMsg = error.error?.message || 'Top-up failed';
        this.message.set(`❌ ${errorMsg}`);
        this.loading.set(false);
      }
    });
  }

  openTopUpModal() {
    this.isTopUpModalOpen.set(true);
  }

  closeTopUpModal() {
    this.isTopUpModalOpen.set(false);
  }

  clearMessage() {
    this.message.set('');
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }
}
