import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../services/company.service';
import { EmployeeService } from '../../services/employee.service';
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
  private companyService = inject(CompanyService);
  private employeeService = inject(EmployeeService);

  companyId = signal('');
  balance = signal(0);
  companyName = signal('');
  accountInfo: any = null;
  showAccountDetails = signal(true);
  isEmployee = signal(false);

  ngOnInit() {
    this.checkUserRole();
    this.loadCompanyData();
  }

  checkUserRole() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const role = window.localStorage.getItem('userRole');
      this.isEmployee.set(role === 'EMPLOYEE');
    }
  }

  loadCompanyData() {
    this.loading.set(true);
    
    // Load from userProfile first
    if (typeof window !== 'undefined' && window.localStorage) {
      const userProfileStr = window.localStorage.getItem('userProfile');
      if (userProfileStr) {
        try {
          const profile = JSON.parse(userProfileStr);
          if (profile.account) {
            this.accountInfo = profile.account;
            this.balance.set(profile.account.currentBalance || 0);
          }
          if (profile.companyId) {
            this.companyId.set(profile.companyId);
            // Load company details for admin/employer
            if (!this.isEmployee()) {
              this.loadCompany(profile.companyId);
            }
          }
          this.loading.set(false);
          return;
        } catch (e) {
          console.error('Failed to parse userProfile:', e);
        }
      }
    }
    
    // Fallback for admin/employer
    this.employeeService.getAll('ACTIVE', undefined, 0, 1).subscribe({
      next: (response: any) => {
        const data = response?.content || response;
        if (Array.isArray(data) && data.length > 0 && data[0].company) {
          this.companyId.set(data[0].company.id);
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
      },
      error: (error) => console.error('Failed to load company:', error)
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
