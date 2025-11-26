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
          this.batchStatus.set(batch.payrollStatus || 'PENDING');
          this.payrollMonth.set(batch.payrollMonth || 'N/A');
          this.paymentStatus.set({ totalPaid: batch.executedAmount?.amount || 0, requiredTopUp: 0 });
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

  employeesWithSalaries = computed(() => {
    // Map backend batch items to UI-friendly structure expected by the table
    const items = this.batchItems();
    return (items || []).map((it: any) => {
      const basic = Math.round(it.basicSalary?.amount ?? 0);
      const hra = Math.round(it.hra?.amount ?? it.houseRentAllowance?.amount ?? Math.round(basic * 0.20));
      const medical = Math.round(it.medicalAllowance?.amount ?? Math.round(basic * 0.15));
      const gross = Math.round(it.grossSalary?.amount ?? (basic + hra + medical));
      return {
        id: it.employeeId || it.id,
        code: it.employeeBizId || it.employeeCode || '',
        name: it.employeeName || '',
        grade: { rank: it.grade || it.gradeRank || 0 },
        account: { accountNumber: it.accountNumber || it.employeeAccountNumber || 'N/A' },
        salary: {
          basic,
          houseRent: hra,
          medicalAllowance: medical,
          gross,
          isPaid: it.status ? (it.status === 'PAID') : false
        }
      } as any;
    });
  });

  paginatedEmployees = computed(() => {
    const sorted = this.employeesWithSalaries();
    const page = this.currentPage();
    const size = this.pageSize();
    const startIndex = page * size;
    return sorted.slice(startIndex, startIndex + size);
  });

  totalPages = computed(() => {
    const len = this.employeesWithSalaries().length;
    const size = this.pageSize();
    return len === 0 ? 1 : Math.ceil(len / size);
  });

  calculateSalaries() {
    // Validate employees exist
    if (this.employees().length === 0) {
      this.message.set('⚠️ Cannot create payroll: No employees available');
      return;
    }

    // Check if company exists
    if (!this.companyId()) {
      this.message.set('⚠️ Company information missing');
      return;
    }

    // Check for existing pending batch
    const currentStatus = this.batchStatus();
    if (currentStatus === 'PENDING' || currentStatus === 'PROCESSING' || currentStatus === 'PARTIALLY_COMPLETED') {
      this.message.set('⚠️ A payroll batch is already in progress. Please complete or cancel the current batch.');
      return;
    }

    // Get funding account from company service (not from employee data)
    // We need to fetch full company details to get mainAccount.id
    this.loading.set(true);
    
    this.companyService.getCompany(this.companyId()).subscribe({
      next: (company: any) => {
        const fundingAccountId = company.mainAccount?.id;
        
        console.log('🏦 Company data:', {
          companyId: company.id,
          mainAccount: company.mainAccount,
          fundingAccountId
        });

        if (!fundingAccountId) {
          this.loading.set(false);
          this.message.set('⚠️ Company funding account not found');
          return;
        }

        console.log('🚀 Creating payroll batch with:', {
          companyId: this.companyId(),
          fundingAccountId,
          baseSalary: this.grade6Basic()
        });

        // Create payroll batch payload matching backend API
        const now = new Date();
        const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        const payload = {
          name: `${monthName} Payroll`,
          payrollMonth: now.toISOString().slice(0, 10), // YYYY-MM-DD format
          companyId: this.companyId(),
          fundingAccountId: fundingAccountId,
          description: `${monthName} Payroll Distribution`,
          baseSalary: this.grade6Basic()
        };

        console.log('📤 Sending create batch request:', payload);

        this.payrollService.createPayrollBatch(payload).subscribe({
          next: (batch: any) => {
            console.log('✅ Batch created successfully:', batch);
            this.loading.set(false);
            this.message.set(`✅ Payroll batch created. Batch ID: ${batch.id}`);
            
            // Update local state with new batch
            this.batchData.set(batch);
            this.batchId.set(batch.id);
            this.batchName.set(batch.name || 'N/A');
            this.batchStatus.set(batch.payrollStatus || batch.status || 'PENDING');
            this.payrollMonth.set(batch.payrollMonth || 'N/A');
            this.paymentStatus.set({ totalPaid: batch.executedAmount?.amount || 0, requiredTopUp: 0 });

            // Reload company balance
            this.loadCompany(this.companyId());

            // Load batch items
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
            this.payrollService.getPayrollItems(batch.id, employeeId).subscribe({
              next: (items: any[]) => {
                this.batchItems.set(items || []);
              },
              error: (err: any) => {
                console.error('Failed to load batch items:', err);
                this.batchItems.set([]);
              }
            });
          },
          error: (error: any) => {
            console.error('❌ Failed to create payroll batch:', error);
            const errorMsg = error.error?.message || error.message || 'Failed to create payroll';
            this.message.set(`❌ ${errorMsg}`);
            this.loading.set(false);
          }
        });
      },
      error: (error: any) => {
        console.error('❌ Failed to load company:', error);
        this.loading.set(false);
        this.message.set('⚠️ Failed to load company information');
      }
    });
  }

  processPayroll() {
    if (!this.batchId()) {
      this.message.set('⚠️ No payroll batch to process');
      return;
    }

    // Compute shortfall: total to be paid minus already executed amount
    const totalToPay = this.batchData()?.totalAmount?.amount || 0;
    const alreadyPaid = this.batchData()?.executedAmount?.amount || 0;
    const remainingToPay = Math.max(0, totalToPay - alreadyPaid);
    const balance = this.companyBalance();

    console.log('💰 Payroll Processing Check:', {
      totalToPay,
      alreadyPaid,
      remainingToPay,
      balance,
      sufficient: remainingToPay <= balance
    });

    // FIXED: Immediately process if funds are sufficient (matching React pattern)
    if (remainingToPay <= balance) {
      console.log('✅ Sufficient funds, processing payroll immediately...');
      this.loading.set(true);
      this.payrollService.processPayrollBatch(this.batchId()).subscribe({
        next: (response: any) => {
          this.loading.set(false);
          this.message.set(`✅ Payroll processed successfully!`);
          console.log('✅ Payroll batch processed:', response);
          // Reload data
          this.loadCompany(this.companyId());
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
          console.error('❌ Failed to process payroll:', error);
          const errorMsg = error.error?.message || 'Payroll process failed';
          this.message.set(`❌ ${errorMsg}`);
          this.loading.set(false);
        }
      });
    } else {
      // FIXED: Insufficient funds - open modal with required minimum (matching React pattern)
      const shortfall = remainingToPay - balance;
      console.log('⚠️ Insufficient funds, need to top up:', formatCurrency(shortfall));
      this.topUpAmount.set(Math.ceil(shortfall / 1000) * 1000); // Round up to nearest 1000
      // Store min/max constraints via signals (reusing modal UI)
      (this as any).topUpMin = shortfall; // for UI hint
      (this as any).topUpMax = Math.max(shortfall, 1000000); // simple max cap; can be refined
      this.paymentStatus.set({ totalPaid: alreadyPaid, requiredTopUp: shortfall });
      this.isTopUpModalOpen.set(true);
      this.message.set(`⚠️ Insufficient funds! Need ${formatCurrency(shortfall)} more to process payroll`);
    }
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
    const requiredMin = this.paymentStatus().requiredTopUp || 1000;
    const maxCap = 10000000; // 10 million max

    // Validate amount
    if (amount <= 0) {
      this.message.set('⚠️ Please enter a valid amount');
      return;
    }

    if (amount < requiredMin) {
      this.message.set(`⚠️ Minimum top-up amount is ${formatCurrency(requiredMin)}`);
      return;
    }
    
    if (amount > maxCap) {
      this.message.set(`⚠️ Maximum top-up amount is ${formatCurrency(maxCap)}`);
      return;
    }
    
    console.log('💰 Processing top-up:', formatCurrency(amount));
    this.loading.set(true);
    
    this.companyService.topUp(this.companyId(), {
      amount: amount,
      description: 'Emergency top-up for payroll processing'
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Top-up successful:', response);
        
        // Update balance from response or reload
        if (response && 'newBalance' in response) {
          this.companyBalance.set(response.newBalance);
        } else {
          // Reload company data to get updated balance
          this.companyService.getCompany(this.companyId()).subscribe({
            next: (company: any) => {
              this.companyBalance.set(company.mainAccount.currentBalance);
              console.log('✅ Balance reloaded:', formatCurrency(company.mainAccount.currentBalance));
            },
            error: (err: any) => console.error('Failed to reload balance:', err)
          });
        }
        
        this.message.set(`✅ Added ${formatCurrency(amount)}. Processing payroll...`);
        this.topUpAmount.set(0);
        this.isTopUpModalOpen.set(false);
        this.paymentStatus.set({ totalPaid: this.batchData()?.executedAmount?.amount || 0, requiredTopUp: 0 });
        this.loading.set(false);
        
        // CRITICAL: Auto-retry payroll processing after successful topup (matching React pattern)
        if (this.batchId()) {
          console.log('🔄 Auto-retrying payroll processing after top-up...');
          // Small delay to ensure balance is updated
          setTimeout(() => {
            this.processPayroll();
          }, 500);
        }
      },
      error: (error: any) => {
        console.error('❌ Top-up failed:', error);
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
