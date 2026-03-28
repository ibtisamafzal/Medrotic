import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardTableActionsComponent } from '../../common/shared/dashboard-table-actions.component';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';
import { DoctorService, Patient } from '../../services/doctor.service';

@Component({
  selector: 'app-patient-management',
  imports: [CommonModule, FormsModule, RouterModule, DashboardTableActionsComponent, PakInputFormatDirective],
  templateUrl: './patient-management.html',
  styleUrl: './patient-management.scss',
})
export class PatientManagement implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  loading = false;
  searchTerm = '';
  searchBy = 'cnic'; // 'cnic' | 'name' | 'phone'

  constructor(
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef
  ) {}

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
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.patients = [];
        this.filteredPatients = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = this.patients;
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    const cnicQueryDigits = this.searchTerm.replace(/\D/g, '');
    this.filteredPatients = this.patients.filter(patient => {
      if (this.searchBy === 'cnic') {
        const pc = (patient.cnic ?? '').replace(/\D/g, '');
        return (
          patient.cnic?.toLowerCase().includes(term) ||
          (!!cnicQueryDigits && pc.includes(cnicQueryDigits))
        );
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

  trackPatientId(_index: number, p: Patient): string {
    return String(p.id);
  }
}
