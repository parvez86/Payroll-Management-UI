import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmployeeListComponent } from './components/employee/employee-list.component';
import { EmployeeFormComponent } from './components/employee/employee-form.component';
import { PayrollProcessComponent } from './components/payroll/payroll-process.component';
import { CompanyAccountComponent } from './components/company/company-account.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'employees',
        pathMatch: 'full'
      },
      {
        path: 'employees',
        component: EmployeeListComponent
      },
      {
        path: 'employees/add',
        component: EmployeeFormComponent
      },
      {
        path: 'employees/edit/:id',
        component: EmployeeFormComponent
      },
      {
        path: 'payroll',
        component: PayrollProcessComponent
      },
      {
        path: 'company',
        component: CompanyAccountComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
