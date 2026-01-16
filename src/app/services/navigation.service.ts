import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Navigate to login page if user is not logged in,
   * otherwise navigate to user's dashboard based on role
   */
  navigateToAuthOrDashboard(): void {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.currentUserValue;
      if (user) {
        switch (user.role) {
          case 'admin':
            this.router.navigate(['/admin/dashboard']);
            break;
          case 'doctor':
            this.router.navigate(['/doctor-portal/dashboard']);
            break;
          case 'patient':
            this.router.navigate(['/patient-portal/dashboard']);
            break;
          default:
            this.router.navigate(['/auth/login']);
        }
      } else {
        this.router.navigate(['/auth/login']);
      }
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
