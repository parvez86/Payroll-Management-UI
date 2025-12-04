import { Component, signal, computed, inject, output, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { UserContextService } from '../../services/user-context.service';
import { CompanySelectionService } from '../../services/company-selection.service';
import { formatCurrency } from '../../simulator/salary-calculator';
import type { Employee } from '../../models/api.types';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit, OnDestroy {
        // For cleaning up subscriptions and effects
        private destroy$ = new Subject<void>();
      // Always reload employees on tab activation and company change
    /**
     * Returns the dynamic employee list title based on company selection
     */
    getEmployeeListTitle(): string {
      if (this.isAdmin()) {
        const selectedId = this.companySelection.selectedCompanyId();
        if (selectedId === '' || !selectedId) {
          return '👥 All Employees (System-wide)';
        }
        const companies = this.userContext.companyNames();
        const company = companies.find(c => c.id === selectedId);
        return company ? `👥 Employees - ${company.name}` : '👥 All Employees';
      }
      return this.listTitle();
    }
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  userContext = inject(UserContextService);
  companySelection = inject(CompanySelectionService);

  ngOnInit() {
    this.companySelection.restoreFromStorage();
    this.userContext.refreshProfile();
      }

      ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    // Restore page from URL query param
    const url = this.router.url;
    const match = url.match(/page=(\d+)/);
    if (match) {
      this.currentPage.set(Number(match[1]));
    }
    // No effect() here!
  }
  // Always reload employees on tab activation and company change
  private companyEffect = effect(() => {
    this.companySelection.selectedCompanyId();
    this.loadEmployees(); // Always fetch live from backend
  });

  employees = signal<Employee[]>([]);
  loading = signal(false);
  sortConfig = signal<{key: string, direction: 'asc' | 'desc'} | null>(null);
  statusFilter = signal<string>('ACTIVE');
  
  // Pagination
  currentPage = signal(0);
  pageSize = signal(5);
  totalElements = signal(0);
  totalPages = signal(1);
  // Always use the selected company from global selection
  companyId = computed(() => this.companySelection.selectedCompanyId());

  // Role checks using UserContextService
  isEmployeeUser = computed(() => this.userContext.isEmployee());
  isAdmin = computed(() => this.userContext.isAdmin());
  isEmployer = computed(() => this.userContext.isEmployer());
  
  // Dynamic title
  listTitle = computed(() => this.userContext.getEmployeeListTitle());  // Events
  employeeDeleted = output<string>();
  messageChanged = output<string>();

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
    // Backend handles pagination, so just return employees as-is
    return this.employees();
  });

  loadEmployees() {
    this.loading.set(true);
    const status = this.statusFilter() === 'ALL' ? undefined : this.statusFilter();
    const role = this.userContext.userRole();

    if (role === 'ADMIN') {
      // Load all employees or filter by selected company from global selector
      const companyObj = this.companySelection.selectedCompanyId();
      const companyId = (typeof companyObj === 'string') ? companyObj : '';
      this.employeeService.getAll(status || 'ACTIVE', companyId || '', this.currentPage(), this.pageSize())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            let employees: any[] = [];
            if (Array.isArray(response)) {
              employees = response;
            } else if (Array.isArray(response?.content)) {
              employees = response.content;
            }
            this.employees.set(employees);
            console.log('DEBUG: employees signal set:', employees);
            // Extract pagination info from response if available
            this.totalElements.set(response?.totalElements || employees.length);
            this.totalPages.set(response?.totalPages || Math.ceil(this.totalElements() / this.pageSize()) || 1);
            this.loading.set(false);
            this.messageChanged.emit(`✅ Loaded ${this.totalElements()} employees`);
          },
          error: this.handleEmployeesError.bind(this)
        });
    } else if (role === 'EMPLOYER') {
      // Load only own company employees
      const companyObj = this.userContext.companyId();
      const companyId = (companyObj && typeof companyObj === 'string') ? companyObj : '';
      this.employeeService.getAll(status || 'ACTIVE', companyId || '', this.currentPage(), this.pageSize())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            const employees = response?.content || response;
            this.employees.set(Array.isArray(employees) ? employees : []);
            console.log('DEBUG: employees signal set:', employees);
            // Extract pagination info from response if available
            this.totalElements.set(response?.totalElements || (Array.isArray(employees) ? employees.length : 0));
            this.totalPages.set(response?.totalPages || Math.ceil(this.totalElements() / this.pageSize()) || 1);
            this.loading.set(false);
            this.messageChanged.emit(`✅ Loaded ${this.totalElements()} employees`);
          },
          error: this.handleEmployeesError.bind(this)
        });
    } else if (role === 'EMPLOYEE') {
      // Load only downstream employees (subordinates)
      const myGradeRank = this.userContext.employeeGradeRank();
      const companyObj = this.userContext.companyId();
      const companyId = (companyObj && typeof companyObj === 'string') ? companyObj : '';
      this.employeeService.getAll(status || 'ACTIVE', companyId || '', this.currentPage(), 100)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            let employees = response?.content || response;
            if (Array.isArray(employees) && myGradeRank !== null) {
              // Filter downstream (higher grade rank = lower in hierarchy)
              employees = employees.filter((emp: Employee) => 
                emp.grade.rank > myGradeRank
              );
            }
            this.employees.set(Array.isArray(employees) ? employees : []);
            console.log('DEBUG: employees signal set:', employees);
            this.totalElements.set(Array.isArray(employees) ? employees.length : 0);
            this.totalPages.set(1);
            this.loading.set(false);
            this.messageChanged.emit(`✅ Loaded ${this.totalElements()} downstream employees`);
          },
          error: this.handleEmployeesError.bind(this)
        });
    }
  }
  
  private handleEmployeesError(error: any) {
    console.error('Failed to load employees:', error);
    this.messageChanged.emit('❌ Failed to load employees. Please try again.');
    this.loading.set(false);
  }

  handleStatusChange(newStatus: string) {
    this.statusFilter.set(newStatus);
    this.currentPage.set(0);
    this.updatePageInUrl(0);
    this.loadEmployees();
  }

  updatePageInUrl(page: number) {
    // Update the URL query param for page
    const tree = this.router.createUrlTree([], {
      queryParams: { page },
      queryParamsHandling: 'merge',
      preserveFragment: true
    });
    this.router.navigateByUrl(tree, { replaceUrl: true });
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.updatePageInUrl(page);
    this.loadEmployees();
  }

  handleSort(key: string) {
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

  handleEdit(emp: Employee) {
    if (this.isEmployeeUser()) return; // disabled for EMPLOYEE
    this.router.navigate(['/dashboard/employees/edit', emp.id]);
  }

  handleDelete(emp: Employee) {
    if (this.isEmployeeUser()) return; // disabled for EMPLOYEE
    if (!confirm(`Are you sure you want to delete employee ${emp.code} - ${emp.name}?`)) {
      return;
    }

    this.loading.set(true);
    this.employeeService.delete(emp.id, this.companySelection.selectedCompanyId() || this.userContext.companyId() || '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadEmployees();
          this.employeeDeleted.emit(emp.id);
          this.messageChanged.emit(`✅ Employee ${emp.code} deleted successfully`);
        },
        error: (error) => {
          console.error('Failed to delete employee:', error);
          const errorMsg = error.error?.message || 'Failed to delete employee';
          this.messageChanged.emit(`❌ ${errorMsg}`);
          this.loading.set(false);
        }
      });
  }

  goToAddEmployee() {
    this.router.navigate(['/dashboard/employees/add']);
  }

  setPage(page: number) {
    const maxPage = this.totalPages() - 1;
    if (page >= 0 && page <= maxPage) {
      this.currentPage.set(page);
      this.loadEmployees();
    }
  }

  setPageSize(size: number | string) {
    const n = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSize.set(isNaN(n as number) ? 5 : (n as number));
    this.currentPage.set(0);
    this.loadEmployees();
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }
}
