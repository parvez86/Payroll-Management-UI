import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import type { APIResponse, Employee } from '../models/api.types';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(status?: string, companyId?: string, page?: number, size?: number): Observable<any> {
    const params: any = {};
    if (status) params.status = status;
    if (companyId) params.companyId = companyId;
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;
    const query = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
    const url = query ? `${this.apiUrl}/employees?${query}` : `${this.apiUrl}/employees`;
    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('employeeService.getAll raw response:', response);
        // Return full response (may include pagination)
        return response;
      })
    );
  }

  getById(id: string): Observable<Employee> {
    return this.http.get<any>(
      `${this.apiUrl}/employees/${id}`
    ).pipe(
      map(response => {
        console.log('📡 Employee getById response:', response);
        // Backend returns employee object directly
        if (response && response.id) {
          return response;
        }
        // Check if wrapped in success format
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to load employee');
      })
    );
  }

  create(employee: Partial<Employee>): Observable<Employee> {
    return this.http.post<any>(
      `${this.apiUrl}/employees`,
      employee
    ).pipe(
      map(response => {
        console.log('✅ Employee create response:', response);
        // Backend returns employee object directly, not wrapped
        if (response && response.id) {
          console.log('✅ Employee created:', response.code);
          return response;
        }
        // Check if wrapped in success format
        if (response.success && response.data) {
          console.log('✅ Employee created:', response.data.code);
          return response.data;
        }
        throw new Error(response.message || 'Failed to create employee');
      })
    );
  }

  update(id: string, employee: Partial<Employee>): Observable<Employee> {
    return this.http.put<any>(
      `${this.apiUrl}/employees/${id}`,
      employee
    ).pipe(
      map(response => {
        console.log('📡 Employee update response:', response);
        // Backend returns employee object directly
        if (response && response.id) {
          console.log('✅ Employee updated:', response.code);
          return response;
        }
        // Check if wrapped in success format
        if (response.success && response.data) {
          console.log('✅ Employee updated:', id);
          return response.data;
        }
        throw new Error(response.message || 'Failed to update employee');
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<APIResponse<void>>(
      `${this.apiUrl}/employees/${id}`
    ).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Employee deleted:', id);
          return;
        }
        throw new Error(response.message || 'Failed to delete employee');
      })
    );
  }

  getNextEmployeeCode(): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/employees/code`,
      {},
      { responseType: 'text' } // Backend returns plain text, not JSON
    ).pipe(
      map(response => {
        console.log('📡 Next employee code response:', response);
        // Backend returns plain text string like "6002"
        if (response && typeof response === 'string') {
          return response.trim();
        }
        // If somehow it's not a string, log and throw
        console.error('❌ Unexpected code response type:', typeof response, response);
        throw new Error('Failed to generate employee code - unexpected type');
      })
    );
  }
}
