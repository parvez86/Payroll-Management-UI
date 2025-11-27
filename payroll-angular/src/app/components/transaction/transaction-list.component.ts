import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
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
  private transactionService = inject(TransactionService);

  // State
  transactions = signal<Transaction[]>([]);
  loading = signal(false);
  message = signal('');

  // Filters
  typeFilter = signal<string>('ALL');
  categoryFilter = signal<string>('ALL');
  statusFilter = signal<string>('ALL');
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

  // Sort
  sortBy = signal('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Filter options
  typeOptions = ['ALL', 'SALARY_DISBURSEMENT', 'TOP_UP', 'DEBIT', 'CREDIT', 'TRANSFER'];
  categoryOptions = ['ALL', 'PAYROLL', 'SYSTEM', 'MANUAL', 'ADJUSTMENT'];
  statusOptions = ['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'CANCELLED'];

  ngOnInit() {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.toDate.set(today.toISOString().split('T')[0]);
    this.fromDate.set(thirtyDaysAgo.toISOString().split('T')[0]);
    
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading.set(true);
    
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

    this.transactionService.getTransactions(filters).subscribe({
      next: (response: any) => {
        if (response?.content && Array.isArray(response.content)) {
          this.transactions.set(response.content);
          this.totalElements.set(response.totalElements || 0);
          this.totalPages.set(response.totalPages || 1);
        } else if (Array.isArray(response)) {
          this.transactions.set(response);
          this.totalElements.set(response.length);
          this.totalPages.set(1);
        }
        this.loading.set(false);
        this.message.set(`✅ Loaded ${this.totalElements()} transactions`);
      },
      error: (error: any) => {
        console.error('Failed to load transactions:', error);
        this.message.set('❌ Failed to load transactions');
        this.loading.set(false);
      }
    });
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
