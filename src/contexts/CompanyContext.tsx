import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { companyService } from '../services/api';
import type { Transaction, TopUpRequest, BackendCompany, TransactionHistoryResponse, TopUpResponse } from '../types';

type CompanyState = {
  company: BackendCompany | null;
  transactions: Array<Transaction>;
  isLoading: boolean;
  error: string | null;
};

type CompanyAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_COMPANY_SUCCESS'; payload: BackendCompany }
  | { type: 'LOAD_TRANSACTIONS_SUCCESS'; payload: Array<Transaction> }
  | { type: 'LOAD_FAILURE'; payload: string }
  | { type: 'TOP_UP_SUCCESS'; payload: { company: BackendCompany; transaction: Transaction } }
  | { type: 'CLEAR_ERROR' };

interface CompanyContextType extends CompanyState {
  loadCompanyAccount: () => Promise<void>;
  topUpAccount: (request: TopUpRequest) => Promise<void>;
  loadTransactions: () => Promise<void>;
  clearError: () => void;
}

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
      // 1. Try to get companyId from userProfile (stringified JSON)
      let companyId = null;
      const userProfileRaw = localStorage.getItem('userProfile');
      if (userProfileRaw) {
        try {
          const userProfile = typeof userProfileRaw === 'string' ? JSON.parse(userProfileRaw) : userProfileRaw;
          companyId = userProfile.companyId || (userProfile.company && userProfile.company.id);
        } catch (e) {}
      }
      // 2. Fallback: try minimal user object
      if (!companyId) {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          try {
            const user = JSON.parse(userRaw);
            companyId = user.companyId || (user.company && user.company.id);
          } catch (e) {}
        }
      }
      if (!companyId) {
        companyId = localStorage.getItem('companyId');
      }
      if (!companyId) {
        throw new Error('No companyId found for current user');
      }
      // 3. Always refresh from API for latest
      const companyRaw: BackendCompany = await companyService.getAccount(companyId);
      dispatch({ type: 'LOAD_COMPANY_SUCCESS', payload: companyRaw });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to load company account';
      dispatch({ type: 'LOAD_FAILURE', payload: message });
    }
  };

  const topUpAccount = async (request: TopUpRequest) => {
    try {
      const topUpResponse: TopUpResponse = await companyService.topUp(request);
      // Reload company account to get updated balance
      let companyId = null;
      const userProfileRaw = localStorage.getItem('userProfile');
      if (userProfileRaw) {
        try {
          const userProfile = typeof userProfileRaw === 'string' ? JSON.parse(userProfileRaw) : userProfileRaw;
          companyId = userProfile.companyId || (userProfile.company && userProfile.company.id);
        } catch (e) {}
      }
      if (!companyId) {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          try {
            const user = JSON.parse(userRaw);
            companyId = user.companyId || (user.company && user.company.id);
          } catch (e) {}
        }
      }
      if (!companyId) {
        companyId = localStorage.getItem('companyId');
      }
      if (!companyId) {
        throw new Error('No companyId found for current user');
      }
      const companyRaw: BackendCompany = await companyService.getAccount(companyId);
      // Synthesize a Transaction from TopUpResponse for UI
      const transaction: Transaction = {
        id: topUpResponse.transactionId,
        type: 'TOPUP',
        amount: topUpResponse.topupAmount,
        description: 'Account top-up',
        balanceAfter: topUpResponse.newBalance,
        timestamp: topUpResponse.timestamp,
      };
      dispatch({ type: 'TOP_UP_SUCCESS', payload: { company: companyRaw, transaction } });
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