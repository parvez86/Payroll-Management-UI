# State Management Patterns

## Contexts Used
- **AuthContext:** JWT, user, roles
- **EmployeeContext:** Employee list, grade validation
- **CompanyContext:** Account, balance, transactions
- **StatusMessageContext:** Global status/toast

## Usage
- Wrap `App.tsx` with all providers
- Use `useContext` in components
- Update context after API calls

## Example
```
<AuthProvider>
  <EmployeeProvider>
    <CompanyProvider>
      <StatusMessageProvider>
        <App />
      </StatusMessageProvider>
    </CompanyProvider>
  </EmployeeProvider>
</AuthProvider>
```

---
See `structure.md` for file locations.