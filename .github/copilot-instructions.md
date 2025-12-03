# Payroll Management System - AI Coding Agent Guide

## 🎯 Project Overview

**Multi-frontend monorepo** for a Payroll Management System with grade-based salary calculations and role-based access control.

### Active Codebases
- **`payroll-frontend/`** - React 19 + TypeScript + Vite (95% complete, production-ready)
- **`payroll-angular/`** - Angular 21 + Standalone Components + Signals (95% complete)
  - ✅ Component extraction, RBAC via `UserContextService`, HTTP interceptors, routing, guards
  - 🔄 Final integration testing

**Backend**: Spring Boot 3.5.6 at `http://localhost:20001/pms/api/v1` (separate repo)

### Critical Business Rules (FIXED - DO NOT MODIFY)
```typescript
// Salary formula (payroll-frontend/src/utils/salaryCalculator.ts)
basic = baseSalaryGrade6 + (6 - employeeGrade) × 5000
hra = basic × 0.20
medical = basic × 0.15
gross = basic + hra + medical

// Employee constraints (payroll-frontend/src/config/index.ts)
Total: 10 employees | Distribution: Grade 1(1), 2(1), 3(2), 4(2), 5(2), 6(2)
ID Format: 4-digit unique | Bank Account: Auto-created by backend
```

## 🛠️ Development Workflow

### React Frontend (Primary)
```powershell
cd payroll-frontend
npm install; npm run dev    # http://localhost:5173
npm run build              # Production build
```
**Credentials**: `admin` / `admin123`

### Angular Frontend (Migration)
```powershell
cd payroll-angular
npm install; npm start     # http://localhost:4200
npm run build             # Production build
npm run watch             # Watch mode
```
**Important**: Requires backend at `localhost:20001` (no mock API mode)

### API Mode Switching (React Only)
Toggle in `payroll-frontend/src/config/index.ts`:
```typescript
USE_MOCK_API: false  // Real backend (localhost:20001)
USE_MOCK_API: true   // Mock data (src/mocks/mockAPI.ts, 10 predefined employees)
```
**How it works**: `api.ts` dynamically imports mock vs real implementations

## 🏗️ Architecture Patterns

### React State Management (Context API, NO Redux)
- `AuthContext` - JWT tokens, user session, login/logout
- `EmployeeContext` - Employee CRUD, grade validation
- `CompanyContext` - Account balance, transactions, top-up
- `StatusMessageContext` - Global toast notifications

**Usage**: `const { user, login } = useAuth();`

### Angular Modern Patterns (Angular 21, enforced in `payroll-angular/AGENTS.md`)
- **Standalone components** (default, NEVER set `standalone: true`)
- **Signals** (`signal()`, `computed()`, NEVER `mutate()` - use `update()` or `set()`)
- **`inject()` function** (not constructor injection)
- **Native control flow** (`@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`)
- **Input/Output functions** (`input()`, `output()` instead of `@Input()`, `@Output()`)
- **OnPush change detection** (`changeDetection: ChangeDetectionStrategy.OnPush`)
- **Host bindings** (`host: {...}` in decorator, NOT `@HostBinding`)
- **No ngClass/ngStyle** (use `[class.foo]`, `[style.color]`)

### RBAC Implementation (Angular)
**`UserContextService`** provides centralized role-based access control:
```typescript
userRole = computed(() => 'ADMIN' | 'EMPLOYER' | 'EMPLOYEE');
isAdmin = computed(() => this.userRole() === 'ADMIN');
canManageEmployees = computed(() => this.isAdmin() || this.isEmployer());
getEmployeeListScope = computed(() => /* ADMIN: all, EMPLOYER: company, EMPLOYEE: downstream */);
```
**Employee role filtering**: Client-side filter by grade rank (downstream = grade.rank > myRank)

## 🔌 API Integration

