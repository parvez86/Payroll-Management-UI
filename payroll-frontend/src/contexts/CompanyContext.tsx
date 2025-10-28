import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { companyService } from '../services/api';
import type { Company, Transaction, TopUpRequest, BackendCompany, TransactionHistoryResponse, TopUpResponse } from '../types';

interface CompanyState {
  company: Company | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

interface CompanyContextType extends CompanyState {
  loadCompanyAccount: () => Promise<void>;
  topUpAccount: (request: TopUpRequest) => Promise<void>;
  loadTransactions: () => Promise<void>;
  clearError: () => void;
}

type CompanyAction = 
  | { type: 'LOAD_START' }
  | { type: 'LOAD_COMPANY_SUCCESS'; payload: Company }
  | { type: 'LOAD_TRANSACTIONS_SUCCESS'; payload: Transaction[] }
  | { type: 'LOAD_FAILURE'; payload: string }
  | { type: 'TOP_UP_SUCCESS'; payload: { company: Company; transaction: Transaction } }
  | { type: 'CLEAR_ERROR' };

const initialState: CompanyState = {
  company: null,
  transactions: [],
  isLoading: false,
  error: null,
};

const companyReducer = (state: CompanyState, action: CompanyAction): CompanyState => {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null };
    case 'LOAD_COMPANY_SUCCESS':
      return { ...state, company: action.payload, isLoading: false, error: null };
    case 'LOAD_TRANSACTIONS_SUCCESS':
      return { ...state, transactions: action.payload, isLoading: false, error: null };
    case 'LOAD_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'TOP_UP_SUCCESS':
      return { 
        ...state, 
        company: action.payload.company,
        transactions: [action.payload.transaction, ...state.transactions]
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(companyReducer, initialState);

  const loadCompanyAccount = async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const companyRaw: BackendCompany = await companyService.getAccount("fc6d6c2f-8f00-4243-9a32-39b9dc615cff");
      // Flatten mainAccount fields to top-level for UI compatibility
      const company: Company = {
        accountNumber: companyRaw.mainAccount.accountNumber,
        accountName: companyRaw.mainAccount.accountName,
        currentBalance: companyRaw.mainAccount.currentBalance,
        bank: companyRaw.mainAccount.branchName,
        branch: companyRaw.mainAccount.branchName,
        lastUpdated: companyRaw.mainAccount.createdAt,
      };
      dispatch({ type: 'LOAD_COMPANY_SUCCESS', payload: company });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load company account';
      dispatch({ type: 'LOAD_FAILURE', payload: message });
    }
  };

  const topUpAccount = async (request: TopUpRequest) => {
    try {
      const topUpResponse: TopUpResponse = await companyService.topUp(request);
      // Reload company account to get updated balance
      const companyRaw: BackendCompany = await companyService.getAccount("fc6d6c2f-8f00-4243-9a32-39b9dc615cff");
      const company: Company = {
        accountNumber: companyRaw.mainAccount.accountNumber,
        accountName: companyRaw.mainAccount.accountName,
        currentBalance: companyRaw.mainAccount.currentBalance,
        bank: companyRaw.mainAccount.branchName,
        branch: companyRaw.mainAccount.branchName,
        lastUpdated: companyRaw.mainAccount.createdAt,
      };
      // Synthesize a Transaction from TopUpResponse for UI
      const transaction: Transaction = {
        id: topUpResponse.transactionId,
        type: 'TOPUP',
        amount: topUpResponse.topupAmount,
        description: 'Account top-up',
        balanceAfter: topUpResponse.newBalance,
        timestamp: topUpResponse.timestamp,
      };
      dispatch({ type: 'TOP_UP_SUCCESS', payload: { company, transaction } });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to top up account';
      dispatch({ type: 'LOAD_FAILURE', payload: message });
      throw error;
    }
  };

  const loadTransactions = async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const txResp: TransactionHistoryResponse = await companyService.getTransactions();
      dispatch({ type: 'LOAD_TRANSACTIONS_SUCCESS', payload: txResp.transactions });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load transactions';
      dispatch({ type: 'LOAD_FAILURE', payload: message });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Load company account on mount
  useEffect(() => {
    loadCompanyAccount();
  }, []);

  return (
    <CompanyContext.Provider value={{
      ...state,
      loadCompanyAccount,
      topUpAccount,
      loadTransactions,
      clearError
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};