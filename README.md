# 💼 Payroll Management System - React Frontend

## 🎯 Project Overview

A comprehensive React web application for calculating and managing employee salaries with a grade-based system. Features full CRUD operations, role-based access control, and real-time payroll processing.

**Status**: ✅ Production Ready (90-95% complete, all core features working)

---

## 🏗️ Architecture

```
Payroll-Management-UI/               ← React Frontend Root
├── src/                           → React TypeScript source code
├── public/                        → Static assets
├── docs/                          → Documentation
├── .github/
│   └── copilot-instructions.md   → AI development guidelines
├── package.json                   → React dependencies
├── vite.config.ts                 → Vite configuration
├── index.html                     → Entry point
├── README.md                      → Project overview
└── QUICK_START.md                 → Quick reference
```

**Backend**: Spring Boot 3.5.6 API (separate repo)  
**API Base URL**: `http://localhost:20001/pms/api/v1`

---

## ✨ Key Features

### 🏢 **Business Logic**
- **Grade-Based Salary System**: 6 grades with automatic calculation
- **Employee Management**: CRUD operations with validation
- **Payroll Processing**: Company account to employee transfers
- **Batch Processing**: Calculate and transfer salaries in bulk
- **Role-Based Access Control**: Admin, Employer, Employee roles
- **Multi-Company Support**: Manage multiple companies per user
- **Insufficient Funds Handling**: Automatic top-up prompts
- **Transaction History**: Track all salary transfers

### 💻 **Technical Features**
- **Framework**: React 19 + TypeScript + Vite
- **UI/UX**: Professional React components with CSS modules
- **State Management**: Context API (no Redux)
- **API Modes**: Toggle between mock (offline) and real backend
- **Authentication**: JWT-based login with token refresh
- **HTTP Interceptors**: Auto JWT injection, error handling
- **Responsive Design**: Mobile and desktop optimized

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- Backend running at `localhost:20001` (optional for mock mode)

### **Development Setup**
```powershell
# Install dependencies (first time only)
npm install

# Start development server → http://localhost:5173
npm run dev
```

### **Quick Login**
- **Username**: admin
- **Password**: admin123

### **API Mode Toggle** (React Only)
Edit `src/config/index.ts`:
```typescript
USE_MOCK_API: true   // Mock data (offline development)
USE_MOCK_API: false  // Real backend (requires http://localhost:20001)
```

---

## 📊 Business Requirements

### **Employee Structure**
- **Total**: 10 employees
- **Distribution**: Grade 1(1), Grade 2(1), Grade 3(2), Grade 4(2), Grade 5(2), Grade 6(2)
- **Employee ID**: 4-digit unique identifier
- **Constraints**: Automatically validated on create/update

### **Salary Calculation**
```
Basic Salary = Grade 6 Base + (6 - Employee Grade) × 5,000 BDT
House Rent = 20% of Basic
Medical = 15% of Basic
Gross = Basic + House Rent + Medical
```

### **Transfer System**
- Company account → Employee bank accounts (batch)
- Insufficient funds → Top-up with company funds
- Real-time balance updates
- Full transaction history

---

## 🎯 Project Status

| Feature | Status | Details |
|---------|--------|---------|
| **Employee CRUD** | ✅ Complete | Full create, read, update, delete operations |
| **Salary Calculation** | ✅ Complete | Grade-based automatic calculation |
| **Payroll Processing** | ✅ Complete | Batch calculate and transfer |
| **Authentication** | ✅ Complete | JWT login with token refresh |
| **RBAC** | ✅ Complete | Admin, Employer, Employee roles |
| **Company Management** | ✅ Complete | Multi-company support |
| **Mock API** | ✅ Complete | Offline development mode |
| **Real Backend** | ✅ Complete | Full integration ready |

See [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) for detailed feature tracking.

---

## 📁 Project Structure

