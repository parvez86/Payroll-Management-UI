# RBAC Implementation - Remaining Work (TODO)

**Date**: December 1, 2025  
**Current Status**: 75% Complete  
**Remaining Effort**: ~8-12 hours

---

## 🔴 CRITICAL (Security & Functionality)

### 1. Backend Authorization Enforcement (HIGHEST PRIORITY)
**Impact**: Security vulnerability - frontend checks can be bypassed  
**Effort**: Backend team - 4-6 hours

**Required Changes**:
```java
// Every endpoint needs role-based authorization
@GetMapping("/employees")
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER', 'EMPLOYEE')")
public ResponseEntity<?> getEmployees(
    @AuthenticationPrincipal User currentUser,
    @RequestParam(required = false) String companyId
) {
    if (currentUser.getRole() == Role.ADMIN) {
        // Return all employees, optionally filtered by companyId
        return ok(employeeService.findAll(companyId));
    } else if (currentUser.getRole() == Role.EMPLOYER) {
        // Verify user owns the company
        if (!currentUser.getCompanyId().equals(companyId)) {
            throw new ForbiddenException("Access denied");
        }
        return ok(employeeService.findByCompany(companyId));
    } else if (currentUser.getRole() == Role.EMPLOYEE) {
        // Return only downstream employees
        return ok(employeeService.findDownstream(currentUser.getId()));
    }
    throw new UnauthorizedException();
}
```

**Endpoints to Secure**:
- ✅ `/auth/*` - Already secured
- ❌ `/employees` - Needs role checks
- ❌ `/employees/{id}` - Verify ownership/access
- ❌ `/payroll/*` - Restrict to ADMIN/EMPLOYER
- ❌ `/companies/{id}` - Verify ownership
- ❌ `/transactions` - Filter by role
- ❌ `/companies/{id}/topup` - ADMIN/EMPLOYER only

---

### 2. Backend Endpoints for EMPLOYEE Downstream
**Impact**: Performance issue - client-side filtering is slow  
**Effort**: Backend team - 2-3 hours

**New Endpoint Needed**:
```java
@GetMapping("/employees/{id}/downstream")
@PreAuthorize("hasRole('EMPLOYEE')")
public ResponseEntity<?> getDownstreamEmployees(
    @PathVariable String id,
    @AuthenticationPrincipal User currentUser,
    @PageableDefault Pageable pageable
) {
    // Verify user is requesting their own downstream
    if (!currentUser.getId().equals(id)) {
        throw new ForbiddenException();
    }
    
    // Get employee's grade rank
    Employee employee = employeeService.findById(id);
    int gradeRank = employee.getGrade().getRank();
    
    // Find all employees with higher grade rank (subordinates)
    Page<Employee> downstream = employeeService.findByCompanyAndGradeRankGreaterThan(
        employee.getCompany().getId(),
        gradeRank,
        pageable
    );
    
    return ok(downstream);
}
```

**Repository Method**:
```java
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {
    Page<Employee> findByCompanyIdAndGradeRankGreaterThan(
        String companyId, 
        int gradeRank, 
        Pageable pageable
    );
}
```

---

### 3. Backend Transaction Filtering
**Impact**: Security - EMPLOYEE can see all transactions  
**Effort**: Backend team - 2-3 hours

**Update Transaction Controller**:
```java
@GetMapping("/transactions")
public ResponseEntity<?> getTransactions(
    @AuthenticationPrincipal User currentUser,
    @RequestParam(required = false) String companyId,
    @RequestParam(required = false) List<String> accountIds,
    // ... other filters
) {
    if (currentUser.getRole() == Role.ADMIN) {
        // Return all, optionally filtered by companyId
        return ok(transactionService.findAll(filters));
    } else if (currentUser.getRole() == Role.EMPLOYER) {
        // Force filter by user's company
        filters.setCompanyId(currentUser.getCompanyId());
        return ok(transactionService.findByCompany(filters));
    } else if (currentUser.getRole() == Role.EMPLOYEE) {
        // Get account IDs for user + downstream
        List<String> allowedAccountIds = transactionService.getEmployeeAccountIds(currentUser.getId());
        filters.setAccountIds(allowedAccountIds);
        return ok(transactionService.findByAccountIds(filters));
    }
}
```

