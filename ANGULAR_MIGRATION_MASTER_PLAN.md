# 🚀 Angular Migration Master Plan - React to Angular Complete Replication

**Project**: Payroll Management System  
**Source**: `payroll-frontend` (React 19 + TypeScript + Vite)  
**Target**: `payroll-angular-new` (Angular 21 + Standalone Components + Signals)  
**Migration Date**: November 23, 2025  
**Completion Target**: One-shot migration without issues  

---

## 📊 Executive Summary

This plan provides a **step-by-step, fail-proof migration strategy** to replicate the complete React frontend in Angular. Every component, service, route, style, and business logic will be mapped 1:1 with Angular equivalents using modern Angular 21 patterns.

### Success Criteria
- ✅ 100% feature parity with React frontend
- ✅ All 95% completed features working identically
- ✅ Same API integration (real + mock modes)
- ✅ Identical UI/UX and styling
- ✅ Zero business logic changes
- ✅ Production-ready on completion

---

## 🏗️ Architecture Mapping

### React → Angular Pattern Translation

| **React Pattern** | **Angular Equivalent** | **Implementation** |
|-------------------|------------------------|-------------------|
| `React.createContext()` + `useContext()` | Injectable Services with Signals | `@Injectable({ providedIn: 'root' })` + `signal()` |
| `useReducer()` | Signal state with `update()` | `state = signal(initialState); state.update()` |
| `useState()` | `signal()` | `const count = signal(0)` |
| `useEffect()` | `effect()` or lifecycle hooks | `effect(() => {...})` or `ngOnInit()` |
| `useMemo()` | `computed()` | `computed(() => ...)` |
| `useCallback()` | Regular methods (memoization not needed) | Class methods in services/components |
| React Router | Angular Router | `@angular/router` with `Routes` |
| Axios interceptors | HTTP Interceptors | `HttpInterceptor` with `HttpClient` |
| Context Providers | Service injection | Automatic via DI |
| Props | `input()` | `name = input<string>()` |
| Callbacks | `output()` | `onClick = output<void>()` |

---

## 📁 Complete Component Mapping

### 1. **Authentication Components**

#### Login Component (`auth/Login.tsx` → `auth/login.component.ts`)

**React Structure**:
```tsx
- useState for credentials, isSubmitting
- useAuth hook for login, error, clearError
- useNavigate for routing
- Form submission with validation
```

**Angular Translation**:
```typescript
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  credentials = signal({ username: '', password: '' });
  isSubmitting = signal(false);
  error = computed(() => this.authService.error());
  
  async onSubmit() {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.authService.clearError();
    
    try {
      await this.authService.login(this.credentials());
      this.router.navigate(['/']);
    } catch (error) {
      // Handled by service
    } finally {
      this.isSubmitting.set(false);
    }
  }
  
  updateCredentials(field: string, value: string) {
    this.credentials.update(c => ({ ...c, [field]: value }));
  }
}
```

**Template** (`login.component.html`):
```html
<div class="login-container">
  <div class="login-card">
    <h2>Payroll Management System</h2>
    <form (ngSubmit)="onSubmit()" class="login-form">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" 
               [value]="credentials().username"
               (input)="updateCredentials('username', $any($event.target).value)"
               [disabled]="isSubmitting()" required>
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password"
               [value]="credentials().password"
               (input)="updateCredentials('password', $any($event.target).value)"
               [disabled]="isSubmitting()" required>
      </div>
      
      @if (error()) {
        <div class="error-message">{{ error() }}</div>
      }
      
      <button type="submit" class="login-btn" [disabled]="isSubmitting()">
        {{ isSubmitting() ? 'Logging in...' : 'Login' }}
      </button>
    </form>
    
    <div class="demo-credentials">
      <p><strong>Demo Credentials:</strong></p>
      <p>Username: admin | Password: admin123</p>
    </div>
  </div>
</div>
```

#### Protected Route (`ProtectedRoute.tsx` → Route Guard)

