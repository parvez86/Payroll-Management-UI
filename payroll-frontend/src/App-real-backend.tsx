import React, { useState, useMemo, useCallback, useEffect } from 'react';
  import type { Employee, BackendCompany, PayrollBatch, Grade, Branch } from './types';
  import './SimulatedApp.css';
  import { LogOut, DollarSign, PlusCircle } from './icons';
  import { authService, employeeService, companyService, payrollService, gradeService, branchService } from './services/api';
  import SalarySheet from './components/payroll/SalarySheet';
  import './SimulatedApp.css'; 

// Helper to map Employee to EmployeeDisplay
function toEmployeeDisplay(emp: Employee): EmployeeDisplay {
  // Map backend EmployeeSalary to SalaryDetails, ensuring isPaid is always boolean
  let salary: SalaryDetails | null = null;
  if (emp.salary) {
    salary = {
      basic: emp.salary.basic,
      houseRent: emp.salary.houseRent,
      medicalAllowance: emp.salary.medicalAllowance,
      gross: emp.salary.gross,
      isPaid: typeof emp.salary.isPaid === 'boolean' ? emp.salary.isPaid : false,
    };
  }
  return {
    ...emp,
    bankAccount: {
      type: emp.account?.accountType || '',
      name: emp.account?.accountName || '',
      number: emp.account?.accountNumber || '',
      balance: emp.account?.currentBalance || 0,
      bank: '', // Add if available in backend
      branch: emp.account?.branchId || '', // Use branchId for dropdown value
    },
    salary,
  };
}
// Types for UI mapping (restored)
interface BankAccount {
  type: string;
  name: string;
  number: string;
  balance: number;
  bank: string;
  branch: string;
}

interface SalaryDetails {
  basic: number;
  houseRent: number;
  medicalAllowance: number;
  gross: number;
  isPaid: boolean;
}

interface EmployeeDisplay extends Employee {
  salary?: SalaryDetails | null;
  bankAccount: BankAccount;
  username?: string;
  email?: string;
  password?: string;
}
// ...existing code...
// Business logic constants from original design
// GRADE_LEVELS removed - now fetched from API

// Utility functions (exact same as original)
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 0,
}).format(amount);

//

//

// No need for custom BankAccount or EmployeeDisplay; use backend Employee type

