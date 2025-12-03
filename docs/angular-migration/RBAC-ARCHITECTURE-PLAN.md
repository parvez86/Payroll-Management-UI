# RBAC Architecture Plan - Payroll Management System
**Project**: Angular Migration - Role-Based Access Control Implementation  
**Date**: November 30, 2025  
**Architect**: AI Development Agent  
**Status**: Design Phase

---

## Executive Summary

This document outlines the architecture for implementing role-based access control (RBAC) across three user roles: **ADMIN**, **EMPLOYER**, and **EMPLOYEE**. The system follows a hierarchical multi-tenant pattern where:

- **ADMIN** has system-wide access across all companies
- **EMPLOYER** has company-scoped access to their organization
- **EMPLOYEE** has self+downstream access within their reporting hierarchy

---

## 1. User Role Hierarchy & Permissions Matrix

### 1.1 Role Definitions

| Role | Scope | Description |
|------|-------|-------------|
| **ADMIN** | System-wide | Super admin with access to all companies, all employees, system-level operations |
| **EMPLOYER** | Company-scoped | Company owner/manager with access to own company data only |
| **EMPLOYEE** | Self+Downstream | Individual employee with access to own data and subordinates |

### 1.2 Permission Matrix

| Feature | ADMIN | EMPLOYER | EMPLOYEE |
|---------|-------|----------|----------|
| View all companies | ✅ | ❌ | ❌ |
| View own company | ✅ | ✅ | ✅ |
| Add/Edit/Delete employees | ✅ All | ✅ Own company | ❌ Read-only |
| Create payroll batch | ✅ | ✅ | ❌ |
| Process payroll | ✅ | ✅ | ❌ |
| View transactions | ✅ All | ✅ Own company | ✅ Self+downstream |
| Top-up account | ✅ System | ✅ Company | ❌ |

---

## 2. Component-Level Implementation Plan

### 2.1 Dashboard Component

**File**: `dashboard.component.ts`, `dashboard.component.html`

#### Current State
```typescript
// Header shows: "Company Balance" or "My Balance"
companyAccountBalance = signal(0);
isEmployee = signal(false);
```

#### Required Changes

**Balance Display Logic**:
```typescript
// New computed signals
userRole = computed(() => {
  const profile = this.getUserProfile();
  return profile?.user?.role || null;
});

balanceLabel = computed(() => {
  switch(this.userRole()) {
    case 'ADMIN': return 'System Balance';
    case 'EMPLOYER': return 'Company Balance';
    case 'EMPLOYEE': return 'My Balance';
    default: return 'Balance';
  }
});

balanceTooltip = computed(() => {
  switch(this.userRole()) {
    case 'ADMIN': return 'Total balance across all companies';
    case 'EMPLOYER': return 'Your company account balance';
    case 'EMPLOYEE': return 'Your personal account balance';
    default: return '';
  }
});
```

**Implementation Tasks**:
- [ ] Add `userRole` computed signal
- [ ] Add `balanceLabel` computed signal with role-based logic
- [ ] Update header template to use dynamic label
- [ ] Load appropriate balance based on role:
  - ADMIN: Sum of all company balances OR system account
  - EMPLOYER: Company main account balance
  - EMPLOYEE: Personal employee account balance

---

### 2.2 Employee List Component

**File**: `employee-list.component.ts`, `employee-list.component.html`

#### Current State
```typescript
// Shows all employees with pagination
// Add button hidden for EMPLOYEE
isEmployeeUser = computed(() => {...});
```

#### Required Changes

**Data Filtering by Role**:
```typescript
// Add role-based filtering
loadEmployees() {
  const role = this.getUserRole();
  const params = {
    status: this.statusFilter(),
    page: this.currentPage(),
    size: this.pageSize()
  };
  
  switch(role) {
    case 'ADMIN':
      // Load all employees across all companies
      this.employeeService.getAll(params).subscribe(...);
      break;
      
    case 'EMPLOYER':
      // Load only own company employees
      const companyId = this.getCompanyId();
      this.employeeService.getAll({...params, companyId}).subscribe(...);
      break;
      
    case 'EMPLOYEE':
      // Load only downstream employees (subordinates)
      const myEmployeeId = this.getEmployeeId();
      this.employeeService.getDownstream(myEmployeeId, params).subscribe(...);
      break;
  }
}
```

