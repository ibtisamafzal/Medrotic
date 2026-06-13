import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { AuthService } from '../../auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { notifyPortalUpdated } from '../../services/patient.service';
import { formatPakistaniCnicDisplay, PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, FormsModule, PakInputFormatDirective],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss',
})
export class ProfileSettings implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  doctor: Partial<Doctor> = {
    name: '',
    email: '',
    phone: '',
    specialization: '',
    cnic: '',
    hospital: '',
    profilePictureUrl: ''
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

  async loadProfile(showSpinner = true) {
    if (showSpinner) {
      this.loading = true;
    }
    const currentUser = this.authService.currentUserValue;
    try {
      const resp = await firstValueFrom(this.doctorService.getProfile());
      const d = resp?.data ?? resp?.Data ?? resp ?? {};
      this.applyDoctorPayload(d, currentUser);
    } catch (err) {
      console.error('Error loading doctor profile:', err);
      this.error = 'Unable to load profile from API.';
      this.doctor = {
        id: '',
        name: currentUser?.name ?? '',
        email: currentUser?.email ?? '',
        phone: '',
        specialization: '',
        cnic: '',
        hospital: '',
        profilePictureUrl: ''
      };
    } finally {
      if (showSpinner) {
        this.loading = false;
      }
      this.cdr.markForCheck();
    }
  }

  private applyDoctorPayload(d: any, currentUser: any) {
    this.doctor = {
      id: d?.id ?? d?.Id,
      name: d?.fullName ?? d?.FullName ?? currentUser?.name ?? '',
      email: d?.email ?? d?.Email ?? currentUser?.email ?? '',
      phone: d?.phoneNumber ?? d?.PhoneNumber ?? '',
      specialization: d?.specialty ?? d?.Specialty ?? '',
      cnic: formatPakistaniCnicDisplay(String(d?.cnic ?? d?.CNIC ?? '')),
      hospital: d?.hospitalName ?? '',
      profilePictureUrl: d?.profilePictureUrl ?? d?.ProfilePictureUrl ?? d?.profilePicturePath ?? d?.ProfilePicturePath ?? ''
    };
    this.authService.updateCurrentUserProfile(this.doctor.name ?? '', this.doctor.profilePictureUrl);
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.doctor.profilePictureUrl = e.target?.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    this.doctorService.uploadProfilePicture(file).subscribe({
      next: (res) => {
        if (res.profilePictureUrl) {
          this.doctor.profilePictureUrl = res.profilePictureUrl;
          this.authService.updateCurrentUserProfile(this.doctor.name ?? '', res.profilePictureUrl);
          this.success = true;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.warn('Backend upload failed, using local preview:', err);
      }
    });
  }

  onSubmit() {
    const fullName = (this.doctor.name ?? '').trim();
    if (fullName.length < 3) {
      this.error = 'Full name must be at least 3 characters.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = false;
    this.cdr.markForCheck();

    const body: Record<string, string> = { fullName };
    const spec = (this.doctor.specialization ?? '').trim();
    if (spec) {
      body['specialty'] = spec;
    }
    const phone = (this.doctor.phone ?? '').trim();
    if (phone) {
      body['phoneNumber'] = phone;
    }

    this.doctorService.updateProfile(body).subscribe({
      next: (resp) => {
        const d = resp?.data ?? resp?.Data;
        if (d) {
          this.applyDoctorPayload(d, this.authService.currentUserValue);
        }

        const current = this.authService.currentUserValue;
        const nextName = (this.doctor.name ?? '').toString().trim();
        if (nextName && current?.email && this.doctor.email && current.email === this.doctor.email) {
          this.authService.updateCurrentUserName(nextName);
        }
        notifyPortalUpdated();

        this.success = true;
        this.saving = false;
        void this.loadProfile(false);

        setTimeout(() => {
          this.success = false;
          this.cdr.markForCheck();
        }, 3000);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update profile';
        this.saving = false;
        this.cdr.markForCheck();
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
      next: () => {
        this.passwordSuccess = true;
        this.changingPassword = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => {
          this.passwordSuccess = false;
          this.cdr.markForCheck();
        }, 3000);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Failed to change password';
        this.changingPassword = false;
        this.cdr.markForCheck();
      }
    });
  }
}
