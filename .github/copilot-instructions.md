# Payroll Management System - AI Coding Agent Guide

## 🎯 Project Overview

**Multi-frontend monorepo** for a Payroll Management System with grade-based salary calculations and role-based access control.

### Active Codebases
  - ✅ Component extraction, RBAC via `UserContextService`, HTTP interceptors, routing, guards
  - 🔄 Final integration testing

**Backend**: Spring Boot 3.5.6 at `http://localhost:20001/pms/api/v1` (separate repo)

### Critical Business Rules (FIXED - DO NOT MODIFY)
```typescript
// Salary formula (payroll-frontend/src/utils/salaryCalculator.ts)

// Employee constraints (payroll-frontend/src/config/index.ts)
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

**Usage**: `const { user, login } = useAuth();`

### Angular Modern Patterns (Angular 21, enforced in `payroll-angular/AGENTS.md`)

# Payroll Management System – AI Coding Agent Guide

## Overview
Multi-frontend monorepo for payroll management with strict grade-based salary rules and role-based access control (RBAC). React (primary) and Angular (migration) frontends share business logic and API contracts. Backend is Spring Boot (external repo).

## Architecture & Data Flow
- **React** (`payroll-frontend/`): Context API for state, no Redux. Key files: `src/components/`, `src/services/api.ts`, `src/utils/salaryCalculator.ts`.
- **Angular** (`payroll-angular/`): Signals for state, enforced modern Angular 21 patterns (see `AGENTS.md`). Key files: `src/app/components/`, `src/app/services/`, `src/app/real-backend.component.ts`.
- **RBAC**: Centralized in Angular via `UserContextService` (see code in this file). React uses context-based role checks.
- **API**: All endpoints return `{ success, message, data }`. JWT required except `/auth/login`. See `docs/api-documentation.md`.

## Critical Business Rules (DO NOT CHANGE)
- Salary: Use only `salaryCalculator.ts` (React) or `salary-calculator.ts` (Angular)
- Employees: Exactly 10, fixed grade distribution (see config/index.ts)
- Employee ID: 4-digit unique, validated by `validateEmployeeId()`
- Grade validation: Use `validateGradeDistribution()` before create/update

## Developer Workflow
- **React**: `cd payroll-frontend; npm install; npm run dev` (http://localhost:5173)
- **Angular**: `cd payroll-angular; npm install; npm start` (http://localhost:4200)
- **API mode (React only)**: Toggle `USE_MOCK_API` in `src/config/index.ts` for mock vs real backend
- **Build**: `npm run build` in either frontend
- **Testing**: No automated tests; use `src/utils/integrationTester.ts` for manual API checks

## Project Conventions & Patterns
- **React**: Context API for auth/state, Axios for HTTP, CSS Modules, no Redux
- **Angular**: Standalone components (never set `standalone: true`), signals for state, use `update()`/`set()` (never `mutate()`), no `ngClass`/`ngStyle`, use native control flow
- **RBAC**: Always filter employee lists by role/grade (see `UserContextService` or context)
- **API**: Always check `success` before using `data`. JWT in `localStorage` as `accessToken`
- **Terminal**: Use PowerShell syntax (`;` for chaining, never `&&`)

## Integration & Cross-Component
- **API Layer**: React: `src/services/api.ts` (dynamic mock/real). Angular: `auth.interceptor.ts` for JWT.
- **Salary/Grade**: Never duplicate logic; always import from shared utils
- **Docs**: See `docs/` and `payroll-frontend/docs/` for business rules, API, and migration status

## Common Pitfalls
1. Never modify salary calculation logic directly
2. Always validate grade distribution and employee ID
3. Always use JWT for protected endpoints
4. React: Check `USE_MOCK_API` before debugging API issues
5. Angular: Never set `standalone: true`; use signals properly
6. Always check API `success` field

## References
- `payroll-frontend/src/utils/salaryCalculator.ts`, `payroll-frontend/src/config/index.ts`
- `payroll-angular/src/app/services/`, `payroll-angular/AGENTS.md`
- `docs/api-documentation.md`, `docs/IMPLEMENTATION_STATUS.md`

---
For migration or architecture questions, see `docs/angular-migration/` and `payroll-angular/AGENTS.md`.

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

### Angular API Layer

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

## 📁 Workspace Structure & Navigation

**Root Level**:

**Working in React** (`payroll-frontend/`):

**Working in Angular** (`payroll-angular/`):

### Critical Files (React)

### Critical Files (Angular)

### Documentation

### Angular Migration

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

  - ✅ All CRUD operations working
  - ✅ JWT authentication with token refresh
  - ✅ Mock API mode for offline development
  - ✅ Context-based state management
  - ✅ Salary calculations with grade validation
  - ⚠️ No automated tests yet (see `payroll-frontend/src/utils/integrationTester.ts` for manual testing)

  - ✅ Simulator (standalone UI prototype with mock data in `src/app/simulator/`)
  - ✅ Real API services (auth, employee, payroll, company)
  - ✅ HTTP interceptor with JWT injection
  - ✅ Component extraction (Login, EmployeeList, EmployeeForm, Payroll, Company, Dashboard)
  - ✅ Router setup (complete routing with auth guards)
  - ✅ Shared components (toast, loading spinner)
  - 🔄 Final integration testing with real backend (components ready, need E2E validation)

  - ✅ Spring Boot 3.5.6 API at `localhost:20001`
  - ✅ All endpoints documented in `docs/api-documentation.md`
  - ✅ Response format: `{ success, message, data }`

  - See `docs/IMPLEMENTATION_STATUS.md` for detailed feature tracking
  - See `docs/angular-migration/COMPONENT-EXTRACTION-COMPLETE.md` for Angular migration status

## 💡 When Making Changes

1. **Read existing documentation first** - Check `docs/` and `payroll-frontend/docs/` before implementing
2. **Preserve business logic** - Salary calculations and validations are finalized
3. **For Angular migration** - Use `real-backend.component.ts` as reference, extract to smaller components maintaining exact functionality
4. **Test with both API modes** - Verify changes work with mock and real backend
5. **Update types** - TypeScript types in `payroll-frontend/src/types/index.ts` match API contracts
6. **Follow framework conventions** - Use React Context in React, signals in Angular
