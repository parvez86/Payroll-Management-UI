# Complete Angular Simulator Template

This is the complete HTML template for the simulator component. Copy this to `simulator.component.html`.

```html
<!-- Login Screen -->
@if (!isLoggedIn()) {
  <div class="login-container">
    <form (ngSubmit)="handleLogin($event)" class="login-form">
      <h1 class="login-title">💼 Payroll Login</h1>
      <p class="login-subtitle">
        Simulated Auth: Enter any credentials to proceed.
      </p>
      
      <div class="form-group">
        <label class="form-label">Username</label>
        <input 
          type="text" 
          class="form-input"
          [(ngModel)]="loginUsername"
          name="username"
          required
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">Password</label>
        <input 
          type="password" 
          class="form-input"
          [(ngModel)]="loginPassword"
          name="password"
          required
        />
      </div>
      
      <button type="submit" class="login-button">
        🔐 Sign In
      </button>
      
      @if (message()) {
        <p class="login-message">{{ message() }}</p>
      }
    </form>
  </div>
} @else {
  <!-- Main Application -->
  <div class="app-container">
    <!-- Top-Up Modal -->
    @if (isTopUpModalOpen()) {
      <div class="modal-overlay" (click)="closeTopUpModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>⚠️ Insufficient Funds</h3>
            <button (click)="closeTopUpModal()" class="close-btn">❌</button>
          </div>
          
          <div class="modal-body">
            <p>
              The company account balance of <strong>{{ formatCurrency(companyAccountBalance()) }}</strong> 
              is not enough to complete the salary transfer.
            </p>
            <p class="modal-required">
              Minimum required top-up to pay the next employee: 
              <strong class="text-red">{{ formatCurrency(paymentStatus().requiredTopUp) }}</strong>
            </p>
            
            <div class="form-group">
              <label for="topup-amount">Top-Up Amount (BDT)</label>
              <input
                id="topup-amount"
                type="number"
                class="form-input"
                [(ngModel)]="topUpAmount"
                [min]="paymentStatus().requiredTopUp > 0 ? paymentStatus().requiredTopUp : 1"
              />
            </div>
            
            <div class="modal-actions">
              <button (click)="closeTopUpModal()" class="btn-secondary">
                Cancel Payment
              </button>
              <button 
                (click)="handleTopUp()" 
                class="btn-primary"
                [disabled]="topUpAmount() <= 0"
              >
                ➕ Add Funds & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    }
    
    <div class="main-content">
      <!-- Header -->
      <header class="app-header">
        <h1 class="app-title">
          💵 Payroll Management System
        </h1>
        <div class="header-actions">
          <div class="company-balance" [class.negative]="companyAccountBalance() < 0">
            Company Balance: {{ formatCurrency(companyAccountBalance()) }}
          </div>
          <button (click)="handleLogout()" class="logout-button">
            🚪 Logout
          </button>
        </div>
      </header>
      
      <!-- Navigation & Controls -->
      <div class="content-card">
        <div class="section-title">Employee Management System</div>
        <div class="controls-section">
          <div class="nav-buttons">
            <button
              (click)="view.set('employees')"
              class="nav-button"
              [class.active]="view() === 'employees'"
            >
              Employee Data (CRUD)
            </button>
            <button
              (click)="view.set('salarySheet')"
              class="nav-button"
              [class.active]="view() === 'salarySheet'"
            >
              Salary Sheet
            </button>
            <button
              (click)="startAddEmployee()"
              class="add-employee-button"
            >
              ➕ Add Employee
            </button>
          </div>
        </div>
        
        <!-- Salary Input and Calculation -->
        @if (view() !== 'addEdit') {
          <div class="salary-controls">
            <div class="salary-input-group">
              <label for="basicSalary" class="salary-label">
                Grade 6 Basic Salary (BDT):
              </label>
              <input
                id="basicSalary"
                type="number"
                class="salary-input"
                [(ngModel)]="grade6Basic"
                min="10000"
              />
            </div>
            <div class="salary-action-buttons">
              <button
                (click)="calculateSalaries()"
                class="salary-button calculate"
              >
                Calculate All Salaries
              </button>
              <button
                (click)="transferSalaries()"
                [disabled]="totalSalaryRequired() === 0 || totalSalaryRequired() > companyAccountBalance()"
                class="salary-button transfer"
              >
                Transfer Salaries
              </button>
            </div>
          </div>
        }
      </div>
      
      <!-- Toast Notification -->
      @if (message()) {
        <div class="toast" [class]="
          (message().includes('success') || message().includes('added') || message().includes('complete')) ? 'toast-success' :
          (message().includes('error') || message().includes('out of money') || message().includes('ran out')) ? 'toast-error' :
          (message().includes('Please') || message().includes('Need')) ? 'toast-warning' :
          'toast-info'
        ">
          <p>{{ message() }}</p>
          <button (click)="message.set('')" class="toast-close">✕</button>
        </div>
      }
      
      <!-- Employee Table View -->
      @if (view() === 'employees') {
        <div class="table-container">
          <table class="employee-table">
            <thead class="table-header">
              <tr>
                <th class="table-cell clickable" (click)="handleSort('id')">
                  ID / Name {{ getSortIcon('id') }}
                </th>
                <th class="table-cell text-center clickable" (click)="handleSort('grade')">
                  Grade {{ getSortIcon('grade') }}
                </th>
                <th class="table-cell">Contact Info</th>
                <th class="table-cell">Bank Account</th>
                <th class="table-cell text-right clickable" (click)="handleSort('balance')">
                  Balance {{ getSortIcon('balance') }}
                </th>
                <th class="table-cell text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              @for (emp of sortedEmployees(); track emp.id) {
                <tr>
                  <td class="table-cell">
                    <div class="employee-info">
                      <div class="employee-name">{{ emp.name }}</div>
                      <div class="employee-id">ID: {{ emp.id }}</div>
                    </div>
                  </td>
                  <td class="table-cell text-center">
                    <div class="grade-badge">G{{ emp.grade }}</div>
                  </td>
                  <td class="table-cell">
                    <div class="text-sm">
                      <div>{{ emp.address }}</div>
                      <div class="text-gray-500">{{ emp.mobile }}</div>
                    </div>
                  </td>
                  <td class="table-cell">
                    <div class="bank-info">
                      <span class="bank-name">{{ emp.bankAccount.name }}</span>
                      <div class="bank-details">
                        {{ emp.bankAccount.number }} ({{ emp.bankAccount.bank }})
                      </div>
                    </div>
                  </td>
                  <td class="table-cell text-right">
                    <div class="amount">{{ formatCurrency(emp.bankAccount.balance) }}</div>
                  </td>
                  <td class="table-cell text-center">
                    <button (click)="handleEditEmployee(emp)" class="action-button edit">✏️</button>
                    <button (click)="handleDeleteEmployee(emp.id)" class="action-button delete">🗑️</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      
      <!-- Salary Sheet View -->
      @if (view() === 'salarySheet') {
        <div class="content-card">
          <h2 class="page-title">💰 Salary Sheet Overview</h2>
          
          <div class="summary-grid">
            <div class="summary-card total-paid">
              <div class="summary-label">Total Paid Salary</div>
              <div class="summary-value">{{ formatCurrency(paymentStatus().totalPaid) }}</div>
            </div>
            <div class="summary-card balance" [class.negative]="companyAccountBalance() < 0">
              <div class="summary-label">Company Account Balance</div>
              <div class="summary-value">{{ formatCurrency(companyAccountBalance()) }}</div>
            </div>
          </div>
          
          <div class="table-container">
            <table class="employee-table">
              <thead class="table-header">
                <tr>
                  <th class="table-cell">Name (ID)</th>
                  <th class="table-cell text-center">Grade</th>
                  <th class="table-cell text-right">Basic</th>
                  <th class="table-cell text-right">HRA (20%)</th>
                  <th class="table-cell text-right">Medical (15%)</th>
                  <th class="table-cell text-right">Gross Salary</th>
                  <th class="table-cell text-center">Paid Status</th>
                </tr>
              </thead>
              <tbody class="table-body">
                @for (emp of employees(); track emp.id) {
                  <tr [class.table-row-success]="emp.salary?.isPaid">
                    <td class="table-cell">
                      <div class="employee-info">
                        <div class="employee-name">{{ emp.name }}</div>
                        <div class="employee-id">ID: {{ emp.id }}</div>
                      </div>
                    </td>
                    <td class="table-cell text-center">
                      <span class="grade-badge">G{{ emp.grade }}</span>
                    </td>
                    <td class="table-cell text-right">{{ formatCurrency(emp.salary?.basic || 0) }}</td>
                    <td class="table-cell text-right">{{ formatCurrency(emp.salary?.houseRent || 0) }}</td>
                    <td class="table-cell text-right">{{ formatCurrency(emp.salary?.medicalAllowance || 0) }}</td>
                    <td class="table-cell text-right">
                      <span class="salary-amount">{{ formatCurrency(emp.salary?.gross || 0) }}</span>
                    </td>
                    <td class="table-cell text-center">
                      <span class="status-badge" [class]="emp.salary?.isPaid ? 'status-paid' : 'status-pending'">
                        {{ emp.salary?.isPaid ? '✅ Paid' : '⏳ Pending' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
      
      <!-- Employee Form (Add/Edit) -->
      @if (view() === 'addEdit' && formData()) {
        <div class="employee-form-container">
          <h2 class="form-title">
            👤 {{ editEmployee()?.id === getNextEmployeeId() ? 'Add New Employee' : 'Edit Employee ID: ' + formData()!.id }}
          </h2>
          <form (ngSubmit)="handleSaveEmployee()">
            <div class="form-grid">
              <!-- Personal Information Section -->
              <div class="form-section">
                <div class="form-section-title">👤 Personal Information</div>
                <div class="form-group">
                  <label class="form-label">Employee ID</label>
                  <input
                    type="text"
                    class="form-input"
                    [value]="formData()!.id"
                    disabled
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input
                    type="text"
                    class="form-input"
                    [value]="formData()!.name"
                    (input)="updateFormField('name', $any($event.target).value)"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Grade / Rank *</label>
                  <select
                    class="form-select"
                    [value]="formData()!.grade"
                    (change)="updateFormField('grade', +$any($event.target).value)"
                  >
                    @for (g of GRADE_LEVELS; track g) {
                      <option [value]="g">Grade {{ g }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Mobile Number *</label>
                  <input
                    type="text"
                    class="form-input"
                    [value]="formData()!.mobile"
                    (input)="updateFormField('mobile', $any($event.target).value)"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Address</label>
                  <input
                    type="text"
                    class="form-input"
                    [value]="formData()!.address"
                    (input)="updateFormField('address', $any($event.target).value)"
                  />
                </div>
              </div>
              
              <!-- Bank Account Information Section -->
              <div class="form-section">
                <div class="form-section-title">🏦 Bank Account Details</div>
                <div class="form-group">
                  <label class="form-label">Account Name *</label>
                  <input
                    type="text"
                    class="form-input"
                    [value]="formData()!.bankAccount.name"
                    (input)="updateBankField('name', $any($event.target).value)"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Account Number *</label>
                  <input
                    type="text"
                    class="form-input"
                    [value]="formData()!.bankAccount.number"
                    (input)="updateBankField('number', $any($event.target).value)"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Account Type *</label>
                  <select
                    class="form-select"
                    [value]="formData()!.bankAccount.type"
                    (change)="updateBankField('type', $any($event.target).value)"
                  >
                    <option value="Savings">Savings Account</option>
                    <option value="Current">Current Account</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Bank Name *</label>
                  <input
                    type="text"
                    class="form-input"
                    [value]="formData()!.bankAccount.bank"
                    (input)="updateBankField('bank', $any($event.target).value)"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Branch Name *</label>
                  <input
                    type="text"
                    class="form-input"
                    [value]="formData()!.bankAccount.branch"
                    (input)="updateBankField('branch', $any($event.target).value)"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Current Balance (BDT) *</label>
                  <input
                    type="number"
                    class="form-input"
                    [value]="formData()!.bankAccount.balance"
                    (input)="updateBankField('balance', +$any($event.target).value)"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div class="form-section-full">
              <div class="form-actions">
                <button type="button" (click)="handleCancelEdit()" class="form-cancel-button">
                  ❌ Cancel
                </button>
                <button type="submit" class="form-save-button">
                  💾 Save Employee
                </button>
              </div>
            </div>
          </form>
        </div>
      }
    </div>
  </div>
}
```

Now copy the CSS from `payroll-frontend/src/SimulatedApp.css` to `simulator.component.css`.
