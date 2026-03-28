import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService, Xray } from '../../services/patient.service';
import { Subscription } from 'rxjs';
import { portalUpdated$ } from '../../services/patient.service';

@Component({
  selector: 'app-view-xrays',
  imports: [CommonModule],
  templateUrl: './view-xrays.html',
  styleUrl: './view-xrays.scss',
})
export class ViewXrays implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  xrays: Xray[] = [];
  selectedXray: Xray | null = null;
  private sub?: Subscription;

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.loadXrays();
    this.sub = portalUpdated$.subscribe(() => this.loadXrays());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadXrays() {
    this.loading = true;
    this.patientService.getXrays().subscribe({
      next: (xrays) => {
        this.xrays = xrays.sort((a, b) => {
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading xrays:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  viewXray(xray: Xray) {
    this.selectedXray = xray;
    this.cdr.markForCheck();
  }

  closeView() {
    this.selectedXray = null;
    this.cdr.markForCheck();
  }
}
