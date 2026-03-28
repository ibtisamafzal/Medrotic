import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AdminService, Analytics as AnalyticsData } from '../../services/admin.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-analytics',
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class Analytics implements OnInit, AfterViewInit {
  analytics: AnalyticsData | null = null;

  @ViewChildren('chartCanvas') chartCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  
  patientChart: Chart | null = null;
  doctorChart: Chart | null = null;

  constructor(
    private adminService: AdminService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  ngAfterViewInit() {
    this.renderCharts();
  }

  loadAnalytics() {
    this.adminService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.renderCharts();
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
      }
    });
  }

  formatOptionalMs(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `${value} ms`;
  }

  formatOptionalPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `${value}%`;
  }

  renderCharts() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.analytics || !this.chartCanvases || this.chartCanvases.length < 2) return;

    const canvases = this.chartCanvases.toArray();
    
    // Patient Growth Chart
    if (this.patientChart) this.patientChart.destroy();
    
    const patientCtx = canvases[0].nativeElement.getContext('2d');
    if (patientCtx) {
      this.patientChart = new Chart(patientCtx, {
        type: 'line',
        data: {
          labels: this.analytics.patientGrowth.map(d => d.month),
          datasets: [{
            label: 'New Patients',
            data: this.analytics.patientGrowth.map(d => d.count),
            borderColor: '#3461ff',
            backgroundColor: 'rgba(52, 97, 255, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // Doctor Growth Chart
    if (this.doctorChart) this.doctorChart.destroy();
    
    const doctorCtx = canvases[1].nativeElement.getContext('2d');
    if (doctorCtx) {
      this.doctorChart = new Chart(doctorCtx, {
        type: 'bar',
        data: {
          labels: this.analytics.doctorGrowth.map(d => d.month),
          datasets: [{
            label: 'New Doctors',
            data: this.analytics.doctorGrowth.map(d => d.count),
            backgroundColor: '#10b981',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
}
