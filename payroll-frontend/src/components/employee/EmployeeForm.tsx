import React, { useState, useEffect } from 'react';
import { useEmployees } from '../../contexts/EmployeeContext';
import type { Employee } from '../../types';

interface EmployeeFormProps {
  employee?: Employee | null;
  onClose: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onClose }) => {
  const { addEmployee, updateEmployee, validateNewEmployee, error, clearError } = useEmployees();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bizId: '',
    name: '',
    address: '',
    mobile: '',
    grade: 6,
    accountType: 'SAVINGS' as 'SAVINGS' | 'CURRENT',
    accountName: '',
    bankName: '',
    branchName: ''
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setFormData({
        bizId: employee.bizId,
        name: employee.name,
        address: employee.address,
        mobile: employee.mobile,
        grade: employee.grade,
        accountType: employee.account.accountType,
        accountName: employee.account.accountName,
        bankName: employee.account.bankName,
        branchName: employee.account.branchName
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'grade' ? parseInt(value) : value
    }));
    
    // Clear validation errors on change
    setValidationError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate form
    const validation = validateNewEmployee(
      { bizId: formData.bizId, grade: formData.grade },
      !!employee,
      employee || undefined
    );
    
    if (validation) {
      setValidationError(validation);
      return;
    }

    // Validate other fields
    if (!formData.name || !formData.address || !formData.mobile) {
      setValidationError('All fields are required');
      return;
    }

    if (!/^\d{10,11}$/.test(formData.mobile)) {
      setValidationError('Mobile number must be 10-11 digits');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const employeeData = {
        bizId: formData.bizId,
        name: formData.name,
        address: formData.address,
        mobile: formData.mobile,
        grade: formData.grade,
        account: {
          id: employee?.account.id || '',
          accountType: formData.accountType,
          accountName: formData.accountName || formData.name,
          accountNumber: employee?.account.accountNumber || `ACC${formData.bizId}${Date.now().toString().slice(-4)}`,
          currentBalance: employee?.account.currentBalance || 0,
          bankName: formData.bankName,
          branchName: formData.branchName
        }
      };

      if (employee) {
        await updateEmployee(employee.id, employeeData);
      } else {
        await addEmployee(employeeData);
      }
      
      onClose();
    } catch (error) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="employee-form">
      <div className="form-header">
        <h3>{employee ? 'Edit Employee' : 'Add New Employee'}</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bizId">Employee ID *</label>
            <input
              type="text"
              id="bizId"
              name="bizId"
              value={formData.bizId}
              onChange={handleChange}
              maxLength={4}
              pattern="\d{4}"
              placeholder="4-digit ID"
              required
              disabled={isSubmitting}
            />
            <small>Must be exactly 4 digits and unique</small>
          </div>

          <div className="form-group">
            <label htmlFor="grade">Grade *</label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            >
              <option value={1}>Grade 1 (Highest)</option>
              <option value={2}>Grade 2</option>
              <option value={3}>Grade 3</option>
              <option value={4}>Grade 4</option>
              <option value={5}>Grade 5</option>
              <option value={6}>Grade 6 (Lowest)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="mobile">Mobile Number *</label>
          <input
            type="tel"
            id="mobile"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            pattern="\d{10,11}"
            placeholder="10 or 11 digits"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-section">
          <h4>Bank Account Details</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="accountType">Account Type *</label>
              <select
                id="accountType"
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              >
                <option value="SAVINGS">Savings</option>
                <option value="CURRENT">Current</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="accountName">Account Name</label>
              <input
                type="text"
                id="accountName"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                placeholder="Default: Employee Name"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bankName">Bank Name *</label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g., Sonali Bank"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="branchName">Branch Name *</label>
              <input
                type="text"
                id="branchName"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                placeholder="e.g., Dhaka Main Branch"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {(validationError || error) && (
          <div className="error-message">
            {validationError || error}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onClose}
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
            {isSubmitting ? 'Saving...' : (employee ? 'Update Employee' : 'Add Employee')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;