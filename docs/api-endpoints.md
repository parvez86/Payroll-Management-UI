# Payroll Management System - API Endpoints

## Base URL
`http://localhost:20001/pms/api/v1`

## Auth
- `POST /auth/login` - Login, returns JWT
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout

## Employee
- `GET /employees` - List employees (paginated)
- `GET /employees/{id}` - Get employee by ID
- `POST /employees` - Create employee
- `PUT /employees/{id}` - Update employee
- `DELETE /employees/{id}` - Delete employee

## Payroll
- `POST /payroll/calculate` - Calculate salaries (input: grade6Basic)
- `GET /payroll/calculate?grade6Basic=...` - Get salary calculation
- `POST /payroll/transfer` - Process salary transfer
- `GET /payroll/salary-sheet?grade6Basic=...` - Get salary sheet

## Company
- `GET /companies/{companyId}` - Get company account
- `POST /company/topup` - Top up company account
- `GET /company/transactions` - Get transaction history (limit, offset)

---
See `business-logic.md` for rules and `structure.md` for file locations.