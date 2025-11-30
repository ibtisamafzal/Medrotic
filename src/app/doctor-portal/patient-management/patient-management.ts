import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DoctorService, Patient } from '../../services/doctor.service';

@Component({
  selector: 'app-patient-management',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './patient-management.html',
  styleUrl: './patient-management.scss',
})
export class PatientManagement implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  loading = false;
  searchTerm = '';
  searchBy = 'cnic'; // 'cnic' | 'name' | 'phone'

  constructor(private doctorService: DoctorService) {}

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    this.loading = true;
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.filteredPatients = patients;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        // Mock data for development
        this.patients = [
          { id: '1', name: 'John Doe', cnic: '12345-1234567-1', phone: '+923001234567', email: 'john@example.com', status: 'active' },
          { id: '2', name: 'Jane Smith', cnic: '12345-1234567-2', phone: '+923001234568', email: 'jane@example.com', status: 'active' },
          { id: '3', name: 'Mike Johnson', cnic: '12345-1234567-3', phone: '+923001234569', email: 'mike@example.com', status: 'active' },
          { id: '4', name: 'Sarah Williams', cnic: '12345-1234567-4', phone: '+923001234570', email: 'sarah@example.com', status: 'active' },
          { id: '5', name: 'David Brown', cnic: '12345-1234567-5', phone: '+923001234571', email: 'david@example.com', status: 'inactive' }
        ];
        this.filteredPatients = this.patients;
        this.loading = false;
      }
    });
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = this.patients;
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredPatients = this.patients.filter(patient => {
      if (this.searchBy === 'cnic') {
        return patient.cnic?.toLowerCase().includes(term);
      } else if (this.searchBy === 'name') {
        return patient.name?.toLowerCase().includes(term);
      } else if (this.searchBy === 'phone') {
        return patient.phone?.toLowerCase().includes(term);
      }
      return false;
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredPatients = this.patients;
  }
}
