import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Doctor } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';

@Component({
  selector: 'app-manage-doctors',
  imports: [CommonModule, FormsModule, PakInputFormatDirective],
  templateUrl: './manage-doctors.html',
  styleUrl: './manage-doctors.scss',
})
export class ManageDoctors implements OnInit {
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  selectedDoctor: Doctor | null = null;
  showAddModal = false;
  showEditModal = false;
  showVerifyModal = false;
  verifying = false;
  saving = false;
  searchTerm = '';
  statusFilter: 'all' | 'pending' | 'verified' | 'rejected' = 'all';

  newDoctor = {
    name: '',
    email: '',
    license: '',
    specialization: '',
    phone: ''
  };

  constructor(
    private adminService: AdminService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.adminService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading doctors:', err);
      }
    });
  }

  applyFilters() {
    this.filteredDoctors = this.doctors.filter(doctor => {
      const matchesSearch = !this.searchTerm || 
        doctor.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        doctor.license.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || doctor.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  openAddModal() {
    this.newDoctor = { name: '', email: '', license: '', specialization: '', phone: '' };
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  addDoctor() {
    this.saving = true;
    this.adminService.addDoctor(this.newDoctor).subscribe({
      next: () => {
        this.closeAddModal();
        this.saving = false;
        this.loadDoctors();
        this.alertService.success('Doctor added successfully!');
      },
      error: (err) => {
        this.saving = false;
        console.error('Error adding doctor:', err);
        this.alertService.error('Error adding doctor. Please try again.');
      }
    });
  }

  openEditModal(doctor: Doctor) {
    this.selectedDoctor = { ...doctor };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedDoctor = null;
  }

  updateDoctor() {
    if (!this.selectedDoctor) return;
    this.saving = true;
    this.adminService.updateDoctor(this.selectedDoctor.id, this.selectedDoctor).subscribe({
      next: () => {
        this.closeEditModal();
        this.saving = false;
        this.loadDoctors();
        this.alertService.success('Doctor updated successfully!');
      },
      error: (err) => {
        this.saving = false;
        console.error('Error updating doctor:', err);
        this.alertService.error('Error updating doctor. Please try again.');
      }
    });
  }

  openVerifyModal(doctor: Doctor) {
    this.selectedDoctor = { ...doctor };
    this.showVerifyModal = true;
  }

  closeVerifyModal() {
    this.showVerifyModal = false;
    this.selectedDoctor = null;
  }

  verifyDoctor(verified: boolean) {
    if (!this.selectedDoctor) return;
    
    this.verifying = true;
    this.adminService.verifyDoctor(this.selectedDoctor.id, verified).subscribe({
      next: () => {
        this.loadDoctors();
        this.verifying = false;
        this.closeVerifyModal();
        this.alertService.success(verified ? 'Doctor verified successfully!' : 'Doctor rejected.');
      },
      error: (err) => {
        console.error('Error verifying doctor:', err);
        this.verifying = false;
        this.alertService.error('Error verifying doctor. Please try again.');
      }
    });
  }

  deleteDoctor(id: string) {
    if (confirm('Are you sure you want to delete this doctor?')) {
      this.adminService.deleteDoctor(id).subscribe({
        next: () => {
          this.loadDoctors();
          this.alertService.success('Doctor deleted successfully.');
        },
        error: (err) => {
          console.error('Error deleting doctor:', err);
          this.alertService.error('Error deleting doctor. Please try again.');
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'verified':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning';
      case 'rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
