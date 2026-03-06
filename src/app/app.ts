import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { Alert } from './common/alert/alert';
import { AlertService, AlertMessage } from './services/alert.service';
import { SessionService } from './services/session.service';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';
import { VercelAnalyticsComponent } from './common/vercel-analytics/vercel-analytics';
import { VercelSpeedInsightsComponent } from './common/vercel-speed-insights/vercel-speed-insights';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Alert, CommonModule, VercelAnalyticsComponent, VercelSpeedInsightsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('frontend');
  private router = inject(Router);
  private alertService = inject(AlertService);
  private sessionService = inject(SessionService);
  private authService = inject(AuthService);
  private subscription?: Subscription;
  alertMessage: AlertMessage | null = null;
  showAlert = false;

  ngOnInit() {
    // Restore session if Remember Me is enabled
    this.authService.restoreSessionIfRemembered();
    
    // Start session monitoring if user is logged in
    if (this.authService.isLoggedIn()) {
      this.sessionService.startSessionMonitoring();
    }
    
    // Monitor auth state changes to start/stop session monitoring
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.sessionService.startSessionMonitoring();
      } else {
        this.sessionService.stopSessionMonitoring();
      }
    });
    
    // Scroll to top on route change
    this.subscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      });

    // Subscribe to alert service
    this.alertService.alert$.subscribe(alert => {
      this.alertMessage = alert;
      this.showAlert = true;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.sessionService.stopSessionMonitoring();
  }

  onAlertClosed() {
    this.showAlert = false;
    this.alertMessage = null;
  }
}
