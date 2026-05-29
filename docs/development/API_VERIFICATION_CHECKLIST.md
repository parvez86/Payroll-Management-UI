# 🔍 API Integration Checklist for UI Team

## 📋 **Backend API Availability Check**

**Document Purpose:** Verify which APIs are implemented, available, and ready for frontend integration  
**Target Audience:** UI Development Team  
**Last Updated:** October 21, 2025  
**Backend Base URL:** `http://localhost:20001/pms/v1/api`

---

## 🔐 **1. AUTHENTICATION ENDPOINTS**

### ✅ **Login API**
- **Endpoint:** `POST /auth/login`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**Request Format:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "ADMIN"
    }
  }
}
```

**UI Team Checklist:**
- [ ] **Test with curl:** `curl -X POST http://localhost:20001/pms/v1/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'`
- [ ] **Verify JWT token format:** Is token valid and parseable?
- [ ] **Check user object:** Does it contain required fields (id, username, role)?
- [ ] **Test invalid credentials:** Returns proper 401 error?

---

### ✅ **Logout API**
- **Endpoint:** `POST /auth/logout`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**Request Format:**
```json
Headers: {
  "Authorization": "Bearer <jwt_token>"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

**UI Team Checklist:**
- [ ] **Test logout:** Does it properly invalidate the token?
- [ ] **Header validation:** Requires Authorization header?
- [ ] **Error handling:** Returns 401 for invalid/missing token?

---

## 👥 **2. EMPLOYEE MANAGEMENT ENDPOINTS**

### ✅ **Get All Employees**
- **Endpoint:** `GET /employees`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**Request Format:**
```json
Headers: {
  "Authorization": "Bearer <jwt_token>"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": [
    {
      "id": "1001",
      "name": "John A",
      "grade": 1,
      "address": "Dhaka",
      "mobile": "01700000001",
      "bankAccount": {
        "type": "Current",
        "name": "John A",
        "number": "1234567890",
        "balance": 5000,
        "bank": "Global Bank",
        "branch": "Main"
      }
    }
  ]
}
```

**UI Team Checklist:**
- [ ] **Test endpoint:** Returns array of employees?
- [ ] **Verify structure:** Each employee has all required fields?
- [ ] **Check bankAccount:** Nested object with correct structure?
- [ ] **Grade distribution:** Follows business rules (1:1, 2:1, 3:2, 4:2, 5:2, 6:2)?
- [ ] **Maximum employees:** Currently enforces 10 employee limit?

---

### ✅ **Get Employee by ID**
- **Endpoint:** `GET /employees/{id}`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**UI Team Checklist:**
- [ ] **Test valid ID:** `curl -X GET http://localhost:20001/pms/v1/api/employees/1001 -H "Authorization: Bearer <token>"`
- [ ] **Test invalid ID:** Returns 404 for non-existent employee?
- [ ] **Response format:** Same structure as employee in array?

---

### ✅ **Create Employee**
- **Endpoint:** `POST /employees`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**Request Format:**
```json
{
  "id": "1011",
  "name": "New Employee",
  "grade": 3,
  "address": "Sylhet",
  "mobile": "01700000011",
  "bankAccount": {
    "type": "Savings",
    "name": "New Employee",
    "number": "1234567900",
    "balance": 0,
    "bank": "Test Bank",
    "branch": "Main"
  }
}
```

**UI Team Checklist:**
- [ ] **Test creation:** Successfully creates new employee?
- [ ] **Validation errors:** Returns 400 with detailed error messages?
- [ ] **ID uniqueness:** Rejects duplicate employee IDs?
- [ ] **Mobile uniqueness:** Rejects duplicate mobile numbers?
- [ ] **Grade limits:** Enforces grade distribution limits?
- [ ] **4-digit ID:** Validates ID format (exactly 4 digits)?
- [ ] **Mobile format:** Validates Bangladesh mobile format?

