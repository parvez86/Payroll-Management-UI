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
import type { Signal } from '@angular/core';

@Component({
selector: 'app-dashboard',
standalone: true,
imports: [CommonModule, FormsModule, RouterModule, ToastMessageComponent, LoadingSpinnerComponent],
changeDetection: ChangeDetectionStrategy.OnPush,
templateUrl: './dashboard.component.html',
styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Signals and services
  loading = signal<boolean>(false);
  message = signal<string>('');
  userProfile = signal<UserProfile | null>(null);
  employees = signal<Employee[]>([]);
  authService = inject(AuthService);
  employeeService = inject(EmployeeService);
  companyService = inject(CompanyService);
  router = inject(Router);
  userContext = inject(UserContextService);
  companySelection = inject(CompanySelectionService);

  // Use companies from CompanySelectionService (loaded from API), not from user context
  companies = computed(() => this.companySelection.companies());
  isAdminOrEmployer = computed(() => this.userContext.isAdmin() || this.userContext.isEmployer());
  isEmployee = computed(() => this.userContext.isEmployee());
  isAdmin = computed(() => this.userContext.isAdmin());
  isEmployer = computed(() => this.userContext.isEmployer());
  balanceLabel: Signal<string> = computed(() => {
    const selectedId = this.companySelection?.selectedCompanyId();
    if (!selectedId) return 'System Balance';
    return 'Company Balance';
  });
  balanceTooltip = computed(() => this.userContext.getBalanceTooltip());

  ngOnInit() {
    this.checkAuth();
    if (this.authService?.isAuthenticated() && window.localStorage.getItem('userProfile')) {
      this.initializeCompanySelection();
      this.loadAllCompaniesForNavbar(); // Load companies immediately for navbar balance
      this.loadInitialData();
      this.restoreRouteState();
    }
    this.router?.events?.subscribe(() => {
      this.saveRouteState();
    });
  }

  private saveRouteState() {
    if (typeof window !== 'undefined' && this.authService?.isAuthenticated()) {
      window.localStorage.setItem('lastRoute', this.router?.url ?? '');
    }
  }

  private restoreRouteState() {
    if (typeof window !== 'undefined') {
      const lastRoute = window.localStorage.getItem('lastRoute');
      if (lastRoute && lastRoute.startsWith('/dashboard')) {
        this.router?.navigate([lastRoute]);
      }
    }
  }

  onCompanyChange(companyId: string) {
    this.companySelection?.setSelectedCompany(companyId);
    // No navigation, only context update
  }

  initializeCompanySelection() {
    // Only restore if user is authenticated and not just logged in
    const accessToken = typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null;
    if (!accessToken) return;
    // If just logged in, use user context (primaryCompanyId)
    const primaryCompanyId = this.userContext?.companyId();
    if (primaryCompanyId) {
      this.companySelection?.setSelectedCompany(primaryCompanyId);
      window.localStorage.setItem('companyId', primaryCompanyId);
    } else {
      this.companySelection?.setSelectedCompany('');
      window.localStorage.removeItem('companyId');
    }
  }

  checkAuth() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const accessToken = window.localStorage.getItem('accessToken');
      if (accessToken) {
        this.authService?.getCurrentUserProfile().subscribe({
          next: (profile: any) => {
            this.userProfile?.set(profile);
            window.localStorage.setItem('userProfile', JSON.stringify(profile));
            this.userContext?.refreshProfile();
            let primaryCompanyId: string | undefined;
            if (profile.companyId) {
              primaryCompanyId = profile.companyId;
            } else if (profile.companyIds && profile.companyIds.length > 0) {
              primaryCompanyId = profile.companyIds[0].companyId;
            }
            if (primaryCompanyId) {
              this.companySelection?.setSelectedCompany(primaryCompanyId);
              window.localStorage.setItem('companyId', primaryCompanyId);
            }
            if (profile.companyIds) {
              window.localStorage.setItem('companyIds', JSON.stringify(profile.companyIds));
            }
            if (profile.account?.currentBalance !== undefined) {
              // Remove: this.companySelection.systemBalance(profile.account.currentBalance);
            }
          },
          error: (error: any) => {
            this.authService?.clearAuthData();
            this.router?.navigate(['/login']);
          }
        });
      } else {
        this.router?.navigate(['/login']);
      }
    }
  }

  loadAllCompaniesForNavbar() {
    // Always load companies for navbar balance and dropdown (regardless of selected company)
    this.companyService?.getAllCompanies().subscribe({
      next: (companies: any[]) => {
        console.log('📦 Raw companies received:', companies);
        if (!Array.isArray(companies)) {
          console.warn('⚠️ Companies is not an array:', companies);
          companies = [];
        }
        this.companySelection?.companies.set(companies);
        console.log('✅ All companies loaded for navbar balance:', companies.length, 'companies:', companies);
      },
      error: (error: any) => {
        console.error('Failed to load companies:', error);
      }
    });
  }

  loadInitialData() {
    this.loading?.set(true);
    const companyId = this.companySelection?.selectedCompanyId() || this.userContext?.companyId() || '';
    this.employeeService?.getAll('ACTIVE', companyId, 0, 5).subscribe({
      next: (data: any) => {
        this.employees?.set(data);
        if (companyId && data.length > 0 && data[0].company) {
          this.loadCompanyData(companyId);
        }
        this.loading?.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load employees:', error);
        this.message?.set('❌ Failed to load data. Please try again.');
        this.loading?.set(false);
        if (error.status === 401) {
          this.logout();
        }
      }
    });
  }

  loadCompanyData(id: string) {
    const role = this.userContext?.userRole();
    switch(role) {
      case 'ADMIN':
        // Already loaded in loadAllCompaniesForNavbar()
        break;
      case 'EMPLOYER':
        // Ensure company is in the companies list with fresh data
        this.companyService?.getCompany(id).subscribe({
          next: (company: any) => {
            const existingCompanies = this.companySelection?.companies() || [];
            const updatedCompanies = existingCompanies.map((c: any) => c.id === id ? company : c);
            if (!updatedCompanies.find((c: any) => c.id === id)) {
              updatedCompanies.push(company);
            }
            this.companySelection?.companies.set(updatedCompanies);
            console.log('✅ Company balance loaded for navbar');
          },
          error: (error: any) => {
            console.error('Failed to load company:', error);
            this.message?.set('⚠️ Failed to load company balance');
          }
        });
        break;
      case 'EMPLOYEE':
        const employeeId = this.userContext?.employeeId();
        const resolvedCompanyId = this.companySelection?.selectedCompanyId() || this.userContext?.companyId() || '';
        if (employeeId) {
          this.employeeService?.getById(employeeId, resolvedCompanyId).subscribe({
            next: (employee: any) => {
              if (employee.grade?.rank) {
                this.userContext?.setEmployeeGradeRank(employee.grade.rank);
              }
            },
            error: (error: any) => {
              console.error('Failed to load employee balance:', error);
              this.message?.set('⚠️ Failed to load your balance');
            }
          });
        }
        break;
    }
  }

  logout() {
    // Clear all signals/context
    this.userContext?.clearProfile();
    this.userProfile?.set(null);
    this.companySelection?.setSelectedCompany('');
    // Remove all user-related data from localStorage/sessionStorage
    if (typeof window !== 'undefined') {
      const keysToRemove = [
        'userProfile', 'accessToken', 'refreshToken', 'companyId', 'companyIds', 'selectedCompanyId',
        'userRole', 'isAuthenticated', 'user', 'tokenExpiration', 'lastRoute', 'userAccount', 'mockUser'
      ];
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
    }
    this.router?.navigate(['/login']);
  }

  clearMessage() {
    this.message?.set('');
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  getRoleDescription(): string {
    switch(this.userContext?.userRole()) {
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

  getCurrentBalance(): number {
    const selectedId = this.companySelection?.selectedCompanyId();
    if (!selectedId) {
      return this.companySelection.systemBalance();
    }
    const company = this.companySelection.companies().find((c: any) => c.id === selectedId);
    console.log('💰 Looking for company:', selectedId, 'found:', company);
    return company?.mainAccount?.currentBalance ?? this.companySelection.systemBalance();
  }
}