# Frontend Integration API Reference
## Request/Response Formats for Immediate Integration

---

## 🔗 **Base Configuration**
```typescript
const API_BASE_URL = "http://localhost:20001/pms/api/v1"
const HEADERS = {
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>" // For protected endpoints
}
```

---

## 🔐 **Authentication APIs**

### **1. Login**
```http
POST /auth/login
Content-Type: application/json
```

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "email": "admin@payroll.com",
    "role": "ADMIN"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "timestamp": "2025-10-21T10:30:00.000Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials",
  "path": "/api/v1/auth/login"
}
```

### **2. Logout**
```http
POST /auth/logout
Authorization: Bearer <jwt_token>
```

**Request:** (Empty body)
```json
{}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 👥 **Employee Management APIs**

### **3. Get All Employees**
```http
GET /employees?page=0&size=20
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "bizId": "1001",
      "name": "Ahmed Rahman",
      "mobile": "01711123456",
      "address": "Gulshan-2, Dhaka",
      "grade": {
        "id": "grade-uuid-1",
        "name": "Grade 1",
        "rank": 1
      },
      "account": {
        "id": "account-uuid-1",
        "accountName": "Ahmed Rahman",
        "accountNumber": "EMP001",
        "accountType": "SAVINGS",
        "balance": 75000.00,
        "branch": {
          "id": "branch-uuid-1",
          "branchName": "Motijheel Branch",
          "bank": {
            "id": "bank-uuid-1",
            "name": "Bangladesh Bank"
          }
        }
      },
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "totalElements": 10,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

### **4. Get Employee by ID**
```http
GET /employees/{employeeId}
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "bizId": "1001",
  "name": "Ahmed Rahman",
  "mobile": "01711123456",
  "address": "Gulshan-2, Dhaka",
  "grade": {
    "id": "grade-uuid-1",
    "name": "Grade 1",
    "rank": 1
  },
  "account": {
    "id": "account-uuid-1",
    "accountName": "Ahmed Rahman",
    "accountNumber": "EMP001",
    "accountType": "SAVINGS",
    "balance": 75000.00,
    "branch": {
      "id": "branch-uuid-1",
      "branchName": "Motijheel Branch",
      "bank": {
        "id": "bank-uuid-1",
        "name": "Bangladesh Bank"
      }
    }
  }
}
```

### **5. Get Employee by Business ID**
```http
GET /employees/biz-id/{bizId}
Authorization: Bearer <jwt_token>
```

**Example:** `GET /employees/biz-id/1001`

**Response:** Same as Get Employee by ID

### **6. Create Employee**
```http
POST /employees
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "bizId": "1011",
  "name": "New Employee",
  "mobile": "01711999999",
  "address": "Sylhet, Bangladesh",
  "gradeId": "grade-uuid-3",
  "companyId": "company-uuid-1",
  "userId": "user-uuid-new",
  "accountDetails": {
    "accountName": "New Employee",
    "accountNumber": "EMP011",
    "accountType": "SAVINGS",
    "branchId": "branch-uuid-1"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "new-employee-uuid",
  "bizId": "1011",
  "name": "New Employee",
  "mobile": "01711999999",
  "address": "Sylhet, Bangladesh",
  "grade": {
    "id": "grade-uuid-3",
    "name": "Grade 3",
    "rank": 3
  },
  "account": {
    "id": "new-account-uuid",
    "accountName": "New Employee",
    "accountNumber": "EMP011",
    "accountType": "SAVINGS",
    "balance": 0.00,
    "branch": {
      "id": "branch-uuid-1",
      "branchName": "Motijheel Branch",
      "bank": {
        "id": "bank-uuid-1",
        "name": "Bangladesh Bank"
      }
    }
  },
  "createdAt": "2025-10-21T10:30:00Z"
}
```

### **7. Update Employee**
```http
PUT /employees/{employeeId}
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Updated Employee Name",
  "mobile": "01711888888",
  "address": "Updated Address",
  "gradeId": "grade-uuid-4"
}
```

**Response (200 OK):** Same format as Create Employee

### **8. Delete Employee**
```http
DELETE /employees/{employeeId}
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "message": "Employee deleted successfully"
}
```

---

## 📊 **Employee Statistics APIs**

### **9. Get Employee Count by Grade**
```http
GET /employees/stats/count-by-grade
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "1": 1,
  "2": 1,
  "3": 2,
  "4": 2,
  "5": 2,
  "6": 2
}
```

### **10. Get Total Employee Count**
```http
GET /employees/stats/total-count
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "totalCount": 10
}
```

---

## 🏢 **Company Management APIs**

### **11. Get Company Account Balance**
```http
GET /companies/{companyId}/account
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "id": "company-account-uuid",
  "accountName": "Company Main Account",
  "accountNumber": "COMP001",
  "balance": 1000000.00,
  "accountType": "CURRENT",
  "branch": {
    "id": "branch-uuid-1",
    "branchName": "Head Office Branch",
    "bank": {
      "id": "bank-uuid-1",
      "name": "Central Bank"
    }
  },
  "updatedAt": "2025-10-21T10:30:00Z"
}
```

### **12. Company Account Top-up**
```http
POST /companies/{companyId}/topup
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "amount": 500000.00,
  "description": "Monthly budget allocation"
}
```

**Response (200 OK):**
```json
{
  "transactionId": "txn-uuid-123",
  "previousBalance": 1000000.00,
  "amount": 500000.00,
  "newBalance": 1500000.00,
  "description": "Monthly budget allocation",
  "timestamp": "2025-10-21T10:30:00Z"
}
```

### **13. Get Company Transaction History**
```http
GET /companies/{companyId}/transactions?page=0&size=20
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "txn-uuid-123",
      "type": "TOP_UP",
      "amount": 500000.00,
      "description": "Monthly budget allocation",
      "balanceAfter": 1500000.00,
      "status": "COMPLETED",
      "createdAt": "2025-10-21T10:30:00Z"
    },
    {
      "id": "txn-uuid-124",
      "type": "PAYROLL_DISBURSEMENT",
      "amount": -450000.00,
      "description": "October 2025 Salary Payment",
      "balanceAfter": 1050000.00,
      "status": "COMPLETED",
      "createdAt": "2025-10-21T09:00:00Z"
    }
  ],
  "totalElements": 25,
  "totalPages": 2,
  "size": 20,
  "number": 0
}
```

---

## 💰 **Payroll Management APIs**

### **14. Create Payroll Batch**
```http
POST /payroll/batches
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "October 2025 Payroll",
  "description": "Monthly salary disbursement for October",
  "companyId": "company-uuid-1",
  "payPeriodStart": "2025-10-01",
  "payPeriodEnd": "2025-10-31"
}
```

**Response (201 Created):**
```json
{
  "id": "batch-uuid-123",
  "name": "October 2025 Payroll",
  "description": "Monthly salary disbursement for October",
  "status": "CREATED",
  "payPeriodStart": "2025-10-01",
  "payPeriodEnd": "2025-10-31",
  "totalEmployees": 0,
  "totalAmount": 0.00,
  "createdAt": "2025-10-21T10:30:00Z"
}
```

### **15. Calculate Salaries for Company**
```http
GET /payroll/companies/{companyId}/calculate
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "companyId": "company-uuid-1",
  "employees": [
    {
      "employeeId": "employee-uuid-1",
      "bizId": "1001",
      "name": "Ahmed Rahman",
      "grade": 1,
      "basicSalary": 55000.00,
      "houseRent": 11000.00,
      "medicalAllowance": 8250.00,
      "grossSalary": 74250.00
    },
    {
      "employeeId": "employee-uuid-2",
      "bizId": "1002",
      "name": "Sarah Khan",
      "grade": 2,
      "basicSalary": 50000.00,
      "houseRent": 10000.00,
      "medicalAllowance": 7500.00,
      "grossSalary": 67500.00
    }
  ],
  "totalAmount": 450000.00,
  "calculatedAt": "2025-10-21T10:30:00Z"
}
```

### **16. Process Payroll Batch**
```http
POST /payroll/batches/{batchId}/process
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "batchId": "batch-uuid-123",
  "status": "COMPLETED",
  "processedEmployees": 10,
  "successfulTransfers": 8,
  "failedTransfers": 2,
  "totalAmount": 450000.00,
  "results": [
    {
      "employeeId": "employee-uuid-1",
      "bizId": "1001",
      "name": "Ahmed Rahman",
      "amount": 74250.00,
      "status": "SUCCESS",
      "transactionId": "txn-uuid-200",
      "processedAt": "2025-10-21T10:30:00Z"
    },
    {
      "employeeId": "employee-uuid-2",
      "bizId": "1002",
      "name": "Sarah Khan",
      "amount": 67500.00,
      "status": "FAILED",
      "errorMessage": "Insufficient company balance",
      "processedAt": "2025-10-21T10:30:00Z"
    }
  ],
  "companyBalanceAfter": 50000.00,
  "processedAt": "2025-10-21T10:30:00Z"
}
```

### **17. Get Payroll Batch Items**
```http
GET /payroll/batches/{batchId}/items?page=0&size=50
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "item-uuid-1",
      "employeeId": "employee-uuid-1",
      "bizId": "1001",
      "name": "Ahmed Rahman",
      "grade": 1,
      "basicSalary": 55000.00,
      "houseRent": 11000.00,
      "medicalAllowance": 8250.00,
      "grossSalary": 74250.00,
      "status": "PAID",
      "transactionId": "txn-uuid-200",
      "paidAt": "2025-10-21T10:30:00Z"
    }
  ],
  "totalElements": 10,
  "totalPages": 1,
  "size": 50,
  "number": 0
}
```

---

## 🏦 **Account Management APIs**

### **18. Get Account Balance**
```http
GET /transactions/accounts/{accountId}/balance
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "accountId": "account-uuid-1",
  "balance": 75000.00,
  "currency": "BDT",
  "lastUpdated": "2025-10-21T10:30:00Z"
}
```

### **19. Get Account Transaction History**
```http
GET /transactions/accounts/{accountId}/history?page=0&size=20
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "txn-uuid-300",
      "type": "CREDIT",
      "amount": 74250.00,
      "description": "October 2025 Salary",
      "balanceAfter": 75000.00,
      "status": "COMPLETED",
      "createdAt": "2025-10-21T10:30:00Z"
    }
  ],
  "totalElements": 5,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

