import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, Doctor } from '../../services/patient.service';

@Component({
  selector: 'app-doctor-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-search.html',
  styleUrl: './doctor-search.scss',
})
export class DoctorSearch implements OnInit {
  loading = false;
  filters = {
    city: '',
    specialty: '',
    disease: '',
    experience: undefined as number | undefined
  };

  doctors: Doctor[] = [];
  specialties = ['Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'];
  cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.searchDoctors();
  }

  searchDoctors() {
    this.loading = true;
    this.patientService.searchDoctors(this.filters).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error searching doctors:', err);
        // Mock data for development
        this.doctors = [
          {
            id: '1',
            name: 'Dr. Ahmed Khan',
            specialty: 'Cardiology',
            city: 'Karachi',
            experience: 15,
            qualifications: ['MBBS', 'FCPS'],
            hospital: 'Aga Khan Hospital',
            rating: 4.8
          },
          {
            id: '2',
            name: 'Dr. Fatima Ali',
            specialty: 'Dermatology',
            city: 'Lahore',
            experience: 10,
            qualifications: ['MBBS', 'MCPS'],
            hospital: 'Shaukat Khanum Hospital',
            rating: 4.9
          }
        ];
        this.loading = false;
      }
    });
  }

  clearFilters() {
    this.filters = {
      city: '',
      specialty: '',
      disease: '',
      experience: undefined
    };
    this.searchDoctors();
  }
}
