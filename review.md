# Payroll Management System – Codebase Review (Dec 2025)

## 1. Architecture & Structure
- **Monorepo**: Contains React (`payroll-frontend/`), Angular (`payroll-angular/`), and shared documentation (`docs/`).
- **Backend**: Spring Boot API (external, not in repo).
- **Frontends**:
  - **React**: Context API for state, dynamic API mode (mock/real), salary logic centralized in `src/utils/salaryCalculator.ts`.
  - **Angular**: Standalone components, signals, functional services, RBAC via `UserContextService`, enforced modern Angular 21 patterns.

## 2. Key Business Logic
- **Salary Calculation**: Only in `salaryCalculator.ts` (React) and `salary-calculator.ts` (Angular). Formula and grade distribution are fixed and validated.
- **Employee Constraints**: 10 employees, strict grade distribution, 4-digit unique IDs, bank account auto-created by backend.

## 3. State Management & Patterns
- **React**: Context Providers for Auth, Employee, Company, StatusMessage. No Redux. API mode toggled in `src/config/index.ts`.
- **Angular**: Signals for state, `inject()` for DI, native control flow (`@if`, `@for`), OnPush change detection, host bindings in decorator, input/output as functions.

## 4. API Integration
- **JWT Handling**: Both frontends auto-inject JWT from `localStorage.accessToken` via interceptors/services.
- **API Response**: Always `{ success, message, data }`. All endpoints except `/auth/login` require JWT.
- **Endpoints**: Auth, employee, payroll, company, transactions. See `docs/api-documentation.md`.

## 5. Component & Service Boundaries
- **React**: Modular components (auth, employee, payroll, company, shared UI). API layer in `src/services/api.ts`.
- **Angular**: Modular components and services. RBAC centralized in `user-context.service.ts`. Multi-company support via `company-selection.service.ts`.

## 6. Developer Workflow
- **React**: `npm install; npm run dev` (port 5173). Use mock API for offline dev.
- **Angular**: `npm install; npm start` (port 4200). Requires backend running.
- **Build**: `npm run build` in each frontend.
- **Debug**: Console logs via interceptors; errors surfaced via context (React) or toast (Angular).
- **Manual Integration Tests**: See `payroll-frontend/src/utils/integrationTester.ts`.

## 7. Conventions & Pitfalls
- **Never duplicate salary logic** – always use provided utilities.
- **Validate grade distribution and employee ID** before create/update.
- **Angular**: Never set `standalone: true`, use signals (`update`/`set`), not `mutate`.
- **React**: Toggle API mode in config.
- **Windows PowerShell**: Use `;` for command chaining.

## 8. Documentation & Migration
- **Docs**: `README.md`, `development.md`, `docs/IMPLEMENTATION_STATUS.md`.
- **Angular Migration**: `ANGULAR_MIGRATION_MASTER_PLAN.md`, `AGENTS.md` (Angular 21 patterns).

## 9. Current State & Status
- **React**: 95% complete, production-ready, real API integrated, manual tests only.
- **Angular**: 95% complete, component-based, final integration testing with backend.
- **Backend**: Complete, JWT auth, all endpoints documented.

## 10. Recommendations
- **Follow framework conventions strictly**.
- **Consult docs before changes**.
- **Test with both API modes (React)**.
- **Use provided utilities for validation and salary logic**.

---
This review summarizes the current codebase state, key patterns, and developer workflow. For deeper details, see referenced files and documentation.