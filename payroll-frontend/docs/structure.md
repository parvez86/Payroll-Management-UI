# Payroll Management System UI - Project Structure

This document provides a detailed overview of the folder and file structure for the Payroll Management System UI (React + TypeScript, Vite). Use this as a reference for navigation, onboarding, and development.

## Root Structure

```
payroll-frontend/
├── src/
│   ├── assets/                # Static assets (images, logos, etc.)
│   ├── components/            # All React components (see below)
│   ├── config/                # App configuration files
│   ├── contexts/              # React Context providers (global state)
│   ├── services/              # API integration and service logic
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility/helper functions
│   ├── App.tsx                # Main app entry (router)
│   ├── App-real-backend.tsx   # App entry for real backend
│   ├── App-simulated.tsx      # App entry for simulated backend
│   └── main.tsx               # Vite entry point
├── vite.config.ts             # Vite configuration
├── package.json               # Project dependencies
```

## Components Structure

```
src/components/
├── auth/
│   ├── Login.tsx              # Login form (JWT)
│   └── ProtectedRoute.tsx     # Route guard for authenticated pages
├── company/
│   └── CompanyAccount.tsx     # Company account balance, transactions, top-up
├── employee/
│   ├── EmployeeForm.tsx       # Employee create/edit form (validations)
│   └── EmployeeList.tsx       # Employee list, filtering, grade grouping
├── payroll/
│   └── PayrollProcess.tsx     # Salary calculation, batch transfer
├── shared/
│   ├── StatusMessage.tsx      # Reusable status/toast messages
│   └── TopUpModal.tsx         # Modal for company account top-up
├── Dashboard.tsx              # (Optional) Dashboard/landing page
├── ProgressDashboard.tsx      # (Optional) Progress/summary dashboard
```

## Contexts

```
src/contexts/
├── AuthContext.tsx            # Auth state (JWT, user, roles)
├── CompanyContext.tsx         # Company account, balance, transactions
├── EmployeeContext.tsx        # Employee list, grade validation
├── StatusMessageContext.tsx   # Global status/toast messages
```

## Services

```
src/services/
├── api.ts                     # Main API integration (axios, real backend)
├── apiClient.ts               # (Optional) Axios instance setup
├── validationService.ts       # (Optional) Form validation helpers
```

## Types

```
src/types/
├── index.ts                   # All main type definitions (Employee, Company, etc.)
```

## Utils

```
src/utils/
├── salaryCalculator.ts        # Salary calculation logic (business formula)
├── errorHandler.ts            # Error handling helpers
├── progressTracker.ts         # (Optional) Progress tracking logic
├── integrationTester.ts       # (Optional) API integration test helpers
```

---

# How to Use This Structure
- **Add new features** in the appropriate folder (e.g., new employee logic in `employee/`, new API in `services/`).
- **Type definitions** go in `src/types/index.ts`.
- **Global state** should use React Contexts in `src/contexts/`.
- **API calls** should use the `api.ts` service and types from `src/types/`.
- **Business logic** (salary, validation) should be in `utils/` or `services/`.

---

# Quick Reference
- **Login:** `src/components/auth/Login.tsx`
- **Employee CRUD:** `src/components/employee/`
- **Payroll:** `src/components/payroll/PayrollProcess.tsx`
- **Company Account:** `src/components/company/CompanyAccount.tsx`
- **API:** `src/services/api.ts`
- **Types:** `src/types/index.ts`
- **Salary Formula:** `src/utils/salaryCalculator.ts`

---

For more details, see the following documentation files:
- `docs/architecture.md` - High-level architecture
- `docs/api-endpoints.md` - Backend API endpoints
- `docs/business-logic.md` - Salary, validation, and business rules
- `docs/context-patterns.md` - State management patterns
- `docs/error-handling.md` - Error handling and UX patterns
- `docs/testing.md` - Testing and validation
