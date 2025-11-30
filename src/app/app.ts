import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { Alert } from './common/alert/alert';
import { AlertService, AlertMessage } from './services/alert.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Alert, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('frontend');
  private router = inject(Router);
  private alertService = inject(AlertService);
  private subscription?: Subscription;
  alertMessage: AlertMessage | null = null;
  showAlert = false;

  ngOnInit() {
    // Scroll to top on route change
    this.subscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
  }

  onAlertClosed() {
    this.showAlert = false;
    this.alertMessage = null;
  }
}
