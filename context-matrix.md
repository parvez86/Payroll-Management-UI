# Application Context Logic Matrix

| Component/Service         | Work/Responsibility         | Context Value(s) Used         | Context Setup/Update | Context Retrieve | Context Delete/Clear | Reload/Init Logic | Issues/Notes |
|--------------------------|-----------------------------|-------------------------------|---------------------|------------------|---------------------|-------------------|--------------|
| UserContextService       | User/session info, roles    | userProfile, companyId, roles | setCompanyContext, refreshProfile | getProfile, computed signals | clearProfile       | loadUserProfile (constructor), refreshProfile | ✔ Refresh after login/change, no business data stored |
| CompanySelectionService  | Global company selection     | selectedCompanyId             | setSelectedCompany, restoreFromStorage | selectedCompanyId | clear               | restoreFromStorage (init) | ✔ Always restored on init |
| EmployeeListComponent    | Employee list display/filter | companySelection.selectedCompanyId, userContext signals | -                 | signals, effect      | -                   | effect (company change), restoreFromStorage (ngOnInit) | ✔ Always reloads on company change, live fetch only |
| CompanyAccountComponent  | Company account info         | companySelection.selectedCompanyId, userContext signals | -                 | signals, effect      | -                   | effect (company change), restoreFromStorage (ngOnInit) | ✔ Always reloads on company change, live fetch only |
| PayrollProcessComponent  | Payroll processing           | companySelection.selectedCompanyId, userContext signals | -                 | signals, effect      | -                   | effect (company change), restoreFromStorage (ngOnInit) | ✔ Always reloads on company change, live fetch only |
| EmployeeService          | Employee API calls           | companyId (param)             | -                  | -                | -                   | -                 | ✔ Passes correct companyId param, no caching |
| CompanyService           | Company API calls            | companyId (param)             | -                  | -                | -                   | -                 | ✔ Passes correct companyId param, no caching |

**Legend:**
- Context Value(s): Signals or values used for app-wide state
- Setup/Update: How context is set/updated
- Retrieve: How context is read
- Delete/Clear: How context is cleared
- Reload/Init Logic: How/when context is reloaded or initialized
- Issues/Notes: Observed or potential issues

**Cross-Check Summary:**
- [x] Minimal context: Only keys/IDs, no business data stored
- [x] Live data fetch: All business data fetched from backend APIs
- [x] Reload/init consistency: All components call restoreFromStorage and use effects for reloads
- [x] Error handling: Context/services propagate errors to UI
- [x] Single source of truth: All components use central context signals
- [x] No duplication: No duplicate context logic or business data
- [x] Browser context: Only session info persisted, not business data

**Notes:**
- Application context = signals/services, not browser context (localStorage only for persistence)
- All components must reload data on context change (company/user)
- Effects should always listen to context signals
- Any missing reload/init logic will cause stale UI/data
- Matrix now reflects completed refactor and best practices
