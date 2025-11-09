import React, { useState } from 'react';
import { useEmployees } from '../../contexts/EmployeeContext';
import { calculateSalary, formatCurrency } from '../../utils/salaryCalculator';
import EmployeeForm from './EmployeeForm';
import type { Employee } from '../../types';

const EmployeeList: React.FC = () => {
  const { employees, isLoading, error, deleteEmployee } = useEmployees();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [baseSalaryGrade6, setBaseSalaryGrade6] = useState(30000);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete employee ${employee.name} (${employee.code})?`)) {
      try {
        await deleteEmployee(employee.id);
      } catch (error) {
        // Error handled by context
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  // Filter and search employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchTerm === '' || 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.code.includes(searchTerm) ||
      emp.mobile.includes(searchTerm);
    const matchesGrade = filterGrade === '' || emp.grade.rank === filterGrade;
    return matchesSearch && matchesGrade;
  });
  // Debug logs (after declaration)
  // console.log('EmployeeList: employees from context', employees);
  // console.log('EmployeeList: filteredEmployees', filteredEmployees);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Group employees by grade.rank for distribution summary
  const employeesByGrade = employees.reduce((acc, emp) => {
    const gradeRank = emp.grade.rank;
    if (!acc[gradeRank]) acc[gradeRank] = [];
    acc[gradeRank].push(emp);
    return acc;
  }, {} as Record<number, Employee[]>);

  if (isLoading) {
    return <div className="loading">Loading employees...</div>;
  }

  return (
    <div className="employee-list">
      <div className="page-header">
        <h2>Employee Management</h2>
        <div className="header-actions">
          <div className="view-controls">
            <button 
              onClick={() => setViewMode('cards')}
              className={`btn-secondary ${viewMode === 'cards' ? 'active' : ''}`}
            >
              📱 Cards
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`btn-secondary ${viewMode === 'table' ? 'active' : ''}`}
            >
              📊 Table
            </button>
          </div>
          <div className="salary-config">
            <label>Base Salary (Grade 6):</label>
            <input
              type="number"
              value={baseSalaryGrade6}
              onChange={(e) => setBaseSalaryGrade6(Number(e.target.value))}
              min="10000"
              step="1000"
            />
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary"
            disabled={employees.length >= 10}
          >
            ➕ Add Employee
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters and Search */}
      <div className="employee-controls">
        <div className="search-filter-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search by name, ID, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value === '' ? '' : Number(e.target.value))}
              className="grade-filter"
            >
              <option value="">All Grades</option>
              <option value={1}>Grade 1</option>
              <option value={2}>Grade 2</option>
              <option value={3}>Grade 3</option>
              <option value={4}>Grade 4</option>
              <option value={5}>Grade 5</option>
              <option value={6}>Grade 6</option>
            </select>
          </div>
        </div>

        <div className="employee-summary">
          <p><strong>Total Employees:</strong> {employees.length} / 10</p>
          <p><strong>Showing:</strong> {filteredEmployees.length} employees</p>
          <p><strong>Total Monthly Payroll:</strong> {formatCurrency(employees.reduce((total, emp) => {
            const salary = calculateSalary(emp.grade.rank, baseSalaryGrade6);
            return total + salary.gross;
          }, 0))}</p>
        </div>
      </div>

      {/* Employee Display */}
      {viewMode === 'cards' ? (
        <div className="employee-cards">
          {paginatedEmployees.length === 0 ? (
            <div className="no-data">No employees found</div>
          ) : (
            paginatedEmployees.map(employee => {
              const salary = calculateSalary(employee.grade.rank, baseSalaryGrade6);
              return (
                <div key={employee.id} className="employee-card">
                  <div className="card-header">
                    <div className="employee-info">
                      <h4>{employee.name}</h4>
                      <span className="employee-id">{employee.code}</span>
                    </div>
                    <span className={`grade-badge grade-${employee.grade.rank}`}>
                      {employee.grade.name}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span>📱 {employee.mobile}</span>
                      <span>📍 {employee.address}</span>
                    </div>
                    <div className="salary-breakdown">
                      <div className="salary-item">
                        <span>Basic:</span> <strong>{formatCurrency(salary.basic)}</strong>
                      </div>
                      <div className="salary-item">
                        <span>HRA (20%):</span> <strong>{formatCurrency(salary.hra)}</strong>
                      </div>
                      <div className="salary-item">
                        <span>Medical (15%):</span> <strong>{formatCurrency(salary.medical)}</strong>
                      </div>
                      <div className="salary-item gross">
                        <span>Gross Salary:</span> <strong>{formatCurrency(salary.gross)}</strong>
                      </div>
                    </div>
                    <div className="account-info">
                      <div>🏦 {employee.account.accountNumber}</div>
                      <small>{employee.account.branchName}</small>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button 
                      onClick={() => handleEdit(employee)}
                      className="btn-edit"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(employee)}
                      className="btn-delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="employee-table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Mobile</th>
                <th>Basic Salary</th>
                <th>HRA (20%)</th>
                <th>Medical (15%)</th>
                <th>Gross Salary</th>
                <th>Account</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="no-data">No employees found</td>
                </tr>
              ) : (
                paginatedEmployees
                  .sort((a, b) => a.grade.rank - b.grade.rank || a.code.localeCompare(b.code))
                  .map(employee => {
                    const salary = calculateSalary(employee.grade.rank, baseSalaryGrade6);
                    return (
                      <tr key={employee.id}>
                        <td className="employee-id">{employee.code}</td>
                        <td>
                          <div className="employee-info">
                            <strong>{employee.name}</strong>
                            <small>{employee.address}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`grade-badge grade-${employee.grade.rank}`}>
                            {employee.grade.name}
                          </span>
                        </td>
                        <td>{employee.mobile}</td>
                        <td>{formatCurrency(salary.basic)}</td>
                        <td>{formatCurrency(salary.hra)}</td>
                        <td>{formatCurrency(salary.medical)}</td>
                        <td><strong>{formatCurrency(salary.gross)}</strong></td>
                        <td>
                          <div className="account-info">
                            <div>{employee.account.accountNumber}</div>
                            <small>{employee.account.branchName}</small>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => handleEdit(employee)}
                              className="btn-edit"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(employee)}
                              className="btn-delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          <div className="pagination-info">
            Page {currentPage} of {totalPages} 
            <span className="item-count">
              ({filteredEmployees.length} items)
            </span>
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}

      {/* Grade Distribution Summary */}
      <div className="grade-distribution-summary">
        <h3>Grade Distribution Overview</h3>
        <div className="grade-grid">
          {[1, 2, 3, 4, 5, 6].map(grade => (
            <div key={grade} className="grade-summary">
              <h4>Grade {grade}</h4>
              <p>{employeesByGrade[grade]?.length || 0} / {grade === 1 || grade === 2 ? 1 : 2}</p>
              {employeesByGrade[grade]?.map(emp => (
                <div key={emp.id} className="employee-chip">
                  {emp.name} ({emp.code})
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Employee Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <EmployeeForm 
              employee={editingEmployee}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;