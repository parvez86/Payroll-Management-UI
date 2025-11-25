import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import type { 
  APIResponse, 
  LoginRequest, 
  LoginResponse, 
  UserProfile,
  User
} from '../models/api.types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('🚀 Making login request...');
    
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      switchMap(loginData => {
        console.log('📡 Raw login response:', loginData);
        
        // Store tokens
        if (typeof window !== 'undefined' && window.localStorage) {
          if (loginData.accessToken) {
            window.localStorage.setItem('accessToken', loginData.accessToken);
            console.log('✅ Access token stored');
          }
          
          if (loginData.refreshToken) {
            window.localStorage.setItem('refreshToken', loginData.refreshToken);
            console.log('✅ Refresh token stored');
          }
          
          if (loginData.expiresIn) {
            window.localStorage.setItem('tokenExpiration', loginData.expiresIn.toString());
          }
        }
        
        // Call /me to get user profile
        console.log('🔄 Calling /me...');
        return this.getCurrentUserProfile().pipe(
          map(userProfile => {
            // Store user profile
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem('userProfile', JSON.stringify(userProfile));
              window.localStorage.setItem('user', JSON.stringify(userProfile.user));
              window.localStorage.setItem('userRole', userProfile.user.role);
            }
            console.log('✅ User stored:', userProfile.user);
            
            return {
              token: loginData.accessToken,
              refreshToken: loginData.refreshToken,
              tokenType: loginData.tokenType || 'Bearer',
              expiresIn: loginData.expiresIn || 3600,
              user: userProfile.user
            };
          }),
          catchError(error => {
            console.error('❌ /me failed:', error);
            this.clearAuthData();
            throw new Error('Failed to verify user credentials');
          })
        );
      }),
      catchError(error => {
        console.error('❌ Login failed:', error);
        throw error;
      })
    );
  }

  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<any>(
      `${this.apiUrl}/auth/me`
    ).pipe(
      map(response => {
        console.log('📡 /me response:', response);
        
        // Backend returns UserProfile directly with nested user object
        if (response.user && response.account) {
          // Direct UserProfile format
          return response;
        } else if (response.success && response.data) {
          // Wrapped format: { success, message, data: UserProfile }
          return response.data;
        }
        
        // Fallback: create UserProfile from response
        console.warn('⚠️ Unexpected /me response format, using fallback');
        return {
          user: {
            id: response.id || 'temp',
            username: response.username || 'admin',
            email: response.email || '',
            role: response.role || 'ADMIN'
          },
          account: {
            id: 'temp-account',
            currentBalance: 1000000,
            accountName: 'TechCorp Main Account',
            accountNumber: 'COMP001',
            accountType: 'COMPANY',
            branchName: 'Main Branch'
          },
          fullName: response.fullName || response.username || 'admin',
          companyId: response.companyId || 'temp'
        } as UserProfile;
      })
    );
  }

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = window.localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  logout(): Observable<void> {
    const accessToken = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('accessToken') : null;
    const refreshToken = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('refreshToken') : null;
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    const body = {
      refreshToken: refreshToken ? `Bearer ${refreshToken}` : '',
      logoutFromAllDevices: false
    };
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, body, { headers }).pipe(
      map(() => {
        console.log('✅ Logout API call successful');
        this.clearAuthData();
      }),
      catchError((error) => {
        console.warn('⚠️ Logout API call failed, but clearing local data anyway:', error);
        this.clearAuthData();
        return of(undefined);
      })
    );
  }

  clearAuthData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      console.log('🧹 Clearing all authentication data');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userRole');
      localStorage.removeItem('tokenExpiration');
      localStorage.removeItem('tokenType');
      console.log('✅ All authentication data cleared');
    }
  }

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !!window.localStorage.getItem('accessToken');
    }
    return false;
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('accessToken');
    }
    return null;
  }
}
