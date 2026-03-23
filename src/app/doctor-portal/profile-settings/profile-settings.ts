import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { AuthService } from '../../auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { notifyPortalUpdated } from '../../services/patient.service';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, FormsModule, PakInputFormatDirective],
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
    const currentUser = this.authService.currentUserValue;
    try {
      const resp = await firstValueFrom(this.doctorService.getProfile());
      const d = resp?.data ?? resp?.Data ?? resp ?? {};
      this.doctor = {
        id: d?.id ?? d?.Id,
        name: d?.fullName ?? d?.FullName ?? currentUser?.name ?? '',
        email: d?.email ?? d?.Email ?? currentUser?.email ?? '',
        phone: d?.phoneNumber ?? d?.PhoneNumber ?? '',
        specialization: d?.specialty ?? d?.Specialty ?? '',
        licenseNumber: d?.cnic ?? d?.CNIC ?? '',
        hospital: d?.hospitalName ?? ''
      };
    } catch (err) {
      console.error('Error loading doctor profile:', err);
      this.error = 'Unable to load profile from API.';
      this.doctor = {
        id: '',
        name: currentUser?.name ?? '',
        email: currentUser?.email ?? '',
        phone: '',
        specialization: '',
        licenseNumber: '',
        hospital: ''
      };
    } finally {
      this.loading = false;
    }
  }

  onSubmit() {
    this.saving = true;
    this.error = '';
    this.success = false;

    this.doctorService.updateProfile({
      fullName: this.doctor.name,
      specialty: this.doctor.specialization,
      phoneNumber: this.doctor.phone
    }).subscribe({
      next: () => {
        this.success = true;
        this.saving = false;

        // Keep dashboard welcome header in real-time (do not wait for logout/login).
        const current = this.authService.currentUserValue;
        const nextName = (this.doctor.name ?? '').toString().trim();
        if (nextName && current?.email && this.doctor.email && current.email === this.doctor.email) {
          this.authService.updateCurrentUserName(nextName);
        }
        notifyPortalUpdated();

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
