/**
 * Integration Progress Dashboard
 * Real-time progress tracking for backend integration
 */

export interface ProgressItem {
  id: string;
  name: string;
  category: 'infrastructure' | 'services' | 'validation' | 'testing' | 'frontend' | 'deployment';
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  progress: number; // 0-100
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  description: string;
  technicalDetails?: string;
  blockers?: string[];
}

export interface ProgressCategory {
  name: string;
  color: string;
  icon: string;
  totalItems: number;
  completedItems: number;
  progress: number;
}

export class IntegrationProgressTracker {
  private progressItems: ProgressItem[] = [
    // Infrastructure (100% Complete)
    {
      id: 'env-config',
      name: 'Environment Configuration',
      category: 'infrastructure',
      status: 'completed',
      progress: 100,
      priority: 'high',
      completedAt: '2025-10-21T10:00:00Z',
      estimatedHours: 2,
      actualHours: 1.5,
      description: 'Environment-based API configuration with development/production separation',
      technicalDetails: 'Created .env files, config/index.ts with flexible API switching'
    },
    {
      id: 'cors-setup',
      name: 'CORS & Networking',
      category: 'infrastructure',
      status: 'completed',
      progress: 100,
      priority: 'high',
      completedAt: '2025-10-21T10:30:00Z',
      estimatedHours: 1,
      actualHours: 1,
      description: 'Vite proxy configuration and CORS headers setup',
      technicalDetails: 'vite.config.ts proxy, industry-standard headers, network error handling'
    },
    {
      id: 'security-impl',
      name: 'Security Implementation',
      category: 'infrastructure',
      status: 'completed',
      progress: 100,
      priority: 'high',
      completedAt: '2025-10-21T11:00:00Z',
      estimatedHours: 2,
      actualHours: 2,
      description: 'JWT authentication, request tracking, CSRF protection',
      technicalDetails: 'Axios interceptors, Bearer token injection, auto-logout on 401'
    },

    // Services (100% Complete)
    {
      id: 'auth-service',
      name: 'Authentication Service',
      category: 'services',
      status: 'completed',
      progress: 100,
      priority: 'high',
      completedAt: '2025-10-21T11:30:00Z',
      estimatedHours: 3,
      actualHours: 2.5,
      description: 'Complete authentication flow with login/logout/state management',
      technicalDetails: 'authService with login, logout, getCurrentUser, isAuthenticated methods'
    },
    {
      id: 'employee-service',
      name: 'Employee Management Service',
      category: 'services',
      status: 'completed',
      progress: 100,
      priority: 'high',
      completedAt: '2025-10-21T12:00:00Z',
      estimatedHours: 4,
      actualHours: 3.5,
      description: 'Full CRUD operations for employee management',
      technicalDetails: 'employeeService with getAll, getById, create, update, delete methods'
    },
    {
      id: 'payroll-service',
      name: 'Payroll Management Service',
      category: 'services',
      status: 'completed',
      progress: 100,
      priority: 'high',
      completedAt: '2025-10-21T12:30:00Z',
      estimatedHours: 4,
      actualHours: 4,
      description: 'Salary calculation, transfer processing, and sheet generation',
      technicalDetails: 'payrollService with calculateSalaries, processSalaryTransfer, getSalarySheet'
    },
    {
      id: 'company-service',
      name: 'Company Account Service',
      category: 'services',
      status: 'completed',
      progress: 100,
      priority: 'high',
      completedAt: '2025-10-21T13:00:00Z',
      estimatedHours: 2,
      actualHours: 2,
      description: 'Company account management and transaction history',
      technicalDetails: 'companyService with getAccount, topUp, getTransactions methods'
    },

    // Validation & Error Handling (100% Complete)
    {
      id: 'error-handling',
      name: 'Enhanced Error Handling',
      category: 'validation',
      status: 'completed',
      progress: 100,
      priority: 'high',
      completedAt: '2025-10-21T13:30:00Z',
      estimatedHours: 3,
      actualHours: 3,
      description: 'Comprehensive error classification and user-friendly messaging',
      technicalDetails: 'errorHandler.ts with parseAPIError, error classification, retry logic'
    },
    {
      id: 'validation-service',
      name: 'Real-time Validation Service',
      category: 'validation',
      status: 'completed',
      progress: 100,
      priority: 'high',
      completedAt: '2025-10-21T14:00:00Z',
      estimatedHours: 4,
      actualHours: 4,
      description: 'Business rules validation with caching and real-time feedback',
      technicalDetails: 'validationService.ts with employee validation, grade distribution checks'
    },
    {
      id: 'api-client',
      name: 'Enhanced API Client',
      category: 'validation',
      status: 'completed',
      progress: 100,
      priority: 'medium',
      completedAt: '2025-10-21T14:30:00Z',
      estimatedHours: 3,
      actualHours: 3,
      description: 'Retry logic, request tracking, and performance monitoring',
      technicalDetails: 'apiClient.ts with exponential backoff, request IDs, duration tracking'
    },

    // Testing (100% Complete)
    {
      id: 'integration-tests',
      name: 'Integration Testing Framework',
      category: 'testing',
      status: 'completed',
      progress: 100,
      priority: 'high',
      completedAt: '2025-10-21T15:00:00Z',
      estimatedHours: 4,
      actualHours: 4,
      description: 'Comprehensive testing suite for all API endpoints',
      technicalDetails: 'integrationTester.ts with automated test execution and reporting'
    },

    // Frontend Integration (20% Complete - Major Gap)
    {
      id: 'component-updates',
      name: 'Component API Integration',
      category: 'frontend',
      status: 'in-progress',
      progress: 20,
      priority: 'high',
      estimatedHours: 6,
      actualHours: 1,
      description: 'Update existing components to use new API services',
      technicalDetails: 'Replace old service calls with new typed API methods in all components',
      blockers: ['Components still using old API structure', 'Form validation needs update']
    },
    {
      id: 'ui-enhancements',
      name: 'UI Error Handling & Loading States',
      category: 'frontend',
      status: 'pending',
      progress: 0,
      priority: 'medium',
      dependencies: ['component-updates'],
      estimatedHours: 3,
      description: 'Add loading states, error displays, and retry mechanisms',
      technicalDetails: 'Implement toast notifications, loading spinners, retry buttons'
    },
    {
      id: 'form-validation',
      name: 'Real-time Form Validation',
      category: 'frontend',
      status: 'pending',
      progress: 0,
      priority: 'medium',
      dependencies: ['component-updates'],
      estimatedHours: 4,
      description: 'Integrate real-time validation service with form inputs',
      technicalDetails: 'Connect validationService to form fields for immediate feedback'
    },

    // Deployment (25% Complete)
    {
      id: 'build-config',
      name: 'Production Build Configuration',
      category: 'deployment',
      status: 'in-progress',
      progress: 50,
      priority: 'medium',
      estimatedHours: 2,
      actualHours: 1,
      description: 'Optimize build for production deployment',
      technicalDetails: 'Asset optimization, environment variables, security headers'
    },
    {
      id: 'backend-cors',
      name: 'Backend CORS Configuration',
      category: 'deployment',
      status: 'blocked',
      progress: 0,
      priority: 'high',
      estimatedHours: 1,
      description: 'Configure backend CORS headers for production',
      technicalDetails: 'Backend team must add CORS headers for frontend domain',
      blockers: ['External dependency on backend team', 'Production domain not finalized']
    },
    {
      id: 'prod-api-integration',
      name: 'Production API Integration',
      category: 'services',
      status: 'completed',
      progress: 100,
      priority: 'high',
      dependencies: ['api-integration', 'error-handling'],
      estimatedHours: 2,
      actualHours: 1.5,
      description: 'Real API integration with organized mock fallback structure',
      technicalDetails: 'Removed mock dependencies, implemented dynamic imports, production-ready configuration',
      completedAt: new Date().toISOString()
    },
    {
      id: 'performance-monitoring',
      name: 'Performance Monitoring',
      category: 'deployment',
      status: 'pending',
      progress: 0,
      priority: 'low',
      dependencies: ['build-config'],
      estimatedHours: 3,
      description: 'API performance monitoring and user experience metrics',
      technicalDetails: 'Request timing, error rates, success metrics, performance optimization'
    }
  ];

