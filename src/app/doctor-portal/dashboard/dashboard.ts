import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { DashboardTableActionsComponent } from '../../common/shared/dashboard-table-actions.component';
import { DoctorService } from '../../services/doctor.service';
import { AuthService, User } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { portalUpdated$ } from '../../services/patient.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, DashboardTableActionsComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private authSub?: Subscription;
  private portalSub?: Subscription;
  private navSub?: Subscription;
  private refreshInFlight = false;
  metrics = {
    totalPatients: null as number | null,
    activePatients: null as number | null,
    totalPrescriptions: null as number | null,
    totalXrays: null as number | null,
    pendingMessages: null as number | null,
  };

  recentPatients: any[] = [];
  assignedPatients: any[] = [];
  recentUploads: any[] = [];
  upcomingAppointments: any[] = [];
  appointmentsLoadError: string | null = null;

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Keep welcome header real-time (zoneless mode needs explicit CD).
    this.currentUser = this.authService.currentUserValue;
    this.authSub = this.authService.currentUser.subscribe((u) => {
      this.currentUser = u;
      this.cdr.markForCheck();
    });

    // Refresh doctor dashboard when portal-visible patient changes happen
    // (e.g., doctor profile edit may trigger a portal update too).
    this.portalSub = portalUpdated$.subscribe(() => {
      this.syncWelcomeFromBackendAndLoad();
    });

    // Also refresh when navigating back/forward to this dashboard.
    this.navSub = this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;
      const url = event.urlAfterRedirects || event.url || '';
      if (url.includes('/doctor-portal/dashboard')) {
        this.syncWelcomeFromBackendAndLoad();
      }
    });

    this.syncWelcomeFromBackendAndLoad();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.portalSub?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  formatMetricCount(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return String(value);
  }

  get welcomeDisplayName(): string {
    const u = this.currentUser;
    const n = (u?.name ?? '').trim();
    if (n) return n;
    const e = (u?.email ?? '').trim();
    if (e) return e;
    return 'Doctor';
  }

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  trackByMetricLabel(_index: number, metric: { label: string }): string {
    return metric.label;
  }

  /** Max of the four headline numbers — used for relative bar length. */
  get metricScaleMax(): number {
    const vals = [
      this.metrics.totalPatients,
      this.metrics.activePatients,
      this.metrics.totalPrescriptions,
      this.metrics.totalXrays,
    ].filter((x): x is number => x != null && x >= 0);
    return vals.length ? Math.max(...vals, 1) : 1;
  }

  /**
   * Optional bar under each metric: "share" = active vs total; "relative" = vs max of the four stats.
   */
  metricBarInsight(metric: {
    label: string;
    value: number | null;
    viz: string;
  }): { pct: number; caption: string } | null {
    if (metric.viz === 'share') {
      const t = this.metrics.totalPatients;
      const a = this.metrics.activePatients;
      if (t == null || t <= 0 || a == null) return null;
      const pct = Math.min(100, Math.round((a / t) * 100));
      return { pct, caption: `${pct}% of roster active` };
    }
    if (metric.value == null) return null;
    const pct = Math.min(100, Math.round((metric.value / this.metricScaleMax) * 100));
    return { pct, caption: 'Volume vs busiest metric' };
  }

  /** Donut + mix strip for the snapshot row (light theme only). */
  get practiceSnapshot():
    | {
        activePct: number;
        rx: number;
        xr: number;
        totalPatients: number;
        activePatients: number;
      }
    | null {
    const t = this.metrics.totalPatients;
    const a = this.metrics.activePatients;
    const rx = this.metrics.totalPrescriptions;
    const xr = this.metrics.totalXrays;
    if (t == null && a == null && rx == null && xr == null) return null;
    const activePct =
      t != null && t > 0 && a != null ? Math.min(100, Math.round((a / t) * 100)) : 0;
    const rv = Math.max(0, rx ?? 0);
    const xv = Math.max(0, xr ?? 0);
    const sum = rv + xv;
    return {
      activePct,
      rx: sum > 0 ? rv : 0,
      xr: sum > 0 ? xv : 0,
      totalPatients: t ?? 0,
      activePatients: a ?? 0,
    };
  }

  private reloadAll(): void {
    this.loadMetrics();
    this.loadRecentPatients();
    this.loadAssignedPatients();
    this.loadRecentUploads();
    this.loadUpcomingAppointments();
  }

  private syncWelcomeFromBackendAndLoad(): void {
    if (this.refreshInFlight) return;
    this.refreshInFlight = true;

    this.doctorService.getProfile().subscribe({
      next: (resp) => {
        const data = resp?.data ?? resp?.Data ?? resp ?? {};
        const name = data?.FullName ?? data?.fullName ?? data?.name ?? data?.Name ?? '';
        if (name) this.authService.updateCurrentUserName(String(name).trim());

        this.reloadAll();
        this.cdr.markForCheck();
        this.refreshInFlight = false;
      },
      error: (err) => {
        console.error('Error syncing doctor dashboard:', err);
        this.reloadAll();
        this.cdr.markForCheck();
        this.refreshInFlight = false;
      }
    });
  }

  loadMetrics() {
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.metrics.totalPatients = patients.length;
        this.metrics.activePatients = patients.filter(p => p.status === 'active').length;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.metrics.totalPatients = null;
        this.metrics.activePatients = null;
        this.cdr.markForCheck();
      }
    });

    this.doctorService.getPrescriptions().subscribe({
      next: (prescriptions) => {
        this.metrics.totalPrescriptions = prescriptions.length;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
        this.metrics.totalPrescriptions = null;
        this.cdr.markForCheck();
      }
    });

    this.doctorService.getXrays().subscribe({
      next: (xrays) => {
        this.metrics.totalXrays = xrays.length;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading xrays:', err);
        this.metrics.totalXrays = null;
        this.cdr.markForCheck();
      }
    });

    this.doctorService.getMessages().subscribe({
      next: (messages) => {
        this.metrics.pendingMessages = messages.filter(m => !m.read).length;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.metrics.pendingMessages = null;
        this.cdr.markForCheck();
      }
    });
  }

  loadRecentPatients() {
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.recentPatients = patients
          .sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading recent patients:', err);
        this.recentPatients = [];
        this.cdr.markForCheck();
      }
    });
  }

  loadAssignedPatients() {
    // In real app, this would filter by doctor assignment
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.assignedPatients = patients
          .filter(p => p.status === 'active')
          .slice(0, 10);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading assigned patients:', err);
        this.assignedPatients = [];
        this.cdr.markForCheck();
      }
    });
  }

  loadUpcomingAppointments() {
    this.appointmentsLoadError = null;
    this.doctorService.getAppointments(1, 50).subscribe({
      next: (res) => {
        const raw = (res?.data ?? res?.Data ?? []) as any[];
        const now = Date.now();
        this.upcomingAppointments = raw
          .filter((a) => {
            const dt = a.appointmentDate ?? a.AppointmentDate;
            const t = new Date(dt).getTime();
            const st = (a.status ?? a.Status ?? 'Scheduled').toString();
            return !Number.isNaN(t) && t >= now && st !== 'Cancelled';
          })
          .sort((a, b) => {
            const ta = new Date(a.appointmentDate ?? a.AppointmentDate).getTime();
            const tb = new Date(b.appointmentDate ?? b.AppointmentDate).getTime();
            return ta - tb;
          })
          .slice(0, 8);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
        this.upcomingAppointments = [];
        this.appointmentsLoadError = 'Appointments could not be loaded. Try again later.';
        this.cdr.markForCheck();
      }
    });
  }

  loadRecentUploads() {
    // Load recent prescriptions and x-rays
    this.doctorService.getPrescriptions().subscribe({
      next: (prescriptions) => {
        const prescriptionUploads = prescriptions
          .map(p => ({
            type: 'prescription',
            id: p.id,
            patientId: p.patientId,
            date: p.createdAt,
            title: `Prescription #${p.id}`
          }));

        this.doctorService.getXrays().subscribe({
          next: (xrays) => {
            const xrayUploads = xrays
              .map(x => ({
                type: 'xray',
                id: x.id,
                patientId: x.patientId,
                date: x.createdAt,
                title: `X-Ray #${x.id}`
              }));

            this.recentUploads = [...prescriptionUploads, ...xrayUploads]
              .sort((a, b) => {
                const dateA = new Date(a.date || 0).getTime();
                const dateB = new Date(b.date || 0).getTime();
                return dateB - dateA;
              })
              .slice(0, 10);
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error loading xrays:', err);
            this.recentUploads = prescriptionUploads.slice(0, 10);
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
        this.recentUploads = [];
        this.cdr.markForCheck();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
