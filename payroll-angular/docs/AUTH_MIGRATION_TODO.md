# Angular Auth System Migration TODO

This file tracks actionable steps to reload/adapt the current payroll system's authentication and authorization to match Angular industry best practices.

## Migration Checklist

1. **Move JWT to HttpOnly cookies for production**
   - Update backend to set JWT as HttpOnly cookie
   - Remove localStorage JWT usage in frontend

2. **Use APP_INITIALIZER to load user context before app starts**
   - Configure APP_INITIALIZER in `app.module.ts`
   - Ensure `UserContextService` loads profile on app bootstrap

3. **Ensure `auth.interceptor.ts` handles token refresh and updates context**
   - Intercept 401 responses
   - Call `/auth/refresh` endpoint
   - Update tokens and user context
   - Rotate refresh tokens on every use

4. **Use permission helpers in both guards and templates**
   - Refactor guards to use `UserContextService` permission methods
   - Use signals and permission helpers in templates (`*ngIf`)

5. **Implement a notification service for error feedback**
   - Surface API/auth errors to users (toast messages, banners)
   - Replace console logs with user-facing notifications

6. **Write tests for all auth and permission logic**
   - Unit tests for permission helpers and guards
   - e2e tests for session flows and protected routes

7. **Review UI for accessibility compliance**
   - Use `aria-disabled` and proper roles for UI elements
   - Ensure keyboard navigation and screen reader support

## Example: APP_INITIALIZER for User Context
```typescript
// app.module.ts
{
  provide: APP_INITIALIZER,
  useFactory: (userContext: UserContextService) => () => userContext.loadUserProfile(),
  deps: [UserContextService],
  multi: true
}
```

---

Update this file as migration progresses. For code samples or further guidance, see `ANGULAR_AUTH_BEST_PRACTICES.md`.