**Implementation Tasks**:
- [ ] Add `getUserRole()` helper method
- [ ] Update `loadEmployees()` with role-based filtering
- [ ] Add company filter dropdown for ADMIN (select company to view)
- [ ] Update API calls to include role-appropriate filters
- [ ] Add "Downstream Employees" label for EMPLOYEE role
- [ ] Handle empty state for EMPLOYEE with no subordinates

**API Requirements**:
- `GET /employees?companyId={id}` - For EMPLOYER
- `GET /employees/{id}/downstream` - For EMPLOYEE (new endpoint needed)

---

### 2.3 Payroll Process Component

**File**: `payroll-process.component.ts`, `payroll-process.component.html`

#### Current State
```typescript
// Processing controls hidden for EMPLOYEE
// Shows own + downstream totals for EMPLOYEE
isEmployeeUser = computed(() => {...});
ownTotalPaid/Unpaid = signal(0);
downstreamTotalPaid/Unpaid = signal(0);
```

#### Required Changes

**Salary Sheet Overview - Role-Based Cards**:

```typescript
// Define role-specific overview metrics
overviewMetrics = computed(() => {
  const role = this.userRole();
  const batch = this.batchData();
  
  switch(role) {
    case 'ADMIN':
      return [
        { label: 'Total Pay To Be', value: this.systemTotalPayable(), color: 'yellow' },
        { label: 'Total Paid', value: this.systemTotalPaid(), color: 'green' },
        { label: 'Companies Account Balance', value: this.companiesBalance(), color: 'purple' },
        { label: 'System Account Balance', value: this.systemBalance(), color: 'blue' }
      ];
      
    case 'EMPLOYER':
      return [
        { label: 'Total Pay To Be', value: batch?.totalAmount?.amount || 0, color: 'yellow' },
        { label: 'Total Paid', value: batch?.executedAmount?.amount || 0, color: 'green' },
        { label: 'Company Balance', value: this.companyBalance(), color: 'purple' }
      ];
      
    case 'EMPLOYEE':
      return [
        { label: 'My Pay To Be', value: this.ownTotalUnpaid(), color: 'yellow' },
        { label: 'My Total Paid', value: this.ownTotalPaid(), color: 'green' },
        { label: 'Downstream Pay To Be', value: this.downstreamTotalUnpaid(), color: 'yellow' },
        { label: 'Downstream Paid', value: this.downstreamTotalPaid(), color: 'green' }
      ];
  }
});
```

**Batch Info Synchronization**:
```typescript
// Ensure batch info stays in sync
loadLastBatch(companyId: string, employeeId?: string) {
  this.payrollService.getLastBatch(companyId).subscribe({
    next: (batch) => {
      // Set all batch fields atomically
      this.updateBatchInfo({
        batchId: batch.id,
        batchName: batch.name,
        batchStatus: batch.payrollStatus,
        payrollMonth: batch.payrollMonth,
        batchData: batch
      });
      
      // Load items
      this.loadBatchItems(batch.id, employeeId);
    }
  });
}

private updateBatchInfo(info: BatchInfo) {
  // Batch update to prevent UI flicker
  this.batchId.set(info.batchId || '');
  this.batchName.set(info.batchName || 'N/A');
  this.batchStatus.set(info.batchStatus || '');
  this.payrollMonth.set(info.payrollMonth || 'N/A');
  this.batchData.set(info.batchData);
}
```

**Implementation Tasks**:
- [ ] Add `overviewMetrics` computed with role-based logic
- [ ] Add ADMIN-specific signals: `systemTotalPayable`, `systemTotalPaid`, `companiesBalance`, `systemBalance`
- [ ] Update overview cards to render from `overviewMetrics` array
- [ ] Create `updateBatchInfo()` method for atomic batch updates
- [ ] Ensure employee list sync with batch items
- [ ] Add company filter for ADMIN payroll view

**API Requirements**:
- `GET /payroll/system/summary` - For ADMIN system-wide stats
- `GET /companies/total-balance` - For ADMIN aggregate balance

---

### 2.4 Company Account / My Account Component

