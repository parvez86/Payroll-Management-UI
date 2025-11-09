import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { formatCurrency } from '../../utils/salaryCalculator';


const CompanyAccount: React.FC = () => {
  const { company, transactions, isLoading, error, topUpAccount, loadTransactions, clearError } = useCompany();
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDescription, setTopUpDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topUpAmount);
    
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      await topUpAccount({ 
        amount, 
        description: topUpDescription || 'Account top-up'
      });
      setShowTopUpForm(false);
      setTopUpAmount('');
      setTopUpDescription('');
    } catch (error) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickTopUpAmounts = [50000, 100000, 200000, 500000];

  if (isLoading) {
    return <div className="loading">Loading company account...</div>;
  }

  return (
    <div className="company-account">
      <div className="page-header">
        <h2>Company Account Management</h2>
        <button 
          onClick={() => setShowTopUpForm(true)}
          className="btn-primary"
        >
          Top-up Account
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Account Overview */}
      <div className="account-overview">
        <div className="account-card">
          <div className="account-header">
            <h3>Main Company Account</h3>
            <div className="account-status">
              <span className={`status-indicator ${(company?.currentBalance || 0) > 100000 ? 'healthy' : 'low'}`}>
                {(company?.currentBalance || 0) > 100000 ? 'Healthy' : 'Low Balance'}
              </span>
            </div>
          </div>
          
          <div className="account-details">
            <div className="balance-display">
              <label>Current Balance</label>
              <div className="balance-amount">
                {formatCurrency(company?.currentBalance || 0)}
              </div>
            </div>
            
              <div className="account-info-grid">
                <div className="info-item">
                  <label>Account Number</label>
                  <span>{company?.accountNumber || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Account Name</label>
                  <span>{company?.accountName || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Bank</label>
                  <span>{company?.bank || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Branch</label>
                  <span>{company?.branch || 'N/A'}</span>
                </div>
              </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <h4>Quick Top-up</h4>
          <div className="quick-amounts">
            {quickTopUpAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => {
                  setTopUpAmount(amount.toString());
                  setShowTopUpForm(true);
                }}
                className="quick-amount-btn"
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-history">
        <h3>Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="no-transactions">
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="transaction-table-container">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.timestamp || Date.now()).toLocaleDateString()}</td>
                    <td>
                      <span className={`transaction-type ${String(transaction.type).toLowerCase().replace('_', '-')}`}>
                        {transaction.type === 'SALARY_TRANSFER' ? 'Payroll' : 'Top-up'}
                      </span>
                    </td>
                    <td>
                      <span className={transaction.type === 'SALARY_TRANSFER' ? 'debit' : 'credit'}>
                        {transaction.type === 'SALARY_TRANSFER' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge success`}>
                        SUCCESS
                      </span>
                    </td>
                    <td>
                      {transaction.type === 'SALARY_TRANSFER'
                        ? 'Employee salary disbursement' 
                        : 'Account top-up'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Balance Insights */}
      <div className="balance-insights">
        <h3>Balance Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Monthly Payroll Coverage</h4>
            <div className="insight-value">
              {company && (
                <>
                  <span className="coverage-number">
                    {Math.floor((company.currentBalance || 0) / 250000)} {/* Assuming avg 250k monthly payroll */}
                  </span>
                  <span className="coverage-label">months</span>
                </>
              )}
            </div>
            <p>Based on average monthly payroll</p>
          </div>
          
          <div className="insight-card">
            <h4>Recommended Balance</h4>
            <div className="insight-value">
              <span className="recommended-amount">{formatCurrency(500000)}</span>
            </div>
            <p>Maintain for 2+ months coverage</p>
          </div>
          
          <div className="insight-card">
            <h4>Balance Health</h4>
            <div className="insight-value">
              <span className={`health-status ${(company?.currentBalance || 0) > 200000 ? 'good' : 'warning'}`}>
                {(company?.currentBalance || 0) > 200000 ? 'Good' : 'Low'}
              </span>
            </div>
            <p>Based on current balance</p>
          </div>
        </div>
      </div>

      {/* Top-up Form Modal */}
      {showTopUpForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="form-header">
              <h3>Top-up Company Account</h3>
              <button onClick={() => setShowTopUpForm(false)} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleTopUp}>
              <div className="current-balance-info">
                <p><strong>Current Balance:</strong> {formatCurrency(company?.currentBalance || 0)}</p>
              </div>

              <div className="form-group">
                <label htmlFor="topUpAmount">Top-up Amount *</label>
                <input
                  type="number"
                  id="topUpAmount"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  min="1000"
                  step="1000"
                  placeholder="Enter amount in BDT"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="topUpDescription">Description (Optional)</label>
                <input
                  type="text"
                  id="topUpDescription"
                  value={topUpDescription}
                  onChange={(e) => setTopUpDescription(e.target.value)}
                  placeholder="e.g., Monthly funding, Emergency top-up"
                  disabled={isSubmitting}
                />
              </div>

              {topUpAmount && (
                <div className="new-balance-preview">
                  <p><strong>New Balance:</strong> {formatCurrency((company?.currentBalance || 0) + parseFloat(topUpAmount || '0'))}</p>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowTopUpForm(false)}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Top-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyAccount;