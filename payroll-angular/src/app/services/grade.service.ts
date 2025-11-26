import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Grade {
  id: string;
  name: string;
  rank: number;
  baseSalary?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllGrades(): Observable<Grade[]> {
    return this.http.get<any>(`${this.apiUrl}/grades`).pipe(
      map(response => {
        console.log('gradeService.getAllGrades raw response:', response);
        // Handle different response formats
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.content)) return response.content;
        return [];
      })
    );
  }
}