**Expected Validation Errors:**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      "Employee ID must be 4 digits",
      "Grade limit exceeded for grade 3",
      "Mobile number already exists"
    ]
  }
}
```

---

### ✅ **Update Employee**
- **Endpoint:** `PUT /employees/{id}`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**UI Team Checklist:**
- [ ] **Test update:** Partial updates work correctly?
- [ ] **ID immutability:** Can employee ID be changed?
- [ ] **Validation:** Same validation rules as create?
- [ ] **404 handling:** Returns error for non-existent employee?

---

### ✅ **Delete Employee**
- **Endpoint:** `DELETE /employees/{id}`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**UI Team Checklist:**
- [ ] **Test deletion:** Successfully removes employee?
- [ ] **404 handling:** Returns error for non-existent employee?
- [ ] **Response format:** Returns success message?

---

## 💰 **3. PAYROLL MANAGEMENT ENDPOINTS**

### ✅ **Calculate Salaries**
- **Endpoint:** `POST /payroll/calculate`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**Request Format:**
```json
{
  "grade6Basic": 25000
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Salaries calculated successfully",
  "data": {
    "employees": [
      {
        "id": "1001",
        "name": "John A",
        "grade": 1,
        "salary": {
          "basic": 50000,
          "houseRent": 10000,
          "medicalAllowance": 7500,
          "gross": 67500
        }
      }
    ],
    "totalSalaryRequired": 450000,
    "calculatedAt": "2025-01-01T12:00:00Z"
  }
}
```

**UI Team Checklist:**
- [ ] **Test calculation:** Correct salary formula implementation?
  - Basic = grade6Basic + (6 - grade) × 5000
  - HRA = Basic × 20%
  - Medical = Basic × 15%
  - Gross = Basic + HRA + Medical
- [ ] **All employees:** Includes all active employees?
- [ ] **Total calculation:** Correct sum of all gross salaries?

---

### ✅ **Get Salary Calculation**
- **Endpoint:** `GET /payroll/calculate?grade6Basic={amount}`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**UI Team Checklist:**
- [ ] **Query parameter:** Accepts grade6Basic as URL parameter?
- [ ] **Same response:** Returns same format as POST version?

---

### ✅ **Process Salary Transfer**
- **Endpoint:** `POST /payroll/transfer`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**Request Format:**
```json
{
  "employeeIds": ["1001", "1002", "1003"],
  "grade6Basic": 25000
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Salary transfer completed",
  "data": {
    "transferResults": [
      {
        "employeeId": "1001",
        "name": "John A",
        "salaryAmount": 67500,
        "status": "SUCCESS",
        "transferredAt": "2025-01-01T12:00:00Z"
      },
      {
        "employeeId": "1002",
        "name": "Jane B",
        "salaryAmount": 62500,
        "status": "FAILED",
        "reason": "Insufficient company balance"
      }
    ],
    "totalTransferred": 67500,
    "totalFailed": 62500,
    "companyBalanceAfter": 32500
  }
}
```

**UI Team Checklist:**
- [ ] **Balance checking:** Validates company account balance?
- [ ] **Individual status:** Shows success/failure per employee?
- [ ] **Partial transfers:** Handles cases where some transfers fail?
- [ ] **Account updates:** Updates employee bank account balances?
- [ ] **Company balance:** Updates company account balance?

---

### ✅ **Get Salary Sheet**
- **Endpoint:** `GET /payroll/salary-sheet?grade6Basic={amount}`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**Expected Response:**
```json
{
  "success": true,
  "message": "Salary sheet generated successfully",
  "data": {
    "employees": [
      {
        "id": "1001",
        "name": "John A",
        "grade": 1,
        "salary": {
          "basic": 50000,
          "houseRent": 10000,
          "medicalAllowance": 7500,
          "gross": 67500,
          "isPaid": true,
          "paidAt": "2025-01-01T12:00:00Z"
        }
      }
    ],
    "summary": {
      "totalEmployees": 10,
      "totalSalaryRequired": 450000,
      "totalPaid": 300000,
      "totalPending": 150000,
      "companyBalance": 100000
    },
    "generatedAt": "2025-01-01T12:00:00Z"
  }
}
```

**UI Team Checklist:**
- [ ] **Payment status:** Shows which employees have been paid?
- [ ] **Summary totals:** Correct calculation of totals?
- [ ] **Company balance:** Current company account balance?

---

## 🏢 **4. COMPANY ACCOUNT ENDPOINTS**

### ✅ **Get Company Account**
- **Endpoint:** `GET /company/account`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**Expected Response:**
```json
{
  "success": true,
  "message": "Company account details retrieved",
  "data": {
    "accountNumber": "COMP-001",
    "accountName": "Company Main Account",
    "currentBalance": 500000,
    "bank": "Central Bank",
    "branch": "Head Office",
    "lastUpdated": "2025-01-01T12:00:00Z"
  }
}
```

**UI Team Checklist:**
- [ ] **Real-time balance:** Returns current account balance?
- [ ] **Account details:** All required fields present?
- [ ] **Last updated:** Timestamp of last balance change?

---

### ✅ **Top-up Company Account**
- **Endpoint:** `POST /company/topup`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**Request Format:**
```json
{
  "amount": 100000,
  "description": "Monthly fund allocation"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account topped up successfully",
  "data": {
    "previousBalance": 500000,
    "topupAmount": 100000,
    "newBalance": 600000,
    "transactionId": "TXN-20250101120000",
    "timestamp": "2025-01-01T12:00:00Z"
  }
}
```

**UI Team Checklist:**
- [ ] **Balance update:** Updates company account balance?
- [ ] **Transaction ID:** Generates unique transaction ID?
- [ ] **Amount validation:** Validates positive amounts?
- [ ] **Description:** Accepts custom description?

---

### ✅ **Get Transaction History**
- **Endpoint:** `GET /company/transactions?limit={limit}&offset={offset}`
- **Status:** ❓ Needs Verification
- **Priority:** 🔥 Critical

**Expected Response:**
```json
{
  "success": true,
  "message": "Transaction history retrieved",
  "data": {
    "transactions": [
      {
        "id": "TXN-20250101120000",
        "type": "TOPUP",
        "amount": 100000,
        "description": "Monthly fund allocation",
        "balanceAfter": 600000,
        "timestamp": "2025-01-01T12:00:00Z"
      },
      {
        "id": "TXN-20250101110000",
        "type": "SALARY_TRANSFER",
        "amount": -67500,
        "description": "Salary transfer to John A (1001)",
        "balanceAfter": 500000,
        "timestamp": "2025-01-01T11:00:00Z"
      }
    ],
    "totalCount": 25,
    "hasMore": true
  }
}
```

**UI Team Checklist:**
- [ ] **Pagination:** Supports limit and offset parameters?
- [ ] **Transaction types:** Includes both TOPUP and SALARY_TRANSFER?
- [ ] **Negative amounts:** Shows salary transfers as negative amounts?
- [ ] **Balance tracking:** Shows balance after each transaction?
- [ ] **Chronological order:** Most recent transactions first?

---

## 🔧 **5. TECHNICAL IMPLEMENTATION CHECKLIST**

### **🌐 Server & Environment**
- [ ] **Backend server running:** `http://localhost:20001` accessible?
- [ ] **Health check:** `GET /health` endpoint available?
- [ ] **CORS headers:** Allows requests from `http://localhost:3000`?
- [ ] **JSON content type:** Accepts and returns `application/json`?

