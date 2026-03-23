import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService, Patient } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';

@Component({
  selector: 'app-manage-patients',
  imports: [CommonModule, FormsModule, RouterModule, PakInputFormatDirective],
  templateUrl: './manage-patients.html',
  styleUrl: './manage-patients.scss',
})
export class ManagePatients implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  selectedPatient: Patient | null = null;
  showEditModal = false;
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  constructor(
    private adminService: AdminService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    this.adminService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
      }
    });
  }

  applyFilters() {
    this.filteredPatients = this.patients.filter(patient => {
      const matchesSearch = !this.searchTerm || 
        patient.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || patient.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  openEditModal(patient: Patient) {
    this.selectedPatient = { ...patient };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedPatient = null;
  }

  updatePatient() {
    if (!this.selectedPatient) return;
    
    this.adminService.updatePatient(this.selectedPatient.id, this.selectedPatient).subscribe({
      next: () => {
        this.loadPatients();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Error updating patient:', err);
        this.alertService.error('Error updating patient. Please try again.');
      }
    });
  }

  deletePatient(id: string) {
    if (confirm('Are you sure you want to delete this patient?')) {
      this.adminService.deletePatient(id).subscribe({
        next: () => {
          this.loadPatients();
        },
        error: (err) => {
          console.error('Error deleting patient:', err);
          this.alertService.error('Error deleting patient. Please try again.');
        }
      });
    }
  }

  viewPatientProfile(id: string) {
    // Navigate to patient details if needed
    console.log('View patient profile:', id);
  }
}
