import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, TestReport } from '../../services/patient.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-test-report-analysis',
  imports: [CommonModule, FormsModule],
  templateUrl: './test-report-analysis.html',
  styleUrl: './test-report-analysis.scss',
})
export class TestReportAnalysis implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  uploading = false;
  analyzing = false;
  selectedFile: File | null = null;
  reports: TestReport[] = [];
  currentAnalysis: string = '';

  constructor(
    private patientService: PatientService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadReports();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadAndAnalyze() {
    if (!this.selectedFile) {
      this.alertService.warning('Please select a file first.');
      return;
    }

    this.uploading = true;
    this.analyzing = true;

    this.patientService.uploadReport(this.selectedFile).subscribe({
      next: (report) => {
        this.uploading = false;
        this.currentAnalysis = (report.analysis ?? '').trim()
          ? String(report.analysis).trim()
          : 'No analysis text was returned for this upload.';
        this.loadReports();
        this.selectedFile = null;
        this.analyzing = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error uploading report:', err);
        this.alertService.error('Error uploading report. Please try again.');
        this.uploading = false;
        this.analyzing = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadReports() {
    this.patientService.getReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading reports:', err);
        this.cdr.markForCheck();
      }
    });
  }
}
