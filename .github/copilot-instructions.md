# Copilot Instructions - Payroll Management UI

## Project Overview
React-based payroll management system with specific business constraints:
- **10 employees total**: Grade distribution (1:1, 2:1, 3:2, 4:2, 5:2, 6:2)
- **4-digit unique employee IDs** (validation required)
- **Salary calculation**: Basic + HRA(20%) + Medical(15%)
- **Grade-based salary**: Grade 6 base + (6-grade) × 5000 increment
- **Company account** with insufficient funds handling

## Critical Business Logic

### Salary Calculation Pattern
```javascript
// Always use this exact formula from development.md
const calculateSalary = (grade, baseSalaryGrade6) => {
  const basic = baseSalaryGrade6 + (6 - grade) * 5000;
  const hra = basic * 0.20;
  const medical = basic * 0.15;
  const gross = basic + hra + medical;
  return { basic, hra, medical, gross };
};
```

### Employee Validation Rules
```javascript
// Employee ID: exactly 4 digits, unique
const validateEmployeeId = (id) => /^\d{4}$/.test(id);

// Grade distribution enforcement (must be checked on create/update)
const GRADE_LIMITS = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2 };
```

## Required Components Structure
Follow this exact structure from `development.md`:

```
src/
├── components/
│   ├── auth/           → Login/Logout with JWT
│   ├── employee/       → CRUD with grade distribution validation
│   ├── payroll/        → Salary calculation & batch transfer
│   ├── company/        → Account balance & top-up functionality
│   └── shared/         → Reusable form components
├── services/           → API integration layer
├── utils/              → Salary calculation helpers
└── App.js              → Router with protected routes
```

## State Management Pattern
Use React Context for global state:
- **AuthContext**: JWT token, user roles
- **EmployeeContext**: Employee list with grade validation
- **CompanyContext**: Account balance, transaction history

## API Integration Points
Mock or implement these endpoints from `development.md`:
```javascript
// Employee CRUD
GET/POST/PUT/DELETE /pms/v1/api/employees
// Payroll processing
POST /pms/v1/api/payroll/batches/{id}/process
GET /pms/v1/api/payroll/calculate
// Company account
GET /pms/v1/api/company/account
POST /pms/v1/api/company/topup
// Auth
POST /pms/v1/api/auth/login
```

## Critical UX Flows

### Payroll Transfer Flow
1. Display salary calculations for all employees
2. Show total amount vs company balance
3. If insufficient funds → prompt for top-up
4. Process transfers with success/failure status per employee
5. Display final salary sheet + remaining balance

### Employee Management Flow
1. Validate 4-digit ID uniqueness
2. Check grade distribution limits before save
3. Auto-create bank account on employee creation
4. Display employees grouped by grade

## Development Priorities (2-hour sprint)
1. **Setup** (15 min): Create React app, install dependencies
2. **Auth** (20 min): Login form + JWT storage
3. **Employee CRUD** (30 min): Form with validations + list view
4. **Salary Calculator** (25 min): Implement exact business formula
5. **Payroll Transfer** (30 min): Transfer logic + insufficient funds handling
6. **Reports** (15 min): Salary sheet + company balance display
7. **Testing** (5 min): Quick manual validation

## Quick Start Commands
```bash
cd payroll-frontend
npm install
npm run dev  # Vite dev server
```

## Project Structure (Actual)
```
payroll-frontend/
├── src/
│   ├── components/
│   │   ├── auth/           → Login/Logout with JWT
│   │   ├── employee/       → Employee CRUD Operations  
│   │   ├── payroll/        → Salary calculation & batch transfer
│   │   ├── company/        → Company account management
│   │   └── shared/         → Reusable UI components
│   ├── services/           → API integration layer (axios)
│   ├── utils/              → Salary calculation helpers
│   ├── contexts/           → React Context providers
│   └── App.tsx             → Main router with protected routes
├── vite.config.ts          → Vite configuration
└── package.json            → Dependencies (React 19, TypeScript, Vite)
```

## Error Handling Patterns
- **Form validation**: Real-time for employee ID/grade limits
- **API errors**: Toast notifications with specific messages
- **Insufficient funds**: Modal with top-up option
- **Transfer failures**: Per-employee status indicators

## Styling Guidelines
- Use CSS modules or styled-components
- Mobile-responsive tables for employee/payroll data
- Clear visual indicators for grade levels (1=highest)
- Success/error states for transfers and validations