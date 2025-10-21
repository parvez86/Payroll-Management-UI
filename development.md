# Master Development Plan Overview

## Project Summary
Complete modular development plan for Payroll Management System using Spring Boot 3.5.6 and Java 24 with industry-standard design patterns and enterprise architecture.

## Technology Stack & Architecture

### Backend (Spring Boot 3.5.6 + Java 24)
```
└── org.sp.payroll_service/
    ├── config/              → Spring Security, Database, JWT Configuration
    ├── domain/              → Domain-Driven Design (DDD) Entities
    │   ├── auth/            → Authentication & Authorization (User, JWT)
    │   ├── common/          → Shared Base Classes & Enums
    │   ├── core/            → Core Business Entities (Company, Grade, Bank, Branch)
    │   ├── payroll/         → Payroll Domain (Employee, PayrollBatch, PayrollItem, Transaction)
    │   └── wallet/          → Financial Account Management
    ├── dto/                 → Data Transfer Objects (Request/Response)
    ├── repository/          → Spring Data JPA Repositories
    ├── service/             → Business Logic Layer
    └── web/                 → REST Controllers (API Layer)
```

### Frontend (React + JavaScript)
```
└── src/
    ├── components/
    │   ├── auth/            → Login/Logout Components
    │   ├── employee/        → Employee CRUD Operations
    │   ├── payroll/         → Salary Calculation & Transfer
    │   ├── company/         → Company Account Management
    │   └── shared/          → Reusable UI Components
    ├── pages/               → Route-based Page Components
    ├── services/            → API Integration Layer
    ├── utils/               → Helper Functions
    └── App.js               → Main Application Router
```

## Domain Model Architecture (Enhanced Enterprise DDD Pattern)

### Core Business Domains

#### 1. Authentication Domain (`auth/`)
```java
@Entity User {
    - UUID id
    - String username (unique)
    - String email (unique)  
    - String passwordHash
    - Role role (ADMIN, EMPLOYER, EMPLOYEE)
    - BaseAuditingEntity fields
}
```

#### 2. Core Business Domain (`core/`)
```java
@Entity Company {
    - UUID id
    - String name (unique)
    - SalaryDistributionFormula salaryFormula (ManyToOne)
    - String description
    - BaseAuditingEntity fields
}

@Entity Grade {
    - UUID id
    - String name (unique)
    - Integer rank (1-6, Grade 1 = highest)
    - BaseAuditingEntity fields
}

@Entity Bank {
    - UUID id
    - String name (unique)
    - String swiftBicCode
    - BaseAuditingEntity fields
}

@Entity Branch {
    - UUID id
    - String branchName
    - String address
    - Bank bank (ManyToOne)
    - BaseAuditingEntity fields
}
```

#### 3. Enhanced Payroll Domain (`payroll/`)
```java
@Entity SalaryDistributionFormula {
    - UUID id
    - String name (e.g., "Standard Formula 2025")
    - Integer baseSalaryGrade (typically 6)
    - BigDecimal hraPercentage (0.20 for 20%)
    - BigDecimal medicalPercentage (0.15 for 15%)
    - BigDecimal gradeIncrementAmount (5000.00)
    - BaseAuditingEntity fields
}

@Entity Employee {
    - UUID id
    - User user (OneToOne)
    - String bizId (4-digit unique business ID)
    - Account account (OneToOne to wallet)
    - Grade grade (ManyToOne)
    - String employeeCode, name, address, mobile
    - BaseAuditingEntity fields
}

@Entity PayrollBatch {
    - UUID id
    - Company company (ManyToOne)
    - User initiatedBy (ManyToOne)
    - BigDecimal totalAmount
    - PayrollStatus status (PENDING, PROCESSING, COMPLETED, FAILED)
    - Instant executedAt
    - BaseAuditingEntity fields
}

@Entity PayrollItem {
    - UUID id
    - PayrollBatch batch (ManyToOne)
    - Employee employee (ManyToOne)
    - BigDecimal amount (net payment amount)
    - BigDecimal basics, hra, medicalAllowance, gross
    - PayrollItemStatus status (PENDING, SENT, FAILED, PAID)
    - String failureReason
    - Instant executedAt
}

@Entity Transaction {
    - UUID id
    - Account debitAccount (ManyToOne)
    - Account creditAccount (ManyToOne)
    - BigDecimal amount
    - TransactionType type (PAYROLL_DISBURSEMENT, TAX_PAYMENT)
    - TransactionStatus status (PENDING, SUCCESS, FAILED)
    - PayrollItem sourceItem (OneToOne) // Traceability
    - Instant requestedAt, processedAt
}
```

