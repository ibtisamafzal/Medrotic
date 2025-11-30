import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService, Prescription } from '../../services/patient.service';

@Component({
  selector: 'app-view-prescriptions',
  imports: [CommonModule],
  templateUrl: './view-prescriptions.html',
  styleUrl: './view-prescriptions.scss',
})
export class ViewPrescriptions implements OnInit {
  loading = false;
  prescriptions: Prescription[] = [];

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.loadPrescriptions();
  }

  loadPrescriptions() {
    this.loading = true;
    this.patientService.getPrescriptions().subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
        this.loading = false;
      }
    });
  }
}
