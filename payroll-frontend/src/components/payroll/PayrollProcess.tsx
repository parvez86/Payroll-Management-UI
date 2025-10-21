import React, { useState } from 'react';
import { useEmployees } from '../../contexts/EmployeeContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useStatusMessages } from '../../contexts/StatusMessageContext';
import { payrollService } from '../../services/api';
import { calculateSalary, formatCurrency } from '../../utils/salaryCalculator';
import TopUpModal from '../shared/TopUpModal';
import type { PayrollBatch, PayrollItem, TopUpRequest } from '../../types';

const PayrollProcess: React.FC = () => {
  const { employees } = useEmployees();
  const { company, loadCompanyAccount, topUpAccount } = useCompany();
  const { addMessage } = useStatusMessages();
  const [baseSalaryGrade6, setBaseSalaryGrade6] = useState(30000);
  const [payrollBatch, setPayrollBatch] = useState<PayrollBatch | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [requiredTopUp, setRequiredTopUp] = useState(0);
  const [processedItems, setProcessedItems] = useState<PayrollItem[]>([]);
  const [remainingItems, setRemainingItems] = useState<PayrollItem[]>([]);

  // Calculate payroll items
  const payrollItems: PayrollItem[] = employees.map(employee => {
    const salary = calculateSalary(employee.grade, baseSalaryGrade6);
    return {
      id: `item-${employee.id}`,
      employeeId: employee.id,
      employee,
      basic: salary.basic,
      hra: salary.hra,
      medical: salary.medical,
      gross: salary.gross,
      status: 'PENDING',
    };
  });

  const totalPayroll = payrollItems.reduce((sum, item) => sum + item.gross, 0);
  const companyBalance = company?.currentBalance || 0;
  const isInsufficientFunds = companyBalance < totalPayroll;

  // Smart payroll processing - similar to old project logic
  const handleProcessPayroll = async () => {
    if (employees.length !== 10) {
      addMessage('error', 'Cannot process payroll: Must have exactly 10 employees');
      return;
    }

    setIsProcessing(true);

    try {
      const sortedItems = [...payrollItems].sort((a, b) => a.employee.grade - b.employee.grade);
      let currentBalance = company?.currentBalance || 0;
      let paidCount = 0;
      let paidAmount = 0;
      const processed: PayrollItem[] = [];
      const remaining: PayrollItem[] = [];

      // Process employees one by one, checking funds for each
      for (const item of sortedItems) {
        if (currentBalance >= item.gross) {
          currentBalance -= item.gross;
          paidAmount += item.gross;
          paidCount++;
          processed.push({ ...item, status: 'PAID' });
        } else {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        // Insufficient funds for some employees
        const nextEmployee = remaining[0];
        const needed = nextEmployee.gross - currentBalance;
        
        setRequiredTopUp(needed);
        setProcessedItems(processed);
        setRemainingItems(remaining);
        setShowTopUpModal(true);
        
        addMessage('warning', 
          `Insufficient funds! Paid ${paidCount} employees successfully.`, 
          `Need ${formatCurrency(needed)} more to pay ${nextEmployee.employee.name}.`,
          false
        );
      } else {
        // All employees paid successfully
        const batch = await payrollService.createBatch();
        const processedBatch = await payrollService.processBatch(batch.id);
        setPayrollBatch(processedBatch);
        
        await loadCompanyAccount();
        
        addMessage('success', 
          `Payroll processed successfully! Paid ${paidCount} employees.`,
          `Total amount: ${formatCurrency(paidAmount)}`
        );
      }

    } catch (error: any) {
      addMessage('error', 'Failed to process payroll', error.response?.data?.message || error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTopUpComplete = async (request: TopUpRequest) => {
    try {
      await topUpAccount(request);
      await loadCompanyAccount();
      
      addMessage('success', 
        `Account topped up with ${formatCurrency(request.amount)}`,
        'Continuing with payroll processing...'
      );
      
      setShowTopUpModal(false);
      
      // Continue processing remaining employees after top-up
      setTimeout(() => {
        handleProcessPayroll();
      }, 1000);
      
    } catch (error: any) {
      addMessage('error', 'Failed to top up account', error.response?.data?.message || error.message);
      throw error;
    }
  };

  return (
    <div className="payroll-process">
      <div className="page-header">
        <h2>Payroll Processing</h2>
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
      </div>

      {/* Payroll Summary */}
      <div className="payroll-summary">
        <div className="summary-card">
          <h3>Payroll Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <label>Total Employees:</label>
              <span>{employees.length} / 10</span>
            </div>
            <div className="stat">
              <label>Total Payroll:</label>
              <span className="amount">{formatCurrency(totalPayroll)}</span>
            </div>
            <div className="stat">
              <label>Company Balance:</label>
              <span className={`amount ${isInsufficientFunds ? 'insufficient' : 'sufficient'}`}>
                {formatCurrency(companyBalance)}
              </span>
            </div>
            <div className="stat">
              <label>After Payroll:</label>
              <span className={`amount ${companyBalance - totalPayroll < 0 ? 'negative' : 'positive'}`}>
                {formatCurrency(companyBalance - totalPayroll)}
              </span>
            </div>
          </div>
        </div>

        {/* Process Button */}
        <div className="process-actions">
          {isInsufficientFunds && (
            <div className="insufficient-funds-warning">
              <p>⚠️ Insufficient funds! Need {formatCurrency(totalPayroll - companyBalance)} more.</p>
            </div>
          )}
          
          <button
            onClick={handleProcessPayroll}
            disabled={isProcessing || employees.length !== 10}
            className={`process-btn ${isInsufficientFunds ? 'top-up' : 'process'}`}
          >
            {isProcessing ? '⏳ Processing...' : isInsufficientFunds ? '💰 Process with Smart Funding' : '✅ Process Payroll'}
          </button>

          {employees.length !== 10 && (
            <div className="employee-warning">
              <p>⚠️ Must have exactly 10 employees to process payroll</p>
            </div>
          )}
        </div>
      </div>

      {/* Salary Breakdown Table */}
      <div className="salary-breakdown">
        <h3>Salary Breakdown</h3>
        <div className="table-container">
          <table className="salary-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Basic</th>
                <th>HRA (20%)</th>
                <th>Medical (15%)</th>
                <th>Gross Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollItems.map(item => {
                const processedItem = processedItems.find(p => p.employeeId === item.employeeId);
                const isProcessed = !!processedItem;
                const isPending = remainingItems.find(r => r.employeeId === item.employeeId);
                
                return (
                  <tr key={item.id} className={isProcessed ? 'processed' : isPending ? 'pending' : ''}>
                    <td>{item.employee.bizId}</td>
                    <td>{item.employee.name}</td>
                    <td>
                      <span className={`grade-badge grade-${item.employee.grade}`}>
                        Grade {item.employee.grade}
                      </span>
                    </td>
                    <td>{formatCurrency(item.basic)}</td>
                    <td>{formatCurrency(item.hra)}</td>
                    <td>{formatCurrency(item.medical)}</td>
                    <td><strong>{formatCurrency(item.gross)}</strong></td>
                    <td>
                      <span className={`status-badge ${isProcessed ? 'paid' : isPending ? 'pending' : 'ready'}`}>
                        {isProcessed ? 'PAID' : isPending ? 'PENDING' : 'READY'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={6}><strong>Total Payroll</strong></td>
                <td><strong>{formatCurrency(totalPayroll)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Processed Batch Results */}
      {payrollBatch && (
        <div className="batch-results">
          <h3>Payroll Batch Results</h3>
          <div className="batch-info">
            <p><strong>Batch ID:</strong> {payrollBatch.id}</p>
            <p><strong>Status:</strong> <span className={`status-badge ${payrollBatch.status.toLowerCase()}`}>{payrollBatch.status}</span></p>
            <p><strong>Total Amount:</strong> {formatCurrency(payrollBatch.totalAmount)}</p>
            <p><strong>Processed At:</strong> {payrollBatch.executedAt ? new Date(payrollBatch.executedAt).toLocaleString() : 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Top-up Modal */}
      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onTopUp={handleTopUpComplete}
        requiredAmount={requiredTopUp}
        currentBalance={company?.currentBalance || 0}
      />
    </div>
  );
};

export default PayrollProcess;