import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, Doctor } from '../../services/patient.service';
import { DashboardTableActionsComponent } from '../../common/shared/dashboard-table-actions.component';
import { AlertService } from '../../services/alert.service';
import { PAKISTAN_CITIES } from '../../common/data/pakistan-cities';

@Component({
  selector: 'app-doctor-search',
  imports: [CommonModule, FormsModule, DashboardTableActionsComponent],
  templateUrl: './doctor-search.html',
  styleUrl: './doctor-search.scss',
})
export class DoctorSearch implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  allDoctors: Doctor[] = [];
  filters = {
    city: '',
    specialty: '',
    disease: '',
    experience: undefined as number | undefined
  };

  doctors: Doctor[] = [];
  specialties: string[] = [];
  cities = PAKISTAN_CITIES;

  constructor(
    private patientService: PatientService,
    private alertService: AlertService
  ) {}

  private syncView(): void {
    this.cdr.markForCheck();
  }

  ngOnInit() {
    this.loadDoctors();
  }

  private hasActiveFilters(): boolean {
    return !!(
      this.filters.city.trim() ||
      this.filters.specialty.trim() ||
      this.filters.disease.trim() ||
      this.filters.experience !== undefined
    );
  }

  private updateSpecialties(doctors: Doctor[]): void {
    const specialties = doctors
      .map((doctor) => (doctor.specialty ?? '').trim())
      .filter((specialty) => specialty.length > 0);
    this.specialties = [...new Set(specialties)].sort((a, b) => a.localeCompare(b));
  }

  loadDoctors() {
    this.loading = true;
    this.syncView();
    this.patientService.searchDoctors().subscribe({
      next: (doctors) => {
        this.allDoctors = doctors;
        this.doctors = [...doctors];
        this.updateSpecialties(doctors);
        this.loading = false;
        this.syncView();
      },
      error: (err) => {
        console.error('Error loading doctors:', err);
        this.allDoctors = [];
        this.doctors = [];
        this.specialties = [];
        this.loading = false;
        this.alertService.error('Could not load doctors. Check your connection and try again.');
        this.syncView();
      }
    });
  }

  searchDoctors() {
    if (!this.hasActiveFilters() && this.allDoctors.length > 0) {
      this.doctors = [...this.allDoctors];
      this.syncView();
      return;
    }

    this.loading = true;
    this.syncView();
    this.patientService.searchDoctors(this.filters).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        if (!this.hasActiveFilters()) {
          this.allDoctors = [...doctors];
          this.updateSpecialties(doctors);
        }
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
    if (this.allDoctors.length > 0) {
      this.doctors = [...this.allDoctors];
      this.syncView();
      return;
    }
    this.loadDoctors();
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
