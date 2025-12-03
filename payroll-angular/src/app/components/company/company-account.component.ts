import { Component, signal, inject, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../services/company.service';
import { CompanySelectionService } from '../../services/company-selection.service';
import { EmployeeService } from '../../services/employee.service';
import { UserContextService } from '../../services/user-context.service';
import { formatCurrency } from '../../simulator/salary-calculator';
import { ToastMessageComponent } from '../shared/toast-message.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-company-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './company-account.component.html',
  styleUrls: ['./company-account.component.css']
})
export class CompanyAccountComponent implements OnInit {
    // Always reload company account data on tab activation and company change
  private companyService = inject(CompanyService);
  private employeeService = inject(EmployeeService);
  userContext = inject(UserContextService);
  companySelection = inject(CompanySelectionService);

  // Always use the selected company from global selection
  companyId = computed(() => this.companySelection.selectedCompanyId());
  balance = signal(0);
  companyName = signal('');
  accountInfo: any = null;
  showAccountDetails = signal(true);
  
  // Multi-company support for ADMIN
  companies = signal<any[]>([]);
  systemBalance = computed(() => {
    return this.companies().reduce((sum, c) => sum + (c.mainAccount?.currentBalance || 0), 0);
  });
  
  // Role checks
  isEmployee = computed(() => this.userContext.isEmployee());
  isAdmin = computed(() => this.userContext.isAdmin());
  isEmployer = computed(() => this.userContext.isEmployer());
  canTopUp = computed(() => this.userContext.canTopUpAccount());
  
  // Dynamic labels
  pageTitle = computed(() => this.userContext.getAccountPageTitle());
  topUpLabel = computed(() => this.userContext.getTopUpLabel());

  ngOnInit() {
    // No effect() here! Do not override dropdown selection.
  }
  // Always reload company account data on tab activation and company change
  private companyEffect = effect(() => {
    this.companySelection.selectedCompanyId();
    this.loadCompanyData();
  });

  checkUserRole() {
    // No longer needed, using UserContextService
  }

  loadCompanyData() {
    this.loading.set(true);
    const selectedCompanyId = this.companySelection.selectedCompanyId();
    if (!selectedCompanyId) {
      // Show all companies (system-wide view)
      this.loadAllCompanies();
    } else {
      // Show only the selected company
      this.loadCompany(selectedCompanyId);
    }
  }
  
  loadEmployeeAccount(employeeId: string) {
    const companyId = this.companySelection.selectedCompanyId() || this.userContext.companyId() || '';
    this.employeeService.getById(employeeId, companyId).subscribe({
      next: (employee) => {
        this.accountInfo = employee.account;
        this.balance.set(employee.account.currentBalance || 0);
        this.companyName.set(employee.name);
        // Set grade rank for downstream calculations
        if (employee.grade?.rank) {
          this.userContext.setEmployeeGradeRank(employee.grade.rank);
        }
        this.loading.set(false);
        this.message.set('✅ Account loaded successfully');
      },
      error: (error) => {
        console.error('Failed to load employee account:', error);
        this.message.set('❌ Failed to load account');
        this.loading.set(false);
      }
    });
  }
  
  loadCompanyFallback() {
    // Fallback: load first company
    const companyId = this.companySelection.selectedCompanyId() || this.userContext.companyId() || '';
    this.employeeService.getAll('ACTIVE', companyId, 0, 1).subscribe({
      next: (response: any) => {
        const data = response?.content || response;
        if (Array.isArray(data) && data.length > 0 && data[0].company) {
          this.companySelection.setSelectedCompany(data[0].company.id);
          this.loadCompany(data[0].company.id);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load:', error);
        this.loading.set(false);
      }
    });
  }

  loadCompany(id: string) {
    this.companyService.getCompany(id).subscribe({
      next: (company) => {
        this.balance.set(company.mainAccount.currentBalance);
        this.companyName.set(company.name);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load company:', error);
        this.loading.set(false);
      }
    });
  }
  
  loadAllCompanies() {
    this.companyService.getAllCompanies().subscribe({
      next: (companies) => {
          this.companies.set(companies);
          console.log('DEBUG: companies signal set:', companies);
          this.loading.set(false);
          this.message.set(`✅ Loaded ${companies.length} companies`);
      },
      error: (error) => {
        console.error('Failed to load companies:', error);
        this.message.set('❌ Failed to load companies');
        this.loading.set(false);
      }
    });
  }

  topUpAmount = signal(0);
  loading = signal(false);
  message = signal('');
  isTopUpModalOpen = signal(false);

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
      description: 'Account top-up'
    }).subscribe({
      next: (response) => {
        // Update balance from response or reload
        if ((response as any).newBalance !== undefined) {
          this.balance.set((response as any).newBalance);
        } else {
          this.loadCompany(this.companyId());
        }
        this.topUpAmount.set(0);
        this.isTopUpModalOpen.set(false);
        this.loading.set(false);
        this.message.set(`✅ Added ${formatCurrency(amount)}. New balance: ${formatCurrency(this.balance())}`);
      },
      error: (error) => {
        console.error('Failed to top up:', error);
        const errorMsg = error.error?.message || 'Top-up failed';
        this.message.set(`❌ ${errorMsg}`);
        this.loading.set(false);
      }
    });
  }
  
  topUpCompany(companyId: string, amount: number) {
    if (amount <= 0 || amount < 1000) {
      this.message.set('⚠️ Minimum top-up amount is 1,000 BDT');
      return;
    }
    
    this.loading.set(true);
    
    this.companyService.topUp(companyId, {
      amount: amount,
      description: 'Account top-up'
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.message.set(`✅ Added ${formatCurrency(amount)}`);
        // Reload all companies to get updated balances
        this.loadAllCompanies();
      },
      error: (error) => {
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

  viewTransactions(company: any) {
    // TODO: Implement view transactions
    console.log('View transactions for', company);
  }
}
