import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, Patient } from '../../services/patient.service';
import { AuthService } from '../../auth/auth.service';
import { notifyPortalUpdated } from '../../services/patient.service';
import { finalize } from 'rxjs/operators';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';
import { AlertService } from '../../services/alert.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, FormsModule, PakInputFormatDirective],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss',
})
export class ProfileSettings implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

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

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  passwordSaving = false;
  passwordError = '';

  cnicVerifying = false;
  cnicVerified = false;
  cnicVerificationMessage = '';

  loadError = false;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.loadError = false;
    this.patientService
      .getPatientById('current')
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (patient) => {
          this.profile = patient;
          // Keep patient dashboard welcome header synced without logout/login.
          const displayName = patient?.name ?? patient?.fullName ?? '';
          if (displayName) this.authService.updateCurrentUserProfile(displayName, patient?.profilePictureUrl);
          this.cnicVerified = patient.cnicVerified || false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading profile:', err);
          this.loadError = true;
          this.profile = {
            name: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            address: '',
            cnic: '',
            cnicVerified: false
          };
          this.alertService.error('Could not load your profile from the server.');
          this.cdr.markForCheck();
        }
      });
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.profile.profilePictureUrl = e.target?.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    this.patientService.uploadProfilePicture(file).subscribe({
      next: (res) => {
        if (res.profilePictureUrl) {
          this.profile.profilePictureUrl = res.profilePictureUrl;
          this.alertService.success('Profile picture uploaded successfully.');
          this.authService.updateCurrentUserProfile(this.profile.name ?? '', res.profilePictureUrl);
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.warn('Backend upload failed, using local preview:', err);
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
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error verifying CNIC:', err);
        this.cnicVerificationMessage = 'Error verifying CNIC. Please try again.';
        this.cnicVerifying = false;
        this.cdr.markForCheck();
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
        this.alertService.success('Profile updated successfully');
        // Reload from backend so form doesn't blank and values stay in sync.
        // Update dashboard welcome header immediately (no need to wait for reload).
        const displayName = (this.profile?.name ?? (this.profile as any)?.fullName ?? '').toString().trim();
        if (displayName) this.authService.updateCurrentUserName(displayName);
        this.loadProfile();
        // Notify other portal components that profile-visible data may have changed.
        notifyPortalUpdated();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.alertService.error('Error updating profile. Please try again.');
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  changePassword() {
    const currentPassword = (this.passwordForm.currentPassword ?? '').trim();
    const newPassword = (this.passwordForm.newPassword ?? '').trim();
    const confirmPassword = (this.passwordForm.confirmPassword ?? '').trim();

    this.passwordError = '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.passwordError = 'Please fill in all password fields.';
      this.cdr.markForCheck();
      return;
    }

    if (newPassword !== confirmPassword) {
      this.passwordError = 'New passwords do not match.';
      this.cdr.markForCheck();
      return;
    }

    if (newPassword.length < 8) {
      this.passwordError = 'Password must be at least 8 characters.';
      this.cdr.markForCheck();
      return;
    }

    this.passwordSaving = true;
    this.cdr.markForCheck();

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordSaving = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.passwordError = '';
        this.alertService.success('Password changed successfully');
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.passwordSaving = false;
        const backendMessage =
          err?.error?.message ??
          err?.error?.Message ??
          (Array.isArray(err?.error) ? err.error.join(' ') : 'Password change failed.');
        this.passwordError = typeof backendMessage === 'string' ? backendMessage : 'Password change failed.';
        this.alertService.error(this.passwordError);
        this.cdr.markForCheck();
      }
    });
  }
}
