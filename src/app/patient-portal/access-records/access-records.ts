import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, MedicalHistory } from '../../services/patient.service';
import { Subscription } from 'rxjs';
import { portalUpdated$ } from '../../services/patient.service';

@Component({
  selector: 'app-access-records',
  imports: [CommonModule, FormsModule],
  templateUrl: './access-records.html',
  styleUrl: './access-records.scss',
})
export class AccessRecords implements OnInit, OnDestroy {
  loading = false;
  exporting = false;
  searchQuery = '';
  records: MedicalHistory[] = [];
  filteredRecords: MedicalHistory[] = [];
  private sub?: Subscription;

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.loadRecords();
    this.sub = portalUpdated$.subscribe(() => this.loadRecords());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadRecords() {
    this.loading = true;
    this.patientService.getAccessRecords(this.searchQuery).subscribe({
      next: (records) => {
        this.records = records;
        this.filteredRecords = records;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading records:', err);
        this.loading = false;
      }
    });
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredRecords = this.records;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredRecords = this.records.filter(record =>
      record.title.toLowerCase().includes(query) ||
      record.description?.toLowerCase().includes(query) ||
      record.doctorName?.toLowerCase().includes(query) ||
      record.type.toLowerCase().includes(query)
    );
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      prescription: 'warning',
      xray: 'danger',
      test: 'info',
      visit: 'success',
      metric: 'primary'
    };
    return colors[type] || 'secondary';
  }

  exportRecords(format: 'pdf' | 'csv' = 'pdf') {
    this.exporting = true;
    this.patientService.exportRecords(format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical-records.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: (err) => {
        console.error('Error exporting records:', err);
        alert('Error exporting records. Please try again.');
        this.exporting = false;
      }
    });
  }
}
