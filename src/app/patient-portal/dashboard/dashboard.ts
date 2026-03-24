import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, RouterModule, Router } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { AuthService, User } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { portalUpdated$ } from '../../services/patient.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  currentUser: User | null = null;
  loading = true;
  private authSub?: Subscription;
  private portalSub?: Subscription;
  private navSub?: Subscription;
  private refreshInFlight = false;
  healthSummary = {
    lastCheckup: null as string | null,
    recentMetrics: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 98.6,
      weight: 70
    },
    upcomingAppointments: 0,
    pendingReports: 0,
    unreadNotifications: 0
  };

  recentActivity: any[] = [];
  recentPrescriptions: any[] = [];
  recentXrays: any[] = [];

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Keep the welcome header in real-time sync with auth/user name updates.
    this.currentUser = this.authService.currentUserValue;
    this.authSub = this.authService.currentUser.subscribe((u) => {
      this.currentUser = u;
      // With zoneless change detection, ensure UI refreshes immediately.
      this.cdr.markForCheck();
    });

    // Keep dashboard cards in real-time sync after metrics updates.
    this.portalSub = portalUpdated$.subscribe(() => {
      this.loadDashboardData();
      this.cdr.markForCheck();
    });

    // Ensure we re-sync welcome name and dashboard data any time the user navigates
    // to this route (covers both router link navigation and browser back/forward).
    this.navSub = this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;

      const url = event.urlAfterRedirects || event.url || '';
      if (url.includes('/patient-portal/dashboard')) {
        this.syncWelcomeFromBackendAndLoad();
      }
    });

    // Initial load
    this.syncWelcomeFromBackendAndLoad();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.portalSub?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  private syncWelcomeFromBackendAndLoad(): void {
    if (this.refreshInFlight) return;
    this.refreshInFlight = true;

    this.patientService
      .getPatientById('current')
      .subscribe({
        next: (patient) => {
          const displayName = (patient?.name ?? patient?.fullName ?? '').toString().trim();
          if (displayName) this.authService.updateCurrentUserName(displayName);
          this.loadDashboardData();
          this.cdr.markForCheck();
          this.refreshInFlight = false;
        },
        error: (err) => {
          console.error('Error syncing dashboard welcome:', err);
          // Fall back to whatever auth state currently has.
          this.loadDashboardData();
          this.cdr.markForCheck();
          this.refreshInFlight = false;
        }
      });
  }

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  loadDashboardData() {
    this.loading = true;
    let completedCalls = 0;
    const totalCalls = 5;

    const checkComplete = () => {
      completedCalls++;
      if (completedCalls >= totalCalls) {
        this.loading = false;
      }
      this.cdr.markForCheck();
    };

    // Load health metrics
    this.patientService.getMetrics().subscribe({
      next: (metrics) => {
        if (metrics && metrics.length > 0) {
          const latest = metrics[0];
          this.healthSummary.recentMetrics = {
            bloodPressure: latest.bloodPressure || '120/80',
            heartRate: latest.heartRate || 72,
            temperature: latest.temperature || 98.6,
            weight: latest.weight || 70
          };
        }
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading metrics:', err);
        checkComplete();
      }
    });

    // Load history
    this.patientService.getHistory().subscribe({
      next: (history) => {
        // Ensure "recent" list is truly chronological (metrics + docs + records can be merged out of order).
        this.recentActivity = (history || [])
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.recentActivity = [];
        checkComplete();
      }
    });

    // Load prescriptions
    this.patientService.getPrescriptions().subscribe({
      next: (prescriptions) => {
        this.recentPrescriptions = prescriptions.slice(0, 3);
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
        this.recentPrescriptions = [];
        checkComplete();
      }
    });

    // Load xrays
    this.patientService.getXrays().subscribe({
      next: (xrays) => {
        this.recentXrays = xrays.slice(0, 3);
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading xrays:', err);
        this.recentXrays = [];
        checkComplete();
      }
    });

    // Load notifications
    this.patientService.getNotifications().subscribe({
      next: (notifications) => {
        this.healthSummary.unreadNotifications = notifications.filter(n => !n.read).length;
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        checkComplete();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
