import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AlertService } from './alert.service';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private checkInterval?: Subscription;
  private warningShown = false;
  private readonly WARNING_TIME_MINUTES = 5; // Show warning 5 minutes before expiry
  private readonly CHECK_INTERVAL_SECONDS = 60; // Check every minute
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  startSessionMonitoring(): void {
    if (!this.isBrowser) return;

    // Stop any existing monitoring
    this.stopSessionMonitoring();

    // Check token expiration periodically
    this.checkInterval = interval(this.CHECK_INTERVAL_SECONDS * 1000).subscribe(() => {
      if (!this.authService.isLoggedIn()) {
        this.stopSessionMonitoring();
        return;
      }

      const token = this.authService.getToken();
      if (!token) {
        this.stopSessionMonitoring();
        return;
      }

      const decoded = this.authService.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return;
      }

      const expirationDate = new Date(decoded.exp * 1000);
      const now = new Date();
      const minutesUntilExpiry = (expirationDate.getTime() - now.getTime()) / (1000 * 60);

      // Show warning if less than WARNING_TIME_MINUTES minutes remaining
      if (minutesUntilExpiry <= this.WARNING_TIME_MINUTES && minutesUntilExpiry > 0 && !this.warningShown) {
        this.showSessionWarning(minutesUntilExpiry);
        this.warningShown = true;
      }

      // Auto-logout if expired
      if (minutesUntilExpiry <= 0) {
        this.handleSessionExpiry();
      }
    });
  }

  stopSessionMonitoring(): void {
    if (this.checkInterval) {
      this.checkInterval.unsubscribe();
      this.checkInterval = undefined;
    }
    this.warningShown = false;
  }

  private showSessionWarning(minutesRemaining: number): void {
    const minutes = Math.floor(minutesRemaining);
    const seconds = Math.floor((minutesRemaining - minutes) * 60);
    
    let message = '';
    if (minutes > 0) {
      message = `Your session will expire in ${minutes} minute${minutes > 1 ? 's' : ''}. Please save your work.`;
    } else if (seconds > 0) {
      message = `Your session will expire in ${seconds} second${seconds > 1 ? 's' : ''}. Please save your work.`;
    } else {
      message = 'Your session is about to expire. Please save your work.';
    }

    this.alertService.warning(message, false); // Don't auto-close warning
  }

  private handleSessionExpiry(): void {
    this.stopSessionMonitoring();
    this.alertService.error('Your session has expired. Please log in again.');
    this.authService.logout();
  }

  resetWarning(): void {
    this.warningShown = false;
  }
}
