import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { AuthService } from '../../auth/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss',
})
export class ProfileSettings implements OnInit {
  doctor: Partial<Doctor> = {
    name: '',
    email: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    hospital: ''
  };
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  loading = false;
  saving = false;
  changingPassword = false;
  success = false;
  passwordSuccess = false;
  error = '';
  passwordError = '';

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    this.loading = true;
    
    // Try to get current user from auth service first
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser && currentUser.email) {
      // Try to load doctor profile by email
      try {
        const doctors = await firstValueFrom(this.doctorService.getDoctors());
        const doctor = doctors.find(d => d.email === currentUser.email);
        if (doctor) {
          this.doctor = doctor;
          this.loading = false;
          return;
        }
      } catch (err) {
        console.error('Error loading doctors:', err);
      }
    }

    // Fallback to mock data for development
    this.doctor = {
      name: currentUser?.name || 'Dr. John Smith',
      email: currentUser?.email || 'doctor@medrotic.com',
      phone: '+923001234567',
      specialization: 'Cardiology',
      licenseNumber: 'MD12345',
      hospital: 'Medrotic Hospital'
    };
    this.loading = false;
  }

  onSubmit() {
    if (!this.doctor.id) {
      this.error = 'Doctor ID not found';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = false;

    this.doctorService.updateDoctor(this.doctor.id, this.doctor).subscribe({
      next: (updatedDoctor) => {
        this.doctor = updatedDoctor;
        this.success = true;
        this.saving = false;
        setTimeout(() => {
          this.success = false;
        }, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update profile';
        this.saving = false;
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'New passwords do not match!';
      return;
    }
    if (this.passwordForm.newPassword.length < 8) {
      this.passwordError = 'Password must be at least 8 characters long!';
      return;
    }

    this.changingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = false;

    this.authService.changePassword(
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).subscribe({
      next: (response) => {
        this.passwordSuccess = true;
        this.changingPassword = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => {
          this.passwordSuccess = false;
        }, 3000);
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Failed to change password';
        this.changingPassword = false;
      }
    });
  }
}
