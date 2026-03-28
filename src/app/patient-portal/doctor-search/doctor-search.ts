import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, Doctor } from '../../services/patient.service';
import { DashboardTableActionsComponent } from '../../common/shared/dashboard-table-actions.component';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-doctor-search',
  imports: [CommonModule, FormsModule, DashboardTableActionsComponent],
  templateUrl: './doctor-search.html',
  styleUrl: './doctor-search.scss',
})
export class DoctorSearch implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

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

  constructor(
    private patientService: PatientService,
    private alertService: AlertService
  ) {}

  private syncView(): void {
    this.cdr.markForCheck();
  }

  ngOnInit() {
    this.searchDoctors();
  }

  searchDoctors() {
    this.loading = true;
    this.syncView();
    this.patientService.searchDoctors(this.filters).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loading = false;
        this.syncView();
      },
      error: (err) => {
        console.error('Error searching doctors:', err);
        this.doctors = [];
        this.loading = false;
        this.alertService.error('Could not load doctors. Check your connection and try again.');
        this.syncView();
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

  viewDoctorProfile(doctor: Doctor) {
    const q = (doctor.qualifications ?? []).join(', ');
    this.alertService.info(
      `${doctor.name} — ${doctor.specialty}${doctor.hospital ? `. ${doctor.hospital}` : ''}${q ? `. ${q}` : ''}`
    );
  }

  bookAppointment(doctor: Doctor) {
    this.alertService.info(
      `Booking with ${doctor.name} is not available online yet. Please call the hospital or use Secure Communication when enabled.`
    );
  }
}