**React**: Component wrapper checking auth state  
**Angular**: `AuthGuard` using `CanActivateFn`

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
```

---

### 2. **Employee Management Components**

#### EmployeeList Component (`employee/EmployeeList.tsx` → `employee/employee-list.component.ts`)

**Features**:
- Display employee table/cards
- Search and filter by grade
- Pagination (5 items per page)
- View mode toggle (table/cards)
- Grade distribution summary
- Base salary configuration
- Add/Edit/Delete operations

**Angular Signals State**:
```typescript
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  
  // State signals
  employees = computed(() => this.employeeService.employees());
  isLoading = computed(() => this.employeeService.isLoading());
  error = computed(() => this.employeeService.error());
  
  showForm = signal(false);
  editingEmployee = signal<Employee | null>(null);
  baseSalaryGrade6 = signal(30000);
  currentPage = signal(1);
  searchTerm = signal('');
  filterGrade = signal<number | ''>('');
  viewMode = signal<'table' | 'cards'>('cards');
  
  // Computed derived state
  filteredEmployees = computed(() => {
    const employees = this.employees();
    const search = this.searchTerm().toLowerCase();
    const grade = this.filterGrade();
    
    return employees.filter(emp => {
      const matchesSearch = search === '' || 
        emp.name.toLowerCase().includes(search) ||
        emp.code.includes(search) ||
        emp.mobile.includes(search);
      const matchesGrade = grade === '' || emp.grade.rank === grade;
      return matchesSearch && matchesGrade;
    });
  });
  
  paginatedEmployees = computed(() => {
    const filtered = this.filteredEmployees();
    const page = this.currentPage();
    const itemsPerPage = 5;
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  });
  
  totalPages = computed(() => 
    Math.ceil(this.filteredEmployees().length / 5)
  );
  
  totalMonthlyPayroll = computed(() => {
    const employees = this.employees();
    const base = this.baseSalaryGrade6();
    return employees.reduce((total, emp) => {
      const salary = this.salaryCalculator.calculate(emp.grade.rank, base);
      return total + salary.gross;
    }, 0);
  });
  
  ngOnInit() {
    this.employeeService.loadEmployees();
  }
  
  handleEdit(employee: Employee) {
    this.editingEmployee.set(employee);
    this.showForm.set(true);
  }
  
  async handleDelete(employee: Employee) {
    const confirmed = confirm(
      `Are you sure you want to delete employee ${employee.name} (${employee.code})?`
    );
    if (confirmed) {
      await this.employeeService.deleteEmployee(employee.id);
    }
  }
  
  handleCloseForm() {
    this.showForm.set(false);
    this.editingEmployee.set(null);
  }
}
```

**Template Structure**:
```html
<div class="employee-list">
  <div class="page-header">
    <h2>Employee Management</h2>
    <div class="header-actions">
      <div class="view-controls">
        <button (click)="viewMode.set('cards')" 
                [class.active]="viewMode() === 'cards'">
          📱 Cards
        </button>
        <button (click)="viewMode.set('table')"
                [class.active]="viewMode() === 'table'">
          📊 Table
        </button>
      </div>
      
      <div class="salary-config">
        <label>Base Salary (Grade 6):</label>
        <input type="number" [value]="baseSalaryGrade6()"
               (input)="baseSalaryGrade6.set(+$any($event.target).value)"
               min="10000" step="1000">
      </div>
      
      <button (click)="showForm.set(true)" class="btn-primary"
              [disabled]="employees().length >= 10">
        ➕ Add Employee
      </button>
    </div>
  </div>
  
  @if (error()) {
    <div class="error-message">{{ error() }}</div>
  }
  
  <!-- Search and Filter -->
  <div class="employee-controls">
    <div class="search-filter-row">
      <input type="text" placeholder="🔍 Search..."
             [value]="searchTerm()"
             (input)="searchTerm.set($any($event.target).value)">
      
      <select [value]="filterGrade()"
              (change)="filterGrade.set($any($event.target).value === '' ? '' : +$any($event.target).value)">
        <option value="">All Grades</option>
        @for (grade of [1,2,3,4,5,6]; track grade) {
          <option [value]="grade">Grade {{ grade }}</option>
        }
      </select>
    </div>
    
    <div class="employee-summary">
      <p><strong>Total:</strong> {{ employees().length }} / 10</p>
      <p><strong>Showing:</strong> {{ filteredEmployees().length }}</p>
      <p><strong>Monthly Payroll:</strong> {{ totalMonthlyPayroll() | currency:'BDT' }}</p>
    </div>
  </div>
  
  <!-- Cards or Table View -->
  @if (viewMode() === 'cards') {
    <div class="employee-cards">
      @for (emp of paginatedEmployees(); track emp.id) {
        <div class="employee-card">
          <!-- Card content -->
        </div>
      }
    </div>
  } @else {
    <table class="employee-table">
      <!-- Table content -->
    </table>
  }
  
  <!-- Pagination -->
  <div class="pagination">
    @for (page of Array(totalPages()).fill(0).map((_, i) => i + 1); track page) {
      <button (click)="currentPage.set(page)"
              [class.active]="currentPage() === page">
        {{ page }}
      </button>
    }
  </div>
  
  <!-- Employee Form Modal -->
  @if (showForm()) {
    <app-employee-form 
      [employee]="editingEmployee()"
      (onClose)="handleCloseForm()" />
  }
