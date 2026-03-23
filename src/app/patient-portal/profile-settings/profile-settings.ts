import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, Patient } from '../../services/patient.service';
import { AuthService } from '../../auth/auth.service';
import { notifyPortalUpdated } from '../../services/patient.service';
import { finalize } from 'rxjs/operators';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, FormsModule, PakInputFormatDirective],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss',
})
export class ProfileSettings implements OnInit {
  loading = false;
  saving = false;
  profile: Partial<Patient> = {
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    cnic: ''
  };
  
  cnicVerifying = false;
  cnicVerified = false;
  cnicVerificationMessage = '';

  constructor(private patientService: PatientService, private authService: AuthService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    // In real app, get current user's profile
    // For now, using mock data
    this.patientService
      .getPatientById('current')
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (patient) => {
          this.profile = patient;
          // Keep patient dashboard welcome header synced without logout/login.
          const displayName = patient?.name ?? patient?.fullName ?? '';
          if (displayName) this.authService.updateCurrentUserName(displayName);
          this.cnicVerified = patient.cnicVerified || false;
        },
        error: (err) => {
          console.error('Error loading profile:', err);
          // Mock data for development
          this.profile = {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+923001234567',
            dateOfBirth: '1990-01-01',
            address: '123 Main St, City',
            cnic: '12345-1234567-1',
            cnicVerified: false
          };
        }
      });
  }

  verifyCNIC() {
    if (!this.profile.cnic) {
      this.cnicVerificationMessage = 'Please enter your CNIC first';
      return;
    }

    this.cnicVerifying = true;
    this.cnicVerificationMessage = '';
    
    this.patientService.verifyCNIC(this.profile.cnic!).subscribe({
      next: (result) => {
        this.cnicVerified = result.verified;
        this.cnicVerificationMessage = result.message || (result.verified ? 'CNIC verified successfully' : 'CNIC verification failed');
        this.cnicVerifying = false;
      },
      error: (err) => {
        console.error('Error verifying CNIC:', err);
        this.cnicVerificationMessage = 'Error verifying CNIC. Please try again.';
        this.cnicVerifying = false;
      }
    });
  }

  saveProfile() {
    this.saving = true;
    // Backend expects: FullName, PhoneNumber, City, Province, DateOfBirth, Gender
    // (and does NOT update Email/CNIC). Build the payload from the form fields.
    const address = (this.profile.address ?? '').trim();
    const parts = address
      ? address.split(',').map((p) => p.trim()).filter((p) => !!p)
      : [];

    const city = parts[0] ?? '';
    const province = parts[1] ?? '';

    const payload: any = {};
    const fullName = (this.profile.name ?? '').trim();
    const phone = (this.profile.phone ?? this.profile.phoneNumber ?? '').trim();

    if (fullName) payload.FullName = fullName;
    if (phone) payload.PhoneNumber = phone;
    if (city) payload.City = city;
    if (province) payload.Province = province;
    if (this.profile.dateOfBirth) payload.DateOfBirth = new Date(this.profile.dateOfBirth).toISOString();
    if (this.profile.gender) payload.Gender = this.profile.gender;

    this.patientService.updateProfile(payload).subscribe({
      next: () => {
        this.saving = false;
        alert('Profile updated successfully');
        // Reload from backend so form doesn't blank and values stay in sync.
        // Update dashboard welcome header immediately (no need to wait for reload).
        const displayName = (this.profile?.name ?? (this.profile as any)?.fullName ?? '').toString().trim();
        if (displayName) this.authService.updateCurrentUserName(displayName);
        this.loadProfile();
        // Notify other portal components that profile-visible data may have changed.
        notifyPortalUpdated();
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        alert('Error updating profile. Please try again.');
        this.saving = false;
      }
    });
  }
}
