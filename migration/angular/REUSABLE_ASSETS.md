# Reusable Assets for Angular Migration

## 📦 100% Reusable (Direct Copy)

### TypeScript Types & Interfaces (`src/types/index.ts`)
**Status:** ✅ Direct copy - No changes needed
**Angular Location:** `src/app/models/`

All interfaces can be directly copied:
- `User`, `Grade`, `Branch`, `Employee`, `EmployeeSalary`
- `BankAccount`, `Company`, `BackendCompany`
- `UserProfile`, `LoginRequest`, `LoginResponse`
- `PayrollBatch`, `PayrollItem`, `Money`, `PageResponse`
- `Transaction`, `TopUpRequest`, `TopUpResponse`
- `ApiResponse`, `SalaryTransferRequest`, `SalaryTransferResponse`

### Business Logic Utilities (`src/utils/salaryCalculator.ts`)
**Status:** ✅ Direct copy - Critical business logic
**Angular Location:** `src/app/core/utils/salary-calculator.ts`

```typescript
// CRITICAL: NEVER MODIFY THIS FORMULA
export const calculateSalary = (grade: number, baseSalaryGrade6?: number): SalaryBreakdown => {
  const baseGrade6 = baseSalaryGrade6 || 30000;
  const basic = baseGrade6 + (6 - grade) * 5000;
  const hra = basic * 0.20;      // 20% HRA
  const medical = basic * 0.15;  // 15% Medical
  const gross = basic + hra + medical;
  return { basic, hra, medical, gross };
};
```

**Includes:**
- `calculateSalary()` - Grade-based salary calculation
- `validateEmployeeId()` - 4-digit validation
- `validateGradeDistribution()` - Grade limits enforcement
- `formatCurrency()` - BDT formatting

### Configuration (`src/config/index.ts`)
**Status:** ✅ Direct copy with minor adjustments
**Angular Location:** `src/app/core/config/app.config.ts`

**Changes needed:**
- Replace `import.meta.env` with Angular environment variables
- Use `environment.ts` files instead

```typescript
// Angular version:
import { environment } from '../../../environments/environment';

export const config = {
  API_BASE_URL: environment.apiBaseUrl,
  // ... rest stays same
};
```

### Complete CSS Stylesheets
**Status:** ✅ Direct copy - Exact UI replica
**Angular Location:** `src/styles.css` (global) or component-specific

**Files to copy:**
1. **`src/App.css`** (2121 lines) - Complete application styles
   - Login page styles
   - Form styles (inputs, selects, buttons)
   - Table styles (employee list)
   - Dashboard cards
   - Payroll processing UI
   - Company account UI
   - Status messages/toasts
   - Responsive design
   - Color scheme and theming

2. **`src/SimulatedApp.css`** - Additional component styles

3. **`src/index.css`** - Base/reset styles

**Angular Strategy:**
- Copy `App.css` → `src/styles.css` (global styles)
- Extract component-specific styles to component `.scss` files
- Use ViewEncapsulation.None for components needing global styles

## 🔧 95% Reusable (Minor Adaptations)

### API Services (`src/services/api.ts`)
**Status:** 🔄 Port to Angular HttpClient
**Angular Location:** `src/app/core/services/`

**What to keep:**
- All API endpoint URLs
- Request/response interfaces
- Business logic in each method
- Error handling patterns

**What to change:**
- Replace `axios` with Angular `HttpClient`
- Replace axios interceptors with Angular `HttpInterceptor`
- Use RxJS Observables instead of Promises
- JWT handling via interceptor

**Services to create:**
1. `auth.service.ts` - Login, logout, profile, token management
2. `employee.service.ts` - CRUD operations
3. `payroll.service.ts` - Batch creation, processing, salary sheet
4. `company.service.ts` - Account balance, top-up, transactions
5. `grade.service.ts` - Grade list
6. `branch.service.ts` - Branch list

**Example conversion:**
```typescript
// React (axios)
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }
};

// Angular (HttpClient)
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}
  
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, credentials);
  }
}
```

### Validation Service (`src/services/validationService.ts`)
**Status:** ✅ Direct copy if exists, or use from `salaryCalculator.ts`
**Angular Location:** `src/app/core/services/validation.service.ts`

