/**
 * Real-time Validation Service for Employee Data
 * Implements business rules validation following API documentation
 */

import { employeeService } from './api';
import { config } from '../config';
import type { Employee } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EmployeeValidationRules {
  id: {
    required: boolean;
    pattern: RegExp;
    length: number;
    uniqueCheck: boolean;
  };
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  grade: {
    required: boolean;
    min: number;
    max: number;
    distributionCheck: boolean;
  };
  mobile: {
    required: boolean;
    pattern: RegExp;
    uniqueCheck: boolean;
  };
  bankAccount: {
    required: boolean;
    numberPattern: RegExp;
  };
}

// Business validation rules from API documentation
export const VALIDATION_RULES: EmployeeValidationRules = {
  id: {
    required: true,
    pattern: /^\d{4}$/,
    length: 4,
    uniqueCheck: true
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  grade: {
    required: true,
    min: 1,
    max: 6,
    distributionCheck: true
  },
  mobile: {
    required: true,
    pattern: /^(017|018|019|015|016|013|014)\d{8}$/,
    uniqueCheck: true
  },
  bankAccount: {
    required: true,
    numberPattern: /^\d{10,20}$/
  }
};

class EmployeeValidationService {
  private employeeCache: Employee[] = [];
  private lastCacheUpdate: number = 0;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Validate complete employee data
   */
  async validateEmployee(employee: Partial<Employee>, isUpdate: boolean = false): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic field validations
    const fieldValidations = await Promise.all([
      this.validateEmployeeId(employee.id, isUpdate),
      this.validateName(employee.name),
      this.validateGrade(employee.grade, isUpdate ? employee.id : undefined),
      this.validateMobile(employee.mobile, isUpdate ? employee.id : undefined),
      this.validateBankAccount(employee.bankAccount)
    ]);

    fieldValidations.forEach(result => {
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate employee ID (4 digits, unique)
   */
  async validateEmployeeId(id?: string, isUpdate: boolean = false): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!id) {
      errors.push('Employee ID is required');
      return { isValid: false, errors, warnings };
    }

    // Pattern validation
    if (!VALIDATION_RULES.id.pattern.test(id)) {
      errors.push('Employee ID must be exactly 4 digits');
    }

    // Uniqueness check (only for new employees or when ID changes)
    if (!isUpdate && VALIDATION_RULES.id.uniqueCheck) {
      try {
        await this.refreshEmployeeCache();
        const existingEmployee = this.employeeCache.find(emp => emp.id === id);
        if (existingEmployee) {
          errors.push('Employee ID already exists');
        }
      } catch (error) {
        warnings.push('Could not verify ID uniqueness - please check manually');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate employee name
   */
  async validateName(name?: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Employee name is required');
      return { isValid: false, errors, warnings };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < VALIDATION_RULES.name.minLength) {
      errors.push(`Name must be at least ${VALIDATION_RULES.name.minLength} characters`);
    }

    if (trimmedName.length > VALIDATION_RULES.name.maxLength) {
      errors.push(`Name must not exceed ${VALIDATION_RULES.name.maxLength} characters`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate grade with distribution limits
   */
  async validateGrade(grade?: number, excludeEmployeeId?: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (grade === undefined || grade === null) {
      errors.push('Grade is required');
      return { isValid: false, errors, warnings };
    }

    if (grade < VALIDATION_RULES.grade.min || grade > VALIDATION_RULES.grade.max) {
      errors.push(`Grade must be between ${VALIDATION_RULES.grade.min} and ${VALIDATION_RULES.grade.max}`);
    }

    // Grade distribution check
    if (VALIDATION_RULES.grade.distributionCheck) {
      try {
        await this.refreshEmployeeCache();
        const gradeCount = this.employeeCache
          .filter(emp => emp.grade === grade && emp.id !== excludeEmployeeId)
          .length;

        const maxAllowed = config.GRADE_DISTRIBUTION[grade as keyof typeof config.GRADE_DISTRIBUTION];
        if (gradeCount >= maxAllowed) {
          errors.push(`Maximum ${maxAllowed} employee(s) allowed for Grade ${grade}`);
        }
      } catch (error) {
        warnings.push('Could not verify grade distribution - please check manually');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate mobile number
   */
  async validateMobile(mobile?: string, excludeEmployeeId?: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!mobile) {
      errors.push('Mobile number is required');
      return { isValid: false, errors, warnings };
    }

    // Pattern validation
    if (!VALIDATION_RULES.mobile.pattern.test(mobile)) {
      errors.push('Mobile number must be 11 digits starting with 017/018/019/015/016/013/014');
    }

    // Uniqueness check
    if (VALIDATION_RULES.mobile.uniqueCheck) {
      try {
        await this.refreshEmployeeCache();
        const existingEmployee = this.employeeCache
          .find(emp => emp.mobile === mobile && emp.id !== excludeEmployeeId);
        if (existingEmployee) {
          errors.push('Mobile number already exists');
        }
      } catch (error) {
        warnings.push('Could not verify mobile number uniqueness - please check manually');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate bank account information
   */
  async validateBankAccount(bankAccount?: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!bankAccount) {
      errors.push('Bank account information is required');
      return { isValid: false, errors, warnings };
    }

    // Required fields
    if (!bankAccount.name || bankAccount.name.trim().length === 0) {
      errors.push('Account holder name is required');
    }

    if (!bankAccount.number) {
      errors.push('Account number is required');
    } else if (!VALIDATION_RULES.bankAccount.numberPattern.test(bankAccount.number)) {
      errors.push('Account number must be 10-20 digits');
    }

    if (!bankAccount.bank || bankAccount.bank.trim().length === 0) {
      errors.push('Bank name is required');
    }

    if (!bankAccount.branch || bankAccount.branch.trim().length === 0) {
      errors.push('Branch name is required');
    }

    if (!bankAccount.type || !['Savings', 'Current'].includes(bankAccount.type)) {
      errors.push('Account type must be either Savings or Current');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if total employee count would exceed limit
   */
  async validateTotalEmployeeCount(isUpdate: boolean = false): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      await this.refreshEmployeeCache();
      const currentCount = this.employeeCache.length;
      
      if (!isUpdate && currentCount >= config.MAX_EMPLOYEES) {
        errors.push(`Maximum ${config.MAX_EMPLOYEES} employees allowed`);
      }
    } catch (error) {
      warnings.push('Could not verify employee count - please check manually');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get current grade distribution
   */
  async getGradeDistribution(): Promise<Record<number, number>> {
    await this.refreshEmployeeCache();
    
    const distribution: Record<number, number> = {};
    for (let grade = 1; grade <= 6; grade++) {
      distribution[grade] = this.employeeCache.filter(emp => emp.grade === grade).length;
    }
    
    return distribution;
  }

  /**
   * Refresh employee cache if needed
   */
  private async refreshEmployeeCache(): Promise<void> {
    const now = Date.now();
    
    if (now - this.lastCacheUpdate > this.cacheTimeout) {
      try {
        this.employeeCache = await employeeService.getAll();
        this.lastCacheUpdate = now;
      } catch (error) {
        console.warn('Failed to refresh employee cache:', error);
        throw error;
      }
    }
  }

  /**
   * Clear cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.employeeCache = [];
    this.lastCacheUpdate = 0;
  }
}

// Export singleton instance
export const validationService = new EmployeeValidationService();
export default validationService;