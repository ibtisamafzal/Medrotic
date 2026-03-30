import { Component, signal, OnInit, OnDestroy, inject, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Alert } from './common/alert/alert';
import { AlertService, AlertMessage } from './services/alert.service';
import { SessionService } from './services/session.service';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';
import { VercelAnalyticsComponent } from './common/vercel-analytics/vercel-analytics';
import { VercelSpeedInsightsComponent } from './common/vercel-speed-insights/vercel-speed-insights';
import { RouteProgressComponent } from './common/shared/route-progress.component';
import { ConfirmDialogComponent } from './common/shared/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Alert, CommonModule, VercelAnalyticsComponent, VercelSpeedInsightsComponent, RouteProgressComponent, ConfirmDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('frontend');
  private alertService = inject(AlertService);
  private sessionService = inject(SessionService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  alertMessage: AlertMessage | null = null;
  showAlert = false;
  scrollProgress = 0;
  showProgressBar = true;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.calculateScrollProgress();

      // Monitor route changes to hide progress bar on specific pages
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        this.updateProgressBarVisibility(url);
      });

      // Initial check
      this.updateProgressBarVisibility(this.router.url);
    }
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

    // Subscribe to alert service
    this.alertService.alert$.subscribe(alert => {
      this.alertMessage = alert;
      this.showAlert = true;
    });
  }

  ngOnDestroy() {
    this.sessionService.stopSessionMonitoring();
  }

  onAlertClosed() {
    this.showAlert = false;
    this.alertMessage = null;
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.calculateScrollProgress();
  }

  private calculateScrollProgress() {
    if (!isPlatformBrowser(this.platformId)) return;
    const docElement = document.documentElement;
    const body = document.body;

    const scrollTop = docElement.scrollTop || body.scrollTop;
    const scrollHeight = docElement.scrollHeight || body.scrollHeight;
    const clientHeight = docElement.clientHeight;

    const windowHeight = scrollHeight - clientHeight;
    this.scrollProgress = windowHeight > 0 ? (scrollTop / windowHeight) * 100 : 0;
  }

  private updateProgressBarVisibility(url: string) {
    const hiddenRoutes = ['/auth', '/admin', '/doctor-portal', '/patient-portal'];
    this.showProgressBar = !hiddenRoutes.some(route => url.startsWith(route));
  }
}

