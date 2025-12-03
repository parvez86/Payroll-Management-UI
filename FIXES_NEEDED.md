## Fixes Required

### Issue 1: Dropdown showing "Primary Company" instead of actual companies
**Root Cause**: `companies()` computed signal is empty because `userContext.companyNames()` is not populated

**Fix**: Need to ensure `companyIds` from API response is properly stored and loaded in UserContextService

### Issue 2: Employee list title needs to be dynamic
**Current**: Always shows "All Employees (System-wide)" for ADMIN
**Expected**: Should change based on selected company:
- When "All" selected: "All Employees (System-wide)"  
- When specific company selected: "Employees - [Company Name]"

### Implementation Plan

1. **Fix company dropdown population**:
   - Verify `companyIds` array is in API response
   - Ensure it's stored correctly in localStorage
   - UserContextService should read from localStorage on init
   - Add console logging to debug

2. **Make employee list title dynamic**:
   - Get selected company from CompanySelectionService
   - Get company name from userContext.companyNames()
   - Return dynamic title based on selection

3. **Add method to employee-list.component.ts**:
```typescript
getEmployeeListTitle(): string {
  if (this.isAdmin()) {
    const selectedId = this.companySelection.selectedCompanyId();
    if (selectedId === '' || !selectedId) {
      return '👥 All Employees (System-wide)';
    }
    const companies = this.userContext.companyNames();
    const company = companies.find(c => c.id === selectedId);
    return company ? `👥 Employees - ${company.name}` : '👥 All Employees';
  }
  return this.listTitle();
}
```

4. **Update template**:
Change `{{ listTitle() }}` to `{{ getEmployeeListTitle() }}`
