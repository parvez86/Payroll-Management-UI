import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { CompanySelectionService } from '../../services/company-selection.service';
import { UserContextService } from '../../services/user-context.service';
import { EmployeeService } from '../../services/employee.service';
import { formatCurrency } from '../../simulator/salary-calculator';
import { ToastMessageComponent } from '../shared/toast-message.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

interface Transaction {
  id: string;
  amount: {
    amount: number;
    currency: string;
  };
  type: string;
  category: string;
  transactionStatus: string;
  debitAccountId: string;
  debitAccountName: string;
  creditAccountId: string;
  creditAccountName: string;
  payrollBatchId?: string;
  payrollItemId?: string;
  referenceId: string;
  description: string;
  processedAt: string;
}

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
    // Always reload transactions on tab activation and company change
  private transactionService = inject(TransactionService);
  private employeeService = inject(EmployeeService);
  userContext = inject(UserContextService);
  companySelection = inject(CompanySelectionService);

  // State
  transactions = signal<Transaction[]>([]);
  loading = signal(false);
  message = signal('');

  // Filters
  typeFilter = signal<string>('ALL');
  categoryFilter = signal<string>('ALL');
  statusFilter = signal<string>('ALL');
  // No local company filter; rely on global selector
  fromDate = signal<string>('');
  toDate = signal<string>('');
  debitAccountId = signal<string>('');
  creditAccountId = signal<string>('');
  batchId = signal<string>('');

  // Pagination
  currentPage = signal(0);
  pageSize = signal(10);
  totalElements = signal(0);
  totalPages = signal(1);
  // Always use the selected company from global selection
  companyId = computed(() => this.companySelection.selectedCompanyId());

  // Sort
  sortBy = signal('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Filter options
  typeOptions = ['ALL', 'SALARY_DISBURSEMENT', 'TOP_UP', 'DEBIT', 'CREDIT', 'TRANSFER'];
  categoryOptions = ['ALL', 'PAYROLL', 'SYSTEM', 'MANUAL', 'ADJUSTMENT'];
  statusOptions = ['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'CANCELLED'];
  
  // Role checks
  isAdmin = computed(() => this.userContext.isAdmin());
  isEmployer = computed(() => this.userContext.isEmployer());
  isEmployee = computed(() => this.userContext.isEmployee());
  
  // Dynamic title
  pageTitle = computed(() => {
    switch(this.userContext.userRole()) {
      case 'ADMIN': return '💳 All System Transactions';
      case 'EMPLOYER': return '💳 Company Transactions';
      case 'EMPLOYEE': return '💳 My Transactions';
      default: return '💳 Transaction History';
    }
  });

  ngOnInit() {
    // Restore global selection on init
    this.companySelection.restoreFromStorage();
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.toDate.set(today.toISOString().split('T')[0]);
    this.fromDate.set(thirtyDaysAgo.toISOString().split('T')[0]);
    // No effect() here!
  }
  // Always reload transactions on tab activation and company change
  private companyEffect = effect(() => {
    this.companySelection.selectedCompanyId();
    this.loadTransactions();
  });
  
  // Listen for global company selection changes (simple polling on each load call)

  async loadTransactions() {
    this.loading.set(true);
    const role = this.userContext.userRole();
    
    const filters: any = {
      page: this.currentPage(),
      size: this.pageSize(),
      sort: this.sortBy(),
      direction: this.sortDirection()
    };

    // For enum filters: 'ALL' means don't send the parameter (null/undefined)
    if (this.typeFilter() && this.typeFilter() !== 'ALL') filters.type = this.typeFilter();
    if (this.categoryFilter() && this.categoryFilter() !== 'ALL') filters.category = this.categoryFilter();
    if (this.statusFilter() && this.statusFilter() !== 'ALL') filters.status = this.statusFilter();
    if (this.fromDate()) filters.fromDate = new Date(this.fromDate()).toISOString();
    if (this.toDate()) {
      const endDate = new Date(this.toDate());
      endDate.setHours(23, 59, 59, 999);
      filters.toDate = endDate.toISOString();
    }
    if (this.debitAccountId()) filters.debitAccountId = this.debitAccountId();
    if (this.creditAccountId()) filters.creditAccountId = this.creditAccountId();
    if (this.batchId()) filters.batchId = this.batchId();

    // Apply role-based filtering
    switch(role) {
      case 'ADMIN':
        const companyIdForApi = this.companySelection.getCompanyIdForApi();
        if (companyIdForApi) {
          filters.companyId = companyIdForApi;
        }
        break;
        
      case 'EMPLOYER':
        // EMPLOYER sees only own company transactions
        const companyId = this.userContext.companyId();
        if (companyId) {
          // TODO: Backend should support filtering by companyId
          // For now, client-side filter after loading
          filters.companyId = companyId;
        }
        break;
        
      case 'EMPLOYEE':
        // EMPLOYEE sees only own + downstream transactions
        // Get own and downstream employee account IDs
        const employeeId = this.userContext.employeeId();
        if (employeeId) {
          try {
            const accountIds = await this.getEmployeeAccountIds(employeeId);
            // TODO: Backend should support filtering by multiple accountIds
            // For now, filter client-side
            filters.employeeAccountIds = accountIds;
          } catch (error) {
            console.error('Failed to get employee account IDs:', error);
          }
        }
        break;
    }

    this.transactionService.getTransactions(filters).subscribe({
      next: (response: any) => {
        let transactions = response?.content || response;
        if (!Array.isArray(transactions)) transactions = [];
        
        // Client-side role filtering (until backend supports it)
        transactions = this.filterTransactionsByRole(transactions, role);
        
        if (response?.content && Array.isArray(response.content)) {
          this.transactions.set(transactions);
          this.totalElements.set(transactions.length); // Use filtered count
          this.totalPages.set(Math.ceil(transactions.length / this.pageSize()));
        } else {
          this.transactions.set(transactions);
          this.totalElements.set(transactions.length);
          this.totalPages.set(1);
        }
        this.loading.set(false);
        const scopeLabel = role === 'ADMIN' ? 'system-wide' : role === 'EMPLOYER' ? 'company' : 'personal';
        this.message.set(`✅ Loaded ${this.totalElements()} ${scopeLabel} transactions`);
      },
      error: (error: any) => {
        console.error('Failed to load transactions:', error);
        this.message.set('❌ Failed to load transactions');
        this.loading.set(false);
      }
    });
  }
  
  private async getEmployeeAccountIds(employeeId: string): Promise<string[]> {
    // Get own account ID and downstream employees' account IDs
    const accountIds: string[] = [];
    
    try {
      // Get own employee data
      const companyId = this.companySelection.selectedCompanyId() || this.userContext.companyId() || '';
      const employee = await this.employeeService.getById(employeeId, companyId).toPromise();
      if (employee?.account?.id) {
        accountIds.push(employee.account.id);
      }
      
      // Get downstream employees
      const myGradeRank = this.userContext.employeeGradeRank();
      if (myGradeRank !== null) {
        const companyId = this.userContext.companyId();
        const allEmployees = await this.employeeService.getAll('ACTIVE', companyId || '', 0, 1000).toPromise();
        const employees = (allEmployees as any)?.content || allEmployees;
        
        if (Array.isArray(employees)) {
          employees.forEach((emp: any) => {
            if (emp.grade?.rank > myGradeRank && emp.account?.id) {
              accountIds.push(emp.account.id);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error getting employee account IDs:', error);
    }
    
    return accountIds;
  }
  
  private filterTransactionsByRole(transactions: any[], role: string | null): any[] {
    if (role === 'ADMIN') {
      return transactions; // Admin sees all
    }
    
    if (role === 'EMPLOYER') {
      const companyId = this.userContext.companyId();
      const companyIdStr = typeof companyId === 'string' ? companyId : '';
      if (!companyIdStr) return transactions;
      // Filter by company (assuming transactions have company info)
      // Note: This is a fallback - backend should handle this
      return transactions.filter(tx => 
        tx.companyId === companyIdStr ||
        tx.debitAccountId?.includes(companyIdStr) ||
        tx.creditAccountId?.includes(companyIdStr)
      );
    }
    
    if (role === 'EMPLOYEE') {
      // Filter by account IDs already loaded in getEmployeeAccountIds
      // This is handled by the accountIds filter above
      return transactions;
    }
    
    return transactions;
  }

  applyFilters() {
    this.currentPage.set(0);
    this.loadTransactions();
  }

  resetFilters() {
    this.typeFilter.set('ALL');
    this.categoryFilter.set('ALL');
    this.statusFilter.set('ALL');
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.toDate.set(today.toISOString().split('T')[0]);
    this.fromDate.set(thirtyDaysAgo.toISOString().split('T')[0]);
    this.debitAccountId.set('');
    this.creditAccountId.set('');
    this.batchId.set('');
    this.currentPage.set(0);
    this.loadTransactions();
  }

  setPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadTransactions();
    }
  }

  setPageSize(size: number | string) {
    const n = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSize.set(isNaN(n) ? 10 : n);
    this.currentPage.set(0);
    this.loadTransactions();
  }

  handleSort(column: string) {
    if (this.sortBy() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortDirection.set('desc');
    }
    this.loadTransactions();
  }

  getSortIcon(column: string): string {
    if (this.sortBy() !== column) return '↕️';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'FAILED': return 'status-failed';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  clearMessage() {
    this.message.set('');
  }
}
