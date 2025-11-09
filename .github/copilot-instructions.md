# Copilot Instructions - Payroll Management System

## 🎯 Project Overview
Full-stack payroll management system with grade-based salary calculations, batch processing, and company account management. React 19 + TypeScript frontend with Spring Boot 3.5.6 backend.

## 🏗️ Architecture

### Frontend Structure (`payroll-frontend/`)
```
src/
├── components/          # Feature-based components
│   ├── auth/           # Login, ProtectedRoute (JWT)
│   ├── employee/       # EmployeeForm, EmployeeList (CRUD + validation)
│   ├── payroll/        # PayrollProcess, SalarySheet (batch operations)
│   ├── company/        # CompanyAccount (balance, top-up)
│   └── shared/         # StatusMessage, TopUpModal (reusable UI)
├── contexts/           # React Context for global state
│   ├── AuthContext     # JWT tokens, user profile, auth state
│   ├── EmployeeContext # Employee list, grade validation logic
│   ├── CompanyContext  # Account balance, transactions
│   └── StatusMessageContext # Toast notifications
├── services/
│   ├── api.ts          # Axios client, interceptors, all API calls
│   └── mockAPI.ts      # Development mock data
├── utils/
│   └── salaryCalculator.ts # CRITICAL: Salary formula (see below)
├── config/index.ts     # Business rules, API mode toggle
└── App.tsx             # Routes: /login, /dashboard, /employees, /payroll, /company
```

### Tech Stack
- **Frontend**: React 19, TypeScript 5.9, Vite 7, React Router DOM 7, Axios
- **Backend**: Spring Boot 3.5.6, Java 24, PostgreSQL/H2
- **Dev Server**: Vite (`npm run dev` on port 3000)
- **Backend API**: `http://localhost:20001/pms/api/v1`

## 🔐 Critical Business Rules (NEVER VIOLATE)

### 1. **Salary Calculation Formula**
**ONLY use this implementation from `src/utils/salaryCalculator.ts`:**
```typescript
export const calculateSalary = (grade: number, baseSalaryGrade6: number = 30000): SalaryBreakdown => {
  const basic = baseSalaryGrade6 + (6 - grade) * 5000;
  const hra = basic * 0.20;      // 20% of basic
  const medical = basic * 0.15;  // 15% of basic
  const gross = basic + hra + medical;
  return { basic, hra, medical, gross };
};

// Example: Grade 3 = 30000 + (6-3)*5000 = 45,000 basic
// HRA = 9,000 | Medical = 6,750 | Gross = 60,750
```

### 2. **Employee Constraints**
- **Total**: Exactly 10 employees (enforced in backend)
- **Grade Distribution**: `{1:1, 2:1, 3:2, 4:2, 5:2, 6:2}` (validated in `EmployeeContext`)
- **Employee ID**: Must be exactly 4 digits, unique (validated via `validateEmployeeId()`)
- **Bank Account**: Auto-created on employee creation (backend handles)

### 3. **Payroll Batch Processing**
- **Workflow**: Create batch → Preview calculations → Process transfer
- **Insufficient Funds**: Show `TopUpModal` when `companyBalance < totalPayroll`
- **Status Tracking**: `PENDING → PROCESSING → COMPLETED/FAILED`
- **Per-Employee Status**: Track individual transfer success/failure

## 🔌 API Integration Patterns

### Authentication Flow (JWT)
```typescript
// 1. Login → Store tokens in localStorage
authService.login({ username, password })
  → response.data: { accessToken, refreshToken, user, expiresIn }
  → localStorage: 'accessToken', 'refreshToken', 'user'

// 2. Protected Requests → Axios Interceptor adds Bearer token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  config.headers.Authorization = `Bearer ${token}`;
});

// 3. 401 Response → Clear tokens, redirect to /login
```

### Key API Endpoints
```typescript
// Auth
POST   /auth/login               → { accessToken, refreshToken, user }
GET    /auth/me                  → UserProfile (requires Bearer token)
POST   /auth/logout              → void

// Employee (paginated)
GET    /employees?page=0&size=50&sort=grade.rank → Employee[]
POST   /employees                → Employee
PUT    /employees/{id}           → Employee
DELETE /employees/{id}           → void

// Payroll Batches
POST   /payroll/batches          → { id, status, totalAmount, ... }
GET    /payroll/batches/{id}     → PayrollBatch
POST   /payroll/batches/{id}/process → { processedItems, failures }
GET    /payroll/batches/{id}/items?page=0&size=10 → PayrollItem[]

// Company Account
GET    /companies/{companyId}    → Company (includes mainAccount.currentBalance)
POST   /companies/{companyId}/topup → { amount }
```

