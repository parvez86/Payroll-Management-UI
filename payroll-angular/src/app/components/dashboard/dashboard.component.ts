import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { CompanyService } from '../../services/company.service';
import { formatCurrency } from '../../simulator/salary-calculator';
import { ToastMessageComponent } from '../shared/toast-message.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import type { Employee, UserProfile } from '../../models/api.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private companyService = inject(CompanyService);
  private router = inject(Router);

  userProfile = signal<UserProfile | null>(null);
  employees = signal<Employee[]>([]);
  companyAccountBalance = signal(0);
  companyId = signal('');
  loading = signal(false);
  message = signal('');

  ngOnInit() {
    this.checkAuth();
    this.loadInitialData();
  }

  checkAuth() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userProfileStr = window.localStorage.getItem('userProfile');
      
      if (userProfileStr) {
        try {
          const profile = JSON.parse(userProfileStr);
          this.userProfile.set(profile);
        } catch (e) {
          console.error('Failed to parse stored user profile:', e);
          this.logout();
        }
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  loadInitialData() {
    this.loading.set(true);
    
    this.employeeService.getAll().subscribe({
      next: (data) => {
        this.employees.set(data);
        
        // Get company from first employee
        if (data.length > 0 && data[0].company) {
          this.companyId.set(data[0].company.id);
          this.loadCompanyData(data[0].company.id);
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load employees:', error);
        this.message.set('❌ Failed to load data. Please try again.');
        this.loading.set(false);
        
        // If 401, logout
        if (error.status === 401) {
          this.logout();
        }
      }
    });
  }

  loadCompanyData(id: string) {
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

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('userProfile');
        }
        this.userProfile.set(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if API fails, still clear local data and redirect
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('userProfile');
        }
        this.userProfile.set(null);
        this.router.navigate(['/login']);
      }
    });
  }

  clearMessage() {
    this.message.set('');
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }
}
