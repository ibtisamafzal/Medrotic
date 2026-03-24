import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService, User } from '../../auth/auth.service';
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
  loading = true;
  private authSub?: Subscription;
  private portalSub?: Subscription;
  private navSub?: Subscription;
  private refreshInFlight = false;
  metrics = {
    totalPatients: 0,
    totalDoctors: 0,
    totalUsers: 0,
    activeAppointments: 0,
    pendingVerifications: 0,
    systemHealth: 'healthy',
    totalIntegrations: 0,
    repositoryItems: 0
  };

  quickLinks = [
    { title: 'Manage Doctors', route: '/admin/manage-doctors', icon: '👨‍⚕️', count: 0, color: '#3461ff' },
    { title: 'Manage Patients', route: '/admin/manage-patients', icon: '👤', count: 0, color: '#10b981' },
    { title: 'User Verification', route: '/admin/user-verification', icon: '✓', count: 0, color: '#f59e0b' },
    { title: 'System Health', route: '/admin/system-health', icon: '💚', count: 0, color: '#ef4444' },
    { title: 'Integrations', route: '/admin/manage-integrations', icon: '🔗', count: 0, color: '#8b5cf6' },
    { title: 'Repository', route: '/admin/manage-repository', icon: '📁', count: 0, color: '#06b6d4' },
    { title: 'Analytics', route: '/admin/analytics', icon: '📊', count: 0, color: '#ec4899' },
    { title: 'Notifications', route: '/admin/notifications', icon: '🔔', count: 0, color: '#f97316' }
  ];

  recentActivity: any[] = [];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
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

    this.syncWelcomeFromBackendAndLoad();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.portalSub?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  private reloadAll(): void {
    this.loadMetrics();
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
    this.loading = true;
    
    // Load analytics
    this.adminService.getAnalytics().subscribe({
      next: (data) => {
        this.metrics.totalPatients = data.totalPatients || 0;
        this.metrics.totalDoctors = data.totalDoctors || 0;
        this.metrics.totalUsers = data.totalUsers || 0;
        this.metrics.activeAppointments = data.activeAppointments || 0;
        this.quickLinks[0].count = data.totalDoctors || 0;
        this.quickLinks[1].count = data.totalPatients || 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.metrics.totalPatients = 0;
        this.metrics.totalDoctors = 0;
        this.metrics.totalUsers = 0;
        this.metrics.activeAppointments = 0;
        this.quickLinks[0].count = 0;
        this.quickLinks[1].count = 0;
        this.loading = false;
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
        this.metrics.pendingVerifications = 0;
        this.quickLinks[2].count = 0;
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
        this.metrics.totalIntegrations = 0;
        this.quickLinks[4].count = 0;
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
        this.metrics.repositoryItems = 0;
        this.quickLinks[5].count = 0;
        this.cdr.markForCheck();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
