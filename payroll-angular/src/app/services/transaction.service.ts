import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTransactions(filters: {
    type?: string;
    category?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    debitAccountId?: string;
    creditAccountId?: string;
    batchId?: string;
    page?: number;
    size?: number;
    sort?: string;
    direction?: string;
  }): Observable<any> {
    const params: any = {};
    
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.debitAccountId) params.debitAccountId = filters.debitAccountId;
    if (filters.creditAccountId) params.creditAccountId = filters.creditAccountId;
    if (filters.batchId) params.batchId = filters.batchId;
    if (filters.page !== undefined) params.page = filters.page;
    if (filters.size !== undefined) params.size = filters.size;
    if (filters.sort) params.sort = filters.sort;
    if (filters.direction) params.direction = filters.direction;

    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    const url = queryString ? `${this.apiUrl}/transactions?${queryString}` : `${this.apiUrl}/transactions`;

    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('📋 Transactions loaded:', response);
        return response;
      })
    );
  }
}
