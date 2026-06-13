import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService, MedicalHistory } from '../../services/patient.service';
import { portalUpdated$ } from '../../services/patient.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-view-medical-history',
  imports: [CommonModule],
  templateUrl: './view-medical-history.html',
  styleUrl: './view-medical-history.scss',
})
export class ViewMedicalHistory implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  history: MedicalHistory[] = [];
  selectedItem: MedicalHistory | null = null;
  private sub?: Subscription;

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.loadHistory();
    this.sub = portalUpdated$.subscribe(() => {
      this.loadHistory();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  openDetails(item: MedicalHistory): void {
    this.selectedItem = item;
    this.cdr.markForCheck();
  }

  closeDetails(): void {
    this.selectedItem = null;
    this.cdr.markForCheck();
  }

  loadHistory() {
    this.loading = true;
    this.patientService.getHistory().subscribe({
      next: (history) => {
        this.history = history.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.history = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      prescription: '📋',
      xray: '🩻',
      test: '🧪',
      visit: '🏥',
      metric: '📊'
    };
    return icons[type] || '📄';
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

  getHistorySummary(item: MedicalHistory): string {
    const parts = [item.disease, item.diagnosis, item.treatment, item.description]
      .map((value) => (value ?? '').trim())
      .filter((value) => value.length > 0);
    return parts.length > 0 ? parts.join(' • ') : 'No additional summary available.';
  }
}
