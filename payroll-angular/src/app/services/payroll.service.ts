import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import type { 
  APIResponse, 
  PayrollCalculationResponse,
  SalaryTransferRequest,
  SalaryTransferResponse,
  SalarySheetResponse
} from '../models/api.types';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  calculateSalaries(grade6Basic: number): Observable<PayrollCalculationResponse> {
    return this.http.post<any>(
      `${this.apiUrl}/payroll/calculate`,
      { grade6Basic }
    ).pipe(
      map(response => {
        console.log('✅ Salaries calculated');
        if (response.success && response.data) return response.data;
        if (response.employeeCount !== undefined) return response;
        return response;
      })
    );
  }

  transferSalaries(request: SalaryTransferRequest): Observable<SalaryTransferResponse> {
    return this.http.post<any>(
      `${this.apiUrl}/payroll/transfer`,
      request
    ).pipe(
      map(response => {
        console.log('✅ Salaries transferred');
        if (response.success && response.data) return response.data;
        if (response.processedCount !== undefined) return response;
        return response;
      })
    );
  }

  getSalarySheet(): Observable<SalarySheetResponse> {
    return this.http.get<APIResponse<SalarySheetResponse>>(
      `${this.apiUrl}/payroll/salary-sheet`
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to load salary sheet');
      })
    );
  }

  getLastBatch(companyId: string): Observable<any> {
    const accessToken = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('accessToken') : null;
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    return this.http.get<any>(
      `${this.apiUrl}/payroll/companies/${companyId}/last-batch`,
      { headers }
    ).pipe(
      map(response => {
        console.log('📦 Last batch response:', response);
        if (response && response.data) return response.data;
        return response;
      }),
      catchError((error) => {
        console.log('ℹ️ No last batch found');
        return of(null);
      })
    );
  }

  getPayrollItems(batchId: string, employeeId?: string): Observable<any[]> {
    const accessToken = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('accessToken') : null;
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    let url = `${this.apiUrl}/payroll/batches/${batchId}/items`;
    if (employeeId) {
      url += `?employeeId=${employeeId}`;
    }
    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        console.log('📋 Payroll items loaded');
        if (Array.isArray(response)) return response;
        if (response.data && Array.isArray(response.data)) return response.data;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  processPayrollBatch(batchId: string): Observable<any> {
    const accessToken = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('accessToken') : null;
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    return this.http.post<any>(
      `${this.apiUrl}/payroll/batches/${batchId}/process`,
      {},
      { headers }
    ).pipe(
      map((response: any) => {
        console.log('✅ Payroll batch processed:', response);
        if (response && response.data) return response.data;
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Payroll batch process failed:', error);
        return of({ success: false, message: 'Payroll process failed', totalAmount: 0 });
      })
    );
  }
}
