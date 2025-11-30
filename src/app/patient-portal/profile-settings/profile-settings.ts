import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, Patient } from '../../services/patient.service';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, FormsModule],
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

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    // In real app, get current user's profile
    // For now, using mock data
    this.patientService.getPatientById('current').subscribe({
      next: (patient) => {
        this.profile = patient;
        this.cnicVerified = patient.cnicVerified || false;
        this.loading = false;
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
        this.loading = false;
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
    this.patientService.updateProfile(this.profile).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.saving = false;
        alert('Profile updated successfully');
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        alert('Error updating profile. Please try again.');
        this.saving = false;
      }
    });
  }
}
