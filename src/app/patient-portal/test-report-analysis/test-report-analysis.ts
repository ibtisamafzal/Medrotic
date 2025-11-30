import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, TestReport } from '../../services/patient.service';

@Component({
  selector: 'app-test-report-analysis',
  imports: [CommonModule, FormsModule],
  templateUrl: './test-report-analysis.html',
  styleUrl: './test-report-analysis.scss',
})
export class TestReportAnalysis implements OnInit {
  uploading = false;
  analyzing = false;
  selectedFile: File | null = null;
  reports: TestReport[] = [];
  currentAnalysis: string = '';

  constructor(private patientService: PatientService) {}

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
      alert('Please select a file first');
      return;
    }

    this.uploading = true;
    this.analyzing = true;

    this.patientService.uploadReport(this.selectedFile).subscribe({
      next: (report) => {
        this.uploading = false;
        this.currentAnalysis = report.analysis || 'Analysis completed. Review the results below.';
        this.loadReports();
        this.selectedFile = null;
        this.analyzing = false;
      },
      error: (err) => {
        console.error('Error uploading report:', err);
        alert('Error uploading report. Please try again.');
        this.uploading = false;
        this.analyzing = false;
      }
    });
  }

  loadReports() {
    this.patientService.getReports().subscribe({
      next: (reports) => {
        this.reports = reports;
      },
      error: (err) => {
        console.error('Error loading reports:', err);
      }
    });
  }
}