---

### 4. Backend System-Level Endpoints for ADMIN
**Impact**: ADMIN sees wrong data (first company instead of system)  
**Effort**: Backend team - 3-4 hours

**New Endpoints**:
```java
// System-wide payroll summary
@GetMapping("/payroll/system/summary")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> getSystemSummary() {
    return ok(Map.of(
        "totalCompanies", companyService.countAll(),
        "totalEmployees", employeeService.countAll(),
        "totalPayrollProcessed", payrollService.sumAllProcessed(),
        "totalPending", payrollService.sumAllPending()
    ));
}

// Aggregate company balances
@GetMapping("/companies/total-balance")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> getTotalBalance() {
    BigDecimal total = companyService.sumAllBalances();
    return ok(Map.of("totalBalance", total));
}

// System account
@GetMapping("/accounts/system")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> getSystemAccount() {
    return ok(accountService.getSystemAccount());
}
```

---

## 🟡 HIGH PRIORITY (UX)

### 5. Company Selector for ADMIN
**Impact**: ADMIN can't switch between companies  
**Effort**: Frontend - 2 hours

**Implementation**:
```typescript
// In dashboard.component.ts, employee-list.component.ts, etc.
companies = signal<Company[]>([]);
selectedCompanyId = signal<string>('');

loadCompanies() {
  if (this.userContext.isAdmin()) {
    this.companyService.getAllCompanies().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        if (companies.length > 0) {
          this.selectedCompanyId.set(companies[0].id);
        }
      }
    });
  }
}

onCompanyChange(companyId: string) {
  this.selectedCompanyId.set(companyId);
  this.loadData(); // Reload with new company filter
}
```

**Template**:
```html
@if (userContext.isAdmin()) {
  <div class="company-selector">
    <label>🏢 Select Company:</label>
    <select [(ngModel)]="selectedCompanyId" (change)="onCompanyChange($event.target.value)">
      <option value="">All Companies</option>
      @for (company of companies(); track company.id) {
        <option [value]="company.id">{{ company.name }}</option>
      }
    </select>
  </div>
}
```

**Add to**:
- ✅ Dashboard (header dropdown)
- ✅ Employee List (filter section)
- ✅ Payroll Process (above batch info)
- ✅ Company Account (can switch companies)
- ✅ Transactions (filter section)

---

### 6. Empty States
**Impact**: Confusing UX when no data  
**Effort**: Frontend - 1 hour

**Employee List** (when EMPLOYEE has no subordinates):
```html
@if (employees().length === 0 && !loading() && isEmployee()) {
  <div class="empty-state">
    <div class="empty-icon">👥</div>
    <h3>No Team Members</h3>
    <p>You don't have any downstream employees yet.</p>
    <p class="hint">As you get promoted or employees join under you, they'll appear here.</p>
  </div>
}
```

**Transactions** (when no transactions found):
```html
@if (transactions().length === 0 && !loading()) {
  <div class="empty-state">
    <div class="empty-icon">💳</div>
    <h3>No Transactions Found</h3>
    <p>There are no transactions matching your current filters.</p>
    @if (isEmployee()) {
      <p class="hint">You can only view your own transactions and those of your team members.</p>
    }
    <button (click)="resetFilters()" class="btn-secondary">Reset Filters</button>
  </div>
}
```

