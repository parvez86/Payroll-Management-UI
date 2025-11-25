import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  if (typeof window !== 'undefined' && window.localStorage) {
    const token = window.localStorage.getItem('accessToken');
    const user = window.localStorage.getItem('user');
    
    if (token && user) {
      return true;
    }
  }
  
  // Redirect to login if not authenticated
  router.navigate(['/login']);
  return false;
};
