import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../auth/auth.service';
import { notifyPortalUpdated } from '../../services/patient.service';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, FormsModule, PakInputFormatDirective],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss',
})
export class ProfileSettings implements OnInit {
  profile = {
    name: 'Admin User',
    email: 'admin@medrotic.com',
    phone: '',
    role: 'admin'
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  preferences = {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    language: 'en',
    timezone: 'UTC'
  };

  constructor(
    private alertService: AlertService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Keep dashboard welcome name in sync even for stubbed admin profile updates.
    const current = this.authService.currentUserValue;
    if (current?.name) this.profile.name = current.name;
    if (current?.email) this.profile.email = current.email;
  }

  updateProfile() {
    // Update profile logic
    this.alertService.success('Profile updated successfully!');

    if (this.profile.name?.trim()) {
      this.authService.updateCurrentUserName(this.profile.name.trim());
    }
    notifyPortalUpdated();
  }

  changePassword() {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.alertService.error('New passwords do not match!');
      return;
    }
    if (this.passwordForm.newPassword.length < 8) {
      this.alertService.warning('Password must be at least 8 characters long!');
      return;
    }
    // Change password logic
    this.alertService.success('Password changed successfully!');
    this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  savePreferences() {
    // Save preferences logic
    this.alertService.success('Preferences saved successfully!');
  }
}
