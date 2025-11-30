import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  loading = true;
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

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.loadDashboardData();
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
        this.recentActivity = history.slice(0, 5);
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
}