## 🎨 UI/UX Design Elements (100% Reusable)

### Color Palette (from CSS)
```css
/* Primary Colors */
--primary: #4f46e5 (Indigo 600)
--primary-hover: #4338ca (Indigo 700)

/* Status Colors */
--success: #059669 (Green 600)
--error: #dc2626 (Red 600)
--warning: #d97706 (Amber 600)
--info: #2563eb (Blue 600)

/* Neutrals */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-500: #6b7280
--gray-700: #374151
--gray-900: #111827
```

### Typography
- Font: 'Inter', system fonts
- Headers: 800 weight
- Body: 400-500 weight
- Sizes: 0.875rem to 1.875rem

### Component Patterns
1. **Cards:** White background, rounded corners (0.75rem), box-shadow
2. **Buttons:** Rounded (0.375rem), padding (0.75rem 1rem), transition
3. **Forms:** Labels + inputs, validation messages, disabled states
4. **Tables:** Header with sortable columns, hover states, responsive
5. **Status Badges:** Colored pills with status text
6. **Modals:** Centered overlay, backdrop blur, close button

### Layout Structure
- **Dashboard:** 2x2 grid layout, responsive
- **Forms:** 2-column layout for fields, stacked on mobile
- **Tables:** Full-width, horizontal scroll on mobile
- **Navigation:** Top bar with logout, company name, user role

## 📋 Business Rules (100% Reusable)

### Employee Constraints
```typescript
MAX_EMPLOYEES: 10
GRADE_DISTRIBUTION: {
  1: 1, // 1 employee at Grade 1 (highest)
  2: 1,
  3: 2,
  4: 2,
  5: 2,
  6: 2  // 2 employees at Grade 6 (lowest)
}
```

### Salary Formula Constants
```typescript
DEFAULT_BASE_SALARY_GRADE_6: 30000
HRA_PERCENTAGE: 0.20    // 20%
MEDICAL_PERCENTAGE: 0.15 // 15%
GRADE_INCREMENT: 5000    // Per grade difference
```

### Validation Rules
- **Employee ID:** Exactly 4 digits, unique
- **Mobile:** 10-11 digits
- **Bank Account:** 10-20 digits
- **Grade:** Must match distribution limits
- **Payroll:** Requires exactly 10 employees

## 🔒 Authentication & Security (100% Reusable)

### JWT Token Management
```typescript
// Token storage
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('user', JSON.stringify(user));

// Token in headers
headers: { Authorization: `Bearer ${token}` }

// Token expiration check
isAuthenticated(): boolean {
  const token = localStorage.getItem('accessToken');
  const expiration = localStorage.getItem('tokenExpiration');
  return token && (Date.now() < parseInt(expiration));
}
```

### Protected Routes Pattern
```typescript
// React pattern to convert to Angular Guards
if (!authService.isAuthenticated()) {
  navigate('/login');
}
```

## 📦 Icons & Assets (100% Reusable)

### Icon System (`src/icons.tsx`)
**Status:** 🔄 Convert to Angular component or use icon library
**Options:**
1. Use Angular Material Icons
2. Use FontAwesome
3. Convert to SVG icon component
4. Use Lucide Angular (recommended - matches current design)

**Current icons used:**
- LogOut, DollarSign, PlusCircle, Users, Building2
- Calendar, CheckCircle, XCircle, AlertTriangle
- ArrowUpDown, Edit, Trash2, Eye, Download

## 🗂️ Folder Structure Mapping

### React Structure → Angular Structure

