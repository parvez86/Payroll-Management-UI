import React, { useState, useMemo, useCallback, useEffect } from 'react';
import './SimulatedApp.css';
import { LogOut, DollarSign, PlusCircle } from './icons';

// Initial employee data matching the old project exactly
const INITIAL_EMPLOYEES = [
  { id: '1001', name: 'John A', grade: 1, address: 'Dhaka', mobile: '01700000001', salary: null, bankAccount: { type: 'Current', name: 'John A', number: '1234567890', balance: 5000, bank: 'Global Bank', branch: 'Main' } },
  { id: '1002', name: 'Jane B', grade: 2, address: 'Chittagong', mobile: '01700000002', salary: null, bankAccount: { type: 'Savings', name: 'Jane B', number: '1234567891', balance: 3500, bank: 'Global Bank', branch: 'North' } },
  { id: '1003', name: 'Amit C', grade: 3, address: 'Rajshahi', mobile: '01700000003', salary: null, bankAccount: { type: 'Current', name: 'Amit C', number: '1234567892', balance: 8000, bank: 'City Bank', branch: 'East' } },
  { id: '1004', name: 'Sarah D', grade: 3, address: 'Khulna', mobile: '01700000004', salary: null, bankAccount: { type: 'Savings', name: 'Sarah D', number: '1234567893', balance: 2000, bank: 'City Bank', branch: 'West' } },
  { id: '1005', name: 'Fahim E', grade: 4, address: 'Barishal', mobile: '01700000005', salary: null, bankAccount: { type: 'Current', name: 'Fahim E', number: '1234567894', balance: 10000, bank: 'Apex Bank', branch: 'South' } },
  { id: '1006', name: 'Nadia F', grade: 4, address: 'Sylhet', mobile: '01700000006', salary: null, bankAccount: { type: 'Savings', name: 'Nadia F', number: '1234567895', balance: 4500, bank: 'Apex Bank', branch: 'Central' } },
  { id: '1007', name: 'Kamal G', grade: 5, address: 'Rangpur', mobile: '01700000007', salary: null, bankAccount: { type: 'Current', name: 'Kamal G', number: '1234567896', balance: 6000, bank: 'Prime Bank', branch: 'Airport' } },
  { id: '1008', name: 'Rina H', grade: 5, address: 'Mymensingh', mobile: '01700000008', salary: null, bankAccount: { type: 'Savings', name: 'Rina H', number: '1234567897', balance: 1200, bank: 'Prime Bank', branch: 'Road' } },
  { id: '1009', name: 'Tareq I', grade: 6, address: 'Comilla', mobile: '01700000009', salary: null, bankAccount: { type: 'Current', name: 'Tareq I', number: '1234567898', balance: 7500, bank: 'United Bank', branch: 'Old' } },
  { id: '1010', name: 'Shanta J', grade: 6, address: 'Bogura', mobile: '01700000010', salary: null, bankAccount: { type: 'Savings', name: 'Shanta J', number: '1234567899', balance: 9000, bank: 'United Bank', branch: 'New' } },
];

const GRADE_LEVELS = [6, 5, 4, 3, 2, 1]; // From lowest to highest grade

// Utility functions
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

// Types
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