#### 4. Wallet Domain (`wallet/`)
```java
@Entity Account {
    - UUID id
    - OwnerType ownerType (COMPANY, EMPLOYEE)
    - UUID ownerId (flexible reference)
    - AccountType accountType (SAVINGS, CURRENT)
    - String accountName, accountNumber (unique)
    - BigDecimal currentBalance (precision=19, scale=2)
    - BigDecimal overdraftLimit
    - Branch branch (ManyToOne)
    - BaseAuditingEntity fields
}
```

## Critical Business Rules & Validations

### Employee Distribution Constraints
- **Total Employees**: Exactly 10
- **Grade Distribution**: Grade 1:1, Grade 2:1, Grade 3:2, Grade 4:2, Grade 5:2, Grade 6:2
- **Employee ID**: Must be exactly 4 digits, unique across system

### Enhanced Salary Calculation Formula (Configurable)
```java
// Dynamic Formula via SalaryDistributionFormula Entity
@Service
public class SalaryCalculationService {
    
    public SalaryBreakdown calculateSalary(Employee employee) {
        SalaryDistributionFormula formula = employee.getCompany().getSalaryFormula();
        Grade grade = employee.getGrade();
        
        // Dynamic Basic Salary Calculation
        BigDecimal basicSalary = formula.getGradeIncrementAmount()
            .multiply(BigDecimal.valueOf(formula.getBaseSalaryGrade() - grade.getRank()))
            .add(getBaseSalaryForGrade(formula.getBaseSalaryGrade()));
            
        // Dynamic Allowances Calculation
        BigDecimal hra = basicSalary.multiply(formula.getHraPercentage());
        BigDecimal medical = basicSalary.multiply(formula.getMedicalPercentage());
        BigDecimal gross = basicSalary.add(hra).add(medical);
        
        return new SalaryBreakdown(basicSalary, hra, medical, gross);
    }
}

// Example with Default Formula:
// Grade 3: Basic = 30,000 + (6-3) × 5,000 = 45,000
// HRA = 45,000 × 0.20 = 9,000
// Medical = 45,000 × 0.15 = 6,750  
// Gross = 45,000 + 9,000 + 6,750 = 60,750
```

### Financial Integrity Rules
1. **BigDecimal Only**: All monetary values use `BigDecimal(19,2)`
2. **ACID Compliance**: All transfers use `@Transactional(isolation = SERIALIZABLE)`
3. **Insufficient Funds**: Automatic rollback with user prompt for top-up
4. **Audit Trail**: Every transaction recorded in ledger (success/failure)

## Enhanced API Endpoints

### Authentication Module
```
POST   /pms/v1/api/auth/login           → JWT Token Generation
POST   /pms/v1/api/auth/register        → User Registration
POST   /pms/v1/api/auth/refresh         → Token Refresh
```

### Employee Management Module
```
GET    /pms/v1/api/employees            → List All Employees (ordered by grade)
POST   /pms/v1/api/employees            → Create Employee + Bank Account
GET    /pms/v1/api/employees/{id}       → Get Employee Details
PUT    /pms/v1/api/employees/{id}       → Update Employee
DELETE /pms/v1/api/employees/{id}       → Delete Employee
GET    /pms/v1/api/employees/grade/{grade} → Filter by Grade
```

### Enhanced Payroll Processing Module
```
POST   /pms/v1/api/payroll/batches      → Create New Payroll Batch
GET    /pms/v1/api/payroll/batches      → List Payroll Batches (with status)
GET    /pms/v1/api/payroll/batches/{id} → Get Batch Details + Items
POST   /pms/v1/api/payroll/batches/{id}/process → Execute ACID Payroll Transfer
GET    /pms/v1/api/payroll/batches/{id}/items   → Get Payroll Items for Batch
PUT    /pms/v1/api/payroll/items/{id}/retry     → Retry Failed Payment
GET    /pms/v1/api/payroll/calculate    → Preview Salary Calculations (no batch)
```

