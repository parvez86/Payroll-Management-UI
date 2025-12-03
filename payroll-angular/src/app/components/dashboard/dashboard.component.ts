import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { CompanyService } from '../../services/company.service';
import { UserContextService } from '../../services/user-context.service';
import { CompanySelectionService } from '../../services/company-selection.service';
import { formatCurrency } from '../../simulator/salary-calculator';
import { ToastMessageComponent } from '../shared/toast-message.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import type { Employee, UserProfile } from '../../models/api.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    // Track last visited route and pagination
    private saveRouteState() {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lastRoute', this.router.url);
        // Pagination state should be saved by child tab components via custom event/service
      }
    }

    private restoreRouteState() {
      if (typeof window !== 'undefined') {
        const lastRoute = window.localStorage.getItem('lastRoute');
        if (lastRoute && lastRoute.startsWith('/dashboard')) {
          this.router.navigate([lastRoute]);
        }
        // Pagination state should be restored by child tab components via custom event/service
      }
    }
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private companyService = inject(CompanyService);
  private router = inject(Router);
  userContext = inject(UserContextService);
  companySelection = inject(CompanySelectionService);

  userProfile = signal<UserProfile | null>(null);
  employees = signal<Employee[]>([]);
  companyAccountBalance = signal(0);
  // Remove companyId signal, use only companySelection.selectedCompanyId
  loading = signal(false);
  message = signal('');
  
  // Company selector for ADMIN/EMPLOYER
  companies = computed(() => this.userContext.companyNames());
  // Handle company change from dropdown
  onCompanyChange(companyId: string) {
    this.companySelection.setSelectedCompany(companyId);
    // Optionally reload data for selected company
    this.loadInitialData();
  }

  // Role-based computed properties using UserContextService
  isAdminOrEmployer = computed(() => this.userContext.isAdmin() || this.userContext.isEmployer());
  isEmployee = computed(() => this.userContext.isEmployee());
  isAdmin = computed(() => this.userContext.isAdmin());
  isEmployer = computed(() => this.userContext.isEmployer());
  
  // Dynamic labels based on role
  balanceLabel = computed(() => this.userContext.getBalanceLabel());
  balanceTooltip = computed(() => this.userContext.getBalanceTooltip());

  ngOnInit() {
    // Always check and restore auth first
    this.checkAuth();
    // Only load data if we have valid auth
    if (this.authService.isAuthenticated() && window.localStorage.getItem('userProfile')) {
      this.loadInitialData();
      // Restore company selection or set to primary company
      this.initializeCompanySelection();
      // Restore last route and pagination
      this.restoreRouteState();
    }
    // Listen for navigation changes to save route state
    this.router.events?.subscribe(() => {
      this.saveRouteState();
    });
  }
  
  initializeCompanySelection() {
    // Try to restore from localStorage first
    const storedSelection = typeof window !== 'undefined' ? window.localStorage.getItem('selectedCompanyId') : null;
    if (storedSelection) {
      this.companySelection.setSelectedCompany(storedSelection);
    } else {
      // Set to primary company by default from /me response
      const primaryCompanyId = this.userContext.companyId();
      if (primaryCompanyId) {
        this.companySelection.setSelectedCompany(primaryCompanyId);
      } else {
        // If no primary company, set to 'All'
        this.companySelection.setSelectedCompany('');
      }
    }
    // Clean up any redundant companyId in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('companyId');
    }
  }

  checkAuth() {
    // Always restore from backend if possible
    if (typeof window !== 'undefined' && window.localStorage) {
      const accessToken = window.localStorage.getItem('accessToken');
      if (accessToken) {
        this.authService.getCurrentUserProfile().subscribe({
          next: (profile) => {
            this.userProfile.set(profile);
            window.localStorage.setItem('userProfile', JSON.stringify(profile));
            // Refresh user context to update companyIds for dropdown
            this.userContext.refreshProfile();
            // Store primary company ID (always string)
            let primaryCompanyId: string | undefined;
            if (profile.companyId) {
              primaryCompanyId = profile.companyId;
            } else if (profile.companyIds && profile.companyIds.length > 0) {
              primaryCompanyId = profile.companyIds[0].companyId;
            }
            if (primaryCompanyId) {
              this.companySelection.setSelectedCompany(primaryCompanyId);
              window.localStorage.setItem('companyId', primaryCompanyId);
            }
            // Store all company IDs if available
            if (profile.companyIds) {
              window.localStorage.setItem('companyIds', JSON.stringify(profile.companyIds));
            }
            if (profile.account?.currentBalance !== undefined) {
              this.companyAccountBalance.set(profile.account.currentBalance);
            }
          },
          error: (error) => {
            this.authService.clearAuthData();
            this.router.navigate(['/login']);
          }
        });
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  loadInitialData() {
    this.loading.set(true);
    
    const companyId = this.companySelection.selectedCompanyId() || this.userContext.companyId() || '';
    this.employeeService.getAll('ACTIVE', companyId, 0, 5).subscribe({
      next: (data) => {
        this.employees.set(data);
        
        // Get company from first employee
        if (data.length > 0 && data[0].company) {
          this.companySelection.setSelectedCompany(data[0].company.id);
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
    // Load balance based on role
    const role = this.userContext.userRole();
    
    switch(role) {
      case 'ADMIN':
        // TODO: Load system-wide balance
        // For now, fallback to company balance
        this.companyService.getCompany(id).subscribe({
          next: (company) => {
            this.companyAccountBalance.set(company.mainAccount.currentBalance);
          },
          error: (error) => console.error('Failed to load balance:', error)
        });
        break;
        
      case 'EMPLOYER':
        this.companyService.getCompany(id).subscribe({
          next: (company) => {
            this.companyAccountBalance.set(company.mainAccount.currentBalance);
          },
          error: (error) => {
            console.error('Failed to load company:', error);
            this.message.set('⚠️ Failed to load company balance');
          }
        });
        break;
        
      case 'EMPLOYEE':
        const employeeId = this.userContext.employeeId();
        const resolvedCompanyId = this.companySelection.selectedCompanyId() || this.userContext.companyId() || '';
        if (employeeId) {
          this.employeeService.getById(employeeId, resolvedCompanyId).subscribe({
            next: (employee) => {
              this.companyAccountBalance.set(employee.account.currentBalance);
              // Set grade rank for downstream filtering
              if (employee.grade?.rank) {
                this.userContext.setEmployeeGradeRank(employee.grade.rank);
              }
            },
            error: (error) => {
              console.error('Failed to load employee balance:', error);
              this.message.set('⚠️ Failed to load your balance');
            }
          });
        }
        break;
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        // Clear in-memory context
        this.userContext.clearProfile();
        this.userProfile.set(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if API fails, still clear local data and redirect
        this.userContext.clearProfile();
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
  
  // Remove loadCompanies and duplicate onCompanyChange. Use companies from userContext and companySelection for all logic.
  
  getRoleDescription(): string {
    switch(this.userContext.userRole()) {
      case 'ADMIN':
        return 'You have system-wide access to all companies and employees. Use the company selector to view specific company data.';
      case 'EMPLOYER':
        return 'You can manage your company employees and process payroll for your organization.';
      case 'EMPLOYEE':
        return 'You can view your salary information and manage your team members (downstream employees).';
      default:
        return '';
    }
  }
}
