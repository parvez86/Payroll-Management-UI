import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastMessageComponent } from '../shared/toast-message.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = signal('');
  password = signal('');
  loading = signal(false);
  message = signal('');

  onSubmit(event: Event) {
    event.preventDefault();
    
    if (!this.username() || !this.password()) {
      this.message.set('⚠️ Please enter both username and password');
      return;
    }

    this.loading.set(true);

    this.authService.login({
      username: this.username(),
      password: this.password()
    }).subscribe({
      next: (response) => {
        // AuthService already stored tokens and user
        this.message.set(`✅ Welcome, ${response.user.username}!`);
        this.loading.set(false);
        
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login failed:', error);
        const errorMsg = error.error?.message || 'Login failed. Please check your credentials.';
        this.message.set(`❌ ${errorMsg}`);
        this.loading.set(false);
      }
    });
  }

  clearMessage() {
    this.message.set('');
  }
}
