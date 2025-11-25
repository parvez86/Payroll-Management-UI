# Angular Payroll - Complete Separation of Simulator & Real Backend

**Date**: November 24, 2025  
**Status**: ✅ COMPLETE & CORRECTLY SEPARATED

---

## ✅ FIXED: COMPLETE SEPARATION

### 1. **Simulator Component** = Pure Prototype (NO Backend)
**Location**: `src/app/simulator/simulator.component.ts`

**Characteristics**:
- ✅ **ZERO backend API calls**
- ✅ Pure client-side state management
- ✅ Mock data loaded from `MockDataService`
- ✅ Simulated login (no JWT, no /auth/login call)
- ✅ Client-side salary calculations
- ✅ In-memory employee CRUD
- ✅ Local balance management

**Use Case**: Demo, prototype, offline testing without backend

### 2. **Real-Backend Component** = Full API Integration
**Location**: `src/app/real-backend.component.ts`

**Characteristics**:
- ✅ Complete backend API integration
- ✅ Real JWT authentication
- ✅ `/auth/login` → `/auth/me` flow
- ✅ All CRUD calls backend services
- ✅ Real salary calculation via API
- ✅ Real salary transfer via API
- ✅ Real company account management

**Use Case**: Production with backend at `http://localhost:20001`

---

## 📊 COMPARISON

| Feature | Simulator | Real-Backend |
|---------|-----------|--------------|
| **Backend Calls** | ❌ ZERO | ✅ All operations |
| **Authentication** | Simulated | Real JWT |
| **Data Source** | MockDataService | API Services |
| **Employee CRUD** | In-memory array | POST/PUT/DELETE /employees |
| **Salary Calc** | Client-side function | POST /payroll/calculate |
| **Salary Transfer** | Local state update | POST /payroll/transfer |
| **Company Balance** | Local variable | GET /companies/{id} |
| **Top-up** | Local addition | POST /company/topup |
| **Employee Type** | `bankAccount` property | `account: BankAccount` property |

---

## 🚀 USAGE

### To Use Simulator (Prototype):
```typescript
// app.ts
import { SimulatorComponent } from './simulator/simulator.component';

@Component({
  imports: [SimulatorComponent]
})
export class App {}
```

```html
<!-- app.html -->
<app-simulator></app-simulator>
```

**No backend required!** Everything works in-memory.

### To Use Real Backend (Production):
```typescript
// app.ts
import { RealBackendComponent } from './real-backend.component';

@Component({
  imports: [RealBackendComponent]
})
export class App {}
```

```html
<!-- app.html -->
<app-real-backend></app-real-backend>
```

**Backend required**: Spring Boot at `http://localhost:20001`

---

## 🔍 KEY DIFFERENCES IN CODE

### Simulator - Login (NO API)
```typescript
handleLogin(event: Event): void {
  event.preventDefault();
  this.message.set('✅ Login successful. Simulating JWT authorization.');
  this.isLoggedIn.set(true);  // Just set state, NO API call
}
```

### Real-Backend - Login (WITH API)
```typescript
handleLogin(event: Event): void {
  event.preventDefault();
  this.authService.login(credentials).subscribe({
    next: (response) => {
      this.userProfile.set(response.user);
      this.isLoggedIn.set(true);
      this.loadInitialData();  // Load from API
    }
  });
}
```

---

### Simulator - Calculate Salaries (NO API)
```typescript
calculateSalaries(): void {
  // Pure client-side calculation
  const updatedEmployees = this.employees().map(emp => {
    const basic = this.basicSalariesByGrade()[emp.grade];
    const salaryDetails = calculateTotalSalary(basic);  // Local function
    return { ...emp, salary: salaryDetails };
  });
  this.employees.set(updatedEmployees);  // Update local state
}
```

### Real-Backend - Calculate Salaries (WITH API)
```typescript
calculateSalaries(): void {
  this.payrollService.calculateSalaries(this.grade6Basic()).subscribe({
    next: (response) => {
      const batch = response.data;
      // Map API response to local state
      this.employees.set(mapEmployees(batch.employees));
    }
  });
}
```

---

### Simulator - Save Employee (NO API)
```typescript
handleSaveEmployee(): void {
  const data = this.formData();
  if (this.editEmployee()) {
    // Update in-memory array
    const updated = this.employees().map(emp => 
      emp.id === data.id ? data : emp
    );
    this.employees.set(updated);
  } else {
    // Add to in-memory array
    this.employees.set([...this.employees(), data]);
  }
}
```

### Real-Backend - Save Employee (WITH API)
```typescript
handleSaveEmployee(): void {
  const data = this.formData();
  if (this.editEmployee()) {
    // Call API to update
    this.employeeService.update(data.id, data).subscribe({
      next: (response) => {
        this.loadEmployees();  // Reload from API
      }
    });
  } else {
    // Call API to create
    this.employeeService.create(data).subscribe({
      next: (response) => {
        this.loadEmployees();  // Reload from API
      }
    });
  }
}
```

---

## 📁 FILE ORGANIZATION

```
src/app/
├── simulator/                        # Pure prototype (NO backend)
│   ├── simulator.component.ts        ✅ ZERO API calls
│   ├── simulator.component.html      ✅ Uses bankAccount
│   ├── simulator.component.css       
│   ├── mock-data.service.ts          ✅ Static mock data
│   └── salary-calculator.ts          ✅ Client-side calculations
│
├── real-backend.component.ts         ✅ Full API integration
├── real-backend.component.html       ✅ Uses account (BankAccount)
├── real-backend.component.css        
│
├── services/                         # Real API services
│   ├── auth.service.ts               ✅ POST /auth/login, GET /auth/me
│   ├── employee.service.ts           ✅ CRUD /employees
│   ├── payroll.service.ts            ✅ POST /payroll/calculate, /transfer
│   └── company.service.ts            ✅ GET /companies, POST /topup
│
├── models/
│   └── api.types.ts                  ✅ Real API types
│
└── interceptors/
    └── auth.interceptor.ts           ✅ JWT injection
```

---

## ✅ VERIFICATION

### Simulator (NO Backend Calls)
- [x] Login: No `/auth/login` call in Network tab
- [x] Employees: Loaded from `MockDataService`, not API
- [x] Calculate: Client-side math, no `/payroll/calculate` call
- [x] Transfer: Local state update, no `/payroll/transfer` call
- [x] CRUD: In-memory array manipulation, no POST/PUT/DELETE
- [x] Works offline without backend

### Real-Backend (WITH Backend Calls)
- [x] Login: POST `/auth/login` → GET `/auth/me` in Network tab
- [x] Employees: GET `/employees` call
- [x] Calculate: POST `/payroll/calculate` call
- [x] Transfer: POST `/payroll/transfer` call
- [x] CRUD: POST/PUT/DELETE `/employees/{id}` calls
- [x] Requires backend at `http://localhost:20001`

---

## 🎯 SUMMARY

✅ **Simulator**: 100% pure client-side, NO backend integration  
✅ **Real-Backend**: 100% API-driven, full backend integration  
✅ **Completely decoupled**: Switch in `app.ts` only  
✅ **No interference**: Separate templates, separate data types  
✅ **Clear use cases**: Prototype vs Production  

**Ready for deployment!** 🎉