interface Employee {
  id: string;
  name: string;
  grade: number;
  address: string;
  mobile: string;
  salary: SalaryDetails | null;
  bankAccount: BankAccount;
}

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
            {employees.sort((a, b) => a.grade - b.grade).map((emp) => (
              <tr key={emp.id} className={emp.salary?.isPaid ? 'table-row-success' : ''}>
                <td className="table-cell">
                  <div className="employee-info">
                    <div className="employee-name">{emp.name}</div>
                    <div className="employee-id">ID: {emp.id}</div>
                  </div>
                </td>
                <td className="table-cell text-center">
                  <span className="grade-badge">G{emp.grade}</span>
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

// Employee Table Component
const EmployeeTable: React.FC<{ 
  employees: Employee[], 
  onEdit: (emp: Employee) => void, 
  onDelete: (id: string) => void,
  onSort: (key: string) => void,
  sortConfig: {key: string, direction: 'asc' | 'desc'} | null 
}> = ({ employees, onEdit, onDelete, onSort, sortConfig }) => {
  
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
            <th className="table-cell text-center">Actions</th>
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
                <div className="grade-badge">G{emp.grade}</div>
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
              <td className="table-cell text-center">
                <button onClick={() => onEdit(emp)} className="action-button edit">✏️</button>
                <button onClick={() => onDelete(emp.id)} className="action-button delete">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [companyAccountBalance, setCompanyAccountBalance] = useState(500000);
  const [grade6Basic, setGrade6Basic] = useState(25000);
  const [view, setView] = useState('employees');
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [message, setMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState({ totalPaid: 0, requiredTopUp: 0 });
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Memoized calculations
  const basicSalariesByGrade = useMemo(() => {
    return GRADE_LEVELS.reduce((acc, grade) => {
      acc[grade] = calculateBasicSalary(grade, grade6Basic);
      return acc;
    }, {} as Record<number, number>);
  }, [grade6Basic]);

  const totalSalaryRequired = useMemo(() => {
    return employees.reduce((total, emp) => total + (emp.salary?.gross || 0), 0);
  }, [employees]);

  // Auth functions
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Login successful. Simulating JWT authorization.');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setMessage('Logged out successfully.');
    setIsLoggedIn(false);
    setView('employees');
  };

  // Sorting function
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

  // Employee CRUD operations
  const getNextEmployeeId = useCallback(() => {
    const maxId = employees.reduce((max, emp) => Math.max(max, parseInt(emp.id)), 0);
    const newId = (maxId + 1).toString().padStart(4, '0');
    return newId;
  }, [employees]);

  const startAddEmployee = () => {
    const newId = getNextEmployeeId();
    setEditEmployee({
      id: newId, name: '', grade: 6, address: '', mobile: '', salary: null,
      bankAccount: { type: 'Savings', name: '', number: '', balance: 0, bank: '', branch: '' }
    });
    setView('addEdit');
  };

  const handleSaveEmployee = (empData: Employee) => {
    const existingIndex = employees.findIndex(e => e.id === empData.id);
    if (existingIndex !== -1) {
      const newEmployees = [...employees];
      newEmployees[existingIndex] = empData;
      setEmployees(newEmployees);
      setMessage(`Employee ${empData.id} updated successfully.`);
    } else {
      setEmployees([...employees, empData]);
      setMessage(`Employee ${empData.id} added successfully.`);
    }
    setEditEmployee(null);
    setView('employees');
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm(`Are you sure you want to delete employee ID ${id}?`)) {
      setEmployees(employees.filter(emp => emp.id !== id));
      setMessage(`Employee ${id} deleted.`);
    }
  };

  // Salary calculation and payment
  const calculateSalaries = () => {
    const updatedEmployees = employees.map(emp => {
      const basic = basicSalariesByGrade[emp.grade];
      const salaryDetails = calculateTotalSalary(basic);
      return {
        ...emp,
        salary: salaryDetails
      };
    });
    setEmployees(updatedEmployees);
    setPaymentStatus({ totalPaid: 0, requiredTopUp: 0 });
    setMessage('Salaries calculated successfully. Ready for transfer.');
  };

  const handleTopUp = () => {
    if (topUpAmount <= 0) {
      setMessage('Please enter a valid top-up amount.');
      return;
    }
    const newBalance = companyAccountBalance + topUpAmount;
    setCompanyAccountBalance(newBalance);
    setMessage(`${formatCurrency(topUpAmount)} added to company account. New balance: ${formatCurrency(newBalance)}.`);
    setTopUpAmount(0);
    setIsTopUpModalOpen(false);
    if (paymentStatus.requiredTopUp > 0) {
      transferSalaries(true);
    }
  };

  const transferSalaries = (isContinuing = false) => {
    let currentBalance = companyAccountBalance;
    let paidCount = 0;
    let paidAmount = 0;
    let requiredTopUp = 0;
    let allPaid = true;

    const employeesToPay = isContinuing
      ? employees.filter(e => e.salary && e.salary.gross > 0 && !e.salary.isPaid)
      : employees.filter(e => e.salary && e.salary.gross > 0);

    const updatedEmployees = employees.map(emp => {
      if (emp.salary?.isPaid || !employeesToPay.find(e => e.id === emp.id)) {
        return emp;
      }

      if (!emp.salary) return emp;
      
      const grossSalary = emp.salary.gross;

      if (currentBalance >= grossSalary) {
        currentBalance -= grossSalary;
        paidAmount += grossSalary;
        paidCount++;
        return {
          ...emp,
          salary: { ...emp.salary, isPaid: true },
          bankAccount: { ...emp.bankAccount, balance: emp.bankAccount.balance + grossSalary }
        };
      } else {
        requiredTopUp = grossSalary - currentBalance;
        allPaid = false;
        return emp;
      }
    }).sort((a, b) => a.grade - b.grade);

    setCompanyAccountBalance(currentBalance);
    setEmployees(updatedEmployees);

    const newTotalPaid = paymentStatus.totalPaid + paidAmount;

    if (!allPaid) {
      setPaymentStatus({ totalPaid: newTotalPaid, requiredTopUp });
      setMessage(`Company account ran out of money! ${employeesToPay.length - paidCount} employees remain unpaid. Need ${formatCurrency(requiredTopUp)} minimum to continue.`);
      setIsTopUpModalOpen(true);
    } else {
      setPaymentStatus({ totalPaid: newTotalPaid, requiredTopUp: 0 });
      setMessage(`Salary transfer complete. Paid ${paidCount} employees successfully!`);
    }

    if (isContinuing && allPaid) {
      setIsTopUpModalOpen(false);
    }
  };

  // Employee Form Component
  const EmployeeForm: React.FC<{ employee: Employee, onSave: (emp: Employee) => void, onCancel: () => void }> = ({ employee, onSave, onCancel }) => {
    const [formData, setFormData] = useState(employee);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }));
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
        setMessage('Please fill in all required fields.');
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
                  value={formData.grade}
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
              <button type="submit" className="form-save-button">
                💾 Save Employee
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  // Top-Up Modal Component
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
            <button onClick={onTopUp} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition" disabled={topUpAmount <= 0}>
              <div className="flex items-center">➕ Add Funds & Continue</div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Login Screen  
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
            Simulated Auth: Enter any credentials to proceed.
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
              defaultValue="admin" 
              required 
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
              defaultValue="password" 
              required 
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
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.1rem',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              marginTop: '1rem'
            }}
          >
            🔐 Sign In
          </button>
          {message && (
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

  // Main Application
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
            Payroll Management System
          </h1>
          <div className="header-actions">
            <div className={`company-balance ${companyAccountBalance < 0 ? 'negative' : ''}`}>
              Company Balance: {formatCurrency(companyAccountBalance)}
            </div>
            <button onClick={handleLogout} className="logout-button">
              <LogOut />
              Logout
            </button>
          </div>
        </header>

        {/* Navigation & Controls */}
        <div className="content-card">
          <div className="section-title">Employee Management System</div>
          <div className="controls-section">
            <div className="nav-buttons">
              <button
                onClick={() => setView('employees')}
                className={`nav-button ${view === 'employees' ? 'active' : ''}`}
              >
                Employee Data (CRUD)
              </button>
              <button
                onClick={() => setView('salarySheet')}
                className={`nav-button ${view === 'salarySheet' ? 'active' : ''}`}
              >
                Salary Sheet
              </button>
              <button
                onClick={startAddEmployee}
                className="add-employee-button"
              >
                <PlusCircle />
                Add Employee
              </button>
            </div>
          </div>

          {/* Salary Input and Calculation */}
          {view !== 'addEdit' && (
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
                />
              </div>
              <div className="salary-action-buttons">
                <button
                  onClick={calculateSalaries}
                  className="salary-button calculate"
                >
                  Calculate All Salaries
                </button>
                <button
                  onClick={() => transferSalaries()}
                  disabled={totalSalaryRequired === 0 || totalSalaryRequired > companyAccountBalance}
                  className="salary-button transfer"
                >
                  Transfer Salaries
                </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {message && (
        <div className={`toast ${
          message.includes('success') || message.includes('added') || message.includes('complete') 
            ? 'toast-success' 
            : message.includes('error') || message.includes('out of money') || message.includes('ran out') 
            ? 'toast-error' 
            : message.includes('Please') || message.includes('Need') 
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
        />
      )}

      {view === 'salarySheet' && (
        <SalarySheet employees={employees} totalPaid={paymentStatus.totalPaid} companyBalance={companyAccountBalance} />
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