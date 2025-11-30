import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, SystemLog } from '../../services/admin.service';

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
  autoRefresh = true;
  refreshInterval: any;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadLogs();
    this.loadErrorReports();
    this.loadPerformanceStats();
    
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.loadLogs();
        this.loadErrorReports();
        this.loadPerformanceStats();
      }, 30000); // Refresh every 30 seconds
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadLogs() {
    this.adminService.getSystemLogs(100).subscribe({
      next: (logs) => {
        this.logs = logs;
      },
      error: (err) => {
        console.error('Error loading logs:', err);
      }
    });
  }

  loadErrorReports() {
    this.adminService.getErrorReports().subscribe({
      next: (errors) => {
        this.errorLogs = errors;
      },
      error: (err) => {
        console.error('Error loading error reports:', err);
      }
    });
  }

  loadPerformanceStats() {
    this.adminService.getPerformanceStats().subscribe({
      next: (stats) => {
        this.performanceStats = stats;
      },
      error: (err) => {
        console.error('Error loading performance stats:', err);
      }
    });
  }

  getFilteredLogs(): SystemLog[] {
    if (this.logLevelFilter === 'all') {
      return this.logs;
    }
    return this.logs.filter(log => log.level === this.logLevelFilter);
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

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.loadLogs();
        this.loadErrorReports();
        this.loadPerformanceStats();
      }, 30000);
    } else {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    }
  }
}
