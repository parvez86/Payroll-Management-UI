import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { employeeService } from '../services/api';
import { validateGradeDistribution } from '../utils/salaryCalculator';
import type { Employee } from '../types';

interface EmployeeState {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
}

interface EmployeeContextType extends EmployeeState {
  loadEmployees: () => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  validateNewEmployee: (employee: { bizId: string; grade: number }, isUpdate?: boolean, currentEmployee?: Employee) => string | null;
  clearError: () => void;
}

type EmployeeAction = 
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: Employee[] }
  | { type: 'LOAD_FAILURE'; payload: string }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: EmployeeState = {
  employees: [],
  isLoading: false,
  error: null,
};

const employeeReducer = (state: EmployeeState, action: EmployeeAction): EmployeeState => {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null };
    case 'LOAD_SUCCESS':
      return { ...state, employees: action.payload, isLoading: false, error: null };
    case 'LOAD_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return { 
        ...state, 
        employees: state.employees.map(emp => 
          emp.id === action.payload.id ? action.payload : emp
        )
      };
    case 'DELETE_EMPLOYEE':
      return { 
        ...state, 
        employees: state.employees.filter(emp => emp.id !== action.payload)
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(employeeReducer, initialState);

  const loadEmployees = async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const employees = await employeeService.getAll();
      dispatch({ type: 'LOAD_SUCCESS', payload: employees });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load employees';
      dispatch({ type: 'LOAD_FAILURE', payload: message });
    }
  };

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    try {
      const newEmployee = await employeeService.create(employee as any);
      dispatch({ type: 'ADD_EMPLOYEE', payload: newEmployee });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add employee';
      dispatch({ type: 'LOAD_FAILURE', payload: message });
      throw error;
    }
  };

  const updateEmployee = async (id: string, employee: Partial<Employee>) => {
    try {
      const updatedEmployee = await employeeService.update(id, employee);
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: updatedEmployee });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update employee';
      dispatch({ type: 'LOAD_FAILURE', payload: message });
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await employeeService.delete(id);
      dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete employee';
      dispatch({ type: 'LOAD_FAILURE', payload: message });
      throw error;
    }
  };

  const validateNewEmployee = (
    employee: { bizId: string; grade: number },
    isUpdate = false,
    currentEmployee?: Employee
  ): string | null => {
    // Validate employee ID format
    if (!/^\d{4}$/.test(employee.bizId)) {
      return 'Employee ID must be exactly 4 digits';
    }

    // Check ID uniqueness (use code)
    const isDuplicate = state.employees.some(emp =>
      emp.code === employee.bizId &&
      (!isUpdate || emp.id !== currentEmployee?.id)
    );
    if (isDuplicate) {
      return 'Employee ID must be unique';
    }

    // Validate grade distribution (use grade.rank)
    const employeesForValidation = state.employees.map(e => ({ grade: e.grade.rank }));
    const currentGrade = isUpdate ? currentEmployee?.grade.rank : undefined;
    if (!validateGradeDistribution(employeesForValidation, employee.grade, isUpdate, currentGrade)) {
      return `Grade ${employee.grade} has reached its maximum limit`;
    }

    return null; // Valid
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <EmployeeContext.Provider value={{
      ...state,
      loadEmployees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      validateNewEmployee,
      clearError
    }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployees = (): EmployeeContextType => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
};