**File**: `company-account.component.ts`, `company-account.component.html`

#### Current State
```typescript
// Shows company account info
// Top-up functionality for company
isEmployee = signal(false);
```

#### Required Changes

**Role-Based Account View**:

```typescript
accountViewConfig = computed(() => {
  const role = this.userRole();
  
  switch(role) {
    case 'ADMIN':
      return {
        title: '🏢 System & Companies Overview',
        showCompanySelector: true,
        showSystemStats: true,
        canTopUp: true,
        topUpLabel: 'Top Up System Account'
      };
      
    case 'EMPLOYER':
      return {
        title: '🏢 Company Account',
        showCompanySelector: false,
        showSystemStats: false,
        canTopUp: true,
        topUpLabel: 'Top Up Company Account'
      };
      
    case 'EMPLOYEE':
      return {
        title: '👤 My Account',
        showCompanySelector: false,
        showSystemStats: false,
        canTopUp: false,
        topUpLabel: null
      };
  }
});

loadAccountData() {
  const role = this.userRole();
  
  switch(role) {
    case 'ADMIN':
      // Load system account + all companies
      forkJoin({
        system: this.companyService.getSystemAccount(),
        companies: this.companyService.getAllCompanies()
      }).subscribe(...);
      break;
      
    case 'EMPLOYER':
      // Load own company account
      const companyId = this.getCompanyId();
      this.companyService.getCompany(companyId).subscribe(...);
      break;
      
    case 'EMPLOYEE':
      // Load own employee account
      const employeeId = this.getEmployeeId();
      this.employeeService.getById(employeeId).subscribe(...);
      break;
  }
}
```

**Implementation Tasks**:
- [ ] Add `accountViewConfig` computed
- [ ] Update template to use config for conditional rendering
- [ ] Add company selector dropdown for ADMIN
- [ ] Show system-level stats for ADMIN (total companies, total employees, total payroll processed)
- [ ] Show employee account details for EMPLOYEE (balance, account number, transactions)
- [ ] Rename component or create separate views based on role

---

### 2.5 Transactions Component

**File**: `transaction-list.component.ts`, `transaction-list.component.html`

#### Current State
```typescript
// Shows all transactions with filters
// Type, Category, Status, Date range, Account IDs, Batch ID
```

#### Required Changes

**Role-Based Transaction Filtering**:

```typescript
loadTransactions() {
  const role = this.userRole();
  const baseFilters = {
    type: this.typeFilter() !== 'ALL' ? this.typeFilter() : undefined,
    category: this.categoryFilter() !== 'ALL' ? this.categoryFilter() : undefined,
    status: this.statusFilter() !== 'ALL' ? this.statusFilter() : undefined,
    fromDate: this.fromDate(),
    toDate: this.toDate(),
    page: this.currentPage(),
    size: this.pageSize()
  };
  
  switch(role) {
    case 'ADMIN':
      // Show all transactions, add company filter
      const filters = {
        ...baseFilters,
        companyId: this.selectedCompanyId() // Optional filter
      };
      this.transactionService.getTransactions(filters).subscribe(...);
      break;
      
    case 'EMPLOYER':
      // Show only own company transactions
      const companyId = this.getCompanyId();
      this.transactionService.getTransactions({
        ...baseFilters,
        companyId
      }).subscribe(...);
      break;
      
    case 'EMPLOYEE':
      // Show only own + downstream transactions
      const employeeId = this.getEmployeeId();
      const accounts = await this.getEmployeeAccountIds(employeeId); // Own + downstream
      this.transactionService.getTransactions({
        ...baseFilters,
        accountIds: accounts // Filter by account IDs
      }).subscribe(...);
      break;
  }
}
```

**Implementation Tasks**:
- [ ] Add company filter dropdown for ADMIN
- [ ] Update filter panel with role-appropriate filters
- [ ] Add helper method `getEmployeeAccountIds()` for EMPLOYEE
- [ ] Show "My Transactions" label for EMPLOYEE
- [ ] Show "Company Transactions" label for EMPLOYER
- [ ] Show "All Transactions" label for ADMIN

---

## 3. Shared Services & Utilities

### 3.1 Auth/User Service Enhancement