**Payroll** (when no batch exists):
```html
@if (!batchData() && !loading()) {
  <div class="empty-state">
    <div class="empty-icon">💰</div>
    <h3>No Payroll Batch</h3>
    @if (canProcessPayroll()) {
      <p>Create a new payroll batch to start processing salaries.</p>
      <button (click)="calculateSalaries()" class="btn-primary">Create Payroll Batch</button>
    } @else {
      <p>No payroll has been processed yet. Check back later.</p>
    }
  </div>
}
```

---

### 7. Role-Based Help Text
**Impact**: Users don't understand role restrictions  
**Effort**: Frontend - 1 hour

**Add info tooltips**:
```html
<!-- Dashboard header -->
@if (userContext.userRole()) {
  <div class="role-info" [title]="getRoleDescription()">
    <span class="icon">ℹ️</span>
    <span class="text">{{ getRoleDescription() }}</span>
  </div>
}
```

**Component**:
```typescript
getRoleDescription(): string {
  switch(this.userContext.userRole()) {
    case 'ADMIN':
      return 'You have system-wide access to all companies and employees';
    case 'EMPLOYER':
      return 'You can manage your company employees and process payroll';
    case 'EMPLOYEE':
      return 'You can view your salary info and your team members';
    default:
      return '';
  }
}
```

---

## 🟢 MEDIUM PRIORITY (Polish)

### 8. Loading States for Role-Based Data
**Impact**: No feedback during role-based loads  
**Effort**: Frontend - 30 minutes

**Pattern**:
```html
@if (loading()) {
  <app-loading-spinner [message]="getLoadingMessage()"></app-loading-spinner>
}

<!-- Component -->
getLoadingMessage(): string {
  const role = this.userContext.userRole();
  if (role === 'ADMIN') return 'Loading system-wide data...';
  if (role === 'EMPLOYER') return 'Loading company data...';
  if (role === 'EMPLOYEE') return 'Loading your data...';
  return 'Loading...';
}
```

---

### 9. Error Handling for Role-Based Operations
**Impact**: Generic errors don't explain role restrictions  
**Effort**: Frontend - 1 hour

**Example**:
```typescript
.catch(error => {
  if (error.status === 403) {
    const role = this.userContext.userRole();
    if (role === 'EMPLOYEE') {
      this.message.set('❌ Access denied. Employees can only view their own data.');
    } else if (role === 'EMPLOYER') {
      this.message.set('❌ Access denied. You can only access your company data.');
    } else {
      this.message.set('❌ Access denied.');
    }
  } else {
    this.message.set('❌ Failed to load data. Please try again.');
  }
});
```

---

### 10. Refresh on Role Change
**Impact**: UI doesn't update if role changes mid-session  
**Effort**: Frontend - 1 hour

**UserContextService**:
```typescript
// Listen for storage events (if another tab changes role)
constructor() {
  this.loadUserProfile();
  
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === 'userProfile') {
        this.refreshProfile();
        console.log('🔄 User profile changed, refreshing...');
      }
    });
  }
}
```

---

## 🔵 LOW PRIORITY (Nice-to-Have)

### 11. Role Switcher for Testing (ADMIN only)
**Impact**: Makes testing easier  
**Effort**: Frontend - 2 hours

```html
@if (userContext.isAdmin()) {
  <div class="role-switcher">
    <label>🎭 Test as:</label>
    <select [(ngModel)]="testRole" (change)="switchTestRole()">
      <option value="ADMIN">Admin</option>
      <option value="EMPLOYER">Employer</option>
      <option value="EMPLOYEE">Employee</option>
    </select>
  </div>
}
```

---

### 12. Audit Logging
**Impact**: No tracking of who accessed what  
**Effort**: Backend - 4 hours

**Add to all sensitive endpoints**:
```java
@PostMapping("/payroll/process")
public ResponseEntity<?> processPayroll(@AuthenticationPrincipal User user) {
    auditService.log(
        user.getId(),
        "PAYROLL_PROCESS",
        "User processed payroll batch",
        Map.of("batchId", batchId)
    );
    // ... process payroll
}
```

---

