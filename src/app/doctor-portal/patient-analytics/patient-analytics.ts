import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DoctorService, PatientAnalytics as PatientAnalyticsData, Patient } from '../../services/doctor.service';

@Component({
  selector: 'app-patient-analytics',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './patient-analytics.html',
  styleUrl: './patient-analytics.scss',
})
export class PatientAnalytics implements OnInit {
  patientId = '';
  patient: Patient | null = null;
  analytics: PatientAnalyticsData | null = null;
  loading = false;
  hubLoading = false;
  hubPatients: Patient[] = [];
  hubFiltered: Patient[] = [];
  hubSearch = '';

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = (params['id'] ?? '').toString().trim();
      this.patientId = id;
      this.analytics = null;
      this.patient = null;
      if (id) {
        this.loadPatient();
        this.loadAnalytics();
      } else {
        this.loadHubPatients();
      }
      this.cdr.markForCheck();
    });
  }

  loadPatient() {
    this.doctorService.getPatientById(this.patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading patient:', err);
        this.patient = null;
        this.cdr.markForCheck();
      }
    });
  }

  loadAnalytics() {
    this.loading = true;
    this.doctorService.getPatientAnalytics(this.patientId).subscribe({
      next: (analytics) => {
        this.analytics = analytics;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.analytics = null;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadHubPatients() {
    this.hubLoading = true;
    this.doctorService.getPatients().subscribe({
      next: (list) => {
        this.hubPatients = list ?? [];
        this.applyHubFilter();
        this.hubLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading patients for analytics hub:', err);
        this.hubPatients = [];
        this.hubFiltered = [];
        this.hubLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onHubSearchInput(): void {
    this.applyHubFilter();
  }

  private applyHubFilter(): void {
    const q = this.hubSearch.trim().toLowerCase();
    if (!q) {
      this.hubFiltered = [...this.hubPatients];
      return;
    }
    this.hubFiltered = this.hubPatients.filter(
      (p) =>
        (p.name ?? '').toLowerCase().includes(q) ||
        (p.cnic ?? '').toLowerCase().includes(q) ||
        (p.phone ?? '').toLowerCase().includes(q)
    );
  }

  trackPatientId(_i: number, p: Patient): string {
    return String(p.id);
  }
}
