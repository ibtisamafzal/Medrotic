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
}
