import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    // Only run client-side logic if window is defined
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      if (this.authService.canRestoreSession()) {
        console.log('🔄 Restoring session from localStorage');
        const userProfile = this.authService.getStoredUserProfile();
        if (userProfile) {
          console.log('✅ Session restored for user:', userProfile.user.username);
          
          // If user is on login page or root, redirect to dashboard
          if (currentPath === '/login' || currentPath === '/' || currentPath === '') {
            console.log('🔀 Redirecting authenticated user to dashboard');
            this.router.navigate(['/dashboard']);
          }
          // Otherwise, let them stay on their current page
        }
      } else {
        // No valid session, redirect to login if not already there
        if (currentPath !== '/login' && !currentPath.startsWith('/login')) {
          console.log('❌ No valid session, redirecting to login');
          this.router.navigate(['/login']);
        }
      }
    }
  }
}
