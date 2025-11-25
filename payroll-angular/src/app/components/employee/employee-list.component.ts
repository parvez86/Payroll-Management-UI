import { Component, signal, computed, inject, output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
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
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private router = inject(Router);

  ngOnInit() {
    this.loadEmployees();
  }

  employees = signal<Employee[]>([]);
  loading = signal(false);
  sortConfig = signal<{key: string, direction: 'asc' | 'desc'} | null>(null);
  
  // Pagination
  currentPage = signal(0);
  pageSize = signal(5);

  // Events
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
    const sorted = this.sortedEmployees();
    const page = this.currentPage();
    const size = this.pageSize();
    const startIndex = page * size;
    return sorted.slice(startIndex, startIndex + size);
  });

  totalPages = computed(() => {
    return Math.ceil(this.sortedEmployees().length / this.pageSize());
  });

  loadEmployees() {
    this.loading.set(true);
    this.employeeService.getAll().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loading.set(false);
        this.messageChanged.emit(`✅ Loaded ${data.length} employees successfully`);
      },
      error: (error) => {
        console.error('Failed to load employees:', error);
        this.messageChanged.emit('❌ Failed to load employees. Please try again.');
        this.loading.set(false);
      }
    });
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
    this.router.navigate(['/dashboard/employees/edit', emp.id]);
  }

  handleDelete(emp: Employee) {
    if (!confirm(`Are you sure you want to delete employee ${emp.code} - ${emp.name}?`)) {
      return;
    }

    this.loading.set(true);
    this.employeeService.delete(emp.id).subscribe({
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
    }
  }

  setPageSize(size: number | string) {
    const n = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSize.set(isNaN(n as number) ? 5 : (n as number));
    this.currentPage.set(0);
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }
}
