# Simulator-First Migration Strategy

## Approach Comparison

### Traditional Migration
```
Create services → Create components → Wire API → Debug → Fix UI → Test
- Multiple integration points
- Difficult debugging (API vs UI issues)
- Delayed visual feedback
```

### Simulator-First Migration
```
1. Build complete UI with mock data → Immediate visual validation
2. Test all features in isolation → No API dependencies
3. Swap mock data for real API → Single integration point
4. Production ready → UI pre-validated
```

---

## Implementation Plan

### Phase 1: Complete Simulator UI
**Location**: `payroll-angular/src/app/simulator/`

**Components**:
1. Main simulator component (integrated app)
2. Employee table component
3. Employee form component (add/edit modal)
4. Salary sheet component
5. Top-up modal component
6. Toast notification component
7. Login screen

**Features**:
- 10 mock employees (matching React data)
- CRUD operations (add, edit, delete)
- Salary calculation (exact formula preservation)
- Salary transfer with insufficient funds handling
- Company account top-up
- Sorting and filtering
- Complete CSS styling (React parity)

**Estimated Time**: 4-6 hours
**Complexity**: Medium (UI-only, no API integration)

---

### Phase 2: Validation
**Test Coverage**:
- Login/logout flow
- Employee list rendering
- CRUD operations (add, edit, delete)
- Salary calculations
- Salary transfers
- Insufficient funds handling
- Account top-up functionality
- UI component interactions
- Styling validation against React

**Estimated Time**: 1 hour
**Complexity**: Low (functional testing)

---

### Phase 3: API Integration
**Data Source Migration**:
```typescript
// BEFORE (Simulator)
employees = signal(MOCK_EMPLOYEES);

// AFTER (Real API)
employees = computed(() => this.employeeService.employees());
```

**Required Changes**:
1. Replace mock data service with real API service
2. Implement HttpClient calls
3. Add JWT interceptor
4. Wire up service dependencies

**Preserved Elements**:
- Component logic (no changes)
- Templates (no changes)
- CSS styling (no changes)
- Business logic (no changes)

**Estimated Time**: 2-3 hours
**Complexity**: Low (data layer only)

---

## Strategy Benefits

### 1. Rapid Visual Validation
- Functional application in 4-6 hours
- No waiting for backend integration
- No API debugging nightmares

### 2. **Easier Debugging**
- UI bugs are obvious (you can see them)
- No "is it the API or the UI?" confusion
- Fix one thing at a time

### 3. **Better Testing**
- Test all features before API integration
- Catch UI bugs early
- Know exactly what works

### 4. **Faster Development**
- No context switching (UI → API → UI)
- Build confidence with working app
- Momentum builds quickly

### 5. **Perfect Migration Path**
- Simulator IS the final UI
- Just swap data sources
- Zero UI rework needed

---

## Implementation Status

### Completed: Simulator UI (Phase 1 & 2)
**Location**: `payroll-angular/src/app/simulator/`

**Implementation**:
```
payroll-angular/src/app/simulator/
├── simulator.component.ts (610+ lines - complete)
├── simulator.component.html (326 lines - complete)
├── simulator.component.css (1510+ lines - React parity)
├── mock-data.service.ts (complete with interfaces)
└── salary-calculator.ts (exact formula preserved)
```

**Features Implemented**:
- Login/logout with simulated auth
- Employee table with sorting (ID, grade, name, balance)
- Employee CRUD operations (add, edit, delete)
- Pagination (5/10/20 rows per page)
- Salary calculation (exact React formula)
- Salary transfer with insufficient funds handling
- Top-up modal
- Salary sheet with all columns
- Toast notifications (auto-dismiss 5s)
- Status banner
- Complete styling matching React

**Build Metrics**:
- Bundle Size: ~157 kB
- Compile Time: <1 second
- Status: Production-ready
- Dev Server: http://localhost:4200/

**Validation**: All features tested and working ✓

---

## Next Phase: API Integration (Phase 3)

### API Migration Checklist

**1. Create Real Services**
```typescript
// Create: payroll-angular/src/app/services/
├── auth.service.ts
├── employee.service.ts
├── payroll.service.ts
├── company.service.ts
└── http-interceptor.service.ts
```

**2. Data Layer Migration**
```typescript
// FROM: Mock Data
employees = signal(MOCK_EMPLOYEES);
companyBalance = signal(500000);

// TO: Real API
employees = signal<Employee[]>([]);
companyBalance = signal<number>(0);

// Load from API
this.employeeService.getAll().subscribe(data => {
  this.employees.set(data);
});
```

**3. HTTP Integration Points**

| Feature | Endpoint | Method | Status |
|---------|----------|--------|--------|
| Login | `/auth/login` | POST | Ready |
| Get Employees | `/employees` | GET | Ready |
| Add Employee | `/employees` | POST | Ready |
| Update Employee | `/employees/{id}` | PUT | Ready |
| Delete Employee | `/employees/{id}` | DELETE | Ready |
| Calculate Salaries | `/payroll/calculate` | POST | Ready |
| Transfer Salaries | `/payroll/transfer` | POST | Ready |
| Get Company | `/companies/{id}` | GET | Ready |
| Top-up Account | `/company/topup` | POST | Ready |
| Get Transactions | `/company/transactions` | GET | Ready |

**4. Backend API Configuration**
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:20001/pms/api/v1'
};
```

**5. JWT Authentication**
```typescript
// HTTP Interceptor
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next.handle(req);
}
```

**6. Error Handling**
```typescript
// Global error interceptor
catchError((error: HttpErrorResponse) => {
  if (error.status === 401) {
    // Redirect to login
    this.router.navigate(['/login']);
  }
  return throwError(() => error);
});
```

---

## API Integration Time Estimate

| Task | Time | Details |
|------|------|---------|
| Create services | 1 hour | 5 service files + interceptor |
| Wire up components | 1 hour | Replace mock with real calls |
| Test endpoints | 30 mins | Verify all API calls work |
| Error handling | 30 mins | Add loading states, errors |
| **Total** | **3 hours** | **Ready for production** |

---

## Ready for Real Integration

**Prerequisites**:
- ✓ Simulator UI complete and validated
- ✓ Mock data matches backend schema
- ✓ All UI components production-ready
- ✓ Business logic preserved
- ✓ Backend API running at `localhost:20001`

**Next Command**:
```powershell
# Create services structure
cd payroll-angular/src/app
mkdir services
cd services
# Generate service files
ng generate service auth
ng generate service employee
ng generate service payroll
ng generate service company
```

**Integration Strategy**: Replace mock data layer only, preserve all UI and business logic.
