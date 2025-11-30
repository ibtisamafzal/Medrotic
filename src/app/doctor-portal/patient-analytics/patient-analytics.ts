import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DoctorService, PatientAnalytics as PatientAnalyticsData, Patient } from '../../services/doctor.service';

@Component({
  selector: 'app-patient-analytics',
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-analytics.html',
  styleUrl: './patient-analytics.scss',
})
export class PatientAnalytics implements OnInit {
  patientId: string = '';
  patient: Patient | null = null;
  analytics: PatientAnalyticsData | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.patientId = params['id'];
      if (this.patientId) {
        this.loadPatient();
        this.loadAnalytics();
      }
    });
  }

  loadPatient() {
    this.doctorService.getPatientById(this.patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
      },
      error: (err) => {
        console.error('Error loading patient:', err);
        // Mock data for development
        this.patient = {
          id: this.patientId,
          name: 'John Doe',
          cnic: '12345-1234567-1',
          email: 'john@example.com',
          phone: '+923001234567',
          status: 'active'
        };
      }
    });
  }

  loadAnalytics() {
    this.loading = true;
    this.doctorService.getPatientAnalytics(this.patientId).subscribe({
      next: (analytics) => {
        this.analytics = analytics;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        // Mock data for development
        this.analytics = {
          patientId: this.patientId,
          totalVisits: 12,
          totalPrescriptions: 8,
          totalXrays: 3,
          lastVisit: new Date().toISOString(),
          healthTrends: [],
          medications: []
        };
        this.loading = false;
      }
    });
  }
}
