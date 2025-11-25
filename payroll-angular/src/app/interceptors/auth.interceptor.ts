import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Public endpoints that don't need auth
  const isLoginEndpoint = req.url.includes('/auth/login');
  const isRefreshEndpoint = req.url.includes('/auth/refresh');
  const isPublicEndpoint = isLoginEndpoint || isRefreshEndpoint;

  if (!isPublicEndpoint) {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Auth token added to request:', req.url);
    } else {
      console.warn('⚠️ No auth token found for protected endpoint:', req.url);
    }
  }

  // Add request ID for tracking
  req = req.clone({
    setHeaders: {
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  });

  return next(req);
};