  /**
   * Get overall integration progress
   */
  getOverallProgress(): { completed: number; total: number; percentage: number } {
    const completed = this.progressItems.filter(item => item.status === 'completed').length;
    const total = this.progressItems.length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  }

  /**
   * Get progress by category
   */
  getProgressByCategory(): ProgressCategory[] {
    const categories = ['infrastructure', 'services', 'validation', 'testing', 'frontend', 'deployment'] as const;
    
    return categories.map(category => {
      const items = this.progressItems.filter(item => item.category === category);
      const completed = items.filter(item => item.status === 'completed').length;
      const totalProgress = items.reduce((sum, item) => sum + item.progress, 0);
      
      return {
        name: this.getCategoryDisplayName(category),
        color: this.getCategoryColor(category),
        icon: this.getCategoryIcon(category),
        totalItems: items.length,
        completedItems: completed,
        progress: Math.round(totalProgress / items.length)
      };
    });
  }

  /**
   * Get high priority pending tasks
   */
  getHighPriorityTasks(): ProgressItem[] {
    return this.progressItems.filter(item => 
      item.priority === 'high' && 
      (item.status === 'in-progress' || item.status === 'pending')
    );
  }

  /**
   * Get blocked tasks
   */
  getBlockedTasks(): ProgressItem[] {
    return this.progressItems.filter(item => item.status === 'blocked');
  }

