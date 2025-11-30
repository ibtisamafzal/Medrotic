import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorService, Patient } from '../../services/doctor.service';

@Component({
  selector: 'app-register-patient',
  imports: [CommonModule, FormsModule],
  templateUrl: './register-patient.html',
  styleUrl: './register-patient.scss',
})
export class RegisterPatient {
  patient: Partial<Patient> = {
    name: '',
    email: '',
    phone: '',
    cnic: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    medicalHistory: '',
    status: 'active'
  };

  loading = false;
  error = '';
  success = false;

  constructor(
    private doctorService: DoctorService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.patient.name || !this.patient.cnic) {
      this.error = 'Name and CNIC are required';
      return;
    }

    this.loading = true;
    this.error = '';

    this.doctorService.registerPatient(this.patient).subscribe({
      next: (createdPatient) => {
        this.success = true;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/doctor-portal/patient-details', createdPatient.id]);
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to register patient';
        this.loading = false;
      }
    });
  }
}
