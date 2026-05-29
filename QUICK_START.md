# ⚡ Quick Start Guide - Payroll Management System

One-page reference for developers. For detailed documentation, see [README.md](README.md).

---

## 🚀 Start Development (30 seconds)

```powershell
# Install dependencies (only first time)
npm install

# Start dev server - opens at http://localhost:5173
npm run dev
```

**✅ That's it!** No subdirectory navigation needed.

**Login**: `admin` / `admin123`

---

## 🔧 Essential Commands

```powershell
# Development
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # Check code quality

# Cleanup
npm install      # Install dependencies
npm ci            # Clean install (CI environment)
```

---

## 🔌 API Configuration

### Mock Mode (No Backend Needed)
```typescript
// src/config/index.ts
USE_MOCK_API: true   // ← Offline development
```

### Real Backend Mode
```typescript
// src/config/index.ts
USE_MOCK_API: false  // ← Requires backend at localhost:20001
```

**Backend URL**: `http://localhost:20001/pms/api/v1`

---

## 📂 Key Files at a Glance

| Path | What | When to use |
|------|------|------------|
| `src/config/index.ts` | Business rules & API toggle | Toggle USE_MOCK_API |
| `src/utils/salaryCalculator.ts` | Salary logic | DO NOT MODIFY |
| `src/services/api.ts` | API client | Debug API calls |
| `src/components/` | React components | Add UI features |
| `src/contexts/` | State management | Manage global state |
| `docs/api-documentation.md` | API reference | API endpoint details |

---

## 🧪 Debug Common Issues

### Backend Not Found
```typescript
// src/config/index.ts
USE_MOCK_API: true  // Switch to mock mode first
```

### Invalid API Response
```typescript
// Always check success field
if (response.data.success) {
  // Use response.data.data
}
```

### Employee Constraints Not Met
```typescript
// Use validation functions
validateEmployeeId()      // Must be 4 digits
validateGradeDistribution()  // Must match: 1(1), 2(1), 3(2), etc.
```

---

## 📊 Project Status

| Component | Status |
|-----------|--------|
| Employee CRUD | ✅ Complete |
| Salary Calc | ✅ Complete |
| Payroll Transfer | ✅ Complete |
| Authentication | ✅ Complete |
| Mock API | ✅ Complete |
| Real Backend | ✅ Ready |

---

## 🎯 Common Tasks

### Add a New Component
1. Create file in `src/components/{feature}/`
2. Export from parent component
3. Use Context API for state
4. Style with CSS modules

### Call an API Endpoint
```typescript
import api from 'src/services/api';

const response = await api.post('/employees', employeeData);
if (response.data.success) {
  // Handle response
}
```

### Use Global State
```typescript
const { user, login } = useAuth();
const { employees, createEmployee } = useEmployeeContext();
```

---

## 📚 Documentation Links

- **Full README**: [README.md](README.md)
- **API Docs**: [docs/api-documentation.md](docs/api-documentation.md)
- **Feature Status**: [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)
- **Dev Guidelines**: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **Frontend Docs**: [docs/](docs/)

---

## ⚠️ Critical Rules

1. ❌ Don't modify `salaryCalculator.ts`
2. ❌ Don't skip API `success` check
3. ❌ Don't use Redux (use Context only)
4. ✅ Always validate employee constraints
5. ✅ Test with both API modes

---

## 💡 Pro Tips

- Use `USE_MOCK_API: true` for offline development
- Check Network tab in DevTools for API debugging
- Use browser Console to inspect context values
- Refer to existing components for patterns
- Read error messages carefully - they're informative

---

## 🆘 Need Help?

1. Check [docs/](docs/) folder for detailed docs
2. Read [.github/copilot-instructions.md](.github/copilot-instructions.md) for patterns
3. Review existing components in `src/components/`
4. Check test scenarios in `src/utils/integrationTester.ts`

**Last Updated**: May 2026
