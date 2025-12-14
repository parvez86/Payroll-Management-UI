import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < now;
  } catch {
    return true;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (typeof window !== 'undefined' && window.localStorage) {
    const token = window.localStorage.getItem('accessToken');
    const user = window.localStorage.getItem('user');
    const refreshToken = window.localStorage.getItem('refreshToken');

    // If access token exists and is not expired
    if (token && !isTokenExpired(token)) {
      // Hydrate user context if missing
      if (!user) {
        return authService.getCurrentUserProfile().toPromise().then(profile => {
          if (profile) {
            window.localStorage.setItem('user', JSON.stringify(profile.user));
            return true;
          } else {
            router.navigate(['/login'], { queryParams: { redirect: state.url } });
            return false;
          }
        }).catch(() => {
          router.navigate(['/login'], { queryParams: { redirect: state.url } });
          return false;
        });
      }
      return true;
    }

    // If refresh token exists, try to refresh
    if (refreshToken) {
      return authService.refreshToken().toPromise().then((response: any) => {
        if (response && response.accessToken) {
          // Optionally hydrate user context
          if (!user) {
            return authService.getCurrentUserProfile().toPromise().then(profile => {
              if (profile) {
                window.localStorage.setItem('user', JSON.stringify(profile.user));
                return true;
              } else {
                router.navigate(['/login'], { queryParams: { redirect: state.url } });
                return false;
              }
            }).catch(() => {
              router.navigate(['/login'], { queryParams: { redirect: state.url } });
              return false;
            });
          }
          return true;
        } else {
          router.navigate(['/login'], { queryParams: { redirect: state.url } });
          return false;
        }
      }).catch(() => {
        router.navigate(['/login'], { queryParams: { redirect: state.url } });
        return false;
      });
    }
  }
  // Redirect to login with intended URL
  router.navigate(['/login'], { queryParams: { redirect: state.url } });
  return false;
};