---

## 📈 **Grade Management APIs**

### **20. Get All Grades**
```http
GET /grades?page=0&size=20&sort=rank
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "grade-uuid-1",
      "name": "Grade 1",
      "rank": 1,
      "description": "Senior Management Level"
    },
    {
      "id": "grade-uuid-2",
      "name": "Grade 2",
      "rank": 2,
      "description": "Management Level"
    },
    {
      "id": "grade-uuid-6",
      "name": "Grade 6",
      "rank": 6,
      "description": "Entry Level"
    }
  ],
  "totalElements": 6,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

---

## 🏪 **Bank & Branch APIs**

### **21. Get All Banks**
```http
GET /banks?page=0&size=20
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "bank-uuid-1",
      "name": "Bangladesh Bank",
      "countryCode": "BD",
      "swiftBicCode": "BBHOBDDHXXX"
    }
  ],
  "totalElements": 5,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

### **22. Get Branches by Bank**
```http
GET /branches?bankId={bankId}&page=0&size=20
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "branch-uuid-1",
      "branchName": "Motijheel Branch",
      "address": "Motijheel Commercial Area, Dhaka",
      "bank": {
        "id": "bank-uuid-1",
        "name": "Bangladesh Bank"
      }
    }
  ],
  "totalElements": 10,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

---

## 🔍 **Health Check APIs**

### **23. Health Check**
```http
GET /actuator/health
```

**Response (200 OK):**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP"
    },
    "diskSpace": {
      "status": "UP"
    }
  }
}
```