</div>
```

#### EmployeeForm Component (`employee/EmployeeForm.tsx` → `employee/employee-form.component.ts`)

**Features**:
- Add/Edit employee modal
- Grade selection with validation
- Bank account details
- Mobile validation (10-11 digits)
- Employee ID validation (4 digits)

**Angular Implementation**:
```typescript
export class EmployeeFormComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  
  employee = input<Employee | null>(null);
  onClose = output<void>();
  
  isSubmitting = signal(false);
  validationError = signal<string | null>(null);
  
  formData = signal({
    code: '',
    name: '',
    address: '',
    mobile: '',
    gradeRank: 6,
    accountType: 'SAVINGS' as 'SAVINGS' | 'CURRENT',
    accountName: '',
    branchName: ''
  });
  
  ngOnInit() {
    effect(() => {
      const emp = this.employee();
      if (emp) {
        this.formData.set({
          code: emp.code,
          name: emp.name,
          address: emp.address,
          mobile: emp.mobile,
          gradeRank: emp.grade.rank,
          accountType: emp.account.accountType,
          accountName: emp.account.accountName,
          branchName: emp.account.branchName
        });
      }
    });
  }
  
  updateField(field: string, value: any) {
    this.formData.update(f => ({ ...f, [field]: value }));
    this.validationError.set(null);
  }
  
  async onSubmit() {
    if (this.isSubmitting()) return;
    
    // Validation
    const validation = this.employeeService.validateNewEmployee(
      { bizId: this.formData().code, grade: this.formData().gradeRank },
      !!this.employee(),
      this.employee() || undefined
    );
    
    if (validation) {
      this.validationError.set(validation);
      return;
    }
    
    this.isSubmitting.set(true);
    
    try {
      const data = this.formData();
      if (this.employee()) {
        await this.employeeService.updateEmployee(this.employee()!.id, data);
      } else {
        await this.employeeService.addEmployee(data);
      }
      this.onClose.emit();
    } catch (error) {
      // Error handled by service
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
```

---

### 3. **Payroll Management Components**

#### PayrollProcess Component (`payroll/PayrollProcess.tsx` → `payroll/payroll-process.component.ts`)

**Complex Features**:
- Calculate salaries for all employees
- Show total payroll vs company balance
- Insufficient funds detection
- Top-up modal integration
- Process batch salary transfer
- Transfer status tracking per employee

**Angular Signals Architecture**:
```typescript
export class PayrollProcessComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private companyService = inject(CompanyService);
  private payrollService = inject(PayrollService);
  private statusService = inject(StatusMessageService);
  
  employees = computed(() => this.employeeService.employees());
  company = computed(() => this.companyService.company());
  
  baseSalaryGrade6 = signal(30000);
  payrollBatch = signal<PayrollBatch | null>(null);
  isProcessing = signal(false);
  showTopUpModal = signal(false);
  requiredTopUp = signal(0);
  
  // Computed payroll items
  payrollItems = computed(() => {
    const employees = this.employees();
    const base = this.baseSalaryGrade6();
    
    return employees.map(emp => {
      const salary = this.salaryCalculator.calculate(emp.grade.rank, base);
      return {
        id: `item-${emp.id}`,
        employeeId: emp.id,
        employee: emp,
        basic: salary.basic,
        hra: salary.hra,
        medical: salary.medical,
        gross: salary.gross,
        status: 'PENDING' as const
      };
    });
  });
  
  totalPayroll = computed(() => 
    this.payrollItems().reduce((sum, item) => sum + item.gross, 0)
  );
  
  companyBalance = computed(() => 
    this.company()?.mainAccount?.currentBalance || 0
  );
  
  isInsufficientFunds = computed(() => 
    this.companyBalance() < this.totalPayroll()
  );
  
  ngOnInit() {
    effect(() => {
      const companyId = this.company()?.id;
      if (companyId) {
        this.fetchPendingBatch(companyId);
      }
    });
  }
  
  async fetchPendingBatch(companyId: string) {
    try {
      const batch = await this.payrollService.getPendingBatch(companyId);
      this.payrollBatch.set(batch);
      if (batch?.basicBaseAmount?.amount) {
        this.baseSalaryGrade6.set(batch.basicBaseAmount.amount);
      }
    } catch {
      this.payrollBatch.set(null);
    }
  }
  
  async handleCalculate() {
    this.isProcessing.set(true);
    try {
      const response = await this.payrollService.calculate(
        this.baseSalaryGrade6()
      );
      this.statusService.addSuccess('Salary calculated successfully');
    } catch (error) {
      this.statusService.addError('Failed to calculate salaries');
    } finally {
      this.isProcessing.set(false);
    }
  }
  
  async handleTransfer() {
    if (this.isInsufficientFunds()) {
      const shortage = this.totalPayroll() - this.companyBalance();
      this.requiredTopUp.set(shortage);
      this.showTopUpModal.set(true);
      return;
    }
    
    this.isProcessing.set(true);
    try {
      const employeeIds = this.employees().map(e => e.id);
      const response = await this.payrollService.transfer({
        employeeIds,
        grade6Basic: this.baseSalaryGrade6()
      });
      
      this.statusService.addSuccess(
        `Successfully transferred to ${response.totalTransferred} employees`
      );
      await this.companyService.loadCompanyAccount();
    } catch (error) {
      this.statusService.addError('Payroll transfer failed');
    } finally {
      this.isProcessing.set(false);
    }
  }
  
  async handleTopUp(request: TopUpRequest) {
    await this.companyService.topUpAccount(request);
    this.showTopUpModal.set(false);
    await this.handleTransfer();
  }
}
```

#### SalarySheet Component (`payroll/SalarySheet.tsx` → `payroll/salary-sheet.component.ts`)

**Features**:
- Display calculated salaries for all employees
- Show payment status (paid/pending)
- Export functionality (future)
- Salary breakdown per grade

---

### 4. **Company Account Component**

#### CompanyAccount Component (`company/CompanyAccount.tsx` → `company/company-account.component.ts`)

**Features**:
- Display company account balance
- Top-up functionality
- Transaction history with pagination
- Quick top-up amounts (50k, 100k, 200k, 500k)
- Balance health indicator

**Angular Implementation**:
```typescript
export class CompanyAccountComponent implements OnInit {
  private companyService = inject(CompanyService);
  
  company = computed(() => this.companyService.company());
  transactions = computed(() => this.companyService.transactions());
  isLoading = computed(() => this.companyService.isLoading());
  error = computed(() => this.companyService.error());
  
  showTopUpForm = signal(false);
  topUpAmount = signal('');
  topUpDescription = signal('');
  isSubmitting = signal(false);
  
  quickTopUpAmounts = [50000, 100000, 200000, 500000];
  
  ngOnInit() {
    this.companyService.loadTransactions();
  }
  
  async handleTopUp() {
    const amount = parseFloat(this.topUpAmount());
    if (isNaN(amount) || amount <= 0) return;
    
    this.isSubmitting.set(true);
    try {
      await this.companyService.topUpAccount({
        amount,
        description: this.topUpDescription() || 'Account top-up'
      });
      this.showTopUpForm.set(false);
      this.topUpAmount.set('');
      this.topUpDescription.set('');
    } finally {
      this.isSubmitting.set(false);
    }
  }
  
  setQuickAmount(amount: number) {
    this.topUpAmount.set(amount.toString());
  }
}
```

---

### 5. **Shared Components**

#### TopUpModal Component (`shared/TopUpModal.tsx` → `shared/top-up-modal.component.ts`)

**Features**:
- Modal overlay
- Shows current balance, required amount, minimum top-up
- Top-up form with validation
- Can be closed or submitted

**Angular Implementation**:
```typescript
export class TopUpModalComponent {
  isOpen = input.required<boolean>();
  requiredAmount = input.required<number>();
  currentBalance = input.required<number>();
  onClose = output<void>();
  onTopUp = output<TopUpRequest>();
  
  amount = signal(0);
  description = signal('Emergency top-up for payroll processing');
  isSubmitting = signal(false);
  
  minimumTopUp = computed(() => 
    Math.max(0, this.requiredAmount() - this.currentBalance())
  );
  
  constructor() {
    effect(() => {
      this.amount.set(this.requiredAmount());
    });
  }
  
  handleSubmit() {
    if (this.amount() <= 0) return;
    
    this.isSubmitting.set(true);
    this.onTopUp.emit({
      amount: this.amount(),
      description: this.description()
    });
  }
}
```

**Template**:
```html
@if (isOpen()) {
  <div class="modal-overlay" (click)="onClose.emit()">
    <div class="modal insufficient-funds-modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>⚠️ Insufficient Funds</h3>
        <button (click)="onClose.emit()" class="close-btn" 
                [disabled]="isSubmitting()">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="insufficient-funds-info">
          <div class="balance-info">
            <p><strong>Current Balance:</strong> 
              <span class="current-balance">{{ currentBalance() | currency:'BDT' }}</span>
            </p>
            <p><strong>Required Amount:</strong> 
              <span class="required-amount">{{ requiredAmount() | currency:'BDT' }}</span>
            </p>
            <p><strong>Minimum Top-up:</strong> 
              <span class="minimum-topup">{{ minimumTopUp() | currency:'BDT' }}</span>
            </p>
          </div>
        </div>
        
        <form (ngSubmit)="handleSubmit()" class="topup-form">
          <div class="form-group">
            <label for="topup-amount">Top-up Amount (BDT) *</label>
            <input type="number" id="topup-amount"
                   [value]="amount()"
                   (input)="amount.set(+$any($event.target).value)"
                   [min]="minimumTopUp()"
                   step="1000" required>
            <small>Minimum required: {{ minimumTopUp() | currency:'BDT' }}</small>
          </div>
          
          <div class="form-group">
            <label for="topup-description">Description</label>
            <input type="text" id="topup-description"
                   [value]="description()"
                   (input)="description.set($any($event.target).value)">
          </div>
          
          <div class="modal-actions">
            <button type="button" (click)="onClose.emit()" 
                    class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary"
                    [disabled]="isSubmitting() || amount() < minimumTopUp()">
              {{ isSubmitting() ? 'Processing...' : 'Top-up Account' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
}
```

#### StatusMessage Component (`shared/StatusMessage.tsx` → `shared/status-message.component.ts`)

**Features**:
- Toast notifications (success, error, warning, info)
- Auto-hide after 5 seconds
- Manual dismiss
- Multiple messages stacked

---

## 🔧 Service Layer Migration

### 1. **AuthService** (Context → Service)

**React Context**: `contexts/AuthContext.tsx`  
**Angular Service**: `services/auth.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // State signals
  private userState = signal<User | null>(null);
  private isAuthenticatedState = signal(false);
  private isLoadingState = signal(false);
  private errorState = signal<string | null>(null);
  
  // Public readonly signals
  user = this.userState.asReadonly();
  isAuthenticated = this.isAuthenticatedState.asReadonly();
  isLoading = this.isLoadingState.asReadonly();
  error = this.errorState.asReadonly();
  
  constructor() {
    this.initializeAuth();
  }
  
  private initializeAuth() {
    const user = this.getCurrentUser();
    if (user) {
      this.userState.set(user);
      this.isAuthenticatedState.set(true);
    }
  }
  
  async login(credentials: LoginRequest): Promise<void> {
    this.isLoadingState.set(true);
    this.errorState.set(null);
    
    try {
      const response = await firstValueFrom(
        this.http.post<APIResponse<LoginResponse>>(
          '/auth/login', 
          credentials
        )
      );
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.userState.set(user);
        this.isAuthenticatedState.set(true);
      }
    } catch (error: any) {
      const message = error.error?.message || 'Login failed';
      this.errorState.set(message);
      throw error;
    } finally {
      this.isLoadingState.set(false);
    }
  }
  
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    this.userState.set(null);
    this.isAuthenticatedState.set(false);
    this.router.navigate(['/login']);
  }
  
  getCurrentUser(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
  
  clearError(): void {
    this.errorState.set(null);
  }
}
```

### 2. **EmployeeService** (Context → Service)

```typescript
@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  
  private employeesState = signal<Employee[]>([]);
  private isLoadingState = signal(false);
  private errorState = signal<string | null>(null);
  
  employees = this.employeesState.asReadonly();
  isLoading = this.isLoadingState.asReadonly();
  error = this.errorState.asReadonly();
  
  async loadEmployees(): Promise<void> {
    this.isLoadingState.set(true);
    try {
      const employees = await this.apiService.getEmployees();
      this.employeesState.set(employees);
      this.errorState.set(null);
    } catch (error: any) {
      this.errorState.set(error.message || 'Failed to load employees');
    } finally {
      this.isLoadingState.set(false);
    }
  }
  
  async addEmployee(employee: Partial<Employee>): Promise<void> {
    const newEmployee = await this.apiService.createEmployee(employee);
    this.employeesState.update(emps => [...emps, newEmployee]);
  }
  
  async updateEmployee(id: string, employee: Partial<Employee>): Promise<void> {
    const updated = await this.apiService.updateEmployee(id, employee);
    this.employeesState.update(emps => 
      emps.map(e => e.id === id ? updated : e)
    );
  }
  
  async deleteEmployee(id: string): Promise<void> {
    await this.apiService.deleteEmployee(id);
    this.employeesState.update(emps => emps.filter(e => e.id !== id));
  }
  
  validateNewEmployee(
    data: { bizId: string; grade: number },
    isUpdate = false,
    currentEmployee?: Employee
  ): string | null {
    const employees = this.employeesState();
    
    // Validate employee ID (4 digits)
    if (!/^\d{4}$/.test(data.bizId)) {
      return 'Employee ID must be exactly 4 digits';
    }
    
    // Check duplicate ID
    if (!isUpdate || currentEmployee?.code !== data.bizId) {
      if (employees.some(e => e.code === data.bizId)) {
        return 'Employee ID already exists';
      }
    }
    
    // Validate grade distribution
    const validation = SalaryCalculator.validateGradeDistribution(
      employees,
      data.grade,
      isUpdate,
      currentEmployee?.grade.rank
    );
    
    return validation;
  }
  
  clearError(): void {
    this.errorState.set(null);
  }
}
```

### 3. **CompanyService** (Context → Service)

```typescript
@Injectable({ providedIn: 'root' })
export class CompanyService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  
  private companyState = signal<BackendCompany | null>(null);
  private transactionsState = signal<Transaction[]>([]);
  private isLoadingState = signal(false);
  private errorState = signal<string | null>(null);
  
  company = this.companyState.asReadonly();
  transactions = this.transactionsState.asReadonly();
  isLoading = this.isLoadingState.asReadonly();
  error = this.errorState.asReadonly();
  
  constructor() {
    this.loadCompanyAccount();
  }
  
  async loadCompanyAccount(): Promise<void> {
    this.isLoadingState.set(true);
    try {
      const company = await this.apiService.getCompanyAccount('COMP001');
      this.companyState.set(company);
      this.errorState.set(null);
    } catch (error: any) {
      this.errorState.set(error.message || 'Failed to load company account');
    } finally {
      this.isLoadingState.set(false);
    }
  }
  
  async topUpAccount(request: TopUpRequest): Promise<void> {
    const response = await this.apiService.topUpCompany(request);
    await this.loadCompanyAccount();
  }
  
  async loadTransactions(limit = 20, offset = 0): Promise<void> {
    const response = await this.apiService.getTransactions(limit, offset);
    this.transactionsState.set(response.transactions);
  }
  
  clearError(): void {
    this.errorState.set(null);
  }
}
```

### 4. **PayrollService**

```typescript
@Injectable({ providedIn: 'root' })
export class PayrollService {
  private apiService = inject(ApiService);
  
