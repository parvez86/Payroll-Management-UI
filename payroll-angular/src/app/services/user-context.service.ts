// Cleaned up: all code before imports removed
import { Injectable, signal, computed } from '@angular/core';
import type { UserProfile } from '../models/api.types';

/**
 * Centralized service for user context and role-based access control
 * Provides reactive signals for role checks throughout the application
 */
@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  private userProfile = signal<UserProfile | null>(null);
  
  // Core user properties
  userRole = computed(() => this.userProfile()?.user?.role || null);
  // Use companyId (primary/default), fallback to first item in companyIds array
  companyId = computed(() => {
    const profile = this.userProfile();
    if (!profile) return null;
    // Prefer explicit companyId, fallback to first in companyIds array
    if (profile.companyId) return profile.companyId;
    if (profile.companyIds && profile.companyIds.length > 0) return profile.companyIds[0].companyId;
    return null;
  });
  // Get all company objects user has access to
  companyIds = computed(() => {
    const profile = this.userProfile();
    if (!profile) return [];
    // If companyIds is an object (id->name map), convert to array
    if (profile.companyIds && !Array.isArray(profile.companyIds)) {
      return Object.entries(profile.companyIds).map(([companyId, companyName]) => ({ companyId, companyName }));
    }
    // If companyIds is already an array, use it
    if (Array.isArray(profile.companyIds) && profile.companyIds.length > 0) return profile.companyIds;
    // If only companyId is present, show as single company
    if (profile.companyId) return [{ companyId: profile.companyId, companyName: 'Primary Company' }];
    return [];
  });
  // Get just the company names for dropdown
  companyNames = computed(() => this.companyIds().map(c => ({ id: c.companyId, name: c.companyName })));
  employeeId = computed(() => this.userProfile()?.user?.id || null);
  username = computed(() => this.userProfile()?.user?.username || '');
  
  // Role checks
  isAdmin = computed(() => this.userRole() === 'ADMIN');
  isEmployer = computed(() => this.userRole() === 'EMPLOYER');
  isEmployee = computed(() => this.userRole() === 'EMPLOYEE');
  
  // Grade info (for EMPLOYEE) - Note: grade is not in User type, needs to be fetched from Employee endpoint
  // Storing grade rank separately when employee is loaded
  private gradeRankSignal = signal<number | null>(null);
  employeeGradeRank = computed(() => this.gradeRankSignal());
  
  constructor() {
    this.loadUserProfile();
  }
  
  /**
   * Load user profile from localStorage
   * Called on service initialization
   */
  private loadUserProfile(): void {
    if (typeof window === 'undefined') return;
    
    const str = window.localStorage.getItem('userProfile');
    if (!str) return;
    
    try {
      const profile = JSON.parse(str);
      this.userProfile.set(profile);
      console.log('👤 User context loaded:', {
        role: profile?.user?.role,
        username: profile?.user?.username,
        companyId: profile?.companyId,
        companyIds: profile?.companyIds
      });
    } catch (e) {
      console.error('Failed to parse user profile:', e);
      this.userProfile.set(null);
    }
  }
  
  /**
   * Refresh user profile from localStorage
   * Call this after profile updates
   */
  refreshProfile(): void {
    this.loadUserProfile();
  }
  
  /**
   * Clear user profile and reset all context
   * Call this on logout
   */
  clearProfile(): void {
    this.userProfile.set(null);
    this.gradeRankSignal.set(null);
    console.log('👤 User context cleared');
  }
  
  /**
   * Get raw user profile object
   */
  getProfile(): UserProfile | null {
    return this.userProfile();
  }
  
  /**
   * Set employee grade rank (called after loading employee data)
   * This is needed because User type doesn't include grade info
   */
  setEmployeeGradeRank(rank: number | null): void {
    this.gradeRankSignal.set(rank);
  }
  
  /**
   * Update companyIds and companyId in user profile and localStorage
   */
  setCompanyContext(companyIds: Record<string, string>, selectedCompanyId?: string): void {
    const profile = this.userProfile();
    if (!profile) return;
    // Convert companyIds map to array if needed
    profile.companyIds = Object.entries(companyIds).map(([companyId, companyName]) => ({ companyId, companyName }));
    if (selectedCompanyId) profile.companyId = selectedCompanyId;
    this.userProfile.set(profile);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('userProfile', JSON.stringify(profile));
    }
    console.log('👤 Company context updated:', { companyIds, selectedCompanyId });
  }
  
  // Permission helpers
  
  canManageEmployees(): boolean {
    return this.isAdmin() || this.isEmployer();
  }
  
  canProcessPayroll(): boolean {
    return this.isAdmin() || this.isEmployer();
  }
  
  canTopUpAccount(): boolean {
    return this.isAdmin() || this.isEmployer();
  }
  
  canViewAllCompanies(): boolean {
    return this.isAdmin();
  }
  
  canCreatePayrollBatch(): boolean {
    return this.isAdmin() || this.isEmployer();
  }
  
  // Scope helpers
  
  getBalanceScope(): 'system' | 'company' | 'personal' {
    switch(this.userRole()) {
      case 'ADMIN': return 'system';
      case 'EMPLOYER': return 'company';
      case 'EMPLOYEE': return 'personal';
      default: return 'personal';
    }
  }
  
  getEmployeeListScope(): 'all' | 'company' | 'downstream' {
    switch(this.userRole()) {
      case 'ADMIN': return 'all';
      case 'EMPLOYER': return 'company';
      case 'EMPLOYEE': return 'downstream';
      default: return 'downstream';
    }
  }
  
  getTransactionScope(): 'all' | 'company' | 'personal' {
    switch(this.userRole()) {
      case 'ADMIN': return 'all';
      case 'EMPLOYER': return 'company';
      case 'EMPLOYEE': return 'personal';
      default: return 'personal';
    }
  }
  
  // Label helpers for UI
  
  getBalanceLabel(): string {
    switch(this.userRole()) {
      case 'ADMIN': return 'System Balance';
      case 'EMPLOYER': return 'Company Balance';
      case 'EMPLOYEE': return 'My Balance';
      default: return 'Balance';
    }
  }
  
  getBalanceTooltip(): string {
    switch(this.userRole()) {
      case 'ADMIN': return 'Total balance across all companies in the system';
      case 'EMPLOYER': return 'Your company account balance';
      case 'EMPLOYEE': return 'Your personal account balance';
      default: return '';
    }
  }
  
  getAccountPageTitle(): string {
    switch(this.userRole()) {
      case 'ADMIN': return '🏢 System & Companies Overview';
      case 'EMPLOYER': return '🏢 Company Account';
      case 'EMPLOYEE': return '👤 My Account';
      default: return 'Account';
    }
  }
  
  getTopUpLabel(): string | null {
    switch(this.userRole()) {
      case 'ADMIN': return 'Top Up System Account';
      case 'EMPLOYER': return 'Top Up Company Account';
      case 'EMPLOYEE': return null;
      default: return null;
    }
  }
  
  getEmployeeListTitle(): string {
    switch(this.userRole()) {
      case 'ADMIN': return '👥 All Employees (System-wide)';
      case 'EMPLOYER': return '👥 Company Employees';
      case 'EMPLOYEE': return '👥 My Team (Downstream)';
      default: return '👥 Employees';
    }
  }
}