**File**: `services/auth.service.ts` or new `services/user-context.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class UserContextService {
  private userProfile = signal<UserProfile | null>(null);
  
  userRole = computed(() => this.userProfile()?.user?.role || null);
  isAdmin = computed(() => this.userRole() === 'ADMIN');
  isEmployer = computed(() => this.userRole() === 'EMPLOYER');
  isEmployee = computed(() => this.userRole() === 'EMPLOYEE');
  
  companyId = computed(() => this.userProfile()?.companyId || null);
  employeeId = computed(() => this.userProfile()?.user?.id || null);
  
  constructor() {
    this.loadUserProfile();
  }
  
  private loadUserProfile() {
    if (typeof window === 'undefined') return;
    const str = window.localStorage.getItem('userProfile');
    if (str) {
      try {
        this.userProfile.set(JSON.parse(str));
      } catch (e) {
        console.error('Failed to parse user profile:', e);
      }
    }
  }
  
  // Helper methods
  canManageEmployees(): boolean {
    return this.isAdmin() || this.isEmployer();
  }
  
  canProcessPayroll(): boolean {
    return this.isAdmin() || this.isEmployer();
  }
  
  canTopUpAccount(): boolean {
    return this.isAdmin() || this.isEmployer();
  }
  
  getBalanceScope(): 'system' | 'company' | 'personal' {
    switch(this.userRole()) {
      case 'ADMIN': return 'system';
      case 'EMPLOYER': return 'company';
      case 'EMPLOYEE': return 'personal';
      default: return 'personal';
    }
  }
}
```

**Implementation Tasks**:
- [ ] Create `UserContextService` with role checks
- [ ] Inject into all components
- [ ] Replace inline role checks with service methods
- [ ] Add reactive updates when user profile changes

---

### 3.2 API Service Updates

**Required New Endpoints**:

| Endpoint | Method | Purpose | Role |
|----------|--------|---------|------|
| `/employees/{id}/downstream` | GET | Get subordinate employees | EMPLOYEE |
| `/payroll/system/summary` | GET | System-wide payroll stats | ADMIN |
| `/companies/total-balance` | GET | Aggregate company balances | ADMIN |
| `/transactions?accountIds=[]` | GET | Filter by multiple accounts | EMPLOYEE |
| `/accounts/system` | GET | System account details | ADMIN |

**Implementation Tasks**:
- [ ] Add methods to `EmployeeService`
- [ ] Add methods to `PayrollService`
- [ ] Add methods to `CompanyService`
- [ ] Add methods to `TransactionService`
- [ ] Update type definitions in `api.types.ts`

---

## 4. Data Flow Architecture

### 4.1 Role-Based Data Flow

```
User Login
    ↓
Store userProfile in localStorage
    ↓
UserContextService reads profile
    ↓
Components inject UserContextService
    ↓
Computed signals determine:
    - What data to load
    - What UI to show
    - What actions are allowed
    ↓
API calls include role-based filters
    ↓
Backend enforces authorization
    ↓
UI renders role-appropriate view
```

### 4.2 Batch Info Synchronization Pattern

**Problem**: Multiple signals (batchId, batchName, batchStatus, payrollMonth) can get out of sync

**Solution**: Atomic batch updates