  async calculate(grade6Basic: number): Promise<PayrollCalculationResponse> {
    return await this.apiService.calculateSalaries(grade6Basic);
  }
  
  async transfer(request: SalaryTransferRequest): Promise<SalaryTransferResponse> {
    return await this.apiService.transferSalaries(request);
  }
  
  async getPendingBatch(companyId: string): Promise<PayrollBatch | null> {
    return await this.apiService.getPendingBatch(companyId);
  }
  
  async getPayrollBatchItems(
    batchId: string, 
    offset: number, 
    limit: number, 
    sortBy: string
  ): Promise<any> {
    return await this.apiService.getPayrollBatchItems(batchId, offset, limit, sortBy);
  }
  
  async getPayrollBatchById(batchId: string): Promise<PayrollBatch> {
    return await this.apiService.getPayrollBatchById(batchId);
  }
}
```

### 5. **StatusMessageService** (Context → Service)

```typescript
export interface StatusMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
  autoHide?: boolean;
}

@Injectable({ providedIn: 'root' })
export class StatusMessageService {
  private messagesState = signal<StatusMessage[]>([]);
  
  messages = this.messagesState.asReadonly();
  
  addSuccess(message: string, details?: string, autoHide = true): void {
    this.addMessage('success', message, details, autoHide);
  }
  
