import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, HealthMetric, notifyPortalUpdated } from '../../services/patient.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-add-metrics',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-metrics.html',
  styleUrl: './add-metrics.scss',
})
export class AddMetrics implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  saving = false;
  submitted = false;
  
  metric: HealthMetric = {
    date: new Date().toISOString().split('T')[0],
    bloodPressure: '',
    heartRate: undefined,
    temperature: undefined,
    weight: undefined,
    height: undefined,
    bloodSugar: undefined,
    symptoms: '',
    notes: ''
  };

  recentMetrics: HealthMetric[] = [];

  constructor(
    private patientService: PatientService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadRecentMetrics();
  }

  loadRecentMetrics() {
    this.patientService.getMetrics().subscribe({
      next: (metrics) => {
        this.recentMetrics = metrics.slice(0, 5);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading metrics:', err);
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit() {
    this.submitted = true;
    if (!this.metric.date) {
      return;
    }

    this.saving = true;
    this.patientService.addMetrics(this.metric).subscribe({
      next: (saved) => {
        this.saving = false;
        this.submitted = false;
        this.alertService.success('Health metrics saved successfully.');
        this.resetForm();
        this.loadRecentMetrics();
        // Trigger real-time refresh across portal components (dashboard/history).
        notifyPortalUpdated();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error saving metrics:', err);
        this.alertService.error('Error saving metrics. Please try again.');
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  resetForm() {
    this.metric = {
      date: new Date().toISOString().split('T')[0],
      bloodPressure: '',
      heartRate: undefined,
      temperature: undefined,
      weight: undefined,
      height: undefined,
      bloodSugar: undefined,
      symptoms: '',
      notes: ''
    };
    this.submitted = false;
  }
}
