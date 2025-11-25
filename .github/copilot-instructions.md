# Payroll Management System - AI Agent Guide

## Project Architecture

This is a **multi-frontend monorepo** for a Payroll Management System with grade-based salary calculations. The workspace contains two frontend implementations connecting to a shared Spring Boot backend:

- **`payroll-frontend/`** - **Primary Active Codebase** (React 19 + TypeScript + Vite) - Production-ready, 95% complete
- **`payroll-angular/`** - **Angular 21 migration** (standalone components + signals, ~70% complete)
  - ✅ Simulator component complete (fully functional UI prototype with mock data)
  - ✅ Real API services complete (auth, employee, payroll, company)
  - ✅ HTTP interceptor with JWT handling complete
  - ✅ Real-backend component complete (571 lines, all features)
  - 🔄 Final integration and testing in progress

**Backend API**: Spring Boot 3.5.6 + Java 24 at `http://localhost:20001/pms/api/v1` (separate repository)

## Critical Business Rules (DO NOT MODIFY)

### Salary Calculation Formula
**Location**: `payroll-frontend/src/utils/salaryCalculator.ts`

```typescript
basic = baseSalaryGrade6 + (6 - employeeGrade) × 5000
hra = basic × 0.20
medical = basic × 0.15
gross = basic + hra + medical
```

**Example**: Grade 3 with base Grade 6 = 30,000 BDT
- Basic: 30,000 + (6-3) × 5,000 = 45,000
- HRA: 9,000 | Medical: 6,750 | Gross: 60,750

### Employee Constraints
- **Total**: Exactly 10 employees across 6 grades
- **Distribution**: Grade 1(1), Grade 2(1), Grade 3(2), Grade 4(2), Grade 5(2), Grade 6(2)
- **ID Format**: 4-digit unique identifier (validated in `salaryCalculator.ts`)
- **Bank Account**: Auto-created by backend on employee creation

**Configuration**: `payroll-frontend/src/config/index.ts` (business rules, grade limits, salary constants)

## Development Commands

### React Frontend (Primary)
```powershell
cd payroll-frontend
npm install
npm run dev              # Development server (http://localhost:5173)
npm run build           # Production build
npm run preview         # Preview production build
```

**Demo Credentials**: username: `admin`, password: `admin123`

### Angular Frontend (Migration)
```powershell
cd payroll-angular
npm install
npm start               # Development server (http://localhost:4200) - uses 'start' not 'ng serve'
npm run build          # Production build
```

### API Mode Switching (React Frontend Only)
Toggle in `payroll-frontend/src/config/index.ts`:
```typescript
USE_MOCK_API: false  // Production: uses real backend at localhost:20001
USE_MOCK_API: true   // Development: uses src/mocks/mockAPI.ts
```

**How it works**: `payroll-frontend/src/services/api.ts` dynamically imports mock vs real implementations:
- When `USE_MOCK_API: true` → All API calls use `src/mocks/mockAPI.ts` (10 predefined employees)
- When `USE_MOCK_API: false` → Axios instance connects to real Spring Boot backend
- Mock API returns same `{ success, message, data }` format for seamless switching

## Key Technical Patterns

### React Frontend Architecture

**State Management**: React Context API (no Redux)
- `AuthContext` - JWT tokens, user session, login/logout
- `EmployeeContext` - Employee list, CRUD operations, grade validation
- `CompanyContext` - Company account balance, transactions, top-up
- `StatusMessageContext` - Global toast notifications

**API Integration**: `payroll-frontend/src/services/api.ts`
- Axios instance with JWT interceptors
- Real API calls when `USE_MOCK_API: false`
- Dynamic mock imports when `USE_MOCK_API: true`
- All endpoints return `{ success, message, data }` format

**Component Organization**:
```
components/
  auth/          → Login, ProtectedRoute
  employee/      → EmployeeList, EmployeeForm, EmployeeDetails
  payroll/       → PayrollProcess (salary calculation + transfers)
  company/       → CompanyAccount (balance, top-up, transactions)
  shared/        → Reusable UI components
```

### Angular Frontend Conventions (payroll-angular)