  addError(message: string, details?: string, autoHide = true): void {
    this.addMessage('error', message, details, autoHide);
  }
  
  addWarning(message: string, details?: string, autoHide = true): void {
    this.addMessage('warning', message, details, autoHide);
  }
  
  addInfo(message: string, details?: string, autoHide = true): void {
    this.addMessage('info', message, details, autoHide);
  }
  
  private addMessage(
    type: StatusMessage['type'],
    message: string,
    details?: string,
    autoHide = true
  ): void {
    const newMessage: StatusMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      message,
      details,
      timestamp: new Date(),
      autoHide
    };
    
    this.messagesState.update(messages => [...messages, newMessage]);
  }
  
  dismissMessage(id: string): void {
    this.messagesState.update(messages => 
      messages.filter(m => m.id !== id)
    );
  }
  
  clearAll(): void {
    this.messagesState.set([]);
  }
}
```

### 6. **ApiService** (Axios → HttpClient)

**React**: `services/api.ts` with Axios  
**Angular**: `services/api.service.ts` with HttpClient + Interceptors

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  
  private baseUrl = this.config.API_BASE_URL;
  
  // Employee endpoints
  async getEmployees(): Promise<Employee[]> {
    const response = await firstValueFrom(
      this.http.get<APIResponse<Employee[]>>(`${this.baseUrl}/employees`)
    );
    return response.data;
  }
  
  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    const response = await firstValueFrom(
      this.http.post<APIResponse<Employee>>(`${this.baseUrl}/employees`, employee)
    );
    return response.data;
  }
  
  async updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee> {
    const response = await firstValueFrom(
      this.http.put<APIResponse<Employee>>(`${this.baseUrl}/employees/${id}`, employee)
    );
    return response.data;
  }
  
  async deleteEmployee(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<APIResponse<void>>(`${this.baseUrl}/employees/${id}`)
    );
  }
  
  // Payroll endpoints
  async calculateSalaries(grade6Basic: number): Promise<PayrollCalculationResponse> {
    const response = await firstValueFrom(
      this.http.post<APIResponse<PayrollCalculationResponse>>(
        `${this.baseUrl}/payroll/calculate`,
        { grade6Basic }
      )
    );
    return response.data;
  }
  
  async transferSalaries(request: SalaryTransferRequest): Promise<SalaryTransferResponse> {
    const response = await firstValueFrom(
      this.http.post<APIResponse<SalaryTransferResponse>>(
        `${this.baseUrl}/payroll/transfer`,
        request
      )
    );
    return response.data;
  }
  
  // Company endpoints
  async getCompanyAccount(companyId: string): Promise<BackendCompany> {
    const response = await firstValueFrom(
      this.http.get<APIResponse<BackendCompany>>(`${this.baseUrl}/companies/${companyId}`)
    );
    return response.data;
  }
  
  async topUpCompany(request: TopUpRequest): Promise<TopUpResponse> {
    const response = await firstValueFrom(
      this.http.post<APIResponse<TopUpResponse>>(
        `${this.baseUrl}/company/topup`,
        request
      )
    );
    return response.data;
  }
  
  async getTransactions(limit: number, offset: number): Promise<TransactionHistoryResponse> {
    const response = await firstValueFrom(
      this.http.get<APIResponse<TransactionHistoryResponse>>(
        `${this.baseUrl}/company/transactions`,
        { params: { limit: limit.toString(), offset: offset.toString() } }
      )
    );
    return response.data;
  }
}
```

