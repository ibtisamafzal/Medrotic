import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, SystemLog } from '../../services/admin.service';
import { VerificationSyncService } from '../../services/verification-sync.service';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-system-health',
  imports: [CommonModule, FormsModule],
  templateUrl: './system-health.html',
  styleUrl: './system-health.scss',
})
export class SystemHealth implements OnInit, OnDestroy {
  logs: SystemLog[] = [];
  errorLogs: SystemLog[] = [];
  performanceStats: any = {};
  logLevelFilter: 'all' | 'info' | 'warning' | 'error' = 'all';
  /** Off by default so the page does not poll unless the admin opts in. */
  autoRefresh = false;
  refreshInterval: ReturnType<typeof setInterval> | null = null;
  private verificationSub?: Subscription;

  /** Stable list for *ngFor (avoids re-creating rows every change detection). */
  statCards: { value: string; label: string; icon: string; color: string }[] = [];

  /** Expanded log rows (by id) for detail / metadata. */
  expandedIds = new Set<string>();

  constructor(
    private adminService: AdminService,
    private verificationSync: VerificationSyncService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadLogs();
    this.loadErrorReports();
    this.loadPerformanceStats();

    this.verificationSub = this.verificationSync.changed$
      .pipe(debounceTime(800))
      .subscribe(() => {
        this.loadLogs();
      });

    this.syncAutoRefreshTimer();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.verificationSub?.unsubscribe();
  }

  trackStatCardLabel(_index: number, stat: { label: string }): string {
    return stat.label;
  }

  loadLogs() {
    this.adminService.getSystemLogs(100).subscribe({
      next: (logs) => {
        this.logs = logs;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading logs:', err);
      },
    });
  }

  loadErrorReports() {
    this.adminService.getErrorReports().subscribe({
      next: (errors) => {
        this.errorLogs = errors;
        this.rebuildStatCards();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading error reports:', err);
        this.rebuildStatCards();
        this.cdr.markForCheck();
      },
    });
  }

  loadPerformanceStats() {
    this.adminService.getPerformanceStats().subscribe({
      next: (stats) => {
        this.performanceStats = stats;
        this.rebuildStatCards();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading performance stats:', err);
        this.rebuildStatCards();
        this.cdr.markForCheck();
      },
    });
  }

  getFilteredLogs(): SystemLog[] {
    if (this.logLevelFilter === 'all') {
      return this.logs;
    }
    return this.logs.filter((log) => log.level === this.logLevelFilter);
  }

  trackLogById(_index: number, log: SystemLog): string {
    return log.id;
  }

  toggleExpanded(log: SystemLog): void {
    if (this.expandedIds.has(log.id)) {
      this.expandedIds.delete(log.id);
    } else {
      this.expandedIds.add(log.id);
    }
    this.cdr.markForCheck();
  }

  isExpanded(log: SystemLog): boolean {
    return this.expandedIds.has(log.id);
  }

  logHasDetails(log: SystemLog): boolean {
    return !!(
      (log.detail && log.detail.trim()) ||
      (log.category && log.category.trim() && log.category !== log.source) ||
      log.actorUserId ||
      log.resourceId ||
      log.resourceType
    );
  }

  getLogLevelClass(level: string): string {
    switch (level) {
      case 'error':
        return 'log-level error';
      case 'warning':
        return 'log-level warning';
      case 'info':
        return 'log-level info';
      default:
        return 'log-level';
    }
  }

  getLogIcon(level: string): string {
    switch (level) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  }

  /** Performance tiles: show "—" when the API does not supply a measured value (no fake percentages). */
  private rebuildStatCards(): void {
    const p = this.performanceStats ?? {};
    const upRaw = p.systemUptimePercent ?? p.systemUptime;
    const uptime =
      upRaw === null || upRaw === undefined || upRaw === '' ? '—' : `${Number(upRaw)}%`;
    const ar = p.avgResponseTimeMs ?? p.avgResponseTime;
    const response =
      ar === null || ar === undefined || ar === '' ? '—' : `${Number(ar)}ms`;
    const au = p.activeUsers;
    const active = au === null || au === undefined ? '—' : String(au);
    this.statCards = [
      { value: uptime, label: 'System Uptime', icon: 'uptime', color: '#10b981' },
      { value: response, label: 'Avg Response Time', icon: 'response', color: '#3461ff' },
      { value: String(this.errorLogs?.length ?? 0), label: 'Error Reports', icon: 'error', color: '#ef4444' },
      { value: active, label: 'Active Users', icon: 'users', color: '#f59e0b' },
    ];
  }

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  onAutoRefreshModelChange(): void {
    this.syncAutoRefreshTimer();
  }

  private syncAutoRefreshTimer(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    if (!this.autoRefresh) return;
    this.refreshInterval = setInterval(() => {
      this.loadLogs();
      this.loadErrorReports();
      this.loadPerformanceStats();
    }, 30000);
  }
}
