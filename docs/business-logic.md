# Payroll Management System - Business Logic

## Salary Calculation
```
const calculateSalary = (grade, baseSalaryGrade6) => {
  const basic = baseSalaryGrade6 + (6 - grade) * 5000;
  const hra = basic * 0.20;
  const medical = basic * 0.15;
  const gross = basic + hra + medical;
  return { basic, hra, medical, gross };
};
```
- **Always use this formula.**

## Employee Validation
- **ID:** 4 digits, unique
- **Grade distribution:** { 1:1, 2:1, 3:2, 4:2, 5:2, 6:2 }
- **Auto-create bank account on employee creation**

## Payroll Transfer
- Show salary for all employees
- Show total vs company balance
- If insufficient funds, prompt top-up
- Process transfer, show per-employee status

## Company Account
- Show balance, allow top-up
- Show transaction history

---
See `api-endpoints.md` for endpoints and `structure.md` for file locations.