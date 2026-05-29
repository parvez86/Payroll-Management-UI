# Testing & Validation

## Manual Testing
- Login/logout flow
- Employee CRUD (ID/grade validation)
- Salary calculation (formula correctness)
- Payroll transfer (insufficient funds, status)
- Company account (balance, top-up, transactions)

## Automated Testing (suggested)
- Unit tests for salary calculation in `utils/salaryCalculator.ts`
- Integration tests for API in `services/apiTest.ts`
- Component tests for forms and lists

## Quick Test Checklist
- [ ] Can login and see dashboard
- [ ] Can add/edit/delete employee (with validation)
- [ ] Salary sheet matches formula
- [ ] Payroll transfer updates company balance
- [ ] Top-up increases balance
- [ ] All errors handled gracefully

---
See `structure.md` for file locations.