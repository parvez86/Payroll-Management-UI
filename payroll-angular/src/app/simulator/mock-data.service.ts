import { Injectable } from '@angular/core';

// Types matching React exactly
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
  
  // Initial employee data matching React exactly
  getInitialEmployees(): Employee[] {
    return [
      { id: '1001', name: 'John A', grade: 1, address: 'Dhaka', mobile: '01700000001', salary: null, bankAccount: { type: 'Current', name: 'John A', number: '1234567890', balance: 5000, bank: 'Global Bank', branch: 'Main' } },
      { id: '1002', name: 'Jane B', grade: 2, address: 'Chittagong', mobile: '01700000002', salary: null, bankAccount: { type: 'Savings', name: 'Jane B', number: '1234567891', balance: 3500, bank: 'Global Bank', branch: 'North' } },
      { id: '1003', name: 'Amit C', grade: 3, address: 'Rajshahi', mobile: '01700000003', salary: null, bankAccount: { type: 'Current', name: 'Amit C', number: '1234567892', balance: 8000, bank: 'City Bank', branch: 'East' } },
      { id: '1004', name: 'Sarah D', grade: 3, address: 'Khulna', mobile: '01700000004', salary: null, bankAccount: { type: 'Savings', name: 'Sarah D', number: '1234567893', balance: 2000, bank: 'City Bank', branch: 'West' } },
      { id: '1005', name: 'Fahim E', grade: 4, address: 'Barishal', mobile: '01700000005', salary: null, bankAccount: { type: 'Current', name: 'Fahim E', number: '1234567894', balance: 10000, bank: 'Apex Bank', branch: 'South' } },
      { id: '1006', name: 'Nadia F', grade: 4, address: 'Sylhet', mobile: '01700000006', salary: null, bankAccount: { type: 'Savings', name: 'Nadia F', number: '1234567895', balance: 4500, bank: 'Apex Bank', branch: 'Central' } },
      { id: '1007', name: 'Kamal G', grade: 5, address: 'Rangpur', mobile: '01700000007', salary: null, bankAccount: { type: 'Current', name: 'Kamal G', number: '1234567896', balance: 6000, bank: 'Prime Bank', branch: 'Airport' } },
      { id: '1008', name: 'Rina H', grade: 5, address: 'Mymensingh', mobile: '01700000008', salary: null, bankAccount: { type: 'Savings', name: 'Rina H', number: '1234567897', balance: 1200, bank: 'Prime Bank', branch: 'Road' } },
      { id: '1009', name: 'Tareq I', grade: 6, address: 'Comilla', mobile: '01700000009', salary: null, bankAccount: { type: 'Current', name: 'Tareq I', number: '1234567898', balance: 7500, bank: 'United Bank', branch: 'Old' } },
      { id: '1010', name: 'Shanta J', grade: 6, address: 'Bogura', mobile: '01700000010', salary: null, bankAccount: { type: 'Savings', name: 'Shanta J', number: '1234567899', balance: 9000, bank: 'United Bank', branch: 'New' } },
    ];
  }

  getCompanyAccountBalance(): number {
    return 500000;
  }

  getGradeLevels(): number[] {
    return [6, 5, 4, 3, 2, 1]; // From lowest to highest grade
  }
}