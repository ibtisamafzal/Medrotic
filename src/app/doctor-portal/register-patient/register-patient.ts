import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorService, Patient } from '../../services/doctor.service';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';

@Component({
  selector: 'app-register-patient',
  imports: [CommonModule, FormsModule, PakInputFormatDirective],
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
    city: '',
    province: '',
    address: '',
    medicalHistory: '',
    status: 'active'
  };

  loading = false;
  error = '';
  success = false;
  existingPatientFound = false;
  existingPatientId = '';

  constructor(
    private doctorService: DoctorService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.patient.name || !this.patient.cnic) {
      this.error = 'Name and CNIC are required';
      return;
    }
    const phoneDigits = (this.patient.phone ?? '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      this.error = 'A valid phone number (at least 10 digits) is required.';
      return;
    }
    const city = (this.patient.city ?? '').trim();
    const province = (this.patient.province ?? '').trim();
    if (city.length < 2 || province.length < 2) {
      this.error = 'City and province are required.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.doctorService.registerPatient(this.patient).subscribe({
      next: (createdPatient) => {
        this.success = true;
        this.loading = false;
        this.existingPatientFound = false;
        setTimeout(() => {
          if (createdPatient?.id) {
            this.router.navigate(['/doctor-portal/patient-details', createdPatient.id]);
          } else {
            this.router.navigate(['/doctor-portal/patient-management']);
          }
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error?.Message || 'Failed to register patient';
        this.loading = false;
      }
    });
  }

  searchByCnic() {
    if (!this.patient.cnic) {
      this.error = 'CNIC is required';
      return;
    }

    this.loading = true;
    this.error = '';
    this.doctorService.lookupPatientByCnic(this.patient.cnic).subscribe({
      next: (result) => {
        this.loading = false;
        if (!result.exists || !result.data) {
          this.existingPatientFound = false;
          this.existingPatientId = '';
          this.error = 'No patient account found for this CNIC. You can add as new patient below.';
          return;
        }

        this.existingPatientFound = true;
        this.existingPatientId = result.data.id;
        this.patient.name = result.data.name || result.data.fullName || '';
        this.patient.email = result.data.email || '';
        this.patient.phone = result.data.phone || '';
        this.error = '';
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to search patient by CNIC.';
      }
    });
  }

  continueWithExistingPatient() {
    if (!this.existingPatientId) return;
    this.router.navigate(['/doctor-portal/patient-details', this.existingPatientId]);
  }
}
