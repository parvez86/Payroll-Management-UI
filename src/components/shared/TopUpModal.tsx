import React, { useState } from 'react';
import type { TopUpRequest } from '../../types';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopUp: (request: TopUpRequest) => Promise<void>;
  requiredAmount: number;
  currentBalance: number;
}

const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  onTopUp,
  requiredAmount,
  currentBalance
}) => {
  const [amount, setAmount] = useState(requiredAmount);
  const [description, setDescription] = useState('Emergency top-up for payroll processing');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsSubmitting(true);
    try {
      await onTopUp({
        amount,
        description
      });
      onClose();
    } catch (error) {
      console.error('Top-up failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal insufficient-funds-modal">
        <div className="modal-header insufficient-funds-header">
          <h3>⚠️ Insufficient Funds</h3>
          <button onClick={onClose} className="close-btn" disabled={isSubmitting}>
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          <div className="insufficient-funds-info">
            <div className="balance-info">
              <p><strong>Current Balance:</strong> <span className="current-balance">{formatCurrency(currentBalance)}</span></p>
              <p><strong>Required Amount:</strong> <span className="required-amount">{formatCurrency(requiredAmount)}</span></p>
              <p><strong>Minimum Top-up:</strong> <span className="minimum-topup">{formatCurrency(Math.max(0, requiredAmount - currentBalance))}</span></p>
            </div>
            
            <div className="warning-message">
              <p>💰 The company account doesn't have sufficient funds to complete this payroll transfer.</p>
              <p>Please add funds to continue with the payment process.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="topup-form">
            <div className="form-group">
              <label htmlFor="topup-amount">Top-up Amount (BDT) *</label>
              <input
                id="topup-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={Math.max(1, requiredAmount - currentBalance)}
                step="1000"
                className="topup-amount-input"
                required
              />
              <small>Minimum required: {formatCurrency(Math.max(0, requiredAmount - currentBalance))}</small>
            </div>

            <div className="form-group">
              <label htmlFor="topup-description">Description</label>
              <input
                id="topup-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reason for top-up..."
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel Payment
              </button>
              <button 
                type="submit" 
                className="btn-primary topup-btn"
                disabled={isSubmitting || amount <= 0}
              >
                {isSubmitting ? '⏳ Processing...' : `💰 Add ${formatCurrency(amount)} & Continue`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TopUpModal;