### 7. **HTTP Interceptors** (JWT Authentication)

**React**: Axios interceptors in `api.ts`  
**Angular**: `HttpInterceptor`

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublicEndpoint = req.url.includes('/auth/login') || 
                          req.url.includes('/auth/refresh');
  
  if (!isPublicEndpoint) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Redirect to login
        inject(Router).navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
```

---

## 🎨 Styling Migration

### CSS Organization

**React**: `SimulatedApp.css` (1510 lines) + component-specific CSS  
**Angular**: Same structure, distributed across component stylesheets

**Strategy**:
1. Copy global styles to `styles.css`
2. Copy component-specific styles to respective `.component.css` files
3. Maintain exact class names for compatibility
4. Use ViewEncapsulation.None only where needed

**Global Styles** (`src/styles.css`):
```css
/* Copy from SimulatedApp.css */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', ... }
/* All utility classes and global styling */
```

**Component Styles**: Each component gets its own CSS file matching React structure.

---

## 🗺️ Routing Configuration

**React Router** (`App-real-backend.tsx`):
```tsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/employees" element={<ProtectedRoute><EmployeeList /></ProtectedRoute>} />
    <Route path="/payroll" element={<ProtectedRoute><PayrollProcess /></ProtectedRoute>} />
    <Route path="/company" element={<ProtectedRoute><CompanyAccount /></ProtectedRoute>} />
  </Routes>
