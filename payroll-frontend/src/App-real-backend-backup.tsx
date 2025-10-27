import React, { useState, useMemo, useCallback, useEffect } from 'react';
import './InterviewApp.css';
import { LogOut, DollarSign, PlusCircle } from './icons';
import { authService, employeeService, companyService, payrollService } from './services/api';
import type { Employee, Company, LoginRequest } from './types';

// Business logic constants from original design
const GRADE_LEVELS = [6, 5, 4, 3, 2, 1]; // From lowest to highest grade

// Utility functions (exact same as original)
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 0,
}).format(amount);

const calculateBasicSalary = (grade: number, grade6Basic: number) => {
  if (grade < 1 || grade > 6) return 0;
  return grade6Basic + (6 - grade) * 5000;
};

const calculateTotalSalary = (basic: number) => {
  const houseRent = basic * 0.20; // 20%
  const medicalAllowance = basic * 0.15; // 15%
  const gross = basic + houseRent + medicalAllowance;
  return {
    basic: basic,
    houseRent: houseRent,
    medicalAllowance: medicalAllowance,
    gross: Math.round(gross),
    isPaid: false,
  };
};

// Salary Sheet Component
const SalarySheet: React.FC<{ employees: Employee[], totalPaid: number, companyBalance: number }> = ({ employees, totalPaid, companyBalance }) => {
  return (
    <div className="content-card">
      <h2 className="page-title">
        💰 Salary Sheet Overview
      </h2>

      <div className="summary-grid">
        <div className="summary-card total-paid">
          <div className="summary-label">Total Paid Salary</div>
          <div className="summary-value">{formatCurrency(totalPaid)}</div>
        </div>
        <div className={`summary-card balance ${companyBalance >= 0 ? '' : 'negative'}`}>
          <div className="summary-label">Company Account Balance</div>
          <div className="summary-value">{formatCurrency(companyBalance)}</div>
        </div>
      </div>

      <div className="table-container">
        <table className="employee-table">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Name (ID)</th>
              <th className="table-cell text-center">Grade</th>
              <th className="table-cell text-right">Basic</th>
              <th className="table-cell text-right">HRA (20%)</th>
              <th className="table-cell text-right">Medical (15%)</th>
              <th className="table-cell text-right">Gross Salary</th>
              <th className="table-cell text-center">Paid Status</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {employees.sort((a, b) => a.grade.rank - b.grade.rank).map((emp) => (
              <tr key={emp.id} className={emp.salary?.isPaid ? 'table-row-success' : ''}>
                <td className="table-cell">
                  <div className="employee-info">
                    <div className="employee-name">{emp.name}</div>
                    <div className="employee-id">ID: {emp.id}</div>
                  </div>
                </td>
                <td className="table-cell text-center">
                  <span className="grade-badge">G{emp.grade.rank}</span>
                </td>
                <td className="table-cell text-right">{formatCurrency(emp.salary?.basic || 0)}</td>
                <td className="table-cell text-right">{formatCurrency(emp.salary?.houseRent || 0)}</td>
                <td className="table-cell text-right">{formatCurrency(emp.salary?.medicalAllowance || 0)}</td>
                <td className="table-cell text-right">
                  <span className="salary-amount">{formatCurrency(emp.salary?.gross || 0)}</span>
                </td>
                <td className="table-cell text-center">
                  <span className={`status-badge ${emp.salary?.isPaid ? 'status-paid' : 'status-pending'}`}>
                    {emp.salary?.isPaid ? '✅ Paid' : '⏳ Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Employee Table Component (exact same UI)
const EmployeeTable: React.FC<{ 
  employees: EmployeeDisplay[], 
  onEdit: (emp: EmployeeDisplay) => void, 
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
                  <div className="employee-id">ID: {emp.id}</div>
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
                  <span className="bank-name">{emp.bankAccount.name}</span>
                  <div className="bank-details">
                    {emp.bankAccount.number} ({emp.bankAccount.bank})
                  </div>
                </div>
              </td>
              <td className="table-cell text-right">
                <div className="amount">{formatCurrency(emp.bankAccount.balance)}</div>
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
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ username: 'admin', password: 'admin123' });
  const [userRole, setUserRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Data state (from real backend)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state (same as original)
  const [grade6Basic, setGrade6Basic] = useState(25000);
  const [view, setView] = useState('employees');
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [message, setMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState({ totalPaid: 0, requiredTopUp: 0 });
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  // Check auth status on load
  useEffect(() => {
    console.log('🔄 App loaded - checking authentication status');
    if (authService.isAuthenticated()) {
      console.log('✅ User is authenticated - loading data');
      
      // Get user role from localStorage
      const storedRole = localStorage.getItem('userRole');
      const storedUserId = localStorage.getItem('user');
      
      if (storedRole) {
        setUserRole(storedRole);
      }
      
      if (storedUserId) {
        try {
          const user = JSON.parse(storedUserId);
          setCurrentUserId(user.id || '');
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
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

  // Role-based access control helpers
  const isAdmin = () => userRole === 'ADMIN';
  const isEmployer = () => userRole === 'EMPLOYER';
  const isEmployee = () => userRole === 'EMPLOYEE';
  const canManageEmployees = () => isAdmin() || isEmployer();
  const canManagePayroll = () => isAdmin() || isEmployer();
  const canViewAllData = () => isAdmin() || isEmployer();

  // Data Loading
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading data from APIs...');

      const [employeesData, companyData] = await Promise.all([
        employeeService.getAll(0, 20, 'grade.rank'), // Get first 50 employees sorted by grade
        companyService.getAccount("fc6d6c2f-8f00-4243-9a32-39b9dc615cff")
      ]);

      // Extract employees from paginated response
      const employees = employeesData.content || [];
      console.log('📊 Raw employees from API:', employees.length);
      
      // Filter data based on user role
      let filteredEmployees = employees;
      if (isEmployee() && currentUserId) {
        // Employee can only see their own data
        filteredEmployees = employees.filter((emp: any) => emp.id === currentUserId);
        console.log('👤 Employee view - showing only own data');
      } else {
        console.log('👥 Admin/Employer view - showing all data');
      }

      setEmployees(filteredEmployees);
      setCompany(companyData);
      console.log('✅ Data loaded successfully');
      console.log('📊 Employees:', employees.length);
      console.log('🏢 Company balance:', companyData.currentBalance);
    } catch (error: any) {
      console.error('❌ Failed to load data:', error);
      setError('Failed to load data: ' + (error.message || 'Unknown error'));
      setMessage('Failed to load data. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized calculations (same as original)
  const basicSalariesByGrade = useMemo(() => {
    return GRADE_LEVELS.reduce((acc, grade) => {
      acc[grade] = calculateBasicSalary(grade, grade6Basic);
      return acc;
    }, {} as Record<number, number>);
  }, [grade6Basic]);

  const totalSalaryRequired = useMemo(() => {
    return employees.reduce((total, emp) => total + (emp.salary?.gross || 0), 0);
  }, [employees]);

  const companyAccountBalance = company?.currentBalance || 0;

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
        setCurrentUserId(userProfile.user.id);
        
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
      setCurrentUserId('');
      setView('employees');
      setEmployees([]);
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
                      key === 'balance' ? a.account.currentBalance : a.name;
        const bValue = key === 'grade' ? b.grade : 
                      key === 'name' ? b.name :
                      key === 'id' ? b.id :
                      key === 'balance' ? b.account.currentBalance : b.name;

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

  // Employee CRUD operations with real backend
  const getNextEmployeeId = useCallback(() => {
    const maxId = employees.reduce((max, emp) => Math.max(max, parseInt(emp.id)), 0);
    const newId = (maxId + 1).toString().padStart(4, '0');
    return newId;
  }, [employees]);

  const startAddEmployee = () => {
    const newId = getNextEmployeeId();
    setEditEmployee({
      id: newId, name: '', gradeRank: 6, address: '', mobile: '', salary: null,
      grade: { id: '', name: 'Grade 6', rank: 6 }, // Add grade object structure
      bankAccount: { type: 'Savings', name: '', number: '', balance: 0, bank: '', branch: '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setView('addEdit');
  };

  const handleSaveEmployee = async (empData: EmployeeDisplay) => {
    try {
      setIsLoading(true);
      
      const gradeRank = empData.gradeRank || empData.grade?.rank || 6;
      
      // Create the payload structure that matches the API
      const createPayload = {
        bizId: empData.id || `${Date.now()}`, // Use employee ID or generate one
        name: empData.name,
        mobile: empData.mobile,
        address: empData.address,
        gradeId: getGradeIdByRank(gradeRank), // You'll need this function
        companyId: "fc6d6c2f-8f00-4243-9a32-39b9dc615cff", // Hard-coded for now
        username: empData.name.toLowerCase().replace(/\s+/g, ''),
        email: `${empData.name.toLowerCase().replace(/\s+/g, '')}@company.com`,
        password: "temp123", // Default password
        accountName: empData.name,
        accountNumber: empData.bankAccount?.number || `EMP${Date.now()}`,
        accountType: empData.bankAccount?.type || "SAVINGS",
        overdraftLimit: "0.00",
        branchId: "a6f0e97e-901f-4f30-bc82-c80730c8eab0" // Hard-coded for now
      };

      const existingIndex = employees.findIndex(e => e.id === empData.id);
      
      if (existingIndex !== -1) {
        // Update existing employee
        await employeeService.update(empData.id, createPayload);
        const newEmployees = [...employees];
        newEmployees[existingIndex] = empData;
        setEmployees(newEmployees);
        setMessage(`✅ Employee ${empData.name} updated successfully.`);
      } else {
        // Create new employee
        const createdEmployee = await employeeService.create(createPayload);
        console.log('✅ Employee created:', createdEmployee);
        
        // Reload data to get fresh employee list
        await loadData();
        setMessage(`✅ Employee ${empData.name} added successfully.`);
      }
    } catch (error: any) {
      console.error('❌ Failed to save employee:', error);
      setMessage(`❌ Failed to save employee: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setEditEmployee(null);
      setView('employees');
    }
  };

  // Helper function to map grade rank to grade ID
  const getGradeIdByRank = (rank: number): string => {
    const gradeMap: Record<number, string> = {
      1: "2196fb63-2919-4ede-bdc4-97e513773b7c", // Grade 1
      2: "e9b4ee7c-c225-4c42-9a7a-1cc6519b92c1", // Grade 2
      3: "grade-3-id", // You'll need the actual IDs
      4: "grade-4-id",
      5: "grade-5-id", 
      6: "grade-6-id"
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
  const calculateSalaries = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Calculating salaries with real backend...');
      
      // Call real backend salary calculation
      const calculationResponse = await payrollService.calculateSalaries(grade6Basic);
      console.log('✅ Backend salary calculation:', calculationResponse);

      // Update local state with calculated salaries
      const updatedEmployees = employees.map(emp => {
        const backendEmp = calculationResponse.employees.find(be => be.id === emp.id);
        if (backendEmp) {
          const salaryDetails = {
            basic: backendEmp.salary.basic,
            houseRent: backendEmp.salary.houseRent,
            medicalAllowance: backendEmp.salary.medicalAllowance,
            gross: backendEmp.salary.gross,
            isPaid: false
          };
          return { ...emp, salary: salaryDetails };
        }
        return emp;
      });

      setEmployees(updatedEmployees);
      setPaymentStatus({ totalPaid: 0, requiredTopUp: 0 });
      setMessage('✅ Salaries calculated successfully with real backend API.');
    } catch (error: any) {
      console.error('❌ Failed to calculate salaries:', error);
      setMessage(`❌ Failed to calculate salaries: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (topUpAmount <= 0) {
      setMessage('❌ Please enter a valid top-up amount.');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔄 Processing company account top-up...');
      
      const topUpResponse = await companyService.topUp({
        amount: topUpAmount,
        description: `Account top-up for payroll processing`
      });
      
      console.log('✅ Top-up successful:', topUpResponse);
      
      // Update company balance
      if (company) {
        setCompany({
          ...company,
          currentBalance: topUpResponse.newBalance
        });
      }
      
      setMessage(`✅ ${formatCurrency(topUpAmount)} added to company account. New balance: ${formatCurrency(topUpResponse.newBalance)}.`);
      setTopUpAmount(0);
      setIsTopUpModalOpen(false);
      
      // Continue with salary transfer if needed
      if (paymentStatus.requiredTopUp > 0) {
        transferSalaries(true);
      }
    } catch (error: any) {
      console.error('❌ Top-up failed:', error);
      setMessage(`❌ Top-up failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const transferSalaries = async (isContinuing = false) => {
    try {
      setIsLoading(true);
      console.log('🔄 Processing salary transfers with real backend...');

      const employeeIds = employees
        .filter(e => e.salary && e.salary.gross > 0 && (!isContinuing || !e.salary.isPaid))
        .map(e => e.id);

      if (employeeIds.length === 0) {
        setMessage('❌ No employees with calculated salaries to transfer.');
        return;
      }

      const transferResponse = await payrollService.processSalaryTransfer({
        employeeIds,
        grade6Basic
      });

      console.log('✅ Salary transfer response:', transferResponse);

      // Update local state with transfer results
      const updatedEmployees = employees.map(emp => {
        const transferResult = transferResponse.transferResults.find(tr => tr.employeeId === emp.id);
        if (transferResult && transferResult.status === 'SUCCESS' && emp.salary) {
          return {
            ...emp,
            salary: { ...emp.salary, isPaid: true },
            bankAccount: { ...emp.bankAccount, balance: emp.bankAccount.balance + transferResult.salaryAmount }
          };
        }
        return emp;
      });

      setEmployees(updatedEmployees);

      // Update company balance
      if (company) {
        setCompany({
          ...company,
          currentBalance: transferResponse.companyBalanceAfter
        });
      }

      const successCount = transferResponse.transferResults.filter(tr => tr.status === 'SUCCESS').length;
      const failCount = transferResponse.transferResults.filter(tr => tr.status === 'FAILED').length;

      if (failCount === 0) {
        setPaymentStatus({ totalPaid: transferResponse.totalTransferred, requiredTopUp: 0 });
        setMessage(`✅ Salary transfer complete! Paid ${successCount} employees successfully with real backend.`);
      } else {
        const firstFailure = transferResponse.transferResults.find(tr => tr.status === 'FAILED');
        const requiredAmount = firstFailure ? parseFloat(firstFailure.reason?.match(/\d+/)?.[0] || '0') : 0;
        
        setPaymentStatus({ 
          totalPaid: transferResponse.totalTransferred, 
          requiredTopUp: requiredAmount 
        });
        setMessage(`⚠️ Partial transfer: ${successCount} paid, ${failCount} failed. ${firstFailure?.reason || 'Insufficient funds'}`);
        setIsTopUpModalOpen(true);
      }

    } catch (error: any) {
      console.error('❌ Salary transfer failed:', error);
      setMessage(`❌ Salary transfer failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Employee Form Component (exact same UI)
  const EmployeeForm: React.FC<{ employee: EmployeeDisplay, onSave: (emp: EmployeeDisplay) => void, onCancel: () => void }> = ({ employee, onSave, onCancel }) => {
    const [formData, setFormData] = useState(employee);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      if (name === 'grade') {
        // Handle grade as a number, but create the grade object structure when saving
        setFormData(prev => ({
          ...prev,
          gradeRank: Number(value), // Store as number for form
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
      if (!formData.name || !formData.mobile || !formData.bankAccount.number) {
        setMessage('❌ Please fill in all required fields.');
        return;
      }
      onSave(formData);
    };

    const isAdding = employee.id === getNextEmployeeId();

    return (
      <div className="employee-form-container">
        <h2 className="form-title">
          👤 {isAdding ? 'Add New Employee' : `Edit Employee ID: ${formData.id}`}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Personal Information Section */}
            <div className="form-section">
              <div className="form-section-title">👤 Personal Information</div>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  value={formData.id}
                  className="form-input"
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Grade / Rank *</label>
                <select
                  name="grade"
                  value={formData.gradeRank || formData.grade?.rank || 6}
                  onChange={handleChange}
                  className="form-select"
                >
                  {GRADE_LEVELS.sort((a, b) => a - b).map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Bank Account Information Section */}
            <div className="form-section">
              <div className="form-section-title">🏦 Bank Account Details</div>
              <div className="form-group">
                <label className="form-label">Account Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.bankAccount.name}
                  onChange={handleBankChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Account Number *</label>
                <input
                  type="text"
                  name="number"
                  value={formData.bankAccount.number}
                  onChange={handleBankChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Account Type *</label>
                <select
                  name="type"
                  value={formData.bankAccount.type}
                  onChange={handleBankChange}
                  className="form-select"
                >
                  <option value="Savings">Savings Account</option>
                  <option value="Current">Current Account</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bank Name *</label>
                <input
                  type="text"
                  name="bank"
                  value={formData.bankAccount.bank}
                  onChange={handleBankChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Branch Name *</label>
                <input
                  type="text"
                  name="branch"
                  value={formData.bankAccount.branch}
                  onChange={handleBankChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Current Balance (BDT) *</label>
                <input
                  type="number"
                  name="balance"
                  value={formData.bankAccount.balance}
                  onChange={handleBankChange}
                  className="form-input"
                  min={0}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section-full">
            <div className="form-actions">
              <button type="button" onClick={onCancel} className="form-cancel-button">
                ❌ Cancel
              </button>
              <button type="submit" className="form-save-button" disabled={isLoading}>
                💾 {isLoading ? 'Saving...' : 'Save Employee'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  // Top-Up Modal Component (exact same UI)
  const TopUpModal: React.FC<{ isOpen: boolean, onClose: () => void, requiredTopUp: number, onTopUp: () => void, companyBalance: number }> = ({ isOpen, onClose, requiredTopUp, onTopUp, companyBalance }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold text-red-600 flex items-center">
              ⚠️ Insufficient Funds
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">❌</button>
          </div>
          <p className="text-gray-700 mb-4">
            The company account balance of <span className="font-bold">{formatCurrency(companyBalance)}</span> is not enough to complete the salary transfer.
          </p>
          <p className="text-gray-700 mb-6 font-semibold">
            Minimum required top-up to pay the next employee: <span className="text-red-600">{formatCurrency(requiredTopUp)}</span>
          </p>

          <div className="flex flex-col space-y-3">
            <label htmlFor="topup-amount" className="text-sm font-medium text-gray-700">Top-Up Amount (BDT)</label>
            <input
              id="topup-amount"
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(Number(e.target.value))}
              min={requiredTopUp > 0 ? requiredTopUp : 1}
              className="p-3 border border-gray-300 rounded-lg text-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              Cancel Payment
            </button>
            <button 
              onClick={onTopUp} 
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition" 
              disabled={topUpAmount <= 0 || isLoading}
            >
              <div className="flex items-center">
                ➕ {isLoading ? 'Processing...' : 'Add Funds & Continue'}
              </div>
            </button>
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

  // Main Application (exact same UI as original)
  return (
    <div className="app-container">
      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        requiredTopUp={paymentStatus.requiredTopUp}
        onTopUp={handleTopUp}
        companyBalance={companyAccountBalance}
      />

      <div className="main-content">
        {/* Header */}
        <header className="app-header">
          <h1 className="app-title">
            <DollarSign />
            Payroll Management System {isLoading && '⏳'}
          </h1>
          <div className="header-actions">
            <div className={`company-balance ${companyAccountBalance < 0 ? 'negative' : ''}`}>
              Company Balance: {formatCurrency(companyAccountBalance)}
            </div>
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
                  disabled={isLoading}
                />
              </div>
              <div className="salary-action-buttons">
                <button
                  onClick={calculateSalaries}
                  className="salary-button calculate"
                  disabled={isLoading}
                >
                  {isLoading ? 'Calculating...' : 'Calculate All Salaries'}
                </button>
                <button
                  onClick={() => transferSalaries()}
                  disabled={isLoading || totalSalaryRequired === 0 || totalSalaryRequired > companyAccountBalance}
                  className="salary-button transfer"
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
          <EmployeeTable 
            employees={sortedEmployees} 
            onEdit={(emp) => { setEditEmployee(emp); setView('addEdit'); }} 
            onDelete={handleDeleteEmployee}
            onSort={handleSort}
            sortConfig={sortConfig}
            canManageEmployees={canManageEmployees}
          />
        )}

        {view === 'salarySheet' && (
          <SalarySheet 
            employees={isEmployee() ? employees.filter(emp => emp.id === currentUserId) : employees} 
            totalPaid={paymentStatus.totalPaid} 
            companyBalance={companyAccountBalance} 
          />
        )}

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