### Company & Configuration Module
```
GET    /pms/v1/api/company/account      → Get Company Account Balance
POST   /pms/v1/api/company/topup        → Add Funds to Company Account
GET    /pms/v1/api/company/transactions → Company Transaction History
GET    /pms/v1/api/config/salary-formula → Get Current Salary Formula
PUT    /pms/v1/api/config/salary-formula → Update Salary Formula Configuration
```

### Enhanced Transaction & Audit Module
```
GET    /pms/v1/api/transactions         → List All Transactions (with filters)
GET    /pms/v1/api/transactions/{id}    → Get Transaction Details
GET    /pms/v1/api/audit/payroll/{batchId} → Complete Audit Trail for Batch
GET    /pms/v1/api/reports/salary-summary  → Salary Summary Reports
```

## Critical Transaction Patterns

### 1. Enhanced ACID-Compliant Payroll Processing
```java
@Service
@Transactional(isolation = Isolation.SERIALIZABLE)
public class PayrollProcessingService {
    
    public PayrollResult processPayrollBatch(UUID batchId) {
        // 1. Load and validate batch
        PayrollBatch batch = payrollBatchRepository.findById(batchId)
            .orElseThrow(() -> new PayrollBatchNotFoundException(batchId));
            
        validateBatchStatus(batch);
        
        // 2. Calculate dynamic salary breakdown for all employees
        List<PayrollItem> payrollItems = generatePayrollItems(batch);
        BigDecimal totalPayroll = payrollItems.stream()
            .map(PayrollItem::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        // 3. Validate company account balance
        Account companyAccount = getCompanyAccount(batch.getCompany());
        if (companyAccount.getCurrentBalance().compareTo(totalPayroll) < 0) {
            batch.setStatus(PayrollStatus.FAILED);
            throw new InsufficientFundsException(
                "Required: " + totalPayroll + 
                ", Available: " + companyAccount.getCurrentBalance()
            );
        }
        
        // 4. Execute double-entry accounting transactions
        batch.setStatus(PayrollStatus.PROCESSING);
        for (PayrollItem item : payrollItems) {
            try {
                // Create double-entry transaction
                Transaction transaction = Transaction.builder()
                    .debitAccount(companyAccount)
                    .creditAccount(item.getEmployee().getAccount())
                    .amount(item.getAmount())
                    .type(TransactionType.PAYROLL_DISBURSEMENT)
                    .sourceItem(item)
                    .requestedAt(Instant.now())
                    .status(TransactionStatus.PENDING)
                    .build();
                    
                // Execute atomic transfer
                executeTransaction(transaction);
                item.setStatus(PayrollItemStatus.PAID);
                item.setExecutedAt(Instant.now());
                
            } catch (Exception e) {
                item.setStatus(PayrollItemStatus.FAILED);
                item.setFailureReason(e.getMessage());
                log.error("Failed to process payroll for employee {}: {}", 
                         item.getEmployee().getBizId(), e.getMessage());
            }
        }
        
        // 5. Update batch status and totals
        batch.setTotalAmount(totalPayroll);
        batch.setStatus(PayrollStatus.COMPLETED);
        batch.setExecutedAt(Instant.now());
        
        return PayrollResult.success(batch, payrollItems);
    }
    
    private List<PayrollItem> generatePayrollItems(PayrollBatch batch) {
        return employeeRepository.findByCompany(batch.getCompany())
            .stream()
            .map(employee -> {
                SalaryBreakdown salary = salaryCalculationService.calculateSalary(employee);
                return PayrollItem.builder()
                    .batch(batch)
                    .employee(employee)
                    .basics(salary.getBasic())
                    .hra(salary.getHra())
                    .medicalAllowance(salary.getMedical())
                    .gross(salary.getGross())
                    .amount(salary.getGross()) // Net = Gross for now
                    .status(PayrollItemStatus.PENDING)
                    .build();
            })
            .collect(Collectors.toList());
    }
}
```

