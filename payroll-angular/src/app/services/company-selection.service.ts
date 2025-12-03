import { Injectable, signal, computed } from '@angular/core';

/**
 * Global Company Selection Service
 * Manages the currently selected company for ADMIN users
 * All pages listen to this service for company context changes
 */
@Injectable({
  providedIn: 'root'
})
export class CompanySelectionService {
  // Currently selected company ID (empty string for all companies, or specific UUID)
  private selectedCompanyIdSignal = signal<string>('');
  
  // Public read-only access
  selectedCompanyId = this.selectedCompanyIdSignal.asReadonly();
  
  // Check if "All Companies" is selected
  isAllCompaniesSelected = computed(() => this.selectedCompanyIdSignal() === '');
  
  // Get company ID for API calls (undefined if empty/all, string if specific company)
  getCompanyIdForApi = computed(() => {
    const id = this.selectedCompanyIdSignal();
    return id === '' ? undefined : id;
  });
  
  /**
   * Set the selected company
   * @param companyId - Company UUID or empty string for all companies
   */
  setSelectedCompany(companyId: string): void {
    this.selectedCompanyIdSignal.set(companyId);
    
    // Persist in localStorage for page reloads
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('selectedCompanyId', companyId);
    }
    
    console.log('🏢 Global company selection changed:', companyId === '' ? 'All Companies' : companyId);
  }
  
  /**
   * Restore selected company from localStorage
   */
  restoreFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('selectedCompanyId');
      if (stored) {
        this.selectedCompanyIdSignal.set(stored);
        console.log('🏢 Restored company selection from storage:', stored);
      }
    }
  }
  
  /**
   * Reset to "All Companies"
   */
  resetToAll(): void {
    this.setSelectedCompany('');
  }
  
  /**
   * Clear on logout
   */
  clear(): void {
    this.selectedCompanyIdSignal.set('');
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('selectedCompanyId');
    }
    console.log('🏢 Company selection cleared');
  }
}