**Base URL**: `http://localhost:20001/pms/api/v1`  
**Auth**: JWT Bearer token in `Authorization` header (except `/auth/login`)  
**Response Format** (all endpoints):
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ }
}
```

### Key Endpoints
```
POST /auth/login                    # Returns JWT + refreshToken
GET  /auth/me                       # Returns user profile + company context
GET  /employees                     # List employees (filtered by role)
POST /employees                     # Create employee (auto-creates bank account)
POST /payroll/calculate             # Calculate salaries (body: {grade6Basic})
POST /payroll/transfer              # Batch salary transfer
GET  /companies/{id}                # Get company account
POST /company/topup                 # Top up company account
GET  /company/transactions          # Transaction history
```

### React API Layer (`payroll-frontend/src/services/api.ts`)
- **Axios instance** with request/response interceptors
- **JWT auto-injection**: Reads `localStorage.accessToken`, adds `Bearer ${token}` header
- **Dynamic imports**: Mock vs real API based on `config.USE_MOCK_API`
- **Error handling**: Try-catch, errors shown via `StatusMessageContext`

### Angular API Layer
- **`HttpClient`** with functional interceptor (`auth.interceptor.ts`)
- **Auto-injects JWT**: Same pattern as React
- **RxJS observables**: Services return `Observable<T>`, components subscribe
- **Login flow**: `/auth/login` → store tokens → `/auth/me` → store profile + company context

## 📂 Component Architecture

### React (`payroll-frontend/src/components/`)
```
auth/          → Login, ProtectedRoute
employee/      → EmployeeList, EmployeeForm, EmployeeDetails
payroll/       → PayrollProcess (salary calculation + batch transfer)
company/       → CompanyAccount (balance, top-up, transaction history)
shared/        → Reusable UI components (Button, Modal, Table)
```

### Angular (`payroll-angular/src/app/components/`)
```
auth/          → login.component.ts (JWT authentication)
employee/      → employee-list.component.ts, employee-form.component.ts
payroll/       → payroll-process.component.ts
company/       → company-account.component.ts
dashboard/     → dashboard.component.ts (main container with routing)
shared/        → toast-message.component.ts, loading-spinner.component.ts
```

**Angular Services** (`payroll-angular/src/app/services/`):
- `auth.service.ts` - Login: `/auth/login` → store tokens → `/auth/me` → store profile
- `user-context.service.ts` - **RBAC**: Signal-based role checks (isAdmin, isEmployer, isEmployee)
- `employee.service.ts`, `payroll.service.ts`, `company.service.ts` - Domain services
- `company-selection.service.ts` - Multi-company context (ADMIN/EMPLOYER)
- `grade.service.ts`, `branch.service.ts`, `transaction.service.ts` - Supporting services

## 📁 Workspace Structure & Navigation

**Root Level**:
- `development.md` - Master dev plan, domain model, backend structure (625 lines - READ THIS FIRST for architecture)
- `ANGULAR_MIGRATION_MASTER_PLAN.md` - Complete React→Angular migration strategy with 1:1 component mappings
- `docs/` - Cross-cutting documentation (API reference, implementation status)
- `payroll-frontend/` - React app (primary codebase)
- `payroll-angular/` - Angular app (migration target)

**Working in React** (`payroll-frontend/`):
- Start here: `payroll-frontend/src/config/index.ts` - Toggle `USE_MOCK_API` for dev mode
- Business logic: `payroll-frontend/src/utils/salaryCalculator.ts` - ALL salary calculations (NEVER duplicate)
- API layer: `payroll-frontend/src/services/api.ts` - Dynamically loads mock vs real API
- Mock data: `payroll-frontend/src/mocks/mockAPI.ts` - 10 predefined employees for offline dev
- Entry point: `payroll-frontend/src/App.tsx` → imports `App-real-backend.tsx`
- Context providers: `payroll-frontend/src/contexts/` - Auth, Employee, Company, StatusMessage

**Working in Angular** (`payroll-angular/`):
- Read first: `payroll-angular/AGENTS.md` - Angular 21 best practices (canonical reference)
- Components: `payroll-angular/src/app/components/` - Modular structure (auth, employee, payroll, company, dashboard, shared)
- Services: `payroll-angular/src/app/services/` - Injectable services with signals
- Routing: `payroll-angular/src/app/app.routes.ts` - `/login`, `/dashboard/*` with guards
- Interceptor: `payroll-angular/src/app/interceptors/auth.interceptor.ts` - Auto-adds JWT to requests
- Entry: `payroll-angular/src/app/app.ts` - Root component with `<router-outlet>`

### Critical Files (React)
- `payroll-frontend/src/utils/salaryCalculator.ts` - **Core business logic** (salary formula, validation)
- `payroll-frontend/src/config/index.ts` - Business rules, API config, environment settings
- `payroll-frontend/src/services/api.ts` - Real API integration with JWT handling
- `payroll-frontend/src/mocks/mockAPI.ts` - Development mock data (10 employees)
- `payroll-frontend/src/App.tsx` - Main router, imports `App-real-backend.tsx`

### Critical Files (Angular)
- `payroll-angular/AGENTS.md` - **Must-read** Angular 21 patterns (signals, inject, control flow)
- `payroll-angular/src/app/services/auth.service.ts` - Login flow: `/auth/login` → store tokens → `/auth/me` → store profile + company context
- `payroll-angular/src/app/services/user-context.service.ts` - **Centralized RBAC**: signal-based role checks (isAdmin, isEmployer, isEmployee), company context
- `payroll-angular/src/app/interceptors/auth.interceptor.ts` - Functional interceptor: injects `Bearer ${token}` header automatically
- `payroll-angular/src/app/guards/auth.guard.ts` - Checks `localStorage.accessToken` before route activation
- `payroll-angular/src/environments/environment.ts` - API base URL configuration

### Documentation
- `README.md` - Project overview, quick start, architecture
- `development.md` - Master development plan, domain model, backend structure
- `docs/IMPLEMENTATION_STATUS.md` - Feature completion tracking (90-95% done)
- `payroll-frontend/docs/` - Detailed architecture, business logic, testing, API verification

### Angular Migration
- `ANGULAR_MIGRATION_MASTER_PLAN.md` - Complete 1:1 React → Angular migration strategy with component mappings
- `payroll-frontend/migration/angular/` - Migration plan, checklist, reusable assets
- `payroll-angular/AGENTS.md` - Angular 21 best practices for AI agents (canonical reference)
- `payroll-angular/.github/copilot-instructions.md` - Angular-specific AI guidelines

## ⚠️ Common Pitfalls

1. **Never modify salary calculation logic** - Always use `salaryCalculator.ts` functions in React or `salary-calculator.ts` in Angular
2. **Grade distribution must match** - Validate using `validateGradeDistribution()` before employee creation/updates
3. **JWT token handling** - React: Check `api.ts` request interceptor; Angular: Check `auth.interceptor.ts`. Token stored in `localStorage` as `accessToken`
4. **Mock vs Real API** - When debugging, verify `USE_MOCK_API` setting in `payroll-frontend/src/config/index.ts`
5. **Employee ID validation** - Must be exactly 4 digits (enforced in `validateEmployeeId()`)
6. **Angular standalone** - Never explicitly set `standalone: true` (it's the default in Angular 21)
7. **Angular signals** - Use `update()` or `set()` to modify signals, NEVER use `mutate()` (doesn't exist)
8. **API response format** - All endpoints return `{ success: boolean, message: string, data: T }` - always check `success` before accessing `data`
9. **Protected routes** - All endpoints except `/auth/login` and `/auth/refresh` require JWT Bearer token in Authorization header
10. **Terminal commands** - This is Windows PowerShell - use `;` to join commands (NOT `&&`), use backslash escaping for special chars

## 🧪 Testing & Debugging

**Integration Tests**: `payroll-frontend/src/utils/integrationTester.ts` (manual API verification)

**Progress Tracking**: `payroll-frontend/src/utils/progressTracker.ts` (feature completion status)

**Error Handling**: All API calls wrapped in try-catch, errors shown via `StatusMessageContext`

**Console Logging**: Request/response interceptors log all API calls in development mode

## 📊 Project Status (December 2025)

- **React Frontend**: 95% complete, production-ready, real API integrated
  - ✅ All CRUD operations working
  - ✅ JWT authentication with token refresh
  - ✅ Mock API mode for offline development
  - ✅ Context-based state management
  - ✅ Salary calculations with grade validation
  - ⚠️ No automated tests yet (see `payroll-frontend/src/utils/integrationTester.ts` for manual testing)

- **Angular Frontend**: 95% complete, component-based architecture ready
  - ✅ Simulator (standalone UI prototype with mock data in `src/app/simulator/`)
  - ✅ Real API services (auth, employee, payroll, company)
  - ✅ HTTP interceptor with JWT injection
  - ✅ Component extraction (Login, EmployeeList, EmployeeForm, Payroll, Company, Dashboard)
  - ✅ Router setup (complete routing with auth guards)
  - ✅ Shared components (toast, loading spinner)
  - 🔄 Final integration testing with real backend (components ready, need E2E validation)

- **Backend Integration**: Complete, JWT authentication working
  - ✅ Spring Boot 3.5.6 API at `localhost:20001`
  - ✅ All endpoints documented in `docs/api-documentation.md`
  - ✅ Response format: `{ success, message, data }`

- **Known Issues**: None blocking
  - See `docs/IMPLEMENTATION_STATUS.md` for detailed feature tracking
  - See `docs/angular-migration/COMPONENT-EXTRACTION-COMPLETE.md` for Angular migration status

## 💡 When Making Changes

1. **Read existing documentation first** - Check `docs/` and `payroll-frontend/docs/` before implementing
2. **Preserve business logic** - Salary calculations and validations are finalized
3. **For Angular migration** - Use `real-backend.component.ts` as reference, extract to smaller components maintaining exact functionality
4. **Test with both API modes** - Verify changes work with mock and real backend
5. **Update types** - TypeScript types in `payroll-frontend/src/types/index.ts` match API contracts
6. **Follow framework conventions** - Use React Context in React, signals in Angular