### 2. Optimistic Locking for Concurrent Safety
```java
@Entity
public abstract class BaseAuditingEntity {
    @Version
    private Long version; // Prevents lost updates in concurrent scenarios
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate  
    private Instant updatedAt;
}
```

### 3. Domain Event Pattern for Audit Trail
```java
@EventListener
public class PayrollEventListener {
    
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePayrollCompleted(PayrollCompletedEvent event) {
        // Log audit trail
        // Send notifications
        // Update reporting tables
    }
}
```

## Database Schema Design

### Key Relationships
```sql
-- Employee to Account (One-to-One)
ALTER TABLE employees ADD CONSTRAINT fk_employee_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id);

-- Employee to Grade (Many-to-One)
ALTER TABLE employees ADD CONSTRAINT fk_employee_grade 
    FOREIGN KEY (grade_id) REFERENCES grades(id);

-- Account to Branch (Many-to-One)  
ALTER TABLE accounts ADD CONSTRAINT fk_account_branch 
    FOREIGN KEY (branch_id) REFERENCES branches(id);

-- Transaction to Account (Many-to-One)
ALTER TABLE transaction_ledgers ADD CONSTRAINT fk_transaction_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id);
```

### Critical Indexes
```sql
-- Performance indexes for frequent queries
CREATE INDEX idx_employee_grade ON employees(grade_id);
CREATE INDEX idx_employee_bizid ON employees(biz_id);
CREATE INDEX idx_account_owner ON accounts(owner_type, owner_id);
CREATE INDEX idx_transaction_batch ON transaction_ledgers(batch_id);
CREATE UNIQUE INDEX idx_account_number ON accounts(account_number);
```

## Development Workflow

### 1. Environment Setup
```bash
# Backend Development
cd payroll_service
./gradlew bootRun

# Database Setup (PostgreSQL)
docker run --name payroll-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Frontend Development  
cd payroll_frontend
npm install
npm start
```

### 2. Database Migration (Liquibase)
```xml
<!-- db/changelog/001-create-base-tables.xml -->
<changeSet id="1" author="developer">
    <createTable tableName="users">
        <column name="id" type="UUID" defaultValueComputed="gen_random_uuid()">
            <constraints primaryKey="true"/>
        </column>
        <column name="username" type="VARCHAR(50)">
            <constraints nullable="false" unique="true"/>
        </column>
        <!-- Additional columns -->
    </createTable>
</changeSet>
```

### 3. Testing Strategy
```java
// Integration Test Example
@SpringBootTest
@Transactional
class PayrollServiceTest {
    
    @Test
    void processPayroll_WithSufficientFunds_ShouldComplete() {
        // Given: Company account with sufficient balance
        // When: Process payroll batch
        // Then: All employees paid, company account debited
    }
    
    @Test  
    void processPayroll_WithInsufficientFunds_ShouldRollback() {
        // Given: Company account with insufficient balance
        // When: Process payroll batch
        // Then: InsufficientFundsException thrown, no accounts modified
    }
}
```

## Security Implementation

### JWT Configuration
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/payroll/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .build();
    }
}
```

### Role-Based Access Control
```java
@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/api/payroll/process")
public ResponseEntity<PayrollResult> processPayroll(@RequestBody ProcessPayrollRequest request) {
    // Only ADMIN users can process payroll
}
```

## Frontend Architecture (React + JavaScript)

### Component Structure
```javascript
// Employee Management Component
const EmployeeForm = () => {
    const [employee, setEmployee] = useState({
        bizId: '',
        name: '',
        address: '',
        mobile: '',
        grade: '',
        accountType: 'SAVINGS'
    });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await employeeService.create(employee);
            // Success notification
        } catch (error) {
            // Error handling
        }
    };
};
```

### API Integration
```javascript
// API Service Layer
const payrollService = {
    calculateSalaries: () => api.get('/api/payroll/calculate'),
    processPayroll: (batchId) => api.post('/api/payroll/process', { batchId }),
    getCompanyBalance: () => api.get('/api/company/account'),
    topUpAccount: (amount) => api.post('/api/company/topup', { amount })
};
```

## Deployment & Production Considerations

### Docker Configuration
```dockerfile
# Backend Dockerfile
FROM openjdk:24-jdk-slim
COPY build/libs/payroll-service-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### Production Environment Variables
```properties
# application-prod.properties
spring.datasource.url=jdbc:postgresql://prod-db:5432/payroll
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=validate
spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.xml

jwt.secret=${JWT_SECRET}
jwt.expiration=86400000
```

