# 🔧 Backend Integration Guide - Industry Best Practices

## 📋 Integration Checklist

### ✅ Environment Configuration
- [x] **Base URL Configuration**: Flexible environment-based API endpoints
- [x] **Environment Files**: `.env.development` and `.env.production` created
- [x] **CORS Setup**: Vite proxy configuration for development
- [x] **Timeout Configuration**: 30-second API timeout with proper error handling

### ✅ API Service Layer (Industry Standards)
- [x] **Axios Configuration**: Comprehensive setup with interceptors
- [x] **Request Interceptors**: JWT token injection, request ID tracking
- [x] **Response Interceptors**: Error handling, logging, auto-logout on 401
- [x] **Error Classification**: Network, timeout, server, auth error handling
- [x] **Mock/Real API Switch**: Seamless development workflow

### ✅ Security Implementation
- [x] **JWT Authentication**: Bearer token in Authorization header
- [x] **Token Storage**: LocalStorage with auto-cleanup on auth failure
- [x] **Request Tracking**: X-Request-ID header for debugging
- [x] **CSRF Protection**: X-Requested-With header

---

## 🌐 Environment Configuration

### **Base URLs by Environment**
```javascript
Development: http://localhost:3000/pms/v1/api (proxied to :20001)
Production:  http://localhost:20001/pms/v1/api
```

### **CORS Strategy**
- **Development**: Vite proxy eliminates CORS issues
- **Production**: Backend must include CORS headers:
  ```
  Access-Control-Allow-Origin: http://localhost:3000
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Request-ID
  Access-Control-Allow-Credentials: false
  ```

---

## 🔌 API Integration Points

### **1. Authentication Service**
```typescript
POST /pms/v1/api/auth/login
Headers: Content-Type: application/json
Body: { username: string, password: string }
Response: { token: string, user: UserObject, expiresIn: number }
```

### **2. Employee Management**
```typescript
GET    /pms/v1/api/employees           // List all employees
POST   /pms/v1/api/employees           // Create employee
PUT    /pms/v1/api/employees/{id}      // Update employee
DELETE /pms/v1/api/employees/{id}      // Delete employee
```

### **3. Payroll Processing**
```typescript
GET  /pms/v1/api/payroll/calculate     // Calculate salaries
POST /pms/v1/api/payroll/batches       // Create payroll batch
POST /pms/v1/api/payroll/batches/{id}/process  // Process transfers
```

### **4. Company Account**
```typescript
GET  /pms/v1/api/company/account       // Get account balance
POST /pms/v1/api/company/topup         // Add funds
GET  /pms/v1/api/company/transactions  // Transaction history
```

---

## 🛠 Integration Testing Strategy

### **1. API Health Check**
```bash
# Test backend connectivity
curl -X GET http://localhost:20001/pms/v1/api/health
```

### **2. Authentication Test**
```bash
# Test login endpoint
curl -X POST http://localhost:20001/pms/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### **3. Development Workflow**
1. Start backend server on port 20001
2. Start frontend with `npm run dev` (port 3000)
3. Vite proxy automatically handles API calls
4. Check browser Network tab for API requests

---

## 🚨 Common Integration Issues & Solutions

### **CORS Errors**
```
❌ Problem: "Access to fetch blocked by CORS policy"
✅ Solution: Use Vite proxy (already configured) or add CORS headers to backend
```

### **401 Unauthorized**
```
❌ Problem: API returns 401 even with valid token
✅ Solution: Check JWT token format (Bearer prefix) and expiration
```

### **Network Errors**
```
❌ Problem: "ERR_NETWORK" or connection refused
✅ Solution: Verify backend server is running on port 20001
```

### **Timeout Issues**
```
❌ Problem: API requests hanging or timing out
✅ Solution: Increase timeout in config or optimize backend responses
```

---

## 📱 Frontend App Integration Requirements

### **Required Features for Backend Integration**

#### **1. Authentication Flow**
- [x] **Login Form**: Username/password validation
- [x] **JWT Storage**: Token persistence in localStorage
- [x] **Auto-Logout**: On token expiration or 401 errors
- [x] **Protected Routes**: Route guards for authenticated pages

#### **2. Employee Management Integration**
- [x] **Real-time Validation**: 4-digit ID uniqueness check via API
- [x] **Grade Distribution**: Server-side validation enforcement
- [x] **Bank Account**: Auto-creation on employee save
- [x] **CRUD Operations**: Full create, read, update, delete with API

#### **3. Payroll Processing Integration**
- [x] **Salary Calculation**: Server-side calculation with caching
- [x] **Batch Processing**: Async transfer processing with status updates
- [x] **Insufficient Funds**: Real-time balance checking
- [x] **Transfer Status**: Per-employee success/failure tracking

#### **4. Company Account Integration**
- [x] **Balance Display**: Real-time account balance
- [x] **Top-up Functionality**: Secure fund addition
- [x] **Transaction History**: Paginated transaction list
- [x] **Transfer Tracking**: Audit trail for all transfers

---

## 🚀 Next Steps for Complete Integration

### **Immediate Actions (5 minutes)**
1. **Start Backend Server**: Ensure port 20001 is running
2. **Test API Endpoints**: Use curl or Postman for basic connectivity
3. **Switch to Real API**: Change `config.USE_MOCK_API` to `false`

### **Integration Testing (10 minutes)**
1. **Login Flow**: Test authentication with real backend
2. **Employee CRUD**: Verify all employee operations
3. **Payroll Processing**: Test salary calculation and transfers
4. **Error Handling**: Verify proper error messages and recovery

### **Production Deployment**
1. **Environment Variables**: Set production API URLs
2. **CORS Configuration**: Add frontend domain to backend CORS
3. **Security Headers**: Implement additional security measures
4. **Performance Monitoring**: Add API response time tracking

---

## 🔍 Development Commands

```bash
# Start development with backend integration
npm run dev

# Build for production
npm run build

# Test API connectivity
curl -X GET http://localhost:3000/pms/v1/api/health

# Check environment configuration
npm run dev -- --debug
```

---

**✨ Result**: Your frontend is now fully configured for backend integration with industry-standard practices, comprehensive error handling, and seamless development workflow!