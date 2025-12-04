import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getAll(status: string, companyId: string, page: number, size: number): Observable<any> {
    const params = new HttpParams()
      .set('status', status)
      .set('companyId', companyId)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.apiUrl}/employees`, { params }).pipe(
      map(response => {
        console.log('employeeService.getAll raw response:', response);
        return response;
      })
    );
  }

  getById(id: string, companyId: string): Observable<Employee> {
    // Use filtered API for single employee retrieval
    const params = new HttpParams().set('companyId', companyId);
    return this.http.get<any>(
      `${this.apiUrl}/employees/${id}`,
      { params }
    ).pipe(
      map(response => {
        console.log('📡 Employee getById response:', response);
        if (response && response.id) {
          return response;
        }
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to load employee');
      })
    );
  }

  create(employee: Partial<Employee>, companyId: string): Observable<Employee> {
    // Use filtered API for employee creation
    const params = new HttpParams().set('companyId', companyId);
    return this.http.post<any>(
      `${this.apiUrl}/employees`,
      employee,
      { params }
    ).pipe(
      map(response => {
        console.log('✅ Employee create response:', response);
        if (response && response.id) {
          console.log('✅ Employee created:', response.code);
          return response;
        }
        if (response.success && response.data) {
          console.log('✅ Employee created:', response.data.code);
          return response.data;
        }
        throw new Error(response.message || 'Failed to create employee');
      })
    );
  }

  update(id: string, employee: Partial<Employee>, companyId: string): Observable<Employee> {
    // Use filtered API for employee update
    const params = new HttpParams().set('companyId', companyId);
    return this.http.put<any>(
      `${this.apiUrl}/employees/${id}`,
      employee,
      { params }
    ).pipe(
      map(response => {
        console.log('📡 Employee update response:', response);
        if (response && response.id) {
          console.log('✅ Employee updated:', response.code);
          return response;
        }
        if (response.success && response.data) {
          console.log('✅ Employee updated:', id);
          return response.data;
        }
        throw new Error(response.message || 'Failed to update employee');
      })
    );
  }

  delete(id: string, companyId: string): Observable<void> {
    // Use filtered API for employee deletion
    const params = new HttpParams().set('companyId', companyId);
    return this.http.delete<APIResponse<void>>(
      `${this.apiUrl}/employees/${id}`,
      { params }
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
