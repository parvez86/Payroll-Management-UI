import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import type { 
  APIResponse, 
  BackendCompany,
  TopUpRequest,
  TopUpResponse,
  TransactionHistoryResponse
} from '../models/api.types';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getCompany(id: string): Observable<BackendCompany> {
    return this.http.get<any>(
      `${this.apiUrl}/companies/${id}`
    ).pipe(
      map(response => {
        console.log('✅ Company loaded');
        if (response.success && response.data) return response.data;
        if (response.id) return response;
        return response;
      })
    );
  }

  topUp(companyId: string, request: TopUpRequest): Observable<any> {
    // Align with React API: POST /companies/{id}/topup
    return this.http.post<any>(
      `${this.apiUrl}/companies/${companyId}/topup`,
      request
    ).pipe(
      map(response => {
        console.log('✅ Top-up successful');
        // Normalize to { newBalance } when possible
        if (response?.newBalance !== undefined) return response;
        if (response?.mainAccount?.currentBalance !== undefined) {
          return { newBalance: response.mainAccount.currentBalance } as TopUpResponse;
        }
        if (response?.data?.mainAccount?.currentBalance !== undefined) {
          return { newBalance: response.data.mainAccount.currentBalance } as TopUpResponse;
        }
        return response;
      })
    );
  }

  getTransactions(companyId: string): Observable<TransactionHistoryResponse> {
    return this.http.get<APIResponse<TransactionHistoryResponse>>(
      `${this.apiUrl}/company/transactions`,
      { params: { companyId } }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to load transactions');
      })
    );
  }
  
  getAllCompanies(): Observable<BackendCompany[]> {
    // Get all companies (ADMIN only)
    return this.http.get<any>(`${this.apiUrl}/companies`).pipe(
      map(response => {
        console.log('✅ All companies loaded');
        if (response.success && response.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      })
    );
  }
}
