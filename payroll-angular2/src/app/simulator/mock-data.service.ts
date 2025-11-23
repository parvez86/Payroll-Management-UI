// Angular copy of React simulator's mock data and business logic
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface BankAccount {
  type: string;
  name: string;
  number: string;
  balance: number;
  bank: string;
  branch: string;
}

export interface SalaryDetails {
  basic: number;
  houseRent: number;
  medicalAllowance: number;
  gross: number;
  isPaid: boolean;
}

export interface Employee {
  id: string;
  name: string;
  grade: number;
  address: string;
  mobile: string;
  salary: SalaryDetails | null;
  bankAccount: BankAccount;
}

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private initialEmployees: Employee[] = [
    // ...copy initial data from App-simulated.tsx (React)
  ];
  private employeesSubject = new BehaviorSubject<Employee[]>(this.initialEmployees);
  employees$ = this.employeesSubject.asObservable();

  // Add CRUD and payroll logic here
}
