import { config } from '../config';

// Critical salary calculation logic from development.md
export interface SalaryBreakdown {
  basic: number;
  hra: number;
  medical: number;
  gross: number;
}

// Grade-based salary calculation: Grade 6 base + (6-grade) × increment
export const calculateSalary = (grade: number, baseSalaryGrade6?: number): SalaryBreakdown => {
  const baseGrade6 = baseSalaryGrade6 || config.DEFAULT_BASE_SALARY_GRADE_6;
  const basic = baseGrade6 + (6 - grade) * config.GRADE_INCREMENT;
  const hra = basic * config.HRA_PERCENTAGE;
  const medical = basic * config.MEDICAL_PERCENTAGE;
  const gross = basic + hra + medical;
  
  return { basic, hra, medical, gross };
};

// Employee ID validation: exactly 4 digits
export const validateEmployeeId = (id: string): boolean => {
  return /^\d{4}$/.test(id);
};

// Grade distribution constraints from config
export const GRADE_LIMITS = config.GRADE_DISTRIBUTION;

export const validateGradeDistribution = (employees: Array<{grade: number}>, newGrade: number, isUpdate = false, currentGrade?: number): boolean => {
  const gradeCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  
  // Count existing employees
  employees.forEach(emp => {
    if (emp.grade >= 1 && emp.grade <= 6) {
      gradeCount[emp.grade as keyof typeof gradeCount]++;
    }
  });
  
  // If updating, subtract the current grade count
  if (isUpdate && currentGrade && currentGrade >= 1 && currentGrade <= 6) {
    gradeCount[currentGrade as keyof typeof gradeCount]--;
  }
  
  // Check if adding new grade would exceed limit
  if (newGrade >= 1 && newGrade <= 6) {
    return gradeCount[newGrade as keyof typeof gradeCount] < GRADE_LIMITS[newGrade as keyof typeof GRADE_LIMITS];
  }
  
  return false;
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(amount);
};