**Modern Angular 21 Patterns** (enforced in `payroll-angular/AGENTS.md`, `payroll-angular/.github/copilot-instructions.md`):
- **Always use standalone components** - Default in Angular 21, NEVER explicitly set `standalone: true`
- **Use signals for state** - `signal()`, `computed()`, NEVER use `mutate()` (use `update()` or `set()`)
- **Use `inject()` function** - Instead of constructor injection
- **Native control flow** - `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- **Input/Output functions** - `input()`, `output()` instead of `@Input()`, `@Output()` decorators
- **OnPush change detection** - `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component`
- **Host bindings** - Use `host: {...}` in `@Component` decorator, NOT `@HostBinding`/`@HostListener`
- **No ngClass/ngStyle** - Use `[class.foo]`, `[style.color]` bindings instead
- **Reactive forms** - Prefer over template-driven forms

**Current Architecture** (✅ Component Extraction Complete):
- `payroll-angular/src/app/components/` - ✅ Fully extracted component structure:
  - `auth/login.component` - Login with JWT authentication
  - `employee/employee-list.component` - List with sorting & pagination
  - `employee/employee-form.component` - Add/Edit forms
  - `payroll/payroll-process.component` - Salary calculation & transfer
  - `company/company-account.component` - Balance & top-up
  - `dashboard/dashboard.component` - Main container with routing
  - `shared/` - Toast messages & loading spinner
- `payroll-angular/src/app/services/` - ✅ Complete injectable services (auth, employee, payroll, company)
- `payroll-angular/src/app/interceptors/` - ✅ HTTP interceptor with JWT injection
- `payroll-angular/src/app/guards/` - ✅ Auth guard for protected routes
- `payroll-angular/src/app/app.routes.ts` - ✅ Complete routing configuration
- `payroll-angular/src/app/simulator/` - ✅ Standalone UI prototype (unchanged)
- `payroll-angular/src/app/real-backend.component.ts` - ⚠️ Legacy (replaced by component structure)

**Status**: Migration 95% complete - All components extracted, routing configured, ready for final testing

## API Integration

**Base URL**: `http://localhost:20001/pms/api/v1`

**Authentication**: JWT Bearer token in `Authorization` header (except `/auth/login`)

**Key Endpoints**:
```
POST /auth/login                           # Login, returns JWT
GET  /auth/me                              # Get current user profile
GET  /employees                            # List all employees
POST /employees                            # Create employee
POST /payroll/calculate                    # Calculate salaries (body: {grade6Basic})
POST /payroll/transfer                     # Process batch salary transfer
GET  /companies/{id}                       # Get company account
POST /company/topup                        # Top up company account
GET  /company/transactions                 # Transaction history
```

**Response Format** (all endpoints):
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ }
}
```

**Detailed Documentation**: `docs/api-documentation.md`, `payroll-frontend/docs/api-endpoints.md`

## File System Navigation

### Critical Files (React)
- `payroll-frontend/src/utils/salaryCalculator.ts` - **Core business logic** (salary formula, validation)
- `payroll-frontend/src/config/index.ts` - Business rules, API config, environment settings
- `payroll-frontend/src/services/api.ts` - Real API integration with JWT handling
- `payroll-frontend/src/mocks/mockAPI.ts` - Development mock data (10 employees)
- `payroll-frontend/src/App.tsx` - Main router, imports `App-real-backend.tsx`

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

## Common Pitfalls

1. **Never modify salary calculation logic** - Always use `salaryCalculator.ts` functions in React or `salary-calculator.ts` in Angular
2. **Grade distribution must match** - Validate using `validateGradeDistribution()` before employee creation/updates
3. **JWT token handling** - React: Check `api.ts` request interceptor; Angular: Check `auth.interceptor.ts`. Token stored in `localStorage` as `accessToken`
4. **Mock vs Real API** - When debugging, verify `USE_MOCK_API` setting in `payroll-frontend/src/config/index.ts`
5. **Employee ID validation** - Must be exactly 4 digits (enforced in `validateEmployeeId()`)
6. **Angular standalone** - Never explicitly set `standalone: true` (it's the default in Angular 21)
7. **API response format** - All endpoints return `{ success: boolean, message: string, data: T }` - always check `success` before accessing `data`
8. **Protected routes** - All endpoints except `/auth/login` and `/auth/refresh` require JWT Bearer token in Authorization header

## Testing & Debugging

**Integration Tests**: `payroll-frontend/src/utils/integrationTester.ts` (manual API verification)

**Progress Tracking**: `payroll-frontend/src/utils/progressTracker.ts` (feature completion status)

**Error Handling**: All API calls wrapped in try-catch, errors shown via `StatusMessageContext`

**Console Logging**: Request/response interceptors log all API calls in development mode

## Project Status

- **React Frontend**: 95% complete, production-ready, real API integrated
- **Angular Frontend**: 95% complete, component-based architecture ready
  - ✅ Simulator (standalone UI prototype with mock data)
  - ✅ Real API services (auth, employee, payroll, company)
  - ✅ HTTP interceptor with JWT injection
  - ✅ Component extraction (Login, EmployeeList, EmployeeForm, Payroll, Company, Dashboard)
  - ✅ Router setup (complete routing with auth guards)
  - ✅ Shared components (toast, loading spinner)
  - 🔄 Final integration testing with real backend
- **Backend Integration**: Complete, JWT authentication working
- **Known Issues**: None blocking, see `docs/IMPLEMENTATION_STATUS.md` and `docs/angular-migration/COMPONENT-EXTRACTION-COMPLETE.md`

## When Making Changes

1. **Read existing documentation first** - Check `docs/` and `payroll-frontend/docs/` before implementing
2. **Preserve business logic** - Salary calculations and validations are finalized
3. **For Angular migration** - Use `real-backend.component.ts` as reference, extract to smaller components maintaining exact functionality
4. **Test with both API modes** - Verify changes work with mock and real backend
5. **Update types** - TypeScript types in `payroll-frontend/src/types/index.ts` match API contracts
6. **Follow framework conventions** - Use React Context in React, signals in Angular