// Employee Table Component (exact same UI)
const EmployeeTable: React.FC<{ 
  employees: Employee[], 
  onEdit: (emp: Employee) => void, 
  onDelete: (id: string) => void,
  onSort: (key: string) => void,
  sortConfig: {key: string, direction: 'asc' | 'desc'} | null,
  canManageEmployees: () => boolean 
}> = ({ employees, onEdit, onDelete, onSort, sortConfig, canManageEmployees }) => {
  
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="table-container">
      <table className="employee-table">
        <thead className="table-header">
          <tr>
            <th className="table-cell" style={{cursor: 'pointer'}} onClick={() => onSort('id')}>
              ID / Name {getSortIcon('id')}
            </th>
            <th className="table-cell text-center" style={{cursor: 'pointer'}} onClick={() => onSort('grade')}>
              Grade {getSortIcon('grade')}
            </th>
            <th className="table-cell">Contact Info</th>
            <th className="table-cell">Bank Account</th>
            <th className="table-cell text-right" style={{cursor: 'pointer'}} onClick={() => onSort('balance')}>
              Balance {getSortIcon('balance')}
            </th>
            {canManageEmployees() && (
              <th className="table-cell text-center">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="table-body">
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td className="table-cell">
                <div className="employee-info">
                  <div className="employee-name">{emp.name}</div>
                  <div className="employee-id">ID: {emp.code}</div>
                </div>
              </td>
              <td className="table-cell text-center">
                <div className="grade-badge">G{emp.grade.rank}</div>
              </td>
              <td className="table-cell">
                <div className="text-sm">
                  <div>{emp.address}</div>
                  <div className="text-gray-500">{emp.mobile}</div>
                </div>
              </td>
              <td className="table-cell">
                <div className="bank-info">
                  <span className="bank-name">{emp.account.accountName}</span>
                  <div className="bank-details">
                    {emp.account.accountNumber} ({emp.account.branchName})
                  </div>
                </div>
              </td>
              <td className="table-cell text-right">
                <div className="amount">{formatCurrency(emp.account.currentBalance)}</div>
              </td>
              {canManageEmployees() && (
                <td className="table-cell text-center">
                  <button onClick={() => onEdit(emp)} className="action-button edit">✏️</button>
                  <button onClick={() => onDelete(emp.id)} className="action-button delete">🗑️</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main App Component with Real Backend Integration

export default function App() {
  // --- State declarations: must be at the very top! ---
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ username: 'admin', password: 'admin123' });
  const [userRole, setUserRole] = useState<string>('');
  // Data state (from real backend)
  const [employees, setEmployees] = useState<EmployeeDisplay[]>([]);
  // Grades state
  const [grades, setGrades] = useState<Grade[]>([]);
  // Branches state
  const [branches, setBranches] = useState<Branch[]>([]);
  // Payroll batch state (for backend batch logic)
  // Removed unused payrollBatch state
  // Company state: always set from backend, not localStorage
  const [company, setCompany] = useState<BackendCompany | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // UI state (same as original)
  const [grade6Basic, setGrade6Basic] = useState(25000);
  const [view, setView] = useState('employees');
  const [editEmployee, setEditEmployee] = useState<EmployeeDisplay | null>(null);
  const [message, setMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState({ totalPaid: 0, requiredTopUp: 0 });
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  
  // Pagination state for employee table
  const [employeePage, setEmployeePage] = useState(0);
  const [employeePageSize, setEmployeePageSize] = useState(5);
  
  // --- Load pending payroll batch after company/account is loaded ---
  const [pendingBatch, setPendingBatch] = useState<PayrollBatch | null>(null);
  const [salarySheetKey, setSalarySheetKey] = useState(0); // Force reload SalarySheet
  const loadPendingBatch = async (companyId: string) => {
    try {
      const batch = await payrollService.getPendingBatch(companyId);
      setPendingBatch(batch && batch.id ? batch : null);
      if (batch && batch.id) {
        setMessage(`⚠️ Loaded existing pending payroll batch (ID: ${batch.id}).`);
      }
    } catch (error: any) {
      setPendingBatch(null);
      // Optionally show error
    }
  };

  useEffect(() => {
    if (company) {
      console.log('[DEBUG][useEffect] company state updated:', company);
    }
  }, [company]);

  // --- Helper: Company Account Balance ---
  let companyAccountBalance: number | null = null;
  if (company && company.mainAccount && typeof company.mainAccount.currentBalance === 'number' && !isNaN(company.mainAccount.currentBalance)) {
    companyAccountBalance = company.mainAccount.currentBalance;
  }

  // --- Helper: Total Salary Required ---
  // Removed unused totalSalaryRequired

  // --- Salary Transfer Handler ---
  const transferSalaries = async () => {
    if (!pendingBatch || !pendingBatch.id) {
      setMessage('❌ No pending payroll batch to process.');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔄 Processing payroll batch:', pendingBatch.id);
      
      // Call the process batch API
      const processResponse = await payrollService.processPayrollBatch(pendingBatch.id);
      console.log('✅ Batch process response:', processResponse);
      
      // Reload data to get updated batch status and company balance
      await loadData();
      
      // Force SalarySheet to reload
      setSalarySheetKey(prev => prev + 1);
      
      setMessage(`✅ Payroll batch processed successfully!`);
    } catch (error: any) {
      console.error('❌ Batch processing failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      // Check if it's an insufficient funds error
      if (errorMessage.includes('Insufficient funds')) {
        // Parse required and available amounts from error message
        // Format: "Insufficient funds. Required: 546750.0000, Available: 494750.0000"
        const requiredMatch = errorMessage.match(/Required:\s*([\d,]+\.?\d*)/);
        const availableMatch = errorMessage.match(/Available:\s*([\d,]+\.?\d*)/);
        
        if (requiredMatch && availableMatch) {
          const required = parseFloat(requiredMatch[1].replace(/,/g, ''));
          const available = parseFloat(availableMatch[1].replace(/,/g, ''));
          const shortfall = required - available;
          
          // Update payment status and open top-up modal
          setPaymentStatus({
            totalPaid: 0,
            requiredTopUp: shortfall
          });
          setTopUpAmount(shortfall); // Pre-fill with required amount
          setIsTopUpModalOpen(true);
          setMessage(`⚠️ Insufficient funds! Need ${formatCurrency(shortfall)} more to complete salary transfer.`);
        } else {
          setMessage(`❌ Batch processing failed: ${errorMessage}`);
        }
      } else {
        setMessage(`❌ Batch processing failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Data Loader ---
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get companyId from userProfile in localStorage (robust)
      let companyId = null;
      const userProfileStr = localStorage.getItem('userProfile');
      if (userProfileStr) {
        try {
          const userProfile = JSON.parse(userProfileStr);
          companyId = userProfile.account?.companyId || userProfile.companyId || null;
        } catch (e) { /* ignore */ }
      }
      // Fallback: try from companyAccount
      if (!companyId) {
        const accStr = localStorage.getItem('companyAccount');
        if (accStr) {
          try {
            const acc = JSON.parse(accStr);
            companyId = acc.companyId || null;
          } catch (e) { /* ignore */ }
        }
      }
      if (!companyId) {
        throw new Error('No companyId found in user profile or account');
      }
      // Fetch employees, company data, grades, and branches
      const [employeesRaw, companyData, gradesData, branchesData] = await Promise.all([
        employeeService.getAll(companyId),
        companyService.getAccount(companyId),
        gradeService.getAll(),
        branchService.getAll()
      ]);
      console.log('[DEBUG] Backend companyData:', companyData);
      console.log('[DEBUG] Grades data:', gradesData);
      console.log('[DEBUG] Branches data:', branchesData);
      
      // Set grades and branches
      setGrades(gradesData);
      setBranches(branchesData);
      
      // Persist company mainAccount and meta to localStorage for instant UI
      if (companyData && companyData.mainAccount) {
        localStorage.setItem('companyAccount', JSON.stringify(companyData.mainAccount));
        localStorage.setItem('companyMeta', JSON.stringify({
          id: companyData.id,
          name: companyData.name,
          description: companyData.description,
          salaryFormulaId: companyData.salaryFormulaId,
          createdAt: companyData.createdAt,
          createdBy: companyData.createdBy
        }));
      }
      // ...rest unchanged, update state
      const filteredEmployees = employeesRaw.map(toEmployeeDisplay);
      setEmployees(filteredEmployees);
      setCompany(companyData ? companyData : null);
      // --- Call pending batch loader here ---
      await loadPendingBatch(companyId);
      console.log('✅ Data loaded successfully');
      console.log('📊 Employees:', filteredEmployees.length);
      console.log('🏢 Company balance:', companyData && companyData.mainAccount ? companyData.mainAccount.currentBalance : 0);
    } catch (error: any) {
      console.error('❌ Failed to load data:', error);
      setError('Failed to load data: ' + (error.message || 'Unknown error'));
      setMessage('Failed to load data. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };
  // Authentication state
  // ...state declarations moved to the top...

  // Check auth status on load
  useEffect(() => {
    console.log('🔄 App loaded - checking authentication status');
    if (authService.isAuthenticated()) {
      console.log('✅ User is authenticated - loading data');
      // Get user role and companyId from localStorage
      const storedRole = localStorage.getItem('userRole');
      const storedUserId = localStorage.getItem('user');
  // const storedProfile = localStorage.getItem('userProfile');
      if (storedRole) setUserRole(storedRole);
      if (storedUserId) {
        try {
          JSON.parse(storedUserId);
          // User data available in localStorage if needed later
        } catch (e) { console.error('Error parsing user data:', e); }
      }
      // Do not set company from localStorage; always use backend data for accuracy
      setIsLoggedIn(true);
      loadData();
    } else {
      console.log('❌ User not authenticated');
      setIsLoggedIn(false);
    }
  }, []);

  // Auto-dismiss toast after 5 seconds (same as original)
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Reload all backend data when switching views
  useEffect(() => {
    if (isLoggedIn && (view === 'employees' || view === 'home' || view === 'salarySheet')) {
      loadData(); // This will also call loadPendingBatch
    }
  }, [view, isLoggedIn]);

  // Role-based access control helpers
  const isAdmin = () => userRole === 'ADMIN';
  const isEmployer = () => userRole === 'EMPLOYER';
  const isEmployee = () => userRole === 'EMPLOYEE';
  const canManageEmployees = () => isAdmin() || isEmployer();
  const canManagePayroll = () => isAdmin() || isEmployer();
  //

  // Data Loading


  // Auth functions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      console.log('🚀 Attempting API login...');
      const response = await authService.login(credentials);
      console.log('✅ API login successful:', response);
      
      // Verify login with /me endpoint
      try {
        const userProfile = await authService.getCurrentProfile();
        console.log('✅ User profile verified:', userProfile);
        
        // Update user data with complete profile
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('user', JSON.stringify(userProfile.user));
        localStorage.setItem('userRole', userProfile.user.role);
        localStorage.setItem('companyAccount', JSON.stringify(userProfile.account));
        
        // Set state
        setUserRole(userProfile.user.role);
        
        setMessage('✅ Login successful!');
        setIsLoggedIn(true);
        await loadData();
      } catch (meError: any) {
        console.error('❌ Failed to verify user credentials:', meError);
        authService.clearAuthData();
        throw new Error('User credentials invalid');
      }
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('Backend server not running');
      } else if (error.message === 'User credentials invalid') {
        setError('User credentials invalid');
      } else if (error.response?.status === 401) {
        setError('Invalid credentials');
      } else {
        setError('Login failed: ' + (error.message || 'Unknown error'));
      }
      setMessage('❌ Login failed: User credentials invalid');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setMessage('✅ Logged out successfully.');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
  setIsLoggedIn(false);
  setUserRole('');
  setView('employees');
  setEmployees([]);
  console.log('[DEBUG][handleLogout] company state set to null');
  setCompany(null);
    }
  };

  // Sorting function (same as original)
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedEmployees = useMemo(() => {
    let sortableEmployees = [...employees];
    if (sortConfig) {
      sortableEmployees.sort((a, b) => {
        const { key } = sortConfig;
        const aValue = key === 'grade' ? a.grade : 
                      key === 'name' ? a.name :
                      key === 'id' ? a.id :
                      key === 'balance' ? a.bankAccount.balance : a.name;
        const bValue = key === 'grade' ? b.grade : 
                      key === 'name' ? b.name :
                      key === 'id' ? b.id :
                      key === 'balance' ? b.bankAccount.balance : b.name;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableEmployees;
  }, [employees, sortConfig]);

  // Paginated employees
  const paginatedEmployees = useMemo(() => {
    const startIndex = employeePage * employeePageSize;
    const endIndex = startIndex + employeePageSize;
    return sortedEmployees.slice(startIndex, endIndex);
  }, [sortedEmployees, employeePage, employeePageSize]);

  const totalEmployeePages = Math.ceil(sortedEmployees.length / employeePageSize);

  // Employee CRUD operations with real backend
  const getNextEmployeeId = useCallback(() => {
    const maxId = employees.reduce((max, emp) => Math.max(max, parseInt(emp.id)), 0);
    const newId = (maxId + 1).toString().padStart(4, '0');
    return newId;
  }, [employees]);

  const startAddEmployee = () => {
    const newId = getNextEmployeeId();
    const defaultBranchId = branches.length > 0 ? branches[0].id : '';
    
    setEditEmployee({
      id: newId,
      code: newId,
      name: '',
      address: '',
      mobile: '+880', // Initialize with country code
      grade: { id: '', name: 'Grade 6', rank: 6 },
      account: {
        id: '', ownerType: '', ownerId: '', accountType: 'SAVINGS', accountName: '', accountNumber: '', currentBalance: 0, overdraftLimit: 0, branchId: '', branchName: '', status: '', createdAt: '', createdBy: null
      },
      company: {
        id: '', name: '', description: '', salaryFormulaId: '', mainAccount: null, createdAt: '', createdBy: null
      },
      status: 'ACTIVE',
      salary: null,
      bankAccount: { type: 'SAVINGS', name: '', number: '', balance: 0, bank: '', branch: defaultBranchId },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setView('addEdit');
  };

  const handleSaveEmployee = async (empData: EmployeeDisplay) => {
    try {
      setIsLoading(true);
      
      // Get companyId from company state
      const companyId = company?.id;
      if (!companyId) {
        setMessage('❌ Company ID not found. Please login again.');
        return;
      }

      // Use grade rank from grade object
      const gradeRank = empData.grade?.rank || 6;
      
      // Get branchId from form data (now it's the branch ID from dropdown)
      const branchId = empData.bankAccount?.branch || company?.mainAccount?.branchId || '';

      const existingIndex = employees.findIndex(e => e.id === empData.id);
      
      if (existingIndex !== -1) {
        // UPDATE existing employee - matches update API structure
        const updatePayload = {
          email: empData.email || `${empData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
          password: empData.password || 'employee123',
          phoneNumber: empData.mobile,
          gradeId: empData.grade?.id || getGradeIdByRank(gradeRank), // Use actual grade ID from backend
          jobTitle: `Grade ${gradeRank} Employee`,
          bankAccountNumber: empData.bankAccount?.number || '',
          bankRoutingNumber: '', // Not in UI, optional
          status: empData.status || 'ACTIVE',
          name: empData.name,
          address: empData.address,
          mobile: empData.mobile,
          accountName: empData.bankAccount?.name || empData.name,
          overdraftLimit: 0,
          branchId: branchId
        };
        
        console.log('🚀 Updating employee with payload:', updatePayload);
        
        const response = await fetch(`http://localhost:20001/pms/api/v1/employees/${empData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(updatePayload)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Update failed: ${response.statusText}`);
        }
        
        await loadData(); // Reload to get updated data
        setMessage(`✅ Employee ${empData.name} updated successfully.`);
      } else {
        // CREATE new employee - matches create API structure
        const createPayload = {
          // Do not send bizId/code/id - backend will auto-generate
          name: empData.name,
          address: empData.address,
          mobile: empData.mobile,
          gradeId: empData.grade?.id || getGradeIdByRank(gradeRank), // Use actual grade ID from backend
          companyId: companyId,
          email: empData.email || `${empData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
          password: empData.password || 'employee123',
          // Bank account details
          accountName: empData.bankAccount?.name || empData.name,
          accountNumber: empData.bankAccount?.number || `ACC${Date.now()}`,
          overdraftLimit: 0.00,
          branchId: branchId
        };
        
        console.log('🚀 Creating employee with payload:', createPayload);
        
        const response = await fetch('http://localhost:20001/pms/api/v1/employees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(createPayload)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Create failed');
        }
        
        const createdEmployee = await response.json();
        console.log('✅ Employee created:', createdEmployee);
        
        // Reload data to get fresh employee list
        await loadData();
        setMessage(`✅ Employee ${empData.name} added successfully.`);
      }
    } catch (error: any) {
      console.error('❌ Failed to save employee:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      setMessage(`❌ Failed to save employee: ${errorMsg}`);
    } finally {
      setIsLoading(false);
      setEditEmployee(null);
      setView('employees');
    }
  };

  // Helper function to map grade rank to grade ID
  // Helper function to get grade ID from rank
  // TODO: Update with actual grade IDs from backend API
  const getGradeIdByRank = (rank: number): string => {
    const gradeMap: Record<number, string> = {
      1: "2196fb63-2919-4ede-bdc4-97e513773b7c", // Grade 1
      2: "e9b4ee7c-c225-4c42-9a7a-1cc6519b92c1", // Grade 2
      3: "grade-3-id", // TODO: Replace with actual ID from backend
      4: "grade-4-id", // TODO: Replace with actual ID from backend
      5: "grade-5-id", // TODO: Replace with actual ID from backend
      6: "grade-6-id"  // TODO: Replace with actual ID from backend
    };
    return gradeMap[rank] || gradeMap[6]; // Default to grade 6
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete employee ID ${id}?`)) {
      try {
        setIsLoading(true);
        await employeeService.delete(id);
        setEmployees(employees.filter(emp => emp.id !== id));
        setMessage(`✅ Employee ${id} deleted from real backend.`);
      } catch (error: any) {
        console.error('❌ Failed to delete employee:', error);
        setMessage(`❌ Failed to delete employee: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Salary calculation and payment with real backend
  // Refactored: Calculate salaries by creating payroll batch (real backend)
  const calculateSalaries = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Creating payroll batch with real backend...');
      // Prepare batch payload
      // Get companyId and fundingAccountId from company object
      const companyId = company?.id ?? "";
      const fundingAccountId = company?.mainAccount?.id ?? "";
      const payrollMonth = new Date().toISOString().slice(0, 10);
      const payload = {
        name: `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Payroll`,
        payrollMonth,
        companyId,
        fundingAccountId,
        description: `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Payroll Distribution`,
        baseSalary: grade6Basic
      };
      const batch = await payrollService.createPayrollBatch(payload);
      console.log('✅ Payroll batch created:', batch);
      
      // Reload pending batch to sync with latest batch
      if (companyId) {
        await loadPendingBatch(companyId);
      }
      
      // Force SalarySheet to reload
      setSalarySheetKey(prev => prev + 1);
      
      setMessage('✅ Payroll batch created successfully. Ready for transfer.');
    } catch (error: any) {
      // Handle active pending batch error
      const errorMsg = error?.response?.data?.message || error.message || 'Unknown error';
      const alreadyPendingMatch = errorMsg.match(/active PENDING payroll batch ID ([a-f0-9\-]{36})/i);
      if (alreadyPendingMatch) {
        const pendingBatchId = alreadyPendingMatch[1];
        setMessage(`⚠️ Company already has a pending payroll batch. Loading batch info...`);
        try {
          const batchInfo = await payrollService.getPayrollBatchById(pendingBatchId);
          localStorage.setItem('payrollBatchInfo', JSON.stringify(batchInfo));
          
          // Reload pending batch to sync state
          const companyId = company?.id ?? "";
          if (companyId) {
            await loadPendingBatch(companyId);
          }
          
          // Force SalarySheet to reload
          setSalarySheetKey(prev => prev + 1);
          
          setMessage(`⚠️ Loaded existing pending payroll batch (ID: ${pendingBatchId}).`);
          // Business logic: if batch is not completed/failed, treat as created batch
          if (batchInfo.status !== 'COMPLETED' && batchInfo.status !== 'FAILED') {
            // Set local state to use this batch
            setPayrollBatch(batchInfo);
          }
        } catch (fetchError: any) {
          setMessage(`❌ Failed to load pending batch info: ${fetchError.message || 'Unknown error'}`);
        }
      } else {
        setMessage(`❌ Failed to create payroll batch: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Top-up handler (moved here for correct scope)
  const handleTopUp = async () => {
    if (topUpAmount <= 0) {
      setMessage('❌ Please enter a valid top-up amount.');
      return;
    }
    
    const companyId = company?.id;
    if (!companyId) {
      setMessage('❌ Company ID not found. Please login again.');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔄 Processing company account top-up...');
      
      // Generate reference ID
      const referenceId = `TOPUP-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const topUpResponse = await companyService.topUp(companyId, {
        amount: topUpAmount,
        referenceId,
        description: `Account top-up for payroll processing`
      });
      
      console.log('✅ Top-up successful:', topUpResponse);
      
      // Update company balance with the full response
      setCompany(topUpResponse);
      
      const newBalance = topUpResponse.mainAccount?.currentBalance || 0;
      setMessage(`✅ ${formatCurrency(topUpAmount)} added to company account. New balance: ${formatCurrency(newBalance)}.`);
      setTopUpAmount(0);
      setIsTopUpModalOpen(false);
      
      // Continue with salary transfer if needed
      if (paymentStatus.requiredTopUp > 0) {
        transferSalaries(true);
      }
    } catch (error: any) {
      console.error('❌ Top-up failed:', error);
      setMessage(`❌ Top-up failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };


  // Employee Form Component - Optimized for API
  const EmployeeForm: React.FC<{ employee: EmployeeDisplay, onSave: (emp: EmployeeDisplay) => void, onCancel: () => void }> = ({ employee, onSave, onCancel }) => {
    // Use grades and branches from API (fetched in loadData)
    const availableGrades = grades.length > 0 ? grades : [];
    const availableBranches = branches.length > 0 ? branches : [];
    
    const [formData, setFormData] = useState({
      ...employee,
      username: employee.username || '',
      email: employee.email || '',
      password: employee.password || '',
      // Ensure bankAccount is properly initialized with first branch as default
      bankAccount: {
        type: employee.bankAccount?.type || 'SAVINGS',
        name: employee.bankAccount?.name || '',
        number: employee.bankAccount?.number || '',
        balance: employee.bankAccount?.balance || 0,
        bank: employee.bankAccount?.bank || '',
        branch: employee.bankAccount?.branch || (availableBranches.length > 0 ? availableBranches[0].id : '')
      }
    });

    // Check if editing existing employee (id, code, username are readonly)
    const isEditing = !!(employee.id && employee.id !== getNextEmployeeId());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      if (name === 'grade') {
        // Find the grade object by ID (value is now the grade ID)
        const selectedGrade = availableGrades.find(g => g.id === value);
        setFormData(prev => ({
          ...prev,
          grade: selectedGrade || prev.grade,
        }));
      } else if (name === 'mobile') {
        // Format mobile number with country code
        let formattedMobile = value.replace(/[^\d+]/g, ''); // Remove non-digit characters except +
        
        // If user types numbers without +, auto-add +880
        if (formattedMobile && !formattedMobile.startsWith('+')) {
          formattedMobile = '+880' + formattedMobile;
        }
        
        setFormData(prev => ({
          ...prev,
          mobile: formattedMobile,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: type === 'number' ? Number(value) : value,
        }));
      }
    };

    const handleBankChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setFormData(prev => ({
        ...prev,
        bankAccount: {
          ...prev.bankAccount,
          [name]: type === 'number' ? Number(value) : value,
        }
      }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      console.log('📝 Form submitted. Validating data:', formData);
      
      // For ADD mode: validate all required fields
      // For EDIT mode: no required validation (all fields optional)
      if (!isEditing) {
        const requiredFields = {
          'Employee ID': formData.id,
          'Name': formData.name,
          'Grade': formData.grade?.id,
          'Mobile': formData.mobile,
          'Address': formData.address,
          'Username': formData.username,
          'Email': formData.email,
          'Password': formData.password,
          'Account Name': formData.bankAccount?.name,
          'Account Number': formData.bankAccount?.number,
          'Branch Name': formData.bankAccount?.branch
        };

        const missingFields = Object.entries(requiredFields)
          .filter(([_, value]) => !value || (typeof value === 'string' && value.trim() === ''))
          .map(([field]) => field);

        if (missingFields.length > 0) {
          console.error('❌ Missing fields:', missingFields);
          setMessage(`❌ Please fill in all required fields: ${missingFields.join(', ')}`);
          return;
        }

        // Validate email format (only for add mode)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
          console.error('❌ Invalid email:', formData.email);
          setMessage('❌ Please enter a valid email address.');
          return;
        }
      } else {
        // For edit mode, only validate email format if provided
        if (formData.email && formData.email.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.email)) {
            console.error('❌ Invalid email:', formData.email);
            setMessage('❌ Please enter a valid email address.');
            return;
          }
        }
      }

      console.log('✅ Validation passed. Submitting employee data...');
      onSave(formData);
    };

    const isAdding = employee.id === getNextEmployeeId();

    return (
      <div className="employee-form-container">
        <h2 className="form-title">
          👤 {isAdding ? 'Add New Employee' : `Edit Employee: ${formData.name}`}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Personal Information Section */}
            <div className="form-section">
              <div className="form-section-title">👤 Personal Information</div>
              {/* Hide internal ID fields in Add Employee mode */}
              {isEditing && (
                <div className="form-group">
                  <label className="form-label">Employee ID (Code)</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code || formData.id}
                    className="form-input"
                    readOnly
                    disabled
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">
                  Full Name {!isEditing && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter full name"
                  required={!isEditing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Grade / Rank {!isEditing && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <select
                  name="grade"
                  value={formData.grade?.id || ''}
                  onChange={handleChange}
                  className="form-select"
                  required={!isEditing}
                >
                  {availableGrades.length > 0 ? (
                    availableGrades.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Loading grades...</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Mobile Number {!isEditing && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+880 1XXXXXXXXX"
                  required={!isEditing}
                  pattern="^\+880\d{10}$"
                  title="Mobile number must be in format: +880XXXXXXXXXX (11 digits after +880)"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Format: +880 followed by 10 digits (e.g., +8801712345678)
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Address {!isEditing && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="City, Country"
                  required={!isEditing}
                />
              </div>
            </div>

            {/* Login Credentials Section */}
            <div className="form-section">
              <div className="form-section-title">🔐 Login Credentials</div>
              <div className="form-group">
                <label className="form-label">
                  Email {!isEditing && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="user@example.com"
                  required={!isEditing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Password {!isEditing && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                  required={!isEditing}
                />
              </div>
            </div>

            {/* Bank Account Information Section */}
            <div className="form-section">
              <div className="form-section-title">🏦 Bank Account Details</div>
              <div className="form-group">
                <label className="form-label">
                  Account Name {!isEditing && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.bankAccount.name || formData.name}
                  onChange={handleBankChange}
                  className="form-input"
                  placeholder="Same as employee name"
                  required={!isEditing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Account Number {!isEditing && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.bankAccount.number}
                  onChange={handleBankChange}
                  className="form-input"
                  placeholder="11-digit account number"
                  required={!isEditing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Account Type {!isEditing && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <select
                  name="type"
                  value={formData.bankAccount.type || 'SAVINGS'}
                  onChange={handleBankChange}
                  className="form-select"
                  required={!isEditing}
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Branch Name {!isEditing && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <select
                  name="branch"
                  value={formData.bankAccount.branch}
                  onChange={handleBankChange}
                  className="form-select"
                  required={!isEditing}
                >
                  {availableBranches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section-full">
            <div className="form-actions">
              <button type="button" onClick={onCancel} className="form-cancel-button">
                ✕ Cancel
              </button>
              <button type="submit" className="form-save-button" disabled={isLoading}>
                {isLoading ? '⏳ Saving...' : '💾 Save Employee'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  // Top-Up Modal Component - Professional styling matching employee form
  const TopUpModal: React.FC<{ isOpen: boolean, onClose: () => void, requiredTopUp: number, onTopUp: () => void, companyBalance: number }> = ({ isOpen, onClose, requiredTopUp, onTopUp, companyBalance }) => {
    if (!isOpen) return null;

    const isInsufficientFunds = requiredTopUp > 0;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1.5rem 2rem',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            color: 'white'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
              {isInsufficientFunds ? '💰 Top-Up Required' : '💰 Add Funds'}
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', opacity: 0.9 }}>
              {isInsufficientFunds 
                ? 'Insufficient balance to complete salary transfer' 
                : 'Add funds to your company account'}
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '2rem' }}>
              {/* Balance Info */}
              <div style={{
                backgroundColor: isInsufficientFunds ? '#fef2f2' : '#f0f4ff',
                border: `2px solid ${isInsufficientFunds ? '#fee2e2' : '#e0e7ff'}`,
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ marginBottom: isInsufficientFunds ? '0.75rem' : 0 }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                    Current Account Balance
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: isInsufficientFunds ? '#dc2626' : '#4f46e5', marginTop: '0.25rem' }}>
                    {formatCurrency(companyBalance)}
                  </div>
                </div>
                
                {isInsufficientFunds && (
                  <>
                    <div style={{ borderTop: '1px solid #fecaca', margin: '0.75rem 0', paddingTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                        Required Top-Up Amount
                      </span>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626', marginTop: '0.25rem' }}>
                        {formatCurrency(requiredTopUp)}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#991b1b', marginTop: '0.75rem', marginBottom: 0 }}>
                      ⚠️ The company account does not have sufficient funds to complete the salary transfer.
                    </p>
                  </>
                )}
                
                {!isInsufficientFunds && (
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.75rem', marginBottom: 0 }}>
                    💡 Add funds to your company account for payroll processing and other expenses.
                  </p>
                )}
              </div>            {/* Input Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="topup-amount" 
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}
              >
                Top-Up Amount (BDT) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="topup-amount"
                type="number"
                value={topUpAmount || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  if (val <= 1000000) {
                    setTopUpAmount(val);
                  }
                }}
                min={isInsufficientFunds ? requiredTopUp : 1000}
                max={1000000}
                step={1000}
                placeholder="Enter amount to add (min: 1,000, max: 10,00,000)"
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '1rem',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', marginBottom: 0 }}>
                Minimum: {formatCurrency(isInsufficientFunds ? requiredTopUp : 1000)} &nbsp;|&nbsp; Maximum: {formatCurrency(1000000)} (10 Lakh)
              </p>
              {topUpAmount > 1000000 && (
                <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem', marginBottom: 0 }}>
                  ⚠️ Maximum top-up amount is {formatCurrency(1000000)} (10 Lakh BDT)
                </p>
              )}
            </div>

            {/* New Balance Preview */}
            {topUpAmount > 0 && topUpAmount <= 1000000 && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '2px solid #bbf7d0',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '600' }}>
                  New Balance After Top-Up
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a', marginTop: '0.25rem' }}>
                  {formatCurrency(companyBalance + topUpAmount)}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                disabled={isLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                ✕ Cancel
              </button>
              <button
                onClick={onTopUp}
                disabled={topUpAmount <= 0 || topUpAmount > 1000000 || isLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  background: (topUpAmount <= 0 || topUpAmount > 1000000 || isLoading) 
                    ? '#d1d5db' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: (topUpAmount <= 0 || topUpAmount > 1000000 || isLoading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: (topUpAmount <= 0 || topUpAmount > 1000000 || isLoading) ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (topUpAmount > 0 && topUpAmount <= 1000000 && !isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = (topUpAmount <= 0 || topUpAmount > 1000000 || isLoading) ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                {isLoading ? '⏳ Processing...' : `💰 ${isInsufficientFunds ? 'Add Funds & Continue' : 'Add Funds'}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Login Screen (same design, real backend)
  if (!isLoggedIn) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        zIndex: 1000
      }}>
        <form onSubmit={handleLogin} style={{
          width: '100%',
          maxWidth: '450px',
          padding: '3rem',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '2px solid rgba(255, 255, 255, 0.18)'
        }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: '#1f2937',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            💼 Payroll Login
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            {/* Real Backend Integration: http://localhost:20001/pms/api/v1 */}
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem'
            }}>Username</label>
            <input 
              type="text" 
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              required 
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem'
            }}>Password</label>
            <input 
              type="password" 
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              required 
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease'
              }}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.1rem',
              border: 'none',
              borderRadius: '12px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              marginTop: '1rem'
            }}
          >
            🔐 {isLoading ? 'Connecting...' : 'Sign In'}
          </button>
          {error && (
            <p style={{
              fontSize: '0.9rem',
              color: '#dc2626',
              textAlign: 'center',
              marginTop: '1rem',
              fontWeight: '500'
            }}>
              ❌ {error}
            </p>
          )}
          {message && !error && (
            <p style={{
              fontSize: '0.9rem',
              color: '#059669',
              textAlign: 'center',
              marginTop: '1rem',
              fontWeight: '500'
            }}>
              {message}
            </p>
          )}
        </form>
      </div>
    );
  }

  // --- Button state logic based on pendingBatch ---
  const batchStatus = pendingBatch ? (pendingBatch.payrollStatus || pendingBatch.status || '') : '';
  // Sync logic: treat PENDING, PROCESSING, PARTIALLY_COMPLETED as active
  const isBatchActive = batchStatus === 'PENDING' || batchStatus === 'PROCESSING' || batchStatus === 'PARTIALLY_COMPLETED';
  const canManagePayrollFlag = isAdmin() || isEmployer();
  let calculateButtonDisabled = true;
  let transferButtonDisabled = true;
  let salaryInputDisabled = true;
  if (canManagePayrollFlag) {
    if (isBatchActive) {
      calculateButtonDisabled = true;
      transferButtonDisabled = false;
      salaryInputDisabled = true;
    } else {
      calculateButtonDisabled = isLoading;
      transferButtonDisabled = true;
      salaryInputDisabled = false;
    }
  } else {
    calculateButtonDisabled = true;
    transferButtonDisabled = true;
    salaryInputDisabled = true;
  }

  // Main Application (exact same UI as original)
  return (
    <div className="app-container">
      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        requiredTopUp={paymentStatus.requiredTopUp}
        onTopUp={handleTopUp}
        companyBalance={companyAccountBalance ?? 0}
      />

      <div className="main-content">
        {/* Header */}
        <header className="app-header">
          <h1 className="app-title">
            <DollarSign />
            Payroll Management System {isLoading && '⏳'}
          </h1>
          <div className="header-actions">
            <div className={`company-balance ${companyAccountBalance !== null && companyAccountBalance < 0 ? 'negative' : ''}`}>
              Company Balance: {
                isLoading
                  ? <span style={{fontStyle: 'italic', color: '#888'}}>Loading...</span>
                  : (companyAccountBalance !== null && typeof companyAccountBalance === 'number' && !isNaN(companyAccountBalance))
                    ? formatCurrency(companyAccountBalance)
                    : '—'
              }
            </div>
            <button 
              onClick={() => {
                setPaymentStatus({ totalPaid: 0, requiredTopUp: 0 });
                setIsTopUpModalOpen(true);
              }} 
              className="action-button"
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
              disabled={isLoading}
            >
              ➕ Top Up Account
            </button>
            <button onClick={handleLogout} className="logout-button" disabled={isLoading}>
              <LogOut />
              Logout
            </button>
          </div>
        </header>

        {/* Real Backend Status Indicator */}
        <div style={{
          background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
          border: '2px solid #10b981',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem',
          textAlign: 'center',
          fontWeight: '600',
          color: '#047857'
        }}>
          ✅ <strong>System Connected!</strong> Employee management system active
        </div>

        {/* Navigation & Controls */}
        <div className="content-card">
          <div className="section-title">Employee Management System</div>
          <div className="controls-section">
            <div className="nav-buttons">
              <button
                onClick={() => setView('employees')}
                className={`nav-button ${view === 'employees' ? 'active' : ''}`}
                disabled={isLoading}
              >
                Employee Data {isEmployee() ? '(My Profile)' : '(CRUD)'}
              </button>
              <button
                onClick={() => setView('salarySheet')}
                className={`nav-button ${view === 'salarySheet' ? 'active' : ''}`}
                disabled={isLoading}
              >
                Salary Sheet {isEmployee() ? '(My Salary)' : ''}
              </button>
              {canManageEmployees() && (
                <button
                  onClick={startAddEmployee}
                  className="add-employee-button"
                  disabled={isLoading}
                >
                  <PlusCircle />
                  Add Employee
                </button>
              )}
            </div>
          </div>

          {/* Salary Input and Calculation - Only for Admin/Employer */}
          {view !== 'addEdit' && canManagePayroll() && (
            <div className="salary-controls">
              <div className="salary-input-group">
                <label htmlFor="basicSalary" className="salary-label">
                  Grade 6 Basic Salary (BDT):
                </label>
                <input
                  id="basicSalary"
                  type="number"
                  value={grade6Basic}
                  onChange={(e) => setGrade6Basic(Number(e.target.value))}
                  min="10000"
                  className="salary-input"
                  disabled={salaryInputDisabled}
                />
              </div>
              <div className="salary-action-buttons">
                <button
                  onClick={calculateSalaries}
                  className="salary-button calculate"
                  disabled={calculateButtonDisabled}
                >
                  {isLoading ? 'Calculating...' : 'Calculate All Salaries'}
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); transferSalaries(); }}
                  className="salary-button transfer"
                  disabled={transferButtonDisabled}
                >
                  {isLoading ? 'Processing...' : 'Transfer Salaries'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {message && (
          <div className={`toast ${
            message.includes('✅') || message.includes('success') || message.includes('successful') 
              ? 'toast-success' 
              : message.includes('❌') || message.includes('error') || message.includes('failed') 
              ? 'toast-error' 
              : message.includes('⚠️') || message.includes('Please') || message.includes('Need') 
              ? 'toast-warning'
              : 'toast-info'
          }`}>
            <p>{message}</p>
            <button 
              onClick={() => setMessage('')} 
              className="toast-close"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {view === 'employees' && (
          <>
            <EmployeeTable 
              employees={paginatedEmployees} 
              onEdit={(emp) => { setEditEmployee(toEmployeeDisplay(emp)); setView('addEdit'); }} 
              onDelete={handleDeleteEmployee}
              onSort={handleSort}
              sortConfig={sortConfig}
              canManageEmployees={canManageEmployees}
            />
            
            {/* Employee Pagination */}
            {sortedEmployees.length > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                gap: '1rem', 
                marginTop: '1.5rem',
                padding: '1rem 1.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                flexWrap: 'wrap'
              }}>
                {/* Left: Page size selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                    Rows per page:
                  </label>
                  <select
                    value={employeePageSize}
                    onChange={(e) => {
                      setEmployeePageSize(Number(e.target.value));
                      setEmployeePage(0);
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '2px solid #d1d5db',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      color: '#000000'
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Center: Navigation buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setEmployeePage(0)}
                    disabled={employeePage === 0}
                    title="First Page"
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: employeePage === 0 ? '#e5e7eb' : '#667eea',
                      color: employeePage === 0 ? '#9ca3af' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: employeePage === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}
                  >
                    ⏮ First
                  </button>
                  <button
                    onClick={() => setEmployeePage(prev => Math.max(0, prev - 1))}
                    disabled={employeePage === 0}
                    title="Previous Page"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: employeePage === 0 ? '#e5e7eb' : '#667eea',
                      color: employeePage === 0 ? '#9ca3af' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: employeePage === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    ← Prev
                  </button>
                  
                  {/* Page numbers */}
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    {Array.from({ length: Math.min(5, totalEmployeePages) }, (_, i) => {
                      let pageNum;
                      if (totalEmployeePages <= 5) {
                        pageNum = i;
                      } else if (employeePage < 3) {
                        pageNum = i;
                      } else if (employeePage > totalEmployeePages - 4) {
                        pageNum = totalEmployeePages - 5 + i;
                      } else {
                        pageNum = employeePage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setEmployeePage(pageNum)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: employeePage === pageNum ? '#667eea' : 'white',
                            color: employeePage === pageNum ? 'white' : '#000000',
                            border: `2px solid ${employeePage === pageNum ? '#667eea' : '#d1d5db'}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            minWidth: '2.5rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            if (employeePage !== pageNum) {
                              e.currentTarget.style.backgroundColor = '#e0e7ff';
                              e.currentTarget.style.borderColor = '#667eea';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (employeePage !== pageNum) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }
                          }}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setEmployeePage(prev => Math.min(totalEmployeePages - 1, prev + 1))}
                    disabled={employeePage >= totalEmployeePages - 1}
                    title="Next Page"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: employeePage >= totalEmployeePages - 1 ? '#e5e7eb' : '#667eea',
                      color: employeePage >= totalEmployeePages - 1 ? '#9ca3af' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: employeePage >= totalEmployeePages - 1 ? 'not-allowed' : 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Next →
                  </button>
                  <button
                    onClick={() => setEmployeePage(totalEmployeePages - 1)}
                    disabled={employeePage >= totalEmployeePages - 1}
                    title="Last Page"
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: employeePage >= totalEmployeePages - 1 ? '#e5e7eb' : '#667eea',
                      color: employeePage >= totalEmployeePages - 1 ? '#9ca3af' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: employeePage >= totalEmployeePages - 1 ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}
                  >
                    Last ⏭
                  </button>
                </div>

                {/* Right: Page info */}
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>
                  Page {employeePage + 1} of {totalEmployeePages} 
                  <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>
                    ({sortedEmployees.length} total)
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {view === 'salarySheet' && <SalarySheet key={salarySheetKey} companyData={company} />}

        {view === 'addEdit' && editEmployee && (
          <EmployeeForm
            employee={editEmployee}
            onSave={handleSaveEmployee}
            onCancel={() => { setEditEmployee(null); setView('employees'); }}
          />
        )}
      </div>
    </div>
  );
}