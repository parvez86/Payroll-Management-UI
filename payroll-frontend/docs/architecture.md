# Payroll Management System UI - Architecture

## Overview
- **Frontend:** React 19 + TypeScript, Vite
- **State Management:** React Context (Auth, Employee, Company, Status)
- **API:** Axios, JWT authentication, real backend at `/pms/api/v1`
- **Business Logic:** Salary calculation, grade validation, company account, payroll transfer

## Key Flows
- **Login:** JWT, user profile fetch, context setup
- **Employee CRUD:** Grade distribution, 4-digit ID, validation, auto bank account
- **Payroll:** Salary calculation (formula), batch transfer, insufficient funds handling
- **Company Account:** Balance, top-up, transaction history

## Folder Structure
See `structure.md` for details.

## Component Diagram
- `App.tsx` → Router, context providers
- `Login.tsx` → Auth flow
- `EmployeeList.tsx`/`EmployeeForm.tsx` → Employee management
- `PayrollProcess.tsx` → Payroll transfer
- `CompanyAccount.tsx` → Account, transactions

## Data Flow
- API calls via `api.ts` → Contexts update state → Components render UI
- All business logic (salary, validation) in `utils/` or `services/`

## Security
- JWT in localStorage, sent via Bearer token
- Protected routes via `ProtectedRoute.tsx`

---
For API and business logic details, see `api-endpoints.md` and `business-logic.md`.