```
React:                          Angular:
─────────────────────────────────────────────────────────
src/
├── types/                    → src/app/models/
│   └── index.ts                 └── *.model.ts
│
├── config/                   → src/app/core/config/
│   └── index.ts                 └── app.config.ts
│
├── utils/                    → src/app/core/utils/
│   ├── salaryCalculator.ts     ├── salary-calculator.ts
│   ├── errorHandler.ts         └── error-handler.ts
│
├── services/                 → src/app/core/services/
│   └── api.ts                   ├── auth.service.ts
│                                ├── employee.service.ts
│                                ├── payroll.service.ts
│                                └── company.service.ts
│
├── contexts/                 → src/app/core/state/
│   ├── AuthContext.tsx          ├── auth.state.ts
│   ├── EmployeeContext.tsx      ├── employee.state.ts
│   └── CompanyContext.tsx       └── company.state.ts
│
├── components/               → src/app/
│   ├── auth/                    ├── features/auth/
│   │   ├── Login.tsx               └── login/
│   │   └── ProtectedRoute.tsx         └── login.component.ts
│   │
│   ├── employee/                ├── features/employee/
│   │   ├── EmployeeForm.tsx        ├── employee-form/
│   │   └── EmployeeList.tsx        └── employee-list/
│   │
│   ├── payroll/                 ├── features/payroll/
│   │   ├── PayrollProcess.tsx      ├── payroll-process/
│   │   └── SalarySheet.tsx         └── salary-sheet/
│   │
│   ├── company/                 ├── features/company/
│   │   └── CompanyAccount.tsx      └── company-account/
│   │
│   └── shared/                  └── shared/components/
│       ├── StatusMessage.tsx        ├── status-message/
│       └── TopUpModal.tsx           └── top-up-modal/
│
├── App.tsx                   → src/app/app.component.ts
├── App.css                   → src/styles.css
└── main.tsx                  → src/main.ts
```

## 🎯 Migration Priority

### Phase 1: Core Foundation (Direct Copy)
1. ✅ Copy all TypeScript types/interfaces
2. ✅ Copy salary calculation utility
3. ✅ Copy validation utilities
4. ✅ Copy config with environment variables
5. ✅ Copy all CSS files

### Phase 2: Services (Minor Adaptation)
1. 🔄 Convert API services to HttpClient
2. 🔄 Create HttpInterceptor for JWT
3. 🔄 Add error handling interceptor
4. ✅ Copy business logic from services

### Phase 3: State Management (Convert)
1. 🔄 Convert React Context to Angular Services + RxJS
2. 🔄 Use BehaviorSubject for state
3. 🔄 Create auth guard from ProtectedRoute

### Phase 4: Components (Convert)
1. 🔄 Convert Login component
2. 🔄 Convert Employee components
3. 🔄 Convert Payroll components
4. 🔄 Convert Company components
5. 🔄 Convert shared components
6. 🔄 Convert Dashboard

### Phase 5: Routing & Final (Setup)
1. 🔄 Setup Angular routing
2. 🔄 Apply all CSS styles
3. 🔄 Test all features
4. ✅ Verify exact UI match

## 📝 Notes for Migration

### DO NOT MODIFY
- ❌ Salary calculation formula
- ❌ Grade distribution rules
- ❌ Employee constraints (10 employees, 4-digit ID)
- ❌ Business validation logic
- ❌ API endpoint URLs

### MODIFY ONLY FRAMEWORK SPECIFICS
- ✅ React hooks → Angular lifecycle hooks
- ✅ useState → Component properties + Change Detection
- ✅ useEffect → ngOnInit, ngOnDestroy
- ✅ React Context → Angular Services + RxJS
- ✅ axios → HttpClient
- ✅ Promises → Observables

### MAINTAIN EXACT UI
- ✅ Same colors, fonts, spacing
- ✅ Same layout and responsive behavior
- ✅ Same form validation messages
- ✅ Same button styles and interactions
- ✅ Same table design and sorting
- ✅ Same modal/dialog behavior

## 🔍 Testing Checklist
- [ ] All 10 employees can be added with correct grade distribution
- [ ] Employee ID validation (4 digits, unique)
- [ ] Salary calculation matches React version exactly
- [ ] Payroll batch creation and processing
- [ ] Insufficient funds shows top-up modal
- [ ] Company account top-up works
- [ ] Transaction history displays
- [ ] Login/logout flow
- [ ] Protected routes redirect to login
- [ ] All tables sortable
- [ ] All forms validate correctly
- [ ] UI matches React version pixel-perfect

---

**Summary:** ~85% of the codebase is directly reusable. Only React-specific syntax and patterns need conversion to Angular. Business logic, types, utilities, and CSS remain unchanged.
