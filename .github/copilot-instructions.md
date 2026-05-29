# Payroll Management System - React Frontend Developer Guide

## 🎯 Project Overview

**React application** for a Payroll Management System with grade-based salary calculations and role-based access control.

**Status**: ✅ Production Ready (90-95% complete)

**Backend**: Spring Boot 3.5.6 at `http://localhost:20001/pms/api/v1` (separate repo)

---

## 🛠️ Development Workflow

### Quick Start
```powershell
# Install dependencies (first time)
npm install

# Start development server
npm run dev    # http://localhost:5173
```

**Credentials**: `admin` / `admin123`

### API Mode Switching
Toggle in `src/config/index.ts`:
```typescript
USE_MOCK_API: false  // Real backend (localhost:20001)
USE_MOCK_API: true   // Mock data (offline development)
```

### Build & Production
```powershell
npm run build       # Production build
npm run lint        # ESLint check
```

---

## ⚠️ Critical Business Rules (FIXED - DO NOT MODIFY)

1. **Salary Calculation** - Use only `src/utils/salaryCalculator.ts`
   - Formula: `Basic = Grade6Base + (6 - Grade) × 5,000 BDT`
   - House Rent: 20% of Basic
   - Medical: 15% of Basic
   - Gross = Basic + Rent + Medical

2. **Employee Constraints**
   - Total: 10 employees (fixed)
   - Grade distribution: 1(1), 2(1), 3(2), 4(2), 5(2), 6(2)
   - Employee ID: 4-digit unique, validated by `validateEmployeeId()`
   - Grade validation: Use `validateGradeDistribution()`

3. **API Response Format** - All endpoints return:
   ```json
   {
     "success": true,
     "message": "Operation successful",
     "data": { /* actual data */ }
   }
   ```
   **Always check `success` before accessing `data`**

---

## 🏗️ Architecture & Data Flow

### State Management (Context API, NO Redux)
```typescript
// Example usage
const { user, login, logout } = useAuth();
const { employees, createEmployee } = useEmployeeContext();
const { status, showMessage } = useStatusMessage();
```

**Key Contexts**:
- `AuthContext` - Authentication & user profile
- `EmployeeContext` - Employee list & CRUD operations
- `CompanyContext` - Company accounts & transactions
- `StatusMessageContext` - Toast notifications

### API Integration
**File**: `src/services/api.ts`
- Dynamic mock/real API switching
- Axios-based HTTP client
- JWT auto-injection via interceptors
- Error handling with retry logic

### Component Structure
```
src/components/
├── auth/              → Login, ProtectedRoute
├── employee/          → EmployeeList, EmployeeForm, EmployeeDetails
├── payroll/           → PayrollProcess (calculate + transfer)
├── company/           → CompanyAccount (balance, top-up, history)
└── shared/            → UI components (Button, Modal, Table)
```

---

## 🔌 API Integration

**Base URL**: `http://localhost:20001/pms/api/v1`

**Authentication**: JWT Bearer token (except `/auth/login`)
- Token stored in `localStorage` as `accessToken`
- Auto-injected in request headers via interceptor

### Key Endpoints
```
POST   /auth/login              # Login → JWT + refreshToken
GET    /auth/me                 # User profile + company context
GET    /employees               # List employees (filtered by role)
POST   /employees               # Create employee
PUT    /employees/{id}          # Update employee
DELETE /employees/{id}          # Delete employee
POST   /payroll/calculate       # Calculate salaries
POST   /payroll/transfer        # Batch salary transfer
GET    /companies/{id}          # Get company account
POST   /company/topup           # Top up company account
GET    /company/transactions    # Transaction history
```

See [docs/api-documentation.md](docs/api-documentation.md) for complete details.

---

## 📂 Project Structure & Key Files

| Path | Purpose |
|------|---------|
| `src/utils/salaryCalculator.ts` | **CRITICAL** - Salary calculation logic (DO NOT MODIFY) |
| `src/config/index.ts` | Business rules, employee constraints, API mode toggle |
| `src/services/api.ts` | API integration with mock/real switching |
| `src/contexts/` | Context providers (Auth, Employee, Company, Status) |
| `src/components/` | React components (modular & reusable) |
| `src/types/index.ts` | TypeScript interfaces (match API contracts) |
| `src/mocks/mockAPI.ts` | Mock data for offline development |
| `docs/` | API docs, implementation status |

---

## 💻 React Development Patterns

### State Management with Context
```typescript
// Create context with reducer
const { user, dispatch, isLoading } = useAuth();

// Use hooks in components
const { employees, addEmployee } = useEmployeeContext();
```

### Handling API Responses
```typescript
// ✅ CORRECT - Always check success
if (response.data.success) {
  console.log(response.data.data);
} else {
  console.error(response.data.message);
}

// ❌ WRONG - Never skip success check
const { data } = response.data; // Could be undefined if success=false
```

### Error Handling
```typescript
try {
  const result = await api.post('/employees', employeeData);
  if (result.data.success) {
    showMessage('Employee created', 'success');
  }
} catch (error) {
  showMessage('Failed to create employee', 'error');
}
```

---

## ⚠️ Common Pitfalls (DO NOT DO THESE)

1. ❌ **Modifying salary calculation** - Never touch `salaryCalculator.ts` directly
2. ❌ **Skipping success check** - Always verify `response.success` before using `data`
3. ❌ **Hardcoding API URLs** - Use `USE_MOCK_API` config instead
4. ❌ **Duplicating business logic** - Import from `utils/`, don't rewrite
5. ❌ **Forgetting JWT token** - Interceptor handles it, but verify in Network tab
6. ❌ **Using Redux** - Project uses Context API only
7. ❌ **Not validating employee constraints** - Use `validateGradeDistribution()` and `validateEmployeeId()`
8. ❌ **Mock/Real API confusion** - Check `USE_MOCK_API` setting when debugging

---

## 🧪 Testing & Debugging

### Integration Tests
Use `src/utils/integrationTester.ts` for manual API verification.

### Mock API Development
1. Set `USE_MOCK_API: true` in `src/config/index.ts`
2. No backend required
3. Pre-loaded with 10 employees
4. Full feature parity with real API

### Real Backend Testing
1. Set `USE_MOCK_API: false` in `src/config/index.ts`
2. Start backend at `localhost:20001`
3. Verify JWT token in `localStorage`
4. Check Network tab for API requests

### Debug Logging
- Interceptors log all API calls in development
- Use browser DevTools Console for context/state inspection
- Redux DevTools alternative: Check context values in component

---

## 📚 Documentation References

- [README.md](../README.md) - Project overview
- [QUICK_START.md](../QUICK_START.md) - Quick reference
- [docs/api-documentation.md](../docs/api-documentation.md) - API endpoints
- [docs/IMPLEMENTATION_STATUS.md](../docs/IMPLEMENTATION_STATUS.md) - Feature tracking
- [docs/](../docs/) - React-specific docs

---

## 💡 When Making Changes

1. **Read existing documentation first** - Check `docs/` before implementing
2. **Preserve business logic** - Salary calculations & validations are finalized
3. **Test with both API modes** - Verify changes work with mock and real backend
4. **Update types** - Keep `src/types/index.ts` in sync with API contracts
5. **Follow React patterns** - Use Context API, no Redux
6. **Validate inputs** - Use validators from `src/utils/`
7. **Check references** - See existing components for patterns
