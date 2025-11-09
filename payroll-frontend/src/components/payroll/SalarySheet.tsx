import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/api';
import { formatCurrency } from '../../utils/salaryCalculator';

interface SalarySheetProps {
  companyData?: {
    id?: string;
    mainAccount?: {
      currentBalance: number;
    };
  } | null;
}

const SalarySheet: React.FC<SalarySheetProps> = ({ companyData }) => {
  const [payrollBatch, setPayrollBatch] = useState<any>(null);
  const [payrollItems, setPayrollItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pageSize, setPageSize] = useState(5);

  // Load batch info and items on mount or when page changes
  useEffect(() => {
    const loadSalarySheet = async () => {
      if (!companyData?.id) {
        return;
      }

      let batchId: string | null = null;

      setIsLoading(true);
      
      // ALWAYS try to fetch pending batch from server first (industry best practice)
      try {
        const pendingBatch = await payrollService.getPendingBatch(companyData.id);
        if (pendingBatch && pendingBatch.id) {
          batchId = pendingBatch.id;
          // Sync localStorage with latest pending batch
          localStorage.setItem('payrollBatchId', batchId);
          localStorage.setItem('payrollBatchInfo', JSON.stringify(pendingBatch));
          localStorage.setItem('payrollBatchStatus', pendingBatch.payrollStatus || pendingBatch.status);
        } else {
          // No pending batch exists - clear localStorage and show empty table
          localStorage.removeItem('payrollBatchId');
          localStorage.removeItem('payrollBatchInfo');
          localStorage.removeItem('payrollBatchStatus');
          setPayrollBatch(null);
          setPayrollItems([]);
          setIsLoading(false);
          return;
        }
      } catch (error: any) {
        // If API fails, fall back to localStorage (offline support)
        const cachedBatchId = localStorage.getItem('payrollBatchId');
        if (cachedBatchId) {
          batchId = cachedBatchId;
        } else {
          // No pending batch and no cache - show empty table
          setPayrollBatch(null);
          setPayrollItems([]);
          setIsLoading(false);
          return;
        }
      }

      // At this point, batchId must be a valid string
      if (!batchId) {
        setPayrollBatch(null);
        setPayrollItems([]);
        setIsLoading(false);
        return;
      }

      try {
        // API 1: Get payroll batch by ID (for total amount and executed amount)
        const batchData = await payrollService.getPayrollBatchById(batchId);
        setPayrollBatch(batchData);

        // API 2: Get payroll items (paginated)
        const itemsData = await payrollService.getPayrollBatchItems(
          batchId,
          currentPage,
          pageSize,
          'amount'
        );
        setPayrollItems(itemsData.content || []);
        setTotalPages(itemsData.totalPages || 0);
        setTotalElements(itemsData.totalElements || 0);
      } catch (error: any) {
        // If batch not found, silently clear it and show empty state
        if (error.response?.data?.message?.includes('not found')) {
          localStorage.removeItem('payrollBatchId');
          localStorage.removeItem('payrollBatchInfo');
          localStorage.removeItem('payrollBatchStatus');
          setPayrollBatch(null);
          setPayrollItems([]);
          setErrorMessage('');
        } else {
          setErrorMessage(`Failed to load salary sheet: ${error.response?.data?.message || error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSalarySheet();
  }, [currentPage, pageSize, companyData?.id]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  if (isLoading) {
    return <div className="loading">Loading salary sheet...</div>;
  }

  if (errorMessage) {
    return (
      <div className="content-card">
        <h2 className="page-title">💰 Salary Sheet Overview</h2>
        <div className="no-data error-message">
          {errorMessage}
        </div>
      </div>
    );
  }

  const companyBalance = companyData?.mainAccount?.currentBalance || 0;

  return (
    <div className="content-card salary-sheet">
      <h2 className="page-title">💰 Salary Sheet Overview</h2>
      
      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card total-paid">
          <div className="summary-label">Pay To Be Amount</div>
          <div className="summary-value">{formatCurrency(payrollBatch?.totalAmount?.amount || 0)}</div>
        </div>
        <div className="summary-card total-paid">
          <div className="summary-label">Total Paid Amount</div>
          <div className="summary-value">{formatCurrency(payrollBatch?.executedAmount?.amount || 0)}</div>
        </div>
        <div className={`summary-card balance ${companyBalance >= 0 ? '' : 'negative'}`}>
          <div className="summary-label">Company Account Balance</div>
          <div className="summary-value">{formatCurrency(companyBalance)}</div>
        </div>
      </div>

      {/* Batch Info */}
      {payrollBatch && (
        <div className="batch-info-section">
          <div className="batch-info-item">
            <strong>Batch ID:</strong> {payrollBatch.id}
          </div>
          <div className="batch-info-item">
            <strong>Batch Name:</strong> {payrollBatch.name}
          </div>
          <div className="batch-info-item">
            <strong>Status:</strong> 
            <span className={`status-badge ${(payrollBatch.payrollStatus || payrollBatch.status)?.toLowerCase()}`}>
              {payrollBatch.payrollStatus || payrollBatch.status}
            </span>
          </div>
          <div className="batch-info-item">
            <strong>Payroll Month:</strong> {payrollBatch.payrollMonth || 'N/A'}
          </div>
        </div>
      )}

      {/* Salary Details Table */}
      <div className="table-container">
        <table className="employee-table salary-table">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Name (ID)</th>
              <th className="table-cell text-center">Grade</th>
              <th className="table-cell text-right">Basic</th>
              <th className="table-cell text-right">HRA (20%)</th>
              <th className="table-cell text-right">Medical (15%)</th>
              <th className="table-cell text-right">Gross Salary</th>
              <th className="table-cell text-right">Net Amount</th>
              <th className="table-cell text-center">Status</th>
              <th className="table-cell">Account Number</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {payrollItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="no-data">
                  {!payrollBatch 
                    ? 'No salary sheet available. Please calculate salaries first from the Employee Data page.' 
                    : 'No salary records found for this batch.'}
                </td>
              </tr>
            ) : (
              payrollItems.map(item => (
                <tr 
                  key={item.id} 
                  className={item.status === 'PAID' ? 'table-row-success' : ''}
                >
                  <td className="table-cell">
                    <div className="employee-info">
                      <div className="employee-name">{item.employeeName}</div>
                      <div className="employee-id">ID: {item.employeeBizId}</div>
                    </div>
                  </td>
                  <td className="table-cell text-center">{item.grade}</td>
                  <td className="table-cell text-right">{formatCurrency(item.basicSalary?.amount || 0)}</td>
                  <td className="table-cell text-right">{formatCurrency(item.hra?.amount || 0)}</td>
                  <td className="table-cell text-right">{formatCurrency(item.medicalAllowance?.amount || 0)}</td>
                  <td className="table-cell text-right">{formatCurrency(item.grossSalary?.amount || 0)}</td>
                  <td className="table-cell text-right"><strong>{formatCurrency(item.netAmount?.amount || 0)}</strong></td>
                  <td className="table-cell text-center">
                    <span className={`status-badge ${
                      item.status === 'PAID' ? 'status-paid' : 
                      item.status === 'FAILED' ? 'status-failed' : 
                      'status-pending'
                    }`}>
                      {item.status === 'PAID' ? '✅ Paid' : 
                       item.status === 'FAILED' ? '❌ Failed' : 
                       '⏳ Pending'}
                    </span>
                  </td>
                  <td className="table-cell">{item.accountNumber || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {payrollItems.length > 0 && (
        <div className="pagination" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Left: Page size selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
              Rows per page:
            </label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className="pagination-btn"
              title="First Page"
              style={{ fontSize: '0.875rem' }}
            >
              ⏮ First
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="pagination-btn"
              title="Previous Page"
            >
              ← Prev
            </button>
            
            {/* Page numbers */}
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (currentPage < 3) {
                  pageNum = i;
                } else if (currentPage > totalPages - 4) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: currentPage === pageNum ? '#667eea' : 'white',
                      color: currentPage === pageNum ? 'white' : '#000000',
                      border: `2px solid ${currentPage === pageNum ? '#667eea' : '#d1d5db'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      minWidth: '2.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = '#e0e7ff';
                        e.currentTarget.style.borderColor = '#667eea';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentPage !== pageNum) {
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
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="pagination-btn"
              title="Next Page"
            >
              Next →
            </button>
            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="pagination-btn"
              title="Last Page"
              style={{ fontSize: '0.875rem' }}
            >
              Last ⏭
            </button>
          </div>

          {/* Right: Page info */}
          <div className="pagination-info">
            Page {currentPage + 1} of {totalPages}
            <span className="item-count">
              ({totalElements} total)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalarySheet;
