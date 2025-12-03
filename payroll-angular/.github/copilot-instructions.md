# Angular 21 Payroll Management System - AI Agent Guide

You are an expert in TypeScript, Angular 21, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Project Context

This is the **Angular migration** of the React-based Payroll Management System. **95% complete** with modular component architecture, RBAC via `UserContextService`, and real API integration ready for final testing.

**Key Files**:
- `AGENTS.md` - Complete Angular 21 patterns reference (READ THIS FIRST)
- `src/app/services/user-context.service.ts` - Centralized RBAC with signal-based role checks
- `src/app/interceptors/auth.interceptor.ts` - JWT auto-injection for all protected routes
- `src/environments/environment.ts` - API base URL: `http://localhost:20001/pms/api/v1`

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular 21 Best Practices

- **Standalone components** (default, NEVER set `standalone: true`)
- **Signals for state** (`signal()`, `computed()`, NEVER `mutate()` - use `update()` or `set()`)
- **`inject()` function** (not constructor injection)
- **Native control flow** (`@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`)
- **Input/Output functions** (`input()`, `output()` instead of `@Input()`, `@Output()`)
- **OnPush change detection** (`changeDetection: ChangeDetectionStrategy.OnPush`)
- **Host bindings** (`host: {...}` in decorator, NOT `@HostBinding`/`@HostListener`)
- **No ngClass/ngStyle** (use `[class.foo]`, `[style.color]`)
- **Reactive forms** (prefer over template-driven)
- **`NgOptimizedImage`** for static images (not inline base64)

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Project-Specific Patterns

### RBAC (UserContextService)
```typescript
private userContext = inject(UserContextService);
isAdmin = this.userContext.isAdmin;  // computed signal
canEdit = this.userContext.canManageEmployees;
```

### API Calls (HTTP + Interceptor)
```typescript
private http = inject(HttpClient);
// Auth token auto-injected by auth.interceptor.ts
this.http.post<APIResponse<T>>(`${apiUrl}/endpoint`, data)
  .subscribe(response => {
    if (response.success) {
      // Handle response.data
    }
  });
```

### Routing with Guards
```typescript
// app.routes.ts - Auth guard checks localStorage.accessToken
{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
```
