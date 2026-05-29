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
    code: '',
    name: '',
    address: '',
    mobile: '',
    gradeRank: 6,
    gradeId: '',
    gradeName: '',
    accountType: 'SAVINGS' as 'SAVINGS' | 'CURRENT',
    accountName: '',
    branchName: '',
    accountNumber: '',
    currentBalance: 0,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setFormData({
        code: employee.code,
        name: employee.name,
        address: employee.address,
        mobile: employee.mobile,
        gradeRank: employee.grade.rank,
        gradeId: employee.grade.id,
        gradeName: employee.grade.name,
  accountType: (employee.account.accountType as 'SAVINGS' | 'CURRENT'),
        accountName: employee.account.accountName,
  branchName: employee.account.branchName,
        accountNumber: employee.account.accountNumber,
        currentBalance: employee.account.currentBalance || 0,
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'gradeRank') {
        // Set gradeRank and gradeName
        const gradeRank = parseInt(value);
        const gradeName = `Grade ${gradeRank}`;
        return { ...prev, gradeRank, gradeName };
      }
      return { ...prev, [name]: value };
    });
    setValidationError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate form
    const validation = validateNewEmployee(
      { bizId: formData.code, grade: formData.gradeRank },
      !!employee,
      employee || undefined
    );
    if (validation) {
      setValidationError(validation);
      return;
    }
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
      const employeeData: Partial<Employee> = {
        code: formData.code,
        name: formData.name,
        address: formData.address,
        mobile: formData.mobile,
        grade: {
          id: formData.gradeId,
          name: formData.gradeName,
          rank: formData.gradeRank,
        },
        account: {
          id: employee?.account.id || '',
          accountType: formData.accountType,
          accountName: formData.accountName || formData.name,
          accountNumber: formData.accountNumber || `ACC${formData.code}${Date.now().toString().slice(-4)}`,
          currentBalance: formData.currentBalance || 0,
          branchName: formData.branchName,
          ownerType: 'EMPLOYEE',
          ownerId: employee?.id || '',
          status: 'ACTIVE',
          createdAt: employee?.account.createdAt || new Date().toISOString(),
          createdBy: null,
          overdraftLimit: 0,
          branchId: '',
        },
        status: 'ACTIVE',
      };
      if (employee) {
        await updateEmployee(employee.id, employeeData);
      } else {
        await addEmployee(employeeData as any);
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
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="code">Employee ID *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
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
            <label htmlFor="gradeRank">Grade *</label>
            <select
              id="gradeRank"
              name="gradeRank"
              value={formData.gradeRank}
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
        {/* Bank Name field removed: not present in backend account object */}

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