  /**
   * Get next recommended tasks
   */
  getNextRecommendedTasks(): ProgressItem[] {
    return this.progressItems
      .filter(item => item.status === 'pending' || item.status === 'in-progress')
      .filter(item => !item.dependencies || 
        item.dependencies.every(dep => 
          this.progressItems.find(p => p.id === dep)?.status === 'completed'
        )
      )
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);
  }

  /**
   * Get integration timeline
   */
  getIntegrationTimeline(): { date: string; completed: number; milestone?: string }[] {
    const timeline: { date: string; completed: number; milestone?: string }[] = [];
    const completedItems = this.progressItems
      .filter(item => item.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    let completedCount = 0;
    const dates = [...new Set(completedItems.map(item => item.completedAt!.split('T')[0]))];

    dates.forEach(date => {
      const dayItems = completedItems.filter(item => item.completedAt!.startsWith(date));
      completedCount += dayItems.length;
      
      const milestone = this.getMilestone(completedCount);
      timeline.push({
        date,
        completed: completedCount,
        milestone
      });
    });

    return timeline;
  }

  /**
   * Get estimated completion time
   */
  getEstimatedCompletion(): { remainingHours: number; estimatedDate: string } {
    const pendingItems = this.progressItems.filter(item => 
      item.status === 'pending' || item.status === 'in-progress'
    );
    
    const remainingHours = pendingItems.reduce((sum, item) => {
      const remaining = (item.estimatedHours || 0) * (1 - item.progress / 100);
      return sum + remaining;
    }, 0);

    // Assuming 8 hours per day
    const remainingDays = Math.ceil(remainingHours / 8);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + remainingDays);

    return {
      remainingHours: Math.round(remainingHours * 10) / 10,
      estimatedDate: estimatedDate.toISOString().split('T')[0]
    };
  }

  private getCategoryDisplayName(category: string): string {
    const names = {
      infrastructure: 'Infrastructure',
      services: 'API Services',
      validation: 'Validation & Error Handling',
      testing: 'Integration Testing',
      frontend: 'Frontend Integration',
      deployment: 'Deployment & Production'
    };
    return names[category as keyof typeof names] || category;
  }

  private getCategoryColor(category: string): string {
    const colors = {
      infrastructure: '#10B981', // Green
      services: '#3B82F6',       // Blue
      validation: '#F59E0B',     // Yellow
      testing: '#8B5CF6',        // Purple
      frontend: '#EF4444',       // Red
      deployment: '#6B7280'      // Gray
    };
    return colors[category as keyof typeof colors] || '#6B7280';
  }

  private getCategoryIcon(category: string): string {
    const icons = {
      infrastructure: '🔧',
      services: '⚡',
      validation: '🛡️',
      testing: '🧪',
      frontend: '🎨',
      deployment: '🚀'
    };
    return icons[category as keyof typeof icons] || '📋';
  }

  private getMilestone(completedCount: number): string | undefined {
    const milestones = {
      4: 'Infrastructure Complete',
      8: 'API Services Complete',
      11: 'Validation & Testing Complete',
      14: 'Frontend Integration Complete',
      17: 'Production Ready'
    };
    return milestones[completedCount as keyof typeof milestones];
  }

  /**
   * Generate progress report
   */
  generateProgressReport(): string {
    const overall = this.getOverallProgress();
    const categories = this.getProgressByCategory();
    const nextTasks = this.getNextRecommendedTasks();
    const blocked = this.getBlockedTasks();
    const estimation = this.getEstimatedCompletion();

    let report = `# 🚀 Backend Integration Progress Report\n\n`;
    report += `**Generated:** ${new Date().toISOString().split('T')[0]}\n`;
    report += `**Overall Progress:** ${overall.percentage}% (${overall.completed}/${overall.total})\n\n`;

    report += `## 📊 Category Progress\n\n`;
    categories.forEach(cat => {
      const status = cat.progress === 100 ? '✅' : cat.progress > 0 ? '🔄' : '⏳';
      report += `${status} **${cat.name}**: ${cat.progress}% (${cat.completedItems}/${cat.totalItems})\n`;
    });

    if (nextTasks.length > 0) {
      report += `\n## 🎯 Next Recommended Tasks\n\n`;
      nextTasks.forEach((task, index) => {
        const priority = task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚠️' : '💡';
        report += `${index + 1}. ${priority} **${task.name}** (${task.progress}%)\n`;
        report += `   ${task.description}\n`;
      });
    }

    if (blocked.length > 0) {
      report += `\n## 🚫 Blocked Tasks\n\n`;
      blocked.forEach(task => {
        report += `- **${task.name}**: ${task.blockers?.join(', ')}\n`;
      });
    }

    report += `\n## ⏱️ Estimation\n\n`;
    report += `- **Remaining Work**: ${estimation.remainingHours} hours\n`;
    report += `- **Estimated Completion**: ${estimation.estimatedDate}\n`;

    return report;
  }
}

// Export singleton instance
export const progressTracker = new IntegrationProgressTracker();
export default progressTracker;