### **🔐 Authentication & Security**
- [ ] **JWT implementation:** Tokens properly signed and validated?
- [ ] **Token expiration:** Handles token expiry correctly?
- [ ] **Protected routes:** All non-auth endpoints require valid token?
- [ ] **401 handling:** Returns proper error for invalid/missing tokens?

### **📊 Data Validation**
- [ ] **Employee ID:** Exactly 4 digits, unique across system?
- [ ] **Mobile numbers:** Valid Bangladesh format (017/018/019/015/016/013/014)?
- [ ] **Grade distribution:** Enforces business rules (1:1, 2:1, 3:2, 4:2, 5:2, 6:2)?
- [ ] **Employee limit:** Maximum 10 employees total?
- [ ] **Bank account:** 10-20 digit account numbers?

### **💰 Business Logic**
- [ ] **Salary calculation:** Correct formula implementation?
- [ ] **Balance checking:** Prevents overdrafts in company account?
- [ ] **Transaction logging:** All balance changes recorded?
- [ ] **Atomic operations:** Transfers are all-or-nothing?

---

## 🚨 **CRITICAL ISSUES TO VERIFY**

### **Priority 1 - Blocking Issues**
1. **Database connectivity:** Is the backend connected to a real database?
2. **Data persistence:** Do changes persist after server restart?
3. **Transaction integrity:** Are salary transfers atomic?
4. **Authentication security:** Are tokens properly validated?