### 13. Advanced Permissions (Department-Level)
**Impact**: More granular control  
**Effort**: Backend + Frontend - 8+ hours

**Not needed for v1**, but future consideration:
- Department-level permissions
- Custom role creation
- Delegation/proxy permissions

---

### 14. Performance Optimization
**Impact**: Slow loading for large datasets  
**Effort**: Backend + Frontend - 4 hours

**Backend**:
- Add indexes on `companyId`, `gradeRank`, `role` columns
- Implement query pagination properly
- Cache frequently accessed data (company list, grade list)

**Frontend**:
- Virtual scrolling for large lists
- Lazy loading for tabs
- Debounce filter inputs

---

### 15. Internationalization (i18n)
**Impact**: Only English supported  
**Effort**: Frontend - 6 hours

**Extract all hardcoded text**:
```typescript
// Instead of:
'System Balance'

// Use:
translate('dashboard.balance.system')
```

---

## 📊 Priority Matrix

| Priority | Item | Effort | Impact | Who |
|----------|------|--------|--------|-----|
| 🔴 CRITICAL | Backend Authorization | 4-6h | High | Backend |
| 🔴 CRITICAL | Downstream Endpoint | 2-3h | High | Backend |
| 🔴 CRITICAL | Transaction Filtering | 2-3h | High | Backend |
| 🔴 CRITICAL | System Endpoints | 3-4h | Medium | Backend |
| 🟡 HIGH | Company Selector | 2h | High | Frontend |
| 🟡 HIGH | Empty States | 1h | Medium | Frontend |
| 🟡 HIGH | Help Text | 1h | Medium | Frontend |
| 🟢 MEDIUM | Loading States | 30m | Low | Frontend |
| 🟢 MEDIUM | Error Handling | 1h | Low | Frontend |
| 🟢 MEDIUM | Refresh on Change | 1h | Low | Frontend |
| 🔵 LOW | Role Switcher | 2h | Low | Frontend |
| 🔵 LOW | Audit Logging | 4h | Low | Backend |
| 🔵 LOW | Advanced Permissions | 8h+ | Low | Both |
| 🔵 LOW | Performance | 4h | Low | Both |
| 🔵 LOW | i18n | 6h | Low | Frontend |

---

## 🎯 Recommended Implementation Order

### Sprint 1 (Week 1) - CRITICAL SECURITY
1. Backend Authorization (Day 1-2)
2. Downstream Endpoint (Day 2)
3. Transaction Filtering (Day 3)
4. Test all three roles thoroughly (Day 4-5)

### Sprint 2 (Week 2) - UX IMPROVEMENTS
5. System Endpoints for ADMIN (Day 1-2)
6. Company Selector (Day 2-3)
7. Empty States (Day 3)
8. Help Text (Day 4)
9. Testing & Bug Fixes (Day 5)

### Sprint 3 (Week 3) - POLISH
10. Loading States (Day 1)
11. Error Handling (Day 1)
12. Refresh on Change (Day 2)
13. Final testing with real users (Day 3-5)

### Future Sprints - ENHANCEMENTS
- Role Switcher
- Audit Logging
- Performance
- i18n

---

## ✅ Completion Criteria

**Before Production**:
- [ ] All CRITICAL items complete
- [ ] All HIGH priority items complete
- [ ] Backend authorization on ALL endpoints
- [ ] Tested with 3 real user accounts (ADMIN, EMPLOYER, EMPLOYEE)
- [ ] No console errors
- [ ] Security audit passed
- [ ] Performance acceptable (< 2s load times)

**Post-Production**:
- [ ] MEDIUM priority items
- [ ] User feedback collected
- [ ] Bug fixes
- [ ] LOW priority nice-to-haves

---

**Total Remaining Effort**: ~12-16 hours (split between Frontend and Backend)  
**Current Progress**: 75% Complete  
**Target Completion**: Sprint 2 (2 weeks)

