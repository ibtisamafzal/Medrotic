import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, FormsModule],
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

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    // Load profile data from service
  }

  updateProfile() {
    // Update profile logic
    this.alertService.success('Profile updated successfully!');
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