### Response Handling
- **Success**: Backend returns data directly OR wrapped in `{ success, data, message }`
- **Errors**: Axios interceptor logs, shows toast via `StatusMessageContext`
- **401/403**: Clear auth, redirect to `/login`
- **Network/Timeout**: Show connection error toast

## 🧩 State Management Patterns

### React Context Usage
```typescript
// 1. AuthContext: Manage authentication state
const { user, isAuthenticated, login, logout } = useAuth();

// 2. EmployeeContext: CRUD + validation
const { employees, addEmployee, updateEmployee, validateNewEmployee } = useEmployees();

// 3. CompanyContext: Account balance
const { company, topUpAccount } = useCompany();

// 4. StatusMessageContext: Toast notifications
const { addMessage } = useStatusMessages();
addMessage('Success!', 'success');
```

### Validation Example
```typescript
// Before creating employee, validate in EmployeeForm
const error = validateNewEmployee({ bizId, grade }, isUpdate, currentEmployee);
if (error) {
  addMessage(error, 'error');
  return;
}
```

## 🛠️ Developer Workflows

### Start Development
```powershell
# Frontend (in payroll-frontend/)
npm install
npm run dev  # Runs on http://localhost:3000

# Backend (see backend README)
# Runs on http://localhost:20001
```

### Switch API Mode
Edit `payroll-frontend/src/config/index.ts`:
```typescript
export const config = {
  USE_MOCK_API: false,  // false = real backend, true = mock data
  API_BASE_URL: 'http://localhost:20001/pms/api/v1',
  // ...
};
```

### Build for Production
```powershell
cd payroll-frontend
npm run build         # Outputs to dist/
npm run preview       # Preview production build
```

### Debugging
- **API Requests**: Check browser DevTools → Network tab
- **Console Logs**: Axios interceptor logs all requests/responses in dev mode
- **Auth Issues**: Check `localStorage` for `accessToken`, `user`
- **Validation Errors**: Check `EmployeeContext.error` state

## 🎨 UI/UX Conventions

### Form Validation
- **Real-time**: Employee ID (4 digits), grade limits
- **On Submit**: Server-side validation errors displayed via toast

### Error Display
- **Toast Notifications**: `StatusMessage` component (success/error/warning)
- **Inline Errors**: Form field validation errors below inputs
- **Modal Dialogs**: Top-up modal for insufficient funds

### Responsive Design
- Mobile-first CSS
- Tables responsive (employee list, payroll sheet)
- Forms optimized for touch

## 🔍 Key Files Reference

### Critical Business Logic
- `src/utils/salaryCalculator.ts` - **Salary formula (NEVER change)**
- `src/config/index.ts` - Business rules (grade distribution, API mode)
- `src/contexts/EmployeeContext.tsx` - Grade validation logic

### API Integration
- `src/services/api.ts` - **All API calls, interceptors, auth handling**
- `src/services/mockAPI.ts` - Mock data for development

### Components
- `src/components/employee/EmployeeForm.tsx` - Employee CRUD with validation
- `src/components/payroll/PayrollProcess.tsx` - Batch creation, processing
- `src/components/company/CompanyAccount.tsx` - Balance, top-up
- `src/components/auth/ProtectedRoute.tsx` - Route guards

### Types
- `src/types/index.ts` - TypeScript interfaces (Employee, PayrollBatch, Company, etc.)

## 🚨 Common Pitfalls

1. **DON'T modify salary formula** - Use `salaryCalculator.ts` as-is
2. **DON'T hardcode grade limits** - Read from `config.GRADE_DISTRIBUTION`
3. **DON'T skip validation** - Always call `validateNewEmployee()` before submit
4. **DON'T forget auth headers** - Axios interceptor handles this (check it's working)
5. **DON'T use mock data in production** - Set `USE_MOCK_API: false`

## 📚 Documentation
- `docs/api-endpoints.md` - Full API reference
- `docs/business-logic.md` - Business rules summary
- `docs/error-handling.md` - Error patterns
- `development.md` - Backend architecture (Spring Boot domain model)

---
**For backend setup/API development, see `development.md` and backend README.**