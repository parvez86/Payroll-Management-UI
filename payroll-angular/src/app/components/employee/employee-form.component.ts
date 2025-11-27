import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { BranchService, type Branch } from '../../services/branch.service';
import { GradeService, type Grade } from '../../services/grade.service';
import { ToastMessageComponent } from '../shared/toast-message.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import type { Employee } from '../../models/api.types';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.css']
})
export class EmployeeFormComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private branchService = inject(BranchService);
  private gradeService = inject(GradeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = signal(false);
  employeeId = signal<string | null>(null);
  loading = signal(false);
  message = signal('');

  // Form fields
  code = signal('');
  name = signal('');
  address = signal('');
  mobile = signal('');
  username = signal('');
  email = signal('');
  password = signal('');
  gradeRank = signal(6);
  accountName = signal('');
  accountNumber = signal('');
  accountType = signal('Savings Account');
  branchId = signal(''); // <-- new signal for branch selection

  branches = signal<Branch[]>([]); // fetched branch list
  grades = signal<Grade[]>([]); // fetched grade list

  GRADE_LEVELS = [1, 2, 3, 4, 5, 6];

  ngOnInit() {
    // Fetch branches for dropdown
    this.branchService.getAllBranches().subscribe({
      next: (branches) => {
        this.branches.set(branches);
      },
      error: (err: any) => {
        console.error('Failed to load branches:', err);
        this.branches.set([]);
      }
    });

    // Fetch grades for dropdown
    this.gradeService.getAllGrades().subscribe({
      next: (grades: Grade[]) => {
        this.grades.set(grades);
      },
      error: (err: any) => {
        console.error('Failed to load grades:', err);
        this.grades.set([]);
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.employeeId.set(id);
      this.loadEmployee(id);
    } else {
      // Generate next employee code for new employee
      this.generateNextCode();
    }
  }

  loadEmployee(id: string) {
    this.loading.set(true);
    this.employeeService.getById(id).subscribe({
      next: (employee) => {
        this.code.set(employee.code);
        this.name.set(employee.name);
        this.address.set(employee.address);
        this.mobile.set(employee.mobile);
        this.username.set(employee.username || '');
        this.email.set(employee.email || '');
        this.gradeRank.set(employee.grade.rank);
        this.accountName.set(employee.account?.accountName || '');
        this.accountNumber.set(employee.account?.accountNumber || '');
        // Map backend account type format (SAVINGS/CURRENT) to display format
        const accountType = employee.account?.accountType || 'SAVINGS';
        this.accountType.set(accountType === 'SAVINGS' ? 'Savings Account' : 'Current Account');
        // Set branchId for dropdown selection
        this.branchId.set(employee.account?.branchId || '');
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load employee:', error);
        this.message.set('❌ Failed to load employee data');
        this.loading.set(false);
      }
    });
  }

  generateNextCode() {
    // Call backend API to get next employee code
    console.log('🔄 Requesting next employee code from API...');
    this.employeeService.getNextEmployeeCode().subscribe({
      next: (code: string) => {
        console.log('✅ Received employee code from API:', code);
        this.code.set(code);
      },
      error: (err: any) => {
        console.error('❌ Failed to get next employee code from API:', err);
        console.error('❌ Error details:', JSON.stringify(err, null, 2));
        // Fallback to random 4-digit code if API fails
        const randomCode = String(Math.floor(1000 + Math.random() * 9000));
        this.code.set(randomCode);
        this.message.set('⚠️ Using random code (API unavailable)');
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    // Validation - basic fields
    if (!this.name() || !this.mobile() || !this.address()) {
      this.message.set('⚠️ Please fill in all required fields');
      return;
    }

    // Username, email and password validation - only required for new employees
    if (!this.isEditMode()) {
      if (!this.username()) {
        this.message.set('⚠️ Username is required for new employees');
        return;
      }
      if (!this.email()) {
        this.message.set('⚠️ Email is required for new employees');
        return;
      }
      if (!this.password()) {
        this.message.set('⚠️ Password is required for new employees');
        return;
      }
    }

    // Bank account validation
    if (!this.accountName() || !this.accountNumber() || !this.branchId()) {
      this.message.set('⚠️ Please fill in all bank account details and select a branch');
      return;
    }

    this.loading.set(true);

    // Get companyId from user profile
    const userProfileStr = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('userProfile') : null;
    let companyId = 'temp-company-id';
    if (userProfileStr) {
      try {
        const userProfile = JSON.parse(userProfileStr);
        companyId = userProfile.companyId || companyId;
      } catch (e) {
        console.error('Failed to parse user profile:', e);
      }
    }

    // Find the actual grade ID from the fetched grades list
    const selectedGrade = this.grades().find(g => g.rank === this.gradeRank());
    if (!selectedGrade) {
      this.message.set('⚠️ Invalid grade selected');
      this.loading.set(false);
      return;
    }

    // Flat payload structure matching backend expectations
    const employeeData: any = {
      bizId: this.code(), // Backend expects bizId, not code
      name: this.name(),
      address: this.address(),
      mobile: this.mobile(),
      gradeId: selectedGrade.id, // Use actual UUID from backend
      companyId: companyId,
      accountName: this.accountName(), // Flat account fields
      accountNumber: this.accountNumber(),
      accountType: this.accountType() === 'Savings Account' ? 'SAVINGS' : 'CURRENT', // Map to backend format
      overdraftLimit: 0.00,
      branchId: this.branchId()
    };

    // Add username and email (required for create, not sent for update)
    if (!this.isEditMode()) {
      employeeData.username = this.username();
      employeeData.email = this.email();
      employeeData.password = this.password();
    }

    if (this.isEditMode() && this.employeeId()) {
      // Update existing
      this.employeeService.update(this.employeeId()!, employeeData).subscribe({
        next: () => {
          this.message.set(`✅ Employee ${this.code()} updated successfully`);
          setTimeout(() => this.router.navigate(['/dashboard/employees']), 1500);
        },
        error: (error) => {
          console.error('Failed to update employee:', error);
          const errorMsg = error.error?.message || 'Failed to update employee';
          this.message.set(`❌ ${errorMsg}`);
          this.loading.set(false);
        }
      });
    } else {
      // Create new
      this.employeeService.create(employeeData).subscribe({
        next: () => {
          this.message.set(`✅ Employee ${this.code()} added successfully`);
          setTimeout(() => this.router.navigate(['/dashboard/employees']), 1500);
        },
        error: (error) => {
          console.error('Failed to add employee:', error);
          const errorMsg = error.error?.message || 'Failed to add employee';
          this.message.set(`❌ ${errorMsg}`);
          this.loading.set(false);
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/dashboard/employees']);
  }

  clearMessage() {
    this.message.set('');
  }
}
