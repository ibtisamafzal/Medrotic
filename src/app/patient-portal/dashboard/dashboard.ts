import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, RouterModule, Router } from '@angular/router';
import { MedicalHistory, PatientService } from '../../services/patient.service';
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
  /** Skeleton metric row only on the first successful load; later refreshes keep cards mounted. */
  loading = true;
  private dashboardReady = false;
  private authSub?: Subscription;
  private portalSub?: Subscription;
  private navSub?: Subscription;
  private refreshInFlight = false;
  healthSummary = {
    lastCheckup: null as string | null,
    recentMetrics: {
      bloodPressure: null as string | null,
      heartRate: null as number | null,
      temperature: null as number | null,
      weight: null as number | null,
    },
    /** `null` if the request failed — do not show as zero. */
    upcomingAppointments: null as number | null,
    pendingReports: null as number | null,
    unreadNotifications: null as number | null
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

  get welcomeDisplayName(): string {
    const u = this.currentUser;
    const n = (u?.name ?? '').trim();
    if (n) return n;
    const e = (u?.email ?? '').trim();
    if (e) return e;
    return 'Patient';
  }

  hasRecordedMetric(value: string | number | null | undefined): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'number') return !Number.isNaN(value);
    return String(value).trim().length > 0;
  }

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  formatOptionalCount(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return String(value);
  }

  trackByMetricLabel(_index: number, metric: { label: string }): string {
    return metric.label;
  }

  private applyLastCheckupFromHistory(history: MedicalHistory[]) {
    const clinical = (history || []).filter((h) => h.type !== 'metric');
    if (clinical.length === 0) {
      this.healthSummary.lastCheckup = null;
      return;
    }
    const sorted = [...clinical].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.healthSummary.lastCheckup = sorted[0].date;
  }

  loadDashboardData() {
    if (!this.dashboardReady) {
      this.loading = true;
    }
    let completedCalls = 0;
    const totalCalls = 7;

    const checkComplete = () => {
      completedCalls++;
      if (completedCalls >= totalCalls) {
        this.loading = false;
        this.dashboardReady = true;
      }
      this.cdr.markForCheck();
    };

    // Load health metrics
    this.patientService.getMetrics().subscribe({
      next: (metrics) => {
        if (metrics && metrics.length > 0) {
          const latest = metrics[0];
          this.healthSummary.recentMetrics = {
            bloodPressure: latest.bloodPressure ?? null,
            heartRate: latest.heartRate ?? null,
            temperature: latest.temperature ?? null,
            weight: latest.weight ?? null,
          };
        } else {
          this.healthSummary.recentMetrics = {
            bloodPressure: null,
            heartRate: null,
            temperature: null,
            weight: null,
          };
        }
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading metrics:', err);
        this.healthSummary.recentMetrics = {
          bloodPressure: null,
          heartRate: null,
          temperature: null,
          weight: null,
        };
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
        this.applyLastCheckupFromHistory(history || []);
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.recentActivity = [];
        this.healthSummary.lastCheckup = null;
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
        this.healthSummary.unreadNotifications = null;
        checkComplete();
      }
    });

    this.patientService.getMyAppointments(1, 100).subscribe({
      next: ({ data }) => {
        const now = Date.now();
        this.healthSummary.upcomingAppointments = data.filter((a) => {
          const t = new Date(a.appointmentDate).getTime();
          const st = (a.status ?? '').toString().toLowerCase();
          return !Number.isNaN(t) && t >= now && st !== 'cancelled';
        }).length;
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
        this.healthSummary.upcomingAppointments = null;
        checkComplete();
      }
    });

    this.patientService.getReports().subscribe({
      next: (reports) => {
        const pending = reports.filter((r) => {
          const t = (r.documentType ?? '').toString().toLowerCase();
          const isReportish = t.includes('lab') || t.includes('report') || t === 'labreport';
          const st = (r.currentState ?? '').toString().toLowerCase();
          const pendingState =
            st === '' || st === 'uploaded' || st === 'pending' || st === 'processing';
          return isReportish && pendingState;
        }).length;
        this.healthSummary.pendingReports = pending;
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading reports for dashboard:', err);
        this.healthSummary.pendingReports = null;
        checkComplete();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
