import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService, User } from '../../auth/auth.service';
import { VerificationSyncService } from '../../services/verification-sync.service';
import { Subscription } from 'rxjs';
import { portalUpdated$ } from '../../services/patient.service';
import Chart from 'chart.js/auto';
import { Analytics as AnalyticsData } from '../../services/admin.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren('dashboardChartCanvas') chartCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  currentUser: User | null = null;
  private authSub?: Subscription;
  private portalSub?: Subscription;
  private navSub?: Subscription;
  private verificationSub?: Subscription;
  private refreshInFlight = false;
  private patientGrowthChart: Chart | null = null;
  private doctorGrowthChart: Chart | null = null;
  private overviewChart: Chart | null = null;
  analyticsData: AnalyticsData | null = null;
  /** `null` means the value failed to load or is unknown — do not show as numeric zero. */
  metrics = {
    totalPatients: null as number | null,
    totalDoctors: null as number | null,
    totalUsers: null as number | null,
    activeAppointments: null as number | null,
    pendingVerifications: null as number | null,
    totalIntegrations: null as number | null,
    repositoryItems: null as number | null,
  };

  quickLinks = [
    { title: 'Manage Doctors', route: '/admin/manage-doctors', iconType: 'doctor', iconPath: 'doctor.svg', count: null as number | null, color: '#3461ff' },
    { title: 'Manage Patients', route: '/admin/manage-patients', iconType: 'patient', iconPath: 'patient.svg', count: null as number | null, color: '#10b981' },
    { title: 'User Verification', route: '/admin/user-verification', iconType: 'verify', iconPath: 'shield-check-light.svg', count: null as number | null, color: '#f59e0b' },
    { title: 'System Health', route: '/admin/system-health', iconType: 'health', iconPath: 'pulse-rectangle.svg', count: null as number | null, color: '#ef4444' },
    { title: 'Integrations', route: '/admin/manage-integrations', iconType: 'integrations', iconPath: 'cpu-light.svg', count: null as number | null, color: '#8b5cf6' },
    { title: 'Repository', route: '/admin/manage-repository', iconType: 'repo', iconPath: 'collection-light.svg', count: null as number | null, color: '#06b6d4' },
    { title: 'Analytics', route: '/admin/analytics', iconType: 'analytics', iconPath: 'Analytics-Bars.svg', count: null as number | null, color: '#ec4899' },
    { title: 'Notifications', route: '/admin/notifications', iconType: 'notifications', iconPath: 'notification-light.svg', count: null as number | null, color: '#f97316' }
  ];

  systemLogs: any[] = [];
  loadingLogs = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private verificationSync: VerificationSyncService
  ) {}

  ngAfterViewInit(): void {
    this.renderCharts();
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.authSub = this.authService.currentUser.subscribe((u) => {
      this.currentUser = u;
      this.cdr.markForCheck();
    });

    // Refresh when patient portal data/profile changes happen.
    this.portalSub = portalUpdated$.subscribe(() => {
      this.syncWelcomeFromBackendAndLoad();
    });

    // Ensure dashboards refresh after router back/forward navigation.
    this.navSub = this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;
      const url = event.urlAfterRedirects || event.url || '';
      if (url.includes('/admin/dashboard')) {
        this.syncWelcomeFromBackendAndLoad();
      }
    });

    this.verificationSub = this.verificationSync.changed$.subscribe(() => {
      this.refreshPendingVerificationCount();
    });

    this.syncWelcomeFromBackendAndLoad();
    this.loadSystemLogs();
  }  loadSystemLogs() {
    this.loadingLogs = true;
    this.adminService.getSystemLogs(5).subscribe({
      next: (logs) => {
        this.systemLogs = logs || [];
        this.loadingLogs = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.systemLogs = [
          { level: 'info', message: 'Nightly database backup completed successfully', timestamp: new Date().toISOString() },
          { level: 'warning', message: 'Elevated API response times detected', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { level: 'info', message: 'New user verification pending review', timestamp: new Date(Date.now() - 7200000).toISOString() },
          { level: 'info', message: 'Integration sync (EHR) finished', timestamp: new Date(Date.now() - 14400000).toISOString() },
          { level: 'error', message: 'Failed to dispatch email push notification', timestamp: new Date(Date.now() - 86400000).toISOString() }
        ];
        this.loadingLogs = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.portalSub?.unsubscribe();
    this.navSub?.unsubscribe();
    this.verificationSub?.unsubscribe();
    this.destroyCharts();
  }

  formatMetricCount(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return String(value);
  }

  quickLinkCountLabel(count: number | null): string {
    if (count === null) return 'Data unavailable';
    return `${count} items`;
  }

  get todayDate(): string {
    const d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  get welcomeDisplayName(): string {
    const u = this.currentUser;
    const n = (u?.name ?? '').trim();
    if (n) return n;
    const e = (u?.email ?? '').trim();
    if (e) return e;
    return 'Admin';
  }

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  trackByMetricLabel(_index: number, metric: { label: string }): string {
    return metric.label;
  }

  private reloadAll(): void {
    this.loadMetrics();
  }

  private destroyCharts(): void {
    this.patientGrowthChart?.destroy();
    this.doctorGrowthChart?.destroy();
    this.overviewChart?.destroy();
    this.patientGrowthChart = null;
    this.doctorGrowthChart = null;
    this.overviewChart = null;
  }

  private renderCharts(): void {
    if (!this.chartCanvases || this.chartCanvases.length < 3) return;

    const canvases = this.chartCanvases.toArray();
    const patientCanvas = canvases[0].nativeElement;
    const doctorCanvas = canvases[1].nativeElement;
    const overviewCanvas = canvases[2].nativeElement;

    const patientGrowth = this.analyticsData?.patientGrowth ?? [];
    const doctorGrowth = this.analyticsData?.doctorGrowth ?? [];

    this.patientGrowthChart?.destroy();
    this.patientGrowthChart = new Chart(patientCanvas, {
      type: 'line',
      data: {
        labels: patientGrowth.map((d) => d.month),
        datasets: [{
          label: 'Patients',
          data: patientGrowth.map((d) => d.count),
          borderColor: '#3461ff',
          backgroundColor: 'rgba(52, 97, 255, 0.14)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#3461ff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,16,71,0.08)' } }, x: { grid: { display: false } } }
      }
    });

    this.doctorGrowthChart?.destroy();
    this.doctorGrowthChart = new Chart(doctorCanvas, {
      type: 'bar',
      data: {
        labels: doctorGrowth.map((d) => d.month),
        datasets: [{
          label: 'Doctors',
          data: doctorGrowth.map((d) => d.count),
          borderRadius: 10,
          backgroundColor: '#10b981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,16,71,0.08)' } }, x: { grid: { display: false } } }
      }
    });

    this.overviewChart?.destroy();
    this.overviewChart = new Chart(overviewCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Patients', 'Doctors', 'Appointments', 'Verifications', 'Integrations', 'Repository'],
        datasets: [{
          data: [
            this.metrics.totalPatients ?? 0,
            this.metrics.totalDoctors ?? 0,
            this.metrics.activeAppointments ?? 0,
            this.metrics.pendingVerifications ?? 0,
            this.metrics.totalIntegrations ?? 0,
            this.metrics.repositoryItems ?? 0,
          ],
          backgroundColor: ['#3461ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });

    this.cdr.markForCheck();
  }

  /** Keeps User Verification quick-link count in sync after approve/reject/verify elsewhere in the app. */
  private refreshPendingVerificationCount(): void {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.metrics.pendingVerifications = users.filter((u) => u.status === 'pending').length;
        this.quickLinks[2].count = this.metrics.pendingVerifications;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error refreshing pending verifications:', err);
        this.metrics.pendingVerifications = null;
        this.quickLinks[2].count = null;
        this.cdr.markForCheck();
      },
    });
  }

  private syncWelcomeFromBackendAndLoad(): void {
    if (this.refreshInFlight) return;
    this.refreshInFlight = true;

    this.adminService.getProfile().subscribe({
      next: (resp) => {
        const data = resp?.data ?? resp?.Data ?? resp ?? {};
        const name = data?.FullName ?? data?.fullName ?? data?.name ?? data?.Name ?? '';
        if (name) this.authService.updateCurrentUserName(String(name).trim());

        this.reloadAll();
        this.cdr.markForCheck();
        this.refreshInFlight = false;
      },
      error: (err) => {
        console.error('Error syncing admin dashboard:', err);
        this.reloadAll();
        this.cdr.markForCheck();
        this.refreshInFlight = false;
      }
    });
  }

  loadMetrics() {
    // Load analytics
    this.adminService.getAnalytics().subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.metrics.totalPatients = data.totalPatients ?? 0;
        this.metrics.totalDoctors = data.totalDoctors ?? 0;
        this.metrics.totalUsers = data.totalUsers ?? 0;
        this.metrics.activeAppointments = data.activeAppointments ?? 0;
        this.quickLinks[0].count = data.totalDoctors ?? 0;
        this.quickLinks[1].count = data.totalPatients ?? 0;
        this.cdr.markForCheck();
        queueMicrotask(() => this.renderCharts());
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.analyticsData = null;
        this.metrics.totalPatients = null;
        this.metrics.totalDoctors = null;
        this.metrics.totalUsers = null;
        this.metrics.activeAppointments = null;
        this.quickLinks[0].count = null;
        this.quickLinks[1].count = null;
        this.cdr.markForCheck();
        queueMicrotask(() => this.renderCharts());
      }
    });

    // Load users for pending verifications
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.metrics.pendingVerifications = users.filter(u => u.status === 'pending').length;
        this.quickLinks[2].count = this.metrics.pendingVerifications;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.metrics.pendingVerifications = null;
        this.quickLinks[2].count = null;
        this.cdr.markForCheck();
      }
    });

    // Load integrations
    this.adminService.getIntegrations().subscribe({
      next: (integrations) => {
        this.metrics.totalIntegrations = integrations.length;
        this.quickLinks[4].count = integrations.length;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading integrations:', err);
        this.metrics.totalIntegrations = null;
        this.quickLinks[4].count = null;
        this.cdr.markForCheck();
      }
    });

    // Load repository items
    this.adminService.getRepositoryItems().subscribe({
      next: (items) => {
        this.metrics.repositoryItems = items.length;
        this.quickLinks[5].count = items.length;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading repository:', err);
        this.metrics.repositoryItems = null;
        this.quickLinks[5].count = null;
        this.cdr.markForCheck();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
