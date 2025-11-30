import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService, Xray } from '../../services/patient.service';

@Component({
  selector: 'app-view-xrays',
  imports: [CommonModule],
  templateUrl: './view-xrays.html',
  styleUrl: './view-xrays.scss',
})
export class ViewXrays implements OnInit {
  loading = false;
  xrays: Xray[] = [];
  selectedXray: Xray | null = null;

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.loadXrays();
  }

  loadXrays() {
    this.loading = true;
    this.patientService.getXrays().subscribe({
      next: (xrays) => {
        this.xrays = xrays.sort((a, b) => {
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading xrays:', err);
        this.loading = false;
      }
    });
  }

  viewXray(xray: Xray) {
    this.selectedXray = xray;
  }

  closeView() {
    this.selectedXray = null;
  }
}
