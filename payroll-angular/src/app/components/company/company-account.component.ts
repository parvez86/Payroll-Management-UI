import { Component, signal, inject, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
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
  private router = inject(Router);
        // Navigate to company details page
        viewAccount(id: string) {
          this.router.navigate(['/dashboard/company', id]);
        }
      // Helper to check if companies() is a non-empty array (for template)
      get companies() { return this.companySelection.companies(); }
      get systemBalance() { return this.companySelection.systemBalance(); }
      get selectedCompanyList() {
        const id = this.companyId();
        if (!id) return this.companies;
        return this.companies.filter((c: any) => c.id === id);
      }
      hasCompanies = computed(() => Array.isArray(this.companies) && this.companies.length > 0);
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
  
  // Role checks
  isEmployee = computed(() => this.userContext.isEmployee());
  isAdmin = computed(() => this.userContext.isAdmin());
  isEmployer = computed(() => this.userContext.isEmployer());
  canTopUp = computed(() => this.userContext.canTopUpAccount());
  
  // Dynamic labels
  pageTitle = computed(() => this.userContext.getAccountPageTitle());
  topUpLabel = computed(() => this.userContext.getTopUpLabel());

  ngOnInit() {
    this.userContext.refreshProfile();
    // No effect() here! Do not override dropdown selection.
  }
  // Always reload company info and balances on tab activation, reload, or dropdown change
  private companyEffect = effect(() => {
    const selectedId = this.companySelection.selectedCompanyId();
    if (!selectedId) {
      // All Companies: fetch list, sum balances, show system info
      this.loadAllCompanies();
      this.selectedCompanyDetails.set(null);
    } else {
      // Reload data for selected company in-place
      this.loadCompany(selectedId);
    }
  });

  // Add new signals for company description and created date (declare only once)
  companyDescription = signal('');
  companyCreatedAt = signal('');
  selectedCompanyDetails = signal<any>(null);

  loadCompany(id: string) {
    this.companyService.getCompany(id).subscribe({
      next: (company) => {
        this.balance.set(company.mainAccount?.currentBalance ?? 0);
        this.companyName.set(company.name);
        this.accountInfo = company.mainAccount;
        this.companyDescription.set(company.description || '');
        this.companyCreatedAt.set(company.createdAt || '');
        this.selectedCompanyDetails.set(company); // <-- update signal
        this.loading.set(false);
        // Sync context with current company
        if (this.userContext && typeof this.userContext.setCompanyContext === 'function') {
          this.userContext.setCompanyContext({ [company.id]: company.name }, company.id);
        }
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
        this.companySelection.companies.set(companies); // Update global signal
        // Update user context with latest companyIds and names
        if (this.userContext && typeof this.userContext.setCompanyContext === 'function') {
          const companyMap: Record<string, string> = {};
          companies.forEach((c: any) => { companyMap[c.id] = c.name; });
          this.userContext.setCompanyContext(companyMap);
        }
        // Only auto-select if there is no selection at all (first load)
        const selectedId = this.companySelection.selectedCompanyId();
        if (!selectedId && companies.length === 1) {
          this.companySelection.setSelectedCompany(companies[0].id);
          this.loadCompany(companies[0].id);
        }
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

  /**
   * Handler for company dropdown change
   */
  onCompanyDropdownChange(selectedId: string) {
    this.companySelection.setSelectedCompany(selectedId);
    this.loadCompany(selectedId);
  }
}