```typescript
interface BatchInfo {
  batchId: string;
  batchName: string;
  batchStatus: string;
  payrollMonth: string;
  batchData: any;
}

// Single method to update all batch info
private updateBatchInfo(info: Partial<BatchInfo>) {
  batch(() => {
    if (info.batchId !== undefined) this.batchId.set(info.batchId);
    if (info.batchName !== undefined) this.batchName.set(info.batchName);
    if (info.batchStatus !== undefined) this.batchStatus.set(info.batchStatus);
    if (info.payrollMonth !== undefined) this.payrollMonth.set(info.payrollMonth);
    if (info.batchData !== undefined) this.batchData.set(info.batchData);
  });
}
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Priority: HIGH)
**Timeline**: 2-3 hours

- [ ] Create `UserContextService`
- [ ] Add role computed signals to all components
- [ ] Update Dashboard balance label logic
- [ ] Update Employee List with basic role filtering

### Phase 2: Component Updates (Priority: HIGH)
**Timeline**: 3-4 hours

- [ ] Update Payroll Process component with role-based overview
- [ ] Implement batch info synchronization
- [ ] Update Company/My Account component
- [ ] Update Transactions with role filters

### Phase 3: API Integration (Priority: MEDIUM)
**Timeline**: 2-3 hours

- [ ] Add new API endpoints to services
- [ ] Test with real backend
- [ ] Handle error cases
- [ ] Add loading states

### Phase 4: UI/UX Polish (Priority: LOW)
**Timeline**: 1-2 hours

- [ ] Add role indicators in header
- [ ] Improve empty states for each role
- [ ] Add tooltips explaining role-based views
- [ ] Test responsive design

### Phase 5: Testing & Documentation (Priority: MEDIUM)
**Timeline**: 2 hours

- [ ] Test all three roles thoroughly
- [ ] Document role-based features
- [ ] Update user guide
- [ ] Create role-based demo accounts

---

## 6. Security Considerations

### 6.1 Frontend Authorization

**What Frontend Should Do**:
- ✅ Hide/disable UI elements based on role
- ✅ Filter data on display
- ✅ Provide good UX based on permissions

**What Frontend Should NOT Do**:
- ❌ Be the sole authorization layer
- ❌ Trust client-side role checks for security

### 6.2 Backend Authorization Requirements

All API endpoints MUST enforce role-based access:

```typescript
// Example backend pseudo-code
@GetMapping("/employees")
public Response getEmployees(
  @RequestParam(required = false) String companyId,
  @AuthUser User currentUser
) {
  switch(currentUser.getRole()) {
    case ADMIN:
      return employeeService.getAllEmployees(companyId);
    case EMPLOYER:
      if (!currentUser.getCompanyId().equals(companyId)) {
        throw new ForbiddenException();
      }
      return employeeService.getByCompany(companyId);
    case EMPLOYEE:
      return employeeService.getDownstream(currentUser.getId());
    default:
      throw new UnauthorizedException();
  }
}
```

**Backend Security Checklist**:
- [ ] All endpoints verify user role
- [ ] Company-scoped endpoints verify company ownership
- [ ] Employee-scoped endpoints verify employee relationship
- [ ] Audit log all sensitive operations

---

## 7. Testing Strategy

### 7.1 Role-Based Test Scenarios

**Test User Accounts**:
```typescript
const TEST_USERS = {
  admin: { username: 'admin', password: 'admin123', role: 'ADMIN' },
  employer1: { username: 'employer1', password: 'pass123', role: 'EMPLOYER', companyId: 'company-1' },
  employer2: { username: 'employer2', password: 'pass123', role: 'EMPLOYER', companyId: 'company-2' },
  employee1: { username: 'employee1', password: 'pass123', role: 'EMPLOYEE', companyId: 'company-1' },
  employee2: { username: 'employee2', password: 'pass123', role: 'EMPLOYEE', companyId: 'company-1', supervisorId: 'employee1' }
};
```

### 7.2 Test Cases by Component

**Dashboard**:
- [ ] ADMIN sees "System Balance"
- [ ] EMPLOYER sees "Company Balance"
- [ ] EMPLOYEE sees "My Balance"
- [ ] Balance values are correct for each role

**Employee List**:
- [ ] ADMIN sees all employees from all companies
- [ ] EMPLOYER sees only own company employees
- [ ] EMPLOYEE sees only downstream employees
- [ ] Add button hidden for EMPLOYEE
- [ ] Actions disabled appropriately

**Payroll**:
- [ ] ADMIN sees system-wide stats
- [ ] EMPLOYER sees company stats
- [ ] EMPLOYEE sees personal + downstream stats
- [ ] Create/Process buttons hidden for EMPLOYEE

**My Account**:
- [ ] ADMIN sees system overview
- [ ] EMPLOYER sees company account
- [ ] EMPLOYEE sees personal account

**Transactions**:
- [ ] ADMIN can filter by company
- [ ] EMPLOYER sees only company transactions
- [ ] EMPLOYEE sees only personal + downstream

---

## 8. Migration Checklist

### 8.1 Code Changes

- [ ] Create `UserContextService`
- [ ] Update `dashboard.component.ts/html`
- [ ] Update `employee-list.component.ts/html`
- [ ] Update `payroll-process.component.ts/html`
- [ ] Update `company-account.component.ts/html`
- [ ] Update `transaction-list.component.ts/html`
- [ ] Add new API service methods
- [ ] Update type definitions

### 8.2 Backend Requirements

- [ ] Verify role-based authorization on all endpoints
- [ ] Add new endpoints for downstream employees
- [ ] Add system-level stats endpoints
- [ ] Test with all three roles

### 8.3 Documentation

- [ ] Update API documentation
- [ ] Create user role guide
- [ ] Update architecture diagrams
- [ ] Document permission matrix

---

## 9. Potential Challenges & Solutions

### Challenge 1: Performance with Large Datasets
**Issue**: ADMIN viewing all employees across many companies  
**Solution**: 
- Implement server-side pagination
- Add company filter for ADMIN to scope results
- Cache frequently accessed data

### Challenge 2: Downstream Employee Calculation
**Issue**: Determining subordinates in hierarchy  
**Solution**:
- Backend stores supervisor relationship
- API endpoint `/employees/{id}/downstream` handles traversal
- Consider materialized path or closure table pattern

### Challenge 3: Real-time Data Sync
**Issue**: Batch info getting out of sync between payroll and employee list  
**Solution**:
- Use Angular's `batch()` for atomic updates
- Single source of truth pattern
- Consider RxJS subjects for cross-component communication

### Challenge 4: Role Switching During Session
**Issue**: User role changes while logged in  
**Solution**:
- Listen for storage events
- Refresh user profile on certain actions
- Force re-login on role change

---

## 10. Future Enhancements

### 10.1 Advanced Features

- [ ] Multi-company support for EMPLOYER (franchise model)
- [ ] Department-level permissions
- [ ] Custom role creation (beyond 3 predefined)
- [ ] Delegation/proxy permissions
- [ ] Audit trail for all actions

### 10.2 UX Improvements

- [ ] Role switcher for ADMIN testing
- [ ] Onboarding tour for each role
- [ ] Contextual help based on role
- [ ] Dashboard customization per role

---

## 11. Success Metrics

**Functional Requirements**:
- ✅ All three roles can log in and see appropriate data
- ✅ No unauthorized access to data
- ✅ UI clearly indicates current role and scope
- ✅ Performance acceptable for large datasets

**Non-Functional Requirements**:
- ✅ Response time < 2s for all operations
- ✅ Zero authorization bypass bugs
- ✅ Code coverage > 80%
- ✅ Zero console errors in production

---

## Appendix A: API Endpoint Reference

### Current Endpoints (Already Implemented)
```
POST   /auth/login
GET    /auth/me
GET    /employees
POST   /employees
PUT    /employees/{id}
DELETE /employees/{id}
GET    /payroll/batches/{id}
POST   /payroll/batches
POST   /payroll/batches/{id}/process
GET    /companies/{id}
POST   /companies/{id}/topup
GET    /transactions
```

### New Endpoints (Required)
```
GET    /employees/{id}/downstream
GET    /payroll/system/summary
GET    /companies/total-balance
GET    /accounts/system
GET    /transactions?accountIds[]=...
```

---

## Appendix B: Component Dependency Graph

```
App Component
  └─ Dashboard Component
      ├─ Employee List Component
      │   └─ UserContextService (role checks)
      ├─ Payroll Process Component
      │   └─ UserContextService (role checks)
      ├─ Company Account Component
      │   └─ UserContextService (role checks)
      └─ Transaction List Component
          └─ UserContextService (role checks)
```

---

## Conclusion

This architecture provides a scalable, maintainable approach to role-based access control in the Payroll Management System. The design follows industry best practices:

1. **Separation of Concerns**: UserContextService handles all role logic
2. **DRY Principle**: Shared utilities prevent code duplication
3. **Single Source of Truth**: Batch info managed atomically
4. **Security in Depth**: Frontend + Backend authorization
5. **Testability**: Clear test scenarios for each role
6. **Scalability**: Ready for future role additions

**Next Step**: Begin Phase 1 implementation with UserContextService creation.

---

**Document Version**: 1.0  
**Last Updated**: November 30, 2025  
**Approved By**: [Pending Review]