## Enhanced Enterprise Features (Latest Update)

### 1. Configurable Salary Formula System
- **Dynamic Calculation**: No more hardcoded salary formulas
- **Multi-Company Support**: Each company can have different formulas
- **Formula Versioning**: Track changes to salary structures over time
- **Runtime Configuration**: Update formulas without code deployment

### 2. Advanced Batch Processing
- **Status Tracking**: PENDING → PROCESSING → COMPLETED/FAILED
- **Partial Failure Handling**: Individual employee payment failures tracked
- **Retry Mechanisms**: Failed payments can be retried individually
- **Audit Trail**: Complete traceability from batch to individual transactions

### 3. Double-Entry Accounting System
- **Proper Debit/Credit Structure**: Every transaction has both sides
- **Source Traceability**: Link transactions back to specific payroll items
- **Account Balance Integrity**: Real-time balance updates with concurrency control
- **Financial Reconciliation**: Complete audit trail for accounting purposes

### 4. Enhanced Transaction Management
```java
// Example: Double-Entry Transaction Creation
@Transactional(isolation = Isolation.SERIALIZABLE)
public void executePayrollTransaction(PayrollItem item) {
    Transaction transaction = Transaction.builder()
        .debitAccount(companyAccount)           // Company pays
        .creditAccount(employeeAccount)         // Employee receives
        .amount(item.getAmount())
        .type(TransactionType.PAYROLL_DISBURSEMENT)
        .sourceItem(item)                       // Traceability
        .requestedAt(Instant.now())
        .build();
        
    // Atomic balance updates
    updateAccountBalance(companyAccount, transaction.getAmount().negate());
    updateAccountBalance(employeeAccount, transaction.getAmount());
    
    transactionRepository.save(transaction);
}
```

## Interview-Ready Features Demonstrated

### 1. Advanced Spring Boot Patterns
- **Modulith Architecture**: Domain-driven package organization
- **ACID Transactions**: Proper financial transaction handling with isolation levels
- **Event-Driven Architecture**: Domain events for audit trails
- **Optimistic Locking**: Concurrent access control with @Version
- **Builder Pattern**: Complex entity creation (Transaction, PayrollItem)

### 2. Enterprise-Grade Data Modeling
- **Configurable Business Rules**: SalaryDistributionFormula entity
- **Base Entity Pattern**: Consistent auditing across all entities
- **Flexible Relationships**: UUID-based owner references for polymorphism
- **Financial Precision**: BigDecimal with proper scale (19,2) for all monetary values
- **Status Enums**: Comprehensive status tracking for workflows

### 3. Advanced Security & Validation
- **JWT Authentication**: Stateless security with role-based access
- **Method-Level Security**: @PreAuthorize annotations for fine-grained control
- **Input Validation**: Bean Validation with custom validators
- **Audit Logging**: Automatic tracking of all financial operations

### 4. Production-Ready Features
- **Batch Processing**: Handle large payroll runs efficiently
- **Error Recovery**: Granular failure handling and retry mechanisms  
- **Performance Optimization**: Proper indexing and query optimization
- **Monitoring**: Health checks and metrics for observability
- **Docker Deployment**: Complete containerization with environment management

### 5. Financial Domain Expertise
- **Double-Entry Bookkeeping**: Proper accounting principles implementation
- **Regulatory Compliance**: Audit trail and transaction immutability
- **Concurrent Transaction Handling**: Serializable isolation for financial consistency
- **Balance Reconciliation**: Real-time account balance management

This enhanced architecture demonstrates senior-level Java development skills with deep financial domain knowledge, showcasing production-ready enterprise patterns suitable for fintech and payroll system interviews.