---

## ⚠️ **Common Error Responses**

### **400 Bad Request**
```json
{
  "timestamp": "2025-10-21T10:30:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/employees",
  "details": [
    "Employee ID must be exactly 4 digits",
    "Mobile number is required"
  ]
}
```

### **401 Unauthorized**
```json
{
  "timestamp": "2025-10-21T10:30:00.000Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "path": "/api/v1/employees"
}
```

### **404 Not Found**
```json
{
  "timestamp": "2025-10-21T10:30:00.000Z",
  "status": 404,
  "error": "Not Found",
  "message": "Employee not found with ID: 1001",
  "path": "/api/v1/employees/1001"
}
```

### **409 Conflict**
```json
{
  "timestamp": "2025-10-21T10:30:00.000Z",
  "status": 409,
  "error": "Conflict",
  "message": "Employee with business ID 1001 already exists",
  "path": "/api/v1/employees"
}
```

---

## 🔑 **Authentication Flow**

### **1. Login and Store Token**
```typescript
const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});

const { token, user } = await loginResponse.json();
localStorage.setItem('jwt_token', token);
```

### **2. Use Token in Subsequent Requests**
```typescript
const employeesResponse = await fetch(`${API_BASE_URL}/employees`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
    'Content-Type': 'application/json'
  }
});
```

---

**API Reference Version**: 1.0  
**Base URL**: http://localhost:20001/pms/api/v1  
**Last Updated**: October 21, 2025