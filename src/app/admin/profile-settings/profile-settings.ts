import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../auth/auth.service';
import { AdminService } from '../../services/admin.service';
import { notifyPortalUpdated } from '../../services/patient.service';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';

const ADMIN_PREFS_STORAGE_KEY = 'medrotic.admin.preferences.v1';

interface AdminPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  language: string;
  timezone: string;
}

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, FormsModule, PakInputFormatDirective],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss',
})
export class ProfileSettings implements OnInit {
  profile = {
    name: '',
    email: '',
    phone: '',
    role: 'admin',
    profilePictureUrl: '',
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  preferences: AdminPreferences = {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    language: 'en',
    timezone: 'UTC',
  };

  profileLoading = false;
  profileSaving = false;
  passwordSaving = false;
  prefsSaving = false;

  constructor(
    private alertService: AlertService,
    private authService: AuthService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPreferencesFromStorage();
    this.loadProfileFromApi();
  }

  private loadPreferencesFromStorage(): void {
    try {
      const raw = localStorage.getItem(ADMIN_PREFS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AdminPreferences>;
      this.preferences = {
        ...this.preferences,
        ...parsed,
      };
    } catch {
      /* ignore corrupt storage */
    }
  }

  private loadProfileFromApi(): void {
    this.profileLoading = true;
    this.cdr.markForCheck();
    this.adminService.getProfile().subscribe({
      next: (resp) => {
        const d = resp?.data ?? resp?.Data ?? resp ?? {};
        this.profile = {
          name: String(d.fullName ?? d.FullName ?? this.authService.currentUserValue?.name ?? '').trim(),
          email: String(d.email ?? d.Email ?? this.authService.currentUserValue?.email ?? '').trim(),
          phone: String(d.phoneNumber ?? d.PhoneNumber ?? '').trim(),
          role: 'admin',
          profilePictureUrl: String(d.profilePictureUrl ?? d.ProfilePictureUrl ?? d.profilePicturePath ?? d.ProfilePicturePath ?? '').trim(),
        };
        this.authService.updateCurrentUserProfile(this.profile.name, this.profile.profilePictureUrl);
        this.profileLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Admin profile load failed:', err);
        const u = this.authService.currentUserValue;
        if (u?.name) this.profile.name = u.name;
        if (u?.email) this.profile.email = u.email;
        this.profileLoading = false;
        this.alertService.error('Could not load profile from the server. Showing cached name/email only.');
        this.cdr.markForCheck();
      },
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

    this.adminService.uploadProfilePicture(file).subscribe({
      next: (res) => {
        if (res.profilePictureUrl) {
          this.profile.profilePictureUrl = res.profilePictureUrl;
          this.authService.updateCurrentUserProfile(this.profile.name, res.profilePictureUrl);
          this.alertService.success('Profile picture uploaded successfully.');
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.warn('Backend upload failed, using local preview:', err);
      }
    });
  }

  updateProfile() {
    const fullName = (this.profile.name ?? '').trim();
    if (fullName.length < 3) {
      this.alertService.error('Name must be at least 3 characters.');
      return;
    }

    this.profileSaving = true;
    this.cdr.markForCheck();
    const phone = (this.profile.phone ?? '').trim();
    this.adminService
      .updateProfile({
        fullName,
        phoneNumber: phone.length ? phone : null,
      })
      .subscribe({
        next: (resp) => {
          const d = resp?.data ?? resp?.Data ?? {};
          const name = String(d.fullName ?? d.FullName ?? fullName).trim();
          const phoneOut = String(d.phoneNumber ?? d.PhoneNumber ?? phone).trim();
          if (name) {
            this.profile.name = name;
            this.authService.updateCurrentUserName(name);
          }
          this.profile.phone = phoneOut;
          this.profileSaving = false;
          this.alertService.success('Profile updated successfully.');
          notifyPortalUpdated();
          this.cdr.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          this.profileSaving = false;
          const msg = err?.error?.message ?? err?.error?.Message ?? 'Profile update failed.';
          this.alertService.error(typeof msg === 'string' ? msg : 'Profile update failed.');
          this.cdr.markForCheck();
        },
      });
  }

  changePassword() {
    const currentPassword = (this.passwordForm.currentPassword ?? '').trim();
    const newPassword = (this.passwordForm.newPassword ?? '').trim();
    const confirmPassword = (this.passwordForm.confirmPassword ?? '').trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.alertService.error('Please fill in all password fields.');
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.alertService.error('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      this.alertService.warning('Password must be at least 8 characters.');
      return;
    }

    this.passwordSaving = true;
    this.cdr.markForCheck();
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordSaving = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.alertService.success('Password changed successfully.');
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.passwordSaving = false;
        const msg = err?.error?.message ?? err?.error?.Message;
        this.alertService.error(typeof msg === 'string' ? msg : 'Password change failed. Check your current password.');
        this.cdr.markForCheck();
      },
    });
  }

  savePreferences() {
    this.prefsSaving = true;
    this.cdr.markForCheck();
    try {
      localStorage.setItem(ADMIN_PREFS_STORAGE_KEY, JSON.stringify(this.preferences));
      this.alertService.success('Preferences saved on this device.');
    } catch {
      this.alertService.error('Could not save preferences (storage unavailable).');
    }
    this.prefsSaving = false;
    this.cdr.markForCheck();
  }
}