### **Project Structure** (`src/`)
```
src/
├── components/          → React components (auth, employee, payroll, company)
├── contexts/           → Context API providers (auth, status, etc.)
├── services/           → API integration layer
├── utils/              → Helpers (salary calculator, validators)
├── types/              → TypeScript interfaces
├── mocks/              → Mock API data for offline development
├── config/             → Business rules and constants
├── assets/             → Images, icons
├── App.tsx             → Main router
└── main.tsx            → Entry point
```

### **Documentation** (`docs/`)
- `api-documentation.md` - REST API endpoints and contracts
- `IMPLEMENTATION_STATUS.md` - Feature completion tracker
- `README.md` - Documentation index

---

## 🔌 API Integration

### **Base URL**
```
http://localhost:20001/pms/api/v1
```

### **Authentication**
- JWT Bearer token required (except `/auth/login`)
- Token stored in `localStorage` as `accessToken`
- Auto-injected in request headers

### **Response Format** (All Endpoints)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ }
}
```

### **Key Endpoints**
```
POST   /auth/login              # Login (returns JWT + refreshToken)
GET    /auth/me                 # User profile + company context
GET    /employees               # List employees (filtered by role)
POST   /employees               # Create employee
PUT    /employees/{id}          # Update employee
DELETE /employees/{id}          # Delete employee
POST   /payroll/calculate       # Calculate salaries
POST   /payroll/transfer        # Batch salary transfer
GET    /companies/{id}          # Get company account
POST   /company/topup           # Top up company account
GET    /company/transactions    # Transaction history
```

See [docs/api-documentation.md](docs/api-documentation.md) for complete endpoint details.

---

## 🛠️ Development Workflow

### **Build for Production**
```powershell
cd payroll-frontend
npm run build
# Output: dist/ folder ready for deployment
```

### **Code Quality**
```powershell
cd payroll-frontend
npm run lint     # ESLint check
```

### **Environment Setup**
- Copy `.env.development` to `.env.local` (if needed)
- Configure `USE_MOCK_API` in `src/config/index.ts`

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `src/utils/salaryCalculator.ts` | Salary calculation logic (DO NOT MODIFY) |
| `src/config/index.ts` | Business rules, employee constraints |
| `src/services/api.ts` | API integration layer |
| `.github/copilot-instructions.md` | AI development guidelines |
| `docs/api-documentation.md` | API contracts |
| `docs/IMPLEMENTATION_STATUS.md` | Feature tracking |

---

## 🧪 Testing

### **Manual Integration Testing**
Use `src/utils/integrationTester.ts` for API verification.

### **API Testing**
1. Toggle `USE_MOCK_API` to `false` in config
2. Ensure backend is running at `localhost:20001`
3. Test endpoints with various roles (admin, employer, employee)

---

## ⚠️ Critical Rules

1. **Never modify salary calculation logic** - Use only `salaryCalculator.ts`
2. **Grade distribution must be validated** - Use `validateGradeDistribution()`
3. **Employee ID must be 4 digits** - Validated by `validateEmployeeId()`
4. **Always check API `success` field** - Before accessing response `data`
5. **JWT token required** - For all protected endpoints

---

## 🤝 Contributing

1. Read [.github/copilot-instructions.md](.github/copilot-instructions.md) for development guidelines
2. Follow React best practices (Context API, no Redux)
3. Test with both mock and real API modes
4. Validate salary calculations and grade distributions

---

## 📄 License

This project is licensed under the MIT License.

---

## 📖 Documentation Links

- [Quick Start Guide](QUICK_START.md) - Developer quick reference
- [API Documentation](docs/api-documentation.md) - REST endpoints
- [Implementation Status](docs/IMPLEMENTATION_STATUS.md) - Feature tracker
- [AI Development Guide](.github/copilot-instructions.md) - Coding patterns

- **Frontend Developer**: React + TypeScript implementation
- **Backend Developer**: Spring Boot + Java implementation
- **Full-Stack Integration**: API connection and deployment

---

**🎯 Assignment Status: 95% Complete - Ready for Production Integration**