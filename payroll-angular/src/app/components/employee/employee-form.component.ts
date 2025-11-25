import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
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
  email = signal('');
  password = signal('');
  gradeRank = signal(6);
  accountName = signal('');
  accountNumber = signal('');
  accountType = signal('Savings Account');
  branchName = signal('');

  GRADE_LEVELS = [1, 2, 3, 4, 5, 6];

  ngOnInit() {
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
        this.email.set(employee.email || '');
        this.gradeRank.set(employee.grade.rank);
        this.accountName.set(employee.account?.accountName || '');
        this.accountNumber.set(employee.account?.accountNumber || '');
        this.accountType.set(employee.account?.accountType || 'Savings Account');
        this.branchName.set(employee.account?.branchName || '');
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
    // This would ideally call a service to get the next available ID
    // For now, generate a random 4-digit code
    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    this.code.set(randomCode);
  }

  onSubmit(event: Event) {
    event.preventDefault();

    // Validation
    if (!this.name() || !this.mobile() || !this.address() || !this.email()) {
      this.message.set('⚠️ Please fill in all required fields');
      return;
    }

    if (!this.isEditMode() && !this.password()) {
      this.message.set('⚠️ Password is required for new employees');
      return;
    }

    if (!this.accountName() || !this.accountNumber() || !this.branchName()) {
      this.message.set('⚠️ Please fill in all bank account details');
      return;
    }

    this.loading.set(true);

    const employeeData: any = {
      code: this.code(),
      name: this.name(),
      address: this.address(),
      mobile: this.mobile(),
      email: this.email(),
      username: this.email(), // Use email as username
      grade: {
        id: `grade-${this.gradeRank()}`,
        name: `Grade ${this.gradeRank()}`,
        rank: this.gradeRank()
      },
      account: {
        accountType: this.accountType(),
        accountName: this.accountName(),
        accountNumber: this.accountNumber(),
        branchName: this.branchName(),
        currentBalance: 0,
        ownerType: 'EMPLOYEE',
        status: 'ACTIVE'
      },
      status: 'ACTIVE'
    };

    // Add password only if provided
    if (this.password()) {
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