### **Priority 2 - Business Logic**
1. **Employee validation:** All business rules enforced?
2. **Salary calculation:** Matches documented formula exactly?
3. **Grade distribution:** Enforced at database level?
4. **Balance management:** Prevents negative company balances?

### **Priority 3 - API Compliance**
1. **Response format:** All responses follow documented structure?
2. **Error messages:** Consistent error response format?
3. **HTTP status codes:** Proper use of 200, 201, 400, 401, 404, etc.?
4. **Pagination:** Consistent across all list endpoints?

---

## 📋 **TESTING COMMANDS FOR UI TEAM**

### **Quick API Test Script**
```bash
# 1. Test server connectivity
curl -X GET http://localhost:20001/pms/v1/api/health

# 2. Test login
curl -X POST http://localhost:20001/pms/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 3. Test get employees (replace <TOKEN> with actual token)
curl -X GET http://localhost:20001/pms/v1/api/employees \
  -H "Authorization: Bearer <TOKEN>"

# 4. Test company account
curl -X GET http://localhost:20001/pms/v1/api/company/account \
  -H "Authorization: Bearer <TOKEN>"

# 5. Test salary calculation
curl -X POST http://localhost:20001/pms/v1/api/payroll/calculate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"grade6Basic":25000}'
```

### **Frontend Integration Test**
```typescript
// Test in browser console after starting frontend
// 1. Switch to real API mode
// Update src/config/index.ts: USE_MOCK_API: false

// 2. Test authentication
import { authService } from './src/services/api';
authService.login({ username: 'admin', password: 'admin123' });

// 3. Test employee service
import { employeeService } from './src/services/api';
employeeService.getAll();

// 4. Test payroll service
import { payrollService } from './src/services/api';
payrollService.calculateSalaries(25000);
```

---

## ✅ **COMPLETION CHECKLIST**

Mark each section when verified and working:

**Authentication:**
- [ ] Login works with real credentials
- [ ] Logout invalidates token
- [ ] Protected routes reject invalid tokens

**Employee Management:**
- [ ] Can retrieve all employees from database
- [ ] Can create new employees with validation
- [ ] Can update existing employees
- [ ] Can delete employees
- [ ] All business rules enforced

**Payroll Management:**
- [ ] Salary calculation works correctly
- [ ] Can process salary transfers
- [ ] Company balance updates correctly
- [ ] Transaction history maintained

**Company Account:**
- [ ] Can view real account balance
- [ ] Can top-up account balance
- [ ] Transaction history shows all activities

**Technical Requirements:**
- [ ] All APIs return consistent response format
- [ ] Error handling works correctly
- [ ] Data persists across server restarts
- [ ] Performance is acceptable (< 2 seconds per request)

---

## 📝 **NOTES FOR UI TEAM**

### **Configuration Changes Needed:**
1. Set `USE_MOCK_API: false` in `src/config/index.ts`
2. Ensure backend URL is correct: `http://localhost:20001/pms/v1/api`
3. Update any hardcoded demo data to use real API responses

### **Error Scenarios to Test:**
1. **Network issues:** Backend server not running
2. **Authentication:** Invalid credentials, expired tokens
3. **Validation:** Invalid employee data, business rule violations
4. **Business logic:** Insufficient company balance, duplicate IDs

### **Performance Considerations:**
1. **Loading states:** All API calls should show loading indicators
2. **Error handling:** User-friendly error messages
3. **Retry logic:** Handle temporary network failures
4. **Caching:** Consider caching employee list for better performance

---

**🎯 Goal:** Complete verification that all APIs work with real backend data, no mock/simulation logic remains**

*Last Updated: October 21, 2025 | Status: Awaiting Backend Verification*