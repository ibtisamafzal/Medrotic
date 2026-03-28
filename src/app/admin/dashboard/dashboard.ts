import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService, User } from '../../auth/auth.service';
import { VerificationSyncService } from '../../services/verification-sync.service';
import { Subscription } from 'rxjs';
import { portalUpdated$ } from '../../services/patient.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private authSub?: Subscription;
  private portalSub?: Subscription;
  private navSub?: Subscription;
  private verificationSub?: Subscription;
  private refreshInFlight = false;
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
    { title: 'Manage Doctors', route: '/admin/manage-doctors', icon: '👨‍⚕️', count: null as number | null, color: '#3461ff' },
    { title: 'Manage Patients', route: '/admin/manage-patients', icon: '👤', count: null as number | null, color: '#10b981' },
    { title: 'User Verification', route: '/admin/user-verification', icon: '✓', count: null as number | null, color: '#f59e0b' },
    { title: 'System Health', route: '/admin/system-health', icon: '💚', count: null as number | null, color: '#ef4444' },
    { title: 'Integrations', route: '/admin/manage-integrations', icon: '🔗', count: null as number | null, color: '#8b5cf6' },
    { title: 'Repository', route: '/admin/manage-repository', icon: '📁', count: null as number | null, color: '#06b6d4' },
    { title: 'Analytics', route: '/admin/analytics', icon: '📊', count: null as number | null, color: '#ec4899' },
    { title: 'Notifications', route: '/admin/notifications', icon: '🔔', count: null as number | null, color: '#f97316' }
  ];

  recentActivity: any[] = [];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private verificationSync: VerificationSyncService
  ) {}

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
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.portalSub?.unsubscribe();
    this.navSub?.unsubscribe();
    this.verificationSub?.unsubscribe();
  }

  formatMetricCount(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return String(value);
  }

  quickLinkCountLabel(count: number | null): string {
    if (count === null) return 'Data unavailable';
    return `${count} items`;
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
        this.metrics.totalPatients = data.totalPatients ?? 0;
        this.metrics.totalDoctors = data.totalDoctors ?? 0;
        this.metrics.totalUsers = data.totalUsers ?? 0;
        this.metrics.activeAppointments = data.activeAppointments ?? 0;
        this.quickLinks[0].count = data.totalDoctors ?? 0;
        this.quickLinks[1].count = data.totalPatients ?? 0;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.metrics.totalPatients = null;
        this.metrics.totalDoctors = null;
        this.metrics.totalUsers = null;
        this.metrics.activeAppointments = null;
        this.quickLinks[0].count = null;
        this.quickLinks[1].count = null;
        this.cdr.markForCheck();
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
