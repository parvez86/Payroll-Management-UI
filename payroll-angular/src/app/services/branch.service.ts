import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Branch {
  id: string;
  branchName: string;
  accountNumber?: string;
  branchType?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class BranchService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllBranches(): Observable<Branch[]> {
    return this.http.get<any>(`${this.apiUrl}/branches?page=0&size=100&sort=Id`).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.content)) return response.content;
        if (response.data && Array.isArray(response.data.content)) return response.data.content;
        return [];
      })
    );
  }
}
