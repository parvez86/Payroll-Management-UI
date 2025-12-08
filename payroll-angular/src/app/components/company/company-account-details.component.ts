import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '../../services/company.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-company-account-details',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './company-account-details.component.html',
  styleUrls: ['./company-account-details.component.css']
})
export class CompanyAccountDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private companyService = inject(CompanyService);

  company = signal<any>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.companyService.getCompany(id).subscribe({
        next: (company) => {
          this.company.set(company);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load company details.');
          this.loading.set(false);
        }
      });
    } else {
      this.error.set('No company ID provided.');
      this.loading.set(false);
    }
  }

  backToList() {
    this.router.navigate(['/dashboard/company']);
  }
}
