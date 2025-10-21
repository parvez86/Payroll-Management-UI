# Payroll Management System - Frontend

A comprehensive React TypeScript application for managing employee payrolls with grade-based salary calculations, batch processing, and company account management.

## 🚀 Quick Start

### Development Mode (Static Mock Data)
```bash
cd payroll-frontend
npm install
npm run dev
```

Visit: http://localhost:5173/

**Demo Credentials:**
- Username: `admin`
- Password: `admin123`

### Production Mode (With Backend API)
1. Update configuration in `src/config/index.ts`:
```typescript
export const config = {
  USE_MOCK_API: false, // Switch to real API
  API_BASE_URL: 'http://your-backend-url/pms/v1/api',
  // ... rest of config
};
```

2. Build and deploy:
```bash
npm run build
npm run preview
```

## 🏗️ Architecture

### Key Features
- **Employee Management**: CRUD operations with business rule validation
- **Payroll Processing**: Batch salary calculations and transfers
- **Company Account**: Balance management and top-up functionality
- **Grade-based Salary**: Configurable salary structure (Grade 1-6)
- **Real-time Dashboard**: Live status monitoring and insights

### Business Rules
- **Total Employees**: Exactly 10 (Grade 1:1, 2:1, 3:2, 4:2, 5:2, 6:2)
- **Employee IDs**: 4-digit unique identifiers
- **Salary Formula**: Basic + HRA(20%) + Medical(15%)
- **Grade Calculation**: Grade 6 base + (6-grade) × 5000 increment

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Styling**: CSS Modules with responsive design

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/                → Authentication components
│   ├── employee/            → Employee CRUD operations
│   ├── payroll/            → Salary calculation & processing
│   ├── company/            → Company account management
│   └── shared/             → Reusable UI components
├── contexts/               → React Context providers
├── services/
│   ├── api.ts             → API integration layer
│   └── mockAPI.ts         → Development mock data
├── utils/                 → Business logic utilities
├── types/                 → TypeScript type definitions
├── config/                → Application configuration
└── App.tsx                → Main application router
```

## 🔧 Configuration

### Environment Switching
Update `src/config/index.ts` to switch between modes:

```typescript
export const config = {
  // Set to false for production API
  USE_MOCK_API: true,
  
  // Backend API endpoint
  API_BASE_URL: 'http://localhost:8080/pms/v1/api',
  
  // Business rules
  MAX_EMPLOYEES: 10,
  GRADE_DISTRIBUTION: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2 },
  
  // Salary calculation
  DEFAULT_BASE_SALARY_GRADE_6: 30000,
  HRA_PERCENTAGE: 0.20,
  MEDICAL_PERCENTAGE: 0.15,
  GRADE_INCREMENT: 5000,
  
  // Demo credentials
  DEMO_CREDENTIALS: {
    username: 'admin',
    password: 'admin123'
  }
};
```

### API Endpoints
The application expects these backend endpoints:

#### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh

#### Employee Management  
- `GET /employees` - List all employees
- `POST /employees` - Create employee
- `GET /employees/{id}` - Get employee details
- `PUT /employees/{id}` - Update employee
- `DELETE /employees/{id}` - Delete employee

#### Payroll Processing
- `GET /payroll/calculate` - Preview salary calculations
- `POST /payroll/batches` - Create payroll batch
- `POST /payroll/batches/{id}/process` - Execute payroll transfer

#### Company Account
- `GET /company/account` - Get company balance
- `POST /company/topup` - Add funds to account
- `GET /company/transactions` - Transaction history

## 🎯 Key Features

### Employee Management
- ✅ Create, read, update, delete employees
- ✅ 4-digit ID validation and uniqueness check
- ✅ Grade distribution enforcement (1:1, 2:1, 3:2, 4:2, 5:2, 6:2)
- ✅ Bank account auto-creation
- ✅ Mobile-responsive employee list

### Payroll Processing
- ✅ Real-time salary calculations
- ✅ Batch processing with status tracking
- ✅ Insufficient funds detection and handling
- ✅ Individual transfer success/failure tracking
- ✅ Comprehensive salary breakdown display

### Company Account
- ✅ Real-time balance monitoring
- ✅ Quick top-up functionality
- ✅ Transaction history with filtering
- ✅ Balance insights and recommendations
- ✅ Multi-currency support preparation

### Dashboard & Reporting
- ✅ Executive summary with key metrics
- ✅ Grade distribution visualization
- ✅ System health status indicators
- ✅ Quick action shortcuts
- ✅ Responsive design for all devices

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Route Protection**: Private routes for authenticated users
- **Input Validation**: Client-side and server-side validation
- **Error Handling**: Comprehensive error management
- **Session Management**: Automatic token refresh and logout

## 🧪 Testing

### Manual Testing
1. **Login Flow**: Test authentication with demo credentials
2. **Employee CRUD**: Add/edit/delete employees with validation
3. **Payroll Processing**: Process payroll with insufficient funds scenario
4. **Account Management**: Top-up company account and view transactions
5. **Responsive Design**: Test on different screen sizes

## 📦 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 🐛 Troubleshooting

### Common Issues

1. **404 Not Found**: Ensure Vite server is running on correct port
2. **API Connection Failed**: Check backend URL in config
3. **Login Issues**: Verify demo credentials or backend authentication
4. **Build Errors**: Check TypeScript configuration and dependencies

### Development Tips

1. **Mock vs Real API**: Use `config.USE_MOCK_API` to switch modes
2. **Hot Reload**: Vite automatically reloads on file changes
3. **Console Debugging**: Check browser console for detailed errors
4. **Network Tab**: Monitor API calls in browser developer tools

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Compatibility**: React 19, TypeScript 5.9, Vite 7
