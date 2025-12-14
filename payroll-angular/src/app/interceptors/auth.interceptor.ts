import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { from, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // Public endpoints that don't need auth
  const isLoginEndpoint = req.url.includes('/auth/login');
  const isRefreshEndpoint = req.url.includes('/auth/refresh');
  const isPublicEndpoint = isLoginEndpoint || isRefreshEndpoint;

  let authReq = req;
  if (!isPublicEndpoint) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }
  // Add request ID for tracking
  authReq = authReq.clone({
    setHeaders: {
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !isLoginEndpoint &&
        !isRefreshEndpoint
      ) {
        // Try refresh token
        return from(authService.refreshToken().toPromise()).pipe(
          switchMap((refreshResponse: any) => {
            if (refreshResponse && refreshResponse.accessToken) {
              // Retry original request with new token
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${refreshResponse.accessToken}`,
                  'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                }
              });
              return next(newReq);
            } else {
              // Refresh failed, force logout
              authService.clearAuthData();
              router.navigate(['/login']);
              return throwError(() => error);
            }
          }),
          catchError(() => {
            authService.clearAuthData();
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
