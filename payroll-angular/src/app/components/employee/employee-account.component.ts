import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { environment } from '../../../environments/environment';
import type { BankAccount } from '../../models/api.types';

@Component({
  selector: 'app-employee-account',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-account.component.html',
  styleUrls: ['./employee-account.component.css']
})
export class EmployeeAccountComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  account = signal<BankAccount | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    // Get accountId from user profile (localStorage)
    let accountId: string | null = null;
    let userRole: string | null = null;
    const userStr = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('userProfile') : null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userRole = user?.user?.role || null;
        // Only allow EMPLOYEE role
        if (userRole === 'EMPLOYEE') {
          accountId = user?.account?.id || user?.user?.account?.id || null;
        }
      } catch {}
    }
    if (userRole !== 'EMPLOYEE') {
      this.error.set('Access denied: Only employees can view this page.');
      this.loading.set(false);
      return;
    }
    if (!accountId) {
      this.error.set('No account ID found for employee user.');
      this.loading.set(false);
      return;
    }
    // Fetch account info
    const apiUrl = `${environment.apiUrl}/accounts/${accountId}`;
    const accessToken = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('accessToken') : null;
      // Fix headers for HttpClient
      const httpOptions = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } as Record<string, string> } : {};
      this.http.get<any>(apiUrl, httpOptions).subscribe({
        next: (response: any) => {
          // Handle both direct and wrapped API response
          const acc = response && response.id ? response : (response && response.data && response.data.id ? response.data : null);
          if (acc) {
            this.account.set(acc);
          } else {
            this.error.set('Account not found in response.');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load account info.');
          this.loading.set(false);
        }
      });
  }
}