</BrowserRouter>
```

**Angular Router** (`app.routes.ts`):
```typescript
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'employees', component: EmployeeListComponent },
      { path: 'payroll', component: PayrollProcessComponent },
      { path: 'company', component: CompanyAccountComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
```

---

## 🔨 Utility Functions Migration

### SalaryCalculator (`utils/salaryCalculator.ts`)

**CRITICAL**: This file must be copied **EXACTLY** as-is. No modifications to business logic.

```typescript
// Copy entire file to Angular: src/app/utils/salary-calculator.ts
// Convert to class with static methods for Angular usage

export class SalaryCalculator {
  static calculate(grade: number, baseSalaryGrade6 = 30000): SalaryBreakdown {
    const basic = baseSalaryGrade6 + (6 - grade) * 5000;
    const hra = basic * 0.20;
    const medical = basic * 0.15;
    const gross = basic + hra + medical;
    return { basic, hra, medical, gross };
  }
  
  static validateEmployeeId(id: string): boolean {
    return /^\d{4}$/.test(id);
  }
  
  static validateGradeDistribution(
    employees: Array<{grade: number}>,
    newGrade: number,
    isUpdate = false,
    currentGrade?: number
  ): string | null {
    // Exact same logic as React version
  }
  
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
```

---

## 📦 Project Structure

```
payroll-angular-new/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.css
│   │   │   ├── employee/
│   │   │   │   ├── employee-list/
│   │   │   │   │   ├── employee-list.component.ts
│   │   │   │   │   ├── employee-list.component.html
│   │   │   │   │   └── employee-list.component.css
│   │   │   │   ├── employee-form/
│   │   │   │   │   ├── employee-form.component.ts
│   │   │   │   │   ├── employee-form.component.html
│   │   │   │   │   └── employee-form.component.css
│   │   │   ├── payroll/
│   │   │   │   ├── payroll-process/
│   │   │   │   ├── salary-sheet/
│   │   │   ├── company/
│   │   │   │   ├── company-account/
│   │   │   ├── shared/
│   │   │   │   ├── top-up-modal/
│   │   │   │   ├── status-message/
│   │   │   └── dashboard/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── employee.service.ts
│   │   │   ├── company.service.ts
│   │   │   ├── payroll.service.ts
│   │   │   ├── status-message.service.ts
│   │   │   └── api.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   ├── models/
│   │   │   └── types.ts (copy from React types/index.ts)
│   │   ├── utils/
│   │   │   └── salary-calculator.ts
│   │   ├── config/
│   │   │   └── app.config.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── styles.css (global styles)
│   ├── index.html
│   └── main.ts
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## ✅ Implementation Checklist

### Phase 1: Project Setup (1-2 hours)
- [ ] Create new Angular 21 project: `ng new payroll-angular-new --standalone`
- [ ] Install dependencies: `npm install`
- [ ] Configure `angular.json` (port 4200, proxy configuration)
- [ ] Copy `types/index.ts` to `models/types.ts`
- [ ] Copy `utils/salaryCalculator.ts` to `utils/salary-calculator.ts`
- [ ] Copy `config/index.ts` to `config/app.config.ts`
- [ ] Copy all CSS files to appropriate locations
- [ ] Set up environment configuration

### Phase 2: Core Services (2-3 hours)
- [ ] Create `ApiService` with HttpClient
- [ ] Create `AuthService` with signals
- [ ] Create `EmployeeService` with signals
- [ ] Create `CompanyService` with signals
- [ ] Create `PayrollService` with signals
- [ ] Create `StatusMessageService` with signals
- [ ] Implement `authInterceptor` for JWT
- [ ] Implement `authGuard` for route protection

### Phase 3: Authentication Components (1-2 hours)
- [ ] Create `LoginComponent` (component + template + styles)
- [ ] Wire up `AuthService.login()`
- [ ] Test login flow with demo credentials
- [ ] Verify JWT storage and routing

### Phase 4: Employee Management (3-4 hours)
- [ ] Create `EmployeeListComponent`
  - [ ] Table view
  - [ ] Card view
  - [ ] Search functionality
  - [ ] Filter by grade
  - [ ] Pagination
  - [ ] Grade distribution summary
- [ ] Create `EmployeeFormComponent`
  - [ ] Add mode
  - [ ] Edit mode
  - [ ] Validation
  - [ ] Grade distribution check
- [ ] Wire up CRUD operations
- [ ] Test all employee operations

### Phase 5: Payroll Management (3-4 hours)
- [ ] Create `PayrollProcessComponent`
  - [ ] Salary calculation UI
  - [ ] Employee list with salaries
  - [ ] Total calculation
  - [ ] Balance check
  - [ ] Transfer button
  - [ ] Insufficient funds detection
- [ ] Create `SalarySheetComponent`
  - [ ] Display calculated salaries
  - [ ] Payment status
  - [ ] Export button (placeholder)
- [ ] Integrate with `PayrollService`
- [ ] Test salary calculations
- [ ] Test transfer flow

### Phase 6: Company Account (2-3 hours)
- [ ] Create `CompanyAccountComponent`
  - [ ] Balance display
  - [ ] Top-up form
  - [ ] Transaction history
  - [ ] Quick top-up buttons
- [ ] Wire up `CompanyService`
- [ ] Test top-up functionality
- [ ] Test transaction loading

### Phase 7: Shared Components (2-3 hours)
- [ ] Create `TopUpModalComponent`
  - [ ] Modal overlay
  - [ ] Form with validation
  - [ ] Balance information
- [ ] Create `StatusMessageComponent`
  - [ ] Toast notifications
  - [ ] Auto-hide logic
  - [ ] Multiple messages
- [ ] Create `DashboardComponent`
  - [ ] Summary cards
  - [ ] Quick actions
  - [ ] Statistics

### Phase 8: Routing & Navigation (1-2 hours)
- [ ] Configure `app.routes.ts`
- [ ] Add navigation menu/header
- [ ] Implement logout functionality
- [ ] Test all route transitions
- [ ] Verify auth guard protection

### Phase 9: Integration & Testing (2-3 hours)
- [ ] Test with mock API mode (`USE_MOCK_API: true`)
- [ ] Test with real backend (`USE_MOCK_API: false`)
- [ ] Verify all CRUD operations
- [ ] Test salary calculations
- [ ] Test payroll transfer
- [ ] Test company top-up
- [ ] Check error handling
- [ ] Verify JWT authentication

### Phase 10: Polish & Deployment (1-2 hours)
- [ ] Final UI adjustments
- [ ] Mobile responsiveness check
- [ ] Performance optimization
- [ ] Build for production: `ng build --configuration production`
- [ ] Test production build: `ng serve --configuration production`
- [ ] Documentation updates

---

## 🎯 Validation Points

After each phase, validate:

1. **Compilation**: `ng build` passes without errors
2. **Runtime**: App loads without console errors
3. **Functionality**: Feature works as expected
4. **API**: Network requests succeed
5. **State**: Signals update correctly
6. **UI**: Styling matches React version

---

## 🔍 Common Pitfalls & Solutions

### 1. **Signal Updates Not Triggering UI**
**Problem**: UI doesn't update when signal changes  
**Solution**: Use `.set()` or `.update()`, never mutate signal value directly

### 2. **HTTP Requests Hanging**
**Problem**: HttpClient requests don't complete  
**Solution**: Always use `firstValueFrom()` or `lastValueFrom()` to convert Observable to Promise

### 3. **Template Syntax Errors**
**Problem**: `*ngIf` doesn't work  
**Solution**: Use new control flow: `@if`, `@for`, `@switch`

### 4. **Interceptor Not Working**
**Problem**: JWT not attached to requests  
**Solution**: Ensure interceptor is provided in `app.config.ts`

### 5. **Circular Dependencies**
**Problem**: Services depend on each other  
**Solution**: Use `inject()` function inside methods, not constructor

### 6. **Styling Not Applied**
**Problem**: Component styles don't show  
**Solution**: Check `ViewEncapsulation`, verify CSS file path in `@Component`

---

## 📊 Time Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Setup | 1-2 hours | 2 hours |
| Services | 2-3 hours | 5 hours |
| Auth | 1-2 hours | 7 hours |
| Employees | 3-4 hours | 11 hours |
| Payroll | 3-4 hours | 15 hours |
| Company | 2-3 hours | 18 hours |
| Shared | 2-3 hours | 21 hours |
| Routing | 1-2 hours | 23 hours |
| Testing | 2-3 hours | 26 hours |
| Polish | 1-2 hours | **28 hours** |

**Total Estimate**: 24-28 hours (3-4 working days)

---

## 🚀 Quick Start Commands

```powershell
# Create new Angular project
ng new payroll-angular-new --routing --style=css --standalone

# Navigate to project
cd payroll-angular-new

# Install dependencies (if any additional needed)
npm install

# Start development server
ng serve

# Build for production
ng build --configuration production

# Run tests
ng test
```

---

## 📝 Notes

1. **DO NOT modify business logic** - Copy `salaryCalculator.ts` exactly as-is
2. **Maintain exact API contracts** - Use same request/response types
3. **Use Angular 21 patterns** - Standalone, signals, new control flow
4. **Test incrementally** - Validate after each component
5. **Keep styling identical** - Copy CSS class names and structures
6. **Follow migration plan order** - Don't skip phases
7. **Commit frequently** - Version control after each working feature

---

## 🎓 Angular 21 Best Practices Reminder

- ✅ **Standalone components only** (never set `standalone: true` explicitly)
- ✅ **Signals for state** (`signal()`, `computed()`, `effect()`)
- ✅ **inject() function** instead of constructor injection
- ✅ **New control flow** (`@if`, `@for`, `@switch`)
- ✅ **input() and output()** instead of decorators
- ✅ **OnPush change detection** always
- ✅ **Host bindings** in `@Component` decorator

---

## 🆘 Support Resources

- **React Codebase**: `payroll-frontend/` - Reference implementation
- **Documentation**: `docs/` and `payroll-frontend/docs/`
- **API Documentation**: `docs/api-documentation.md`
- **Business Logic**: `payroll-frontend/docs/business-logic.md`
- **Angular Docs**: https://angular.dev/
- **This Plan**: Re-read sections as needed during implementation

---

**Ready to migrate? Start with Phase 1 and work through sequentially. Good luck! 🚀**
