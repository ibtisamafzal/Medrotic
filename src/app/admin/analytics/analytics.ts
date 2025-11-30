import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, Analytics as AnalyticsData } from '../../services/admin.service';

@Component({
  selector: 'app-analytics',
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class Analytics implements OnInit {
  analytics: AnalyticsData | null = null;
  chartData: any = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.adminService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.prepareChartData();
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
      }
    });
  }

  prepareChartData() {
    if (!this.analytics) return;
    
    // Prepare data for charts (simplified - would use Chart.js in production)
    this.chartData = {
      patientGrowth: this.analytics.patientGrowth,
      doctorGrowth: this.analytics.doctorGrowth,
      kpis: this.analytics.kpis
    };
  }

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
}
