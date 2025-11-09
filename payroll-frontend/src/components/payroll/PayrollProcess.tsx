import React, { useState, useEffect } from 'react';
import { useEmployees } from '../../contexts/EmployeeContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useStatusMessages } from '../../contexts/StatusMessageContext';
import { useAuth } from '../../contexts/AuthContext';
import { payrollService } from '../../services/api';
import { calculateSalary, formatCurrency } from '../../utils/salaryCalculator';
import TopUpModal from '../shared/TopUpModal';
import type { PayrollBatch, TopUpRequest } from '../../types';

// Local payroll item interface for calculations
interface LocalPayrollItem {
  id: string;
  employeeId: string;
  employee: any;
  basic: number;
  hra: number;
  medical: number;
  gross: number;
  status: 'PENDING';
}

const PayrollProcess: React.FC = () => {
  const { employees } = useEmployees();
  const { company, loadCompanyAccount, topUpAccount } = useCompany();
  const { addMessage } = useStatusMessages();
  const { user } = useAuth();
  const [baseSalaryGrade6, setBaseSalaryGrade6] = useState(30000);
  const [payrollBatch, setPayrollBatch] = useState<PayrollBatch | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [requiredTopUp, setRequiredTopUp] = useState(0);
  const [payrollItems, setPayrollItems] = useState<any[]>([]);
  const [salarySheet, setSalarySheet] = useState<any>(null);

  // Calculate payroll items (local, for summary)
  const _payrollItems: LocalPayrollItem[] = employees.map(employee => {
    const salary = calculateSalary(employee.grade.rank, baseSalaryGrade6);
    return {
      id: `item-${employee.id}`,
      employeeId: employee.id,
      employee,
      basic: salary.basic,
      hra: salary.hra,
      medical: salary.medical,
      gross: salary.gross,
      status: 'PENDING' as const,
    };
  });

  const totalPayroll = _payrollItems.reduce((sum, item) => sum + item.gross, 0);
  const companyBalance = company?.mainAccount?.currentBalance || 0;
  const isInsufficientFunds = companyBalance < totalPayroll;

  // Initial load: Always call pending-batch API when company.id is set
  useEffect(() => {
    if (!company?.id) return;
    async function fetchPendingBatch() {
      try {
        const pendingBatch = await payrollService.getPendingBatch(company.id);
        if (pendingBatch && pendingBatch.id) {
          setPayrollBatch(pendingBatch);
          if (pendingBatch.basicBaseAmount?.amount) {
            setBaseSalaryGrade6(pendingBatch.basicBaseAmount.amount);
          }
        } else {
          setPayrollBatch(null);
          setPayrollItems([]);
        }
      } catch {
        setPayrollBatch(null);
        setPayrollItems([]);
      }
    }
    fetchPendingBatch();
  }, [company?.id]);

  // Fetch payroll batch items from backend when batch changes
  useEffect(() => {
    if (payrollBatch && payrollBatch.id) {
      payrollService.getPayrollBatchItems(payrollBatch.id, 0, 10, 'amount')
        .then((data) => {
          setPayrollItems(data.content || []);
        })
        .catch(() => setPayrollItems([]));
    } else {
      setPayrollItems([]);
    }
  }, [payrollBatch]);

  // Utility: Refresh batch status from backend
  const refreshBatchStatus = async () => {
    const batchId = localStorage.getItem('payrollBatchId');
    if (batchId) {
      try {
        const batch = await payrollService.getPayrollBatchById(batchId);
        setPayrollBatch(batch);
        localStorage.setItem('payrollBatchInfo', JSON.stringify(batch));
        localStorage.setItem('payrollBatchStatus', batch.payrollStatus || batch.status);
      } catch {
        setPayrollBatch(null);
        localStorage.removeItem('payrollBatchInfo');
        localStorage.removeItem('payrollBatchId');
        localStorage.removeItem('payrollBatchStatus');
      }
    }
  };

  // After transfer, batch creation, or reload, always refresh batch status
  useEffect(() => {
    refreshBatchStatus();
  }, []);

  // Payroll batch creation (real backend)
  const handleCreateBatch = async () => {
    if (employees.length !== 10) {
      addMessage('error', 'Cannot process payroll: Must have exactly 10 employees');
      return;
    }
    if (!company?.id || !company?.mainAccount?.id) {
      addMessage('error', 'Company or main account information missing.');
      return;
    }

    // Prevent duplicate batch creation
    const batchStatus = payrollBatch ? (payrollBatch.payrollStatus || payrollBatch.status || '') : '';
    if (batchStatus === 'PENDING' || batchStatus === 'PARTIALLY_COMPLETED') {
      addMessage('error', 'A payroll batch is already in progress. Please complete or fail the current batch before creating a new one.');
      return;
    }

    // Check if sufficient funds
    if (isInsufficientFunds) {
      addMessage('error', `Insufficient funds! Need ${formatCurrency(totalPayroll - companyBalance)} more.`);
      setRequiredTopUp(totalPayroll - companyBalance);
      setShowTopUpModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        name: `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Payroll`,
        payrollMonth: new Date().toISOString().slice(0, 10),
        companyId: company.id,
        fundingAccountId: company.mainAccount.id,
        description: `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Payroll Distribution`,
        baseSalary: baseSalaryGrade6
      };
      const batch = await payrollService.createPayrollBatch(payload);
      setPayrollBatch(batch);
      localStorage.setItem('payrollBatchId', batch.id);
      localStorage.setItem('payrollBatchStatus', batch.payrollStatus || batch.status);
      localStorage.setItem('payrollBatchInfo', JSON.stringify(batch));
      addMessage('success', 'Payroll batch created. Ready for transfer.', `Batch ID: ${batch.id}`);
      await loadCompanyAccount();
    } catch (error: any) {
      addMessage('error', 'Failed to create payroll batch', error.response?.data?.message || error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Transfer salaries for batch
  const handleTransferSalaries = async () => {
    if (!payrollBatch) return;
    
    // Get employee IDs from payroll items
    const employeeIds = payrollItems.length > 0 
      ? payrollItems.map(item => item.employeeId || item.id)
      : employees.map(emp => emp.id);
    
    setIsProcessing(true);
    try {
      const request = {
        employeeIds,
        grade6Basic: baseSalaryGrade6
      };
      const transferResult = await payrollService.processSalaryTransfer(request);
      const successCount = transferResult.transferResults.filter(r => r.status === 'SUCCESS').length;
      addMessage('success', 'Salary transfer processed.', `${successCount} of ${transferResult.transferResults.length} transfers successful`);
      
      // Refresh batch info and company balance
      const updatedBatch = await payrollService.getPayrollBatchById(payrollBatch.id);
      setPayrollBatch(updatedBatch);
      localStorage.setItem('payrollBatchInfo', JSON.stringify(updatedBatch));
      localStorage.setItem('payrollBatchStatus', updatedBatch.payrollStatus || updatedBatch.status);
      await loadCompanyAccount();
      
      // If batch is complete or failed, clear batch info
      const finalStatus = updatedBatch.payrollStatus || updatedBatch.status;
      if (finalStatus === 'COMPLETED' || finalStatus === 'FAILED') {
        localStorage.removeItem('payrollBatchInfo');
        localStorage.removeItem('payrollBatchId');
        localStorage.removeItem('payrollBatchStatus');
        setPayrollBatch(null);
      }
    } catch (error: any) {
      addMessage('error', 'Failed to transfer salaries', error.response?.data?.message || error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTopUpComplete = async (request: TopUpRequest) => {
    try {
      await topUpAccount(request);
      await loadCompanyAccount();
      addMessage('success', `Account topped up with ${formatCurrency(request.amount)}`, 'You can now process payroll.');
      setShowTopUpModal(false);
    } catch (error: any) {
      addMessage('error', 'Failed to top up account', error.response?.data?.message || error.message);
      throw error;
    }
  };

  // Button logic strictly from batch status
  const batchStatus = payrollBatch ? ((payrollBatch as any).payrollStatus || payrollBatch.status || '') : '';
  const isBatchComplete = batchStatus === 'COMPLETED' || batchStatus === 'FAILED';
  const isBatchActive = batchStatus === 'PENDING' || batchStatus === 'PARTIALLY_COMPLETED';
  const canManagePayroll = user?.role === 'ADMIN' || user?.role === 'EMPLOYER';

  let calculateButtonDisabled = true;
  let transferButtonDisabled = true;
  if (canManagePayroll) {
    if (isBatchActive) {
      calculateButtonDisabled = true;
      transferButtonDisabled = false;
    } else {
      calculateButtonDisabled = isProcessing || employees.length !== 10;
      transferButtonDisabled = true;
    }
  } else {
    calculateButtonDisabled = true;
    transferButtonDisabled = true;
  }

  // Debug logging
  console.log('🔍 PayrollProcess State:', {
    payrollBatch: payrollBatch ? { id: payrollBatch.id, status: batchStatus } : null,
    batchStatus,
    isBatchActive,
    isBatchComplete,
    canManagePayroll,
    userRole: user?.role
  });

  // Salary sheet and transfer should use batchId from pending batch or transfer response
  const salarySheetBatchId = payrollBatch?.id || localStorage.getItem('payrollBatchId');

  // Fetch salary sheet using batchId
  useEffect(() => {
    async function fetchSalarySheet() {
      if (salarySheetBatchId) {
        try {
          const sheet = await payrollService.getPayrollBatchById(salarySheetBatchId);
          setSalarySheet(sheet);
        } catch {
          setSalarySheet(null);
        }
      } else {
        setSalarySheet(null);
      }
    }
    fetchSalarySheet();
  }, [salarySheetBatchId]);

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
            disabled={calculateButtonDisabled}
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

        {/* Process/Transfer Buttons */}
        <div className="process-actions">
          {isInsufficientFunds && !isBatchActive && (
            <div className="insufficient-funds-warning">
              <p>⚠️ Insufficient funds! Need {formatCurrency(totalPayroll - companyBalance)} more.</p>
            </div>
          )}

          {/* Only admin/employer can use buttons */}
          {canManagePayroll ? (
            <>
              <button
                onClick={handleCreateBatch}
                disabled={calculateButtonDisabled}
                className={`process-btn ${isInsufficientFunds && !isBatchActive ? 'top-up' : 'process'}`}
              >
                {isProcessing ? '⏳ Creating Batch...' : '✅ Calculate All Salaries'}
              </button>
              <button
                onClick={handleTransferSalaries}
                disabled={transferButtonDisabled}
                className="process-btn transfer-btn"
              >
                {isProcessing ? '⏳ Transferring...' : '💸 Transfer Salaries'}
              </button>
              {/* Status messages */}
              {isBatchActive && (
                <div className="batch-status-info">
                  <p>✅ Batch ready for transfer (Status: {batchStatus})</p>
                </div>
              )}
              {isBatchComplete && (
                <div className="batch-status-info">
                  <p>Batch {batchStatus}. You can calculate new payroll.</p>
                </div>
              )}
            </>
          ) : (
            <div className="access-denied">
              <p>⚠️ Only ADMIN or EMPLOYER can process payroll</p>
            </div>
          )}
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
          {/* Debug output for troubleshooting */}
          <pre style={{ display: 'none' }}>{JSON.stringify({payrollBatch, payrollItems, localPayrollItems: payrollItems}, null, 2)}</pre>
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
                <th>Net Amount</th>
                <th>Status</th>
                <th>Failure Reason</th>
                <th>Account Number</th>
              </tr>
            </thead>
            <tbody>
              {(payrollBatch && payrollItems.length > 0 ? payrollItems : payrollItems).map(item => (
                <tr key={item.id || item.employeeId} className={item.status?.toLowerCase() || ''}>
                  <td>{item.employeeBizId || item.employee?.code}</td>
                  <td>{item.employeeName || item.employee?.name}</td>
                  <td>{item.grade || (item.employee?.grade ? `Grade ${item.employee.grade.rank}` : '')}</td>
                  <td>{formatCurrency(item.basicSalary?.amount ?? item.basic ?? 0)}</td>
                  <td>{formatCurrency(item.hra?.amount ?? item.hra ?? 0)}</td>
                  <td>{formatCurrency(item.medicalAllowance?.amount ?? item.medical ?? 0)}</td>
                  <td>{formatCurrency(item.grossSalary?.amount ?? item.gross ?? 0)}</td>
                  <td>{formatCurrency(item.netAmount?.amount ?? item.gross ?? 0)}</td>
                  <td><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                  <td>{item.failureReason || ''}</td>
                  <td>{item.accountNumber || (item.employee?.account?.accountNumber || '')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={6}><strong>Total Payroll</strong></td>
                <td><strong>{formatCurrency(totalPayroll)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          {/* If no data, show a message */}
          {((payrollBatch && payrollItems.length === 0) || (!payrollBatch && payrollItems.length === 0)) && (
            <div className="no-data">No payroll items to display.</div>
          )}
        </div>
      </div>

      {/* Salary Sheet Overview */}
      {salarySheet && (
        <div className="salary-sheet-overview">
          <h3>Salary Sheet Overview</h3>
          <div className="sheet-summary">
            <div><strong>PAY TO BE AMOUNT</strong><br />BDT {salarySheet.totalAmount?.amount?.toLocaleString() || 0}</div>
            <div><strong>TOTAL PAID AMOUNT</strong><br />BDT {salarySheet.executedAmount?.amount?.toLocaleString() || 0}</div>
            <div><strong>COMPANY ACCOUNT BALANCE</strong><br />BDT {company?.mainAccount?.currentBalance?.toLocaleString() || 0}</div>
          </div>
          <table className="salary-table">
            <thead>
              <tr>
                <th>Name (ID)</th>
                <th>Grade</th>
                <th>Basic</th>
                <th>HRA</th>
                <th>Medical</th>
                <th>Gross Salary</th>
              </tr>
            </thead>
            <tbody>
              {(salarySheet.items || []).map((item: any) => (
                <tr key={item.employeeId}>
                  <td>{item.employeeName} <br />ID: {item.employeeBizId}</td>
                  <td>{item.grade}</td>
                  <td>BDT {item.basicSalary?.amount?.toLocaleString() || 0}</td>
                  <td>BDT {item.hra?.amount?.toLocaleString() || 0}</td>
                  <td>BDT {item.medicalAllowance?.amount?.toLocaleString() || 0}</td>
                  <td>BDT {item.grossSalary?.amount?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Processed Batch Results */}
      {payrollBatch && (
        <div className="batch-results">
          <h3>Payroll Batch Results</h3>
          <div className="batch-info">
            <p><strong>Batch ID:</strong> {payrollBatch.id}</p>
            <p><strong>Status:</strong> <span className={`status-badge ${payrollBatch.status.toLowerCase()}`}>{payrollBatch.status}</span></p>
            <p><strong>Total Amount:</strong> {formatCurrency(payrollBatch.totalAmount?.amount ?? 0)}</p>
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
        currentBalance={company?.mainAccount?.currentBalance || 0}
      />
    </div>
  );
};

export default PayrollProcess;