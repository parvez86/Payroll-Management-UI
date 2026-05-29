import React from 'react';
import { Link } from 'react-router-dom';
import { useEmployees } from '../contexts/EmployeeContext';
import { useCompany } from '../contexts/CompanyContext';
import { calculateSalary, formatCurrency, GRADE_LIMITS } from '../utils/salaryCalculator';

const Dashboard: React.FC = () => {
  const { employees, isLoading: employeesLoading } = useEmployees();
  const { company, isLoading: companyLoading } = useCompany();

  if (employeesLoading || companyLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  // Calculate grade distribution
  const gradeDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  employees.forEach(emp => {
    if (emp.grade >= 1 && emp.grade <= 6) {
      gradeDistribution[emp.grade as keyof typeof gradeDistribution]++;
    }
  });

  // Calculate total payroll with sample base salary
  const baseSalaryGrade6 = 30000; // Default base for demo
  const totalPayroll = employees.reduce((total, emp) => {
    const salary = calculateSalary(emp.grade, baseSalaryGrade6);
    return total + salary.gross;
  }, 0);

  return (
    <div className="dashboard">
      <h2>Dashboard Overview</h2>
      
      <div className="dashboard-grid">
        {/* Company Account Card */}
        <div className="dashboard-card">
          <h3>Company Account</h3>
          <div className="account-info">
            <p><strong>Balance:</strong> {formatCurrency(company?.currentBalance || 0)}</p>
            <p><strong>Account:</strong> {company?.account?.accountNumber || 'N/A'}</p>
            <div className={`balance-status ${(company?.currentBalance || 0) >= totalPayroll ? 'sufficient' : 'insufficient'}`}>
              {(company?.currentBalance || 0) >= totalPayroll ? 'Sufficient for payroll' : 'Insufficient funds'}
            </div>
          </div>
        </div>

        {/* Employee Summary Card */}
        <div className="dashboard-card">
          <h3>Employee Summary</h3>
          <div className="employee-stats">
            <p><strong>Total Employees:</strong> {employees.length} / 10</p>
            <div className="grade-distribution">
              <h4>Grade Distribution:</h4>
              {Object.entries(GRADE_LIMITS).map(([grade, limit]) => (
                <div key={grade} className="grade-item">
                  <span>Grade {grade}:</span>
                  <span className={gradeDistribution[parseInt(grade) as keyof typeof gradeDistribution] === limit ? 'complete' : 'incomplete'}>
                    {gradeDistribution[parseInt(grade) as keyof typeof gradeDistribution]} / {limit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payroll Summary Card */}
        <div className="dashboard-card">
          <h3>Payroll Summary</h3>
          <div className="payroll-stats">
            <p><strong>Total Monthly Payroll:</strong> {formatCurrency(totalPayroll)}</p>
            <p><strong>Average Salary:</strong> {formatCurrency(employees.length > 0 ? totalPayroll / employees.length : 0)}</p>
            <div className="payroll-status">
              <div className={`status-indicator ${(company?.currentBalance || 0) >= totalPayroll ? 'ready' : 'blocked'}`}>
                {(company?.currentBalance || 0) >= totalPayroll ? 'Ready to Process' : 'Needs Top-up'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="dashboard-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/employees" className="action-btn">
              👥 Manage Employees
            </Link>
            <Link to="/payroll" className="action-btn primary">
              💰 Process Payroll
            </Link>
            <Link to="/company" className="action-btn">
              🏢 Top-up Account
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>System Status</h3>
        <div className="status-list">
          <div className={`status-item ${employees.length === 10 ? 'success' : 'warning'}`}>
            <span>Employee Count:</span>
            <span>{employees.length === 10 ? 'Complete (10/10)' : `Incomplete (${employees.length}/10)`}</span>
          </div>
          <div className={`status-item ${Object.entries(gradeDistribution).every(([grade, count]) => count === GRADE_LIMITS[parseInt(grade) as keyof typeof GRADE_LIMITS]) ? 'success' : 'warning'}`}>
            <span>Grade Distribution:</span>
            <span>{Object.entries(gradeDistribution).every(([grade, count]) => count === GRADE_LIMITS[parseInt(grade) as keyof typeof GRADE_LIMITS]) ? 'Balanced' : 'Needs adjustment'}</span>
          </div>
          <div className={`status-item ${(company?.currentBalance || 0) >= totalPayroll ? 'success' : 'error'}`}>
            <span>Payroll Funding:</span>
            <span>{(company?.currentBalance || 0) >= totalPayroll ? 'Sufficient' : 'Insufficient'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;