# Error Handling & UX Patterns

## Form Validation
- Real-time validation for employee ID (4 digits, unique)
- Grade distribution checked before save
- Show inline errors for invalid fields

## API Errors
- All API errors logged in console (dev)
- User-facing errors shown via `StatusMessage` (toast)
- 401/403: Clear tokens, redirect to login
- 500+: Show generic error message
- Network/timeout: Show connection error

## Insufficient Funds
- Show modal with top-up option if payroll > balance

## Transfer Failures
- Show per-employee status (success/fail) in payroll sheet

---
See `structure.md` for file locations.