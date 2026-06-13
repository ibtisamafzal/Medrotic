import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Doctor } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { VerificationSyncService } from '../../services/verification-sync.service';
import { Subscription } from 'rxjs';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';
import { DashboardTableActionsComponent } from '../../common/shared/dashboard-table-actions.component';

@Component({
  selector: 'app-manage-doctors',
  imports: [CommonModule, FormsModule, PakInputFormatDirective, DashboardTableActionsComponent],
  templateUrl: './manage-doctors.html',
  styleUrl: './manage-doctors.scss',
})
export class ManageDoctors implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private verificationSub?: Subscription;

  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  profileDoctor: Doctor | null = null;
  selectedDoctor: Doctor | null = null;
  showAddModal = false;
  showProfileModal = false;
  showEditModal = false;

  addSaving = false;
  editSaving = false;

  searchTerm = '';

  newDoctor = {
    name: '',
    email: '',
    cnic: '',
    specialization: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    province: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    experienceYears: 0,
  };

  constructor(
    private adminService: AdminService,
    private alertService: AlertService,
    private verificationSync: VerificationSyncService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit() {
    this.loadDoctors();
    this.verificationSub = this.verificationSync.changed$.subscribe(() => this.loadDoctors());
  }

  ngOnDestroy(): void {
    this.verificationSub?.unsubscribe();
  }

  private syncView(): void {
    this.cdr.markForCheck();
  }

  loadDoctors() {
    this.adminService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.applyFilters();
        this.syncView();
      },
      error: (err) => {
        console.error('Error loading doctors:', err);
        this.syncView();
      }
    });
  }

  private patchDoctorInLists(id: string, patch: Partial<Doctor>) {
    const apply = (list: Doctor[]) => {
      const i = list.findIndex((d) => d.id === id);
      if (i >= 0) list[i] = { ...list[i], ...patch };
    };
    apply(this.doctors);
    if (this.selectedDoctor?.id === id) {
      this.selectedDoctor = { ...this.selectedDoctor, ...patch };
    }
    this.applyFilters();
  }

  openProfileModal(doctor: Doctor) {
    this.profileDoctor = { ...doctor };
    this.showProfileModal = true;
    this.syncView();
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.profileDoctor = null;
    this.syncView();
  }

  applyFilters() {
    this.filteredDoctors = this.doctors.filter(doctor => {
      const q = this.searchTerm.toLowerCase();
      const cnicDigits = (doctor.cnic ?? '').replace(/\D/g, '');
      const searchCnicDigits = this.searchTerm.replace(/\D/g, '');
      const matchesSearch = !this.searchTerm ||
        doctor.name.toLowerCase().includes(q) ||
        doctor.email.toLowerCase().includes(q) ||
        doctor.cnic.toLowerCase().includes(q) ||
        (!!searchCnicDigits && cnicDigits.includes(searchCnicDigits));

      return matchesSearch;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  openAddModal() {
    this.newDoctor = {
      name: '',
      email: '',
      cnic: '',
      specialization: '',
      phone: '',
      password: '',
      confirmPassword: '',
      city: '',
      province: '',
      dateOfBirth: '',
      gender: 'Male',
      experienceYears: 0,
    };
    this.showAddModal = true;
    this.syncView();
  }

  closeAddModal() {
    this.showAddModal = false;
    this.syncView();
  }

  addDoctor() {
    const name = (this.newDoctor.name ?? '').trim();
    const email = (this.newDoctor.email ?? '').trim();
    const spec = (this.newDoctor.specialization ?? '').trim();
    const cnicDigits = (this.newDoctor.cnic ?? '').replace(/\D/g, '');
    const phoneDigits = (this.newDoctor.phone ?? '').replace(/\D/g, '');
    const city = (this.newDoctor.city ?? '').trim();
    const province = (this.newDoctor.province ?? '').trim();
    const dob = (this.newDoctor.dateOfBirth ?? '').trim();
    const pw = (this.newDoctor.password ?? '').trim();
    const pw2 = (this.newDoctor.confirmPassword ?? '').trim();

    if (name.length < 3) {
      this.alertService.error('Name must be at least 3 characters.');
      return;
    }
    if (!email) {
      this.alertService.error('Email is required.');
      return;
    }
    if (!spec) {
      this.alertService.error('Specialization is required.');
      return;
    }
    if (cnicDigits.length !== 13) {
      this.alertService.error('CNIC must be exactly 13 digits.');
      return;
    }
    if (phoneDigits.length < 10) {
      this.alertService.error('Phone is required (at least 10 digits).');
      return;
    }
    if (city.length < 2 || province.length < 2) {
      this.alertService.error('City and province are required.');
      return;
    }
    if (!dob) {
      this.alertService.error('Date of birth is required.');
      return;
    }
    if (this.newDoctor.experienceYears == null || this.newDoctor.experienceYears < 0 || this.newDoctor.experienceYears > 50) {
      this.alertService.error('Experience years must be between 0 and 50.');
      return;
    }
    if (!pw) {
      this.alertService.error('Initial password is required for the new account.');
      return;
    }
    if (pw !== pw2) {
      this.alertService.error('Password and confirmation do not match.');
      return;
    }

    this.addSaving = true;
    this.syncView();
    this.adminService
      .addDoctor({
        name,
        email,
        cnic: this.newDoctor.cnic,
        specialization: spec,
        phone: this.newDoctor.phone,
        password: pw,
        city,
        province,
        dateOfBirth: dob,
        gender: this.newDoctor.gender,
        experienceYears: this.newDoctor.experienceYears,
      })
      .subscribe({
      next: () => {
        this.addSaving = false;
        this.closeAddModal();
        this.loadDoctors();
        this.verificationSync.notify();
        this.alertService.success('Doctor added successfully!');
        this.syncView();
      },
      error: (err) => {
        this.addSaving = false;
        console.error('Error adding doctor:', err);
        const e = err?.error;
        let msg = e?.message as string | undefined;
        if (!msg && e?.errors && typeof e.errors === 'object') {
          const parts = Object.values(e.errors).flat() as string[];
          msg = parts.filter(Boolean).join(' ');
        }
        this.alertService.error(msg || 'Error adding doctor. Please try again.');
        this.syncView();
      }
    });
  }

  openEditModal(doctor: Doctor) {
    this.selectedDoctor = { ...doctor };
    this.showEditModal = true;
    this.syncView();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedDoctor = null;
    this.syncView();
  }

  updateDoctor() {
    if (!this.selectedDoctor) return;
    const id = this.selectedDoctor.id;
    const snapshot = { ...this.selectedDoctor };
    this.editSaving = true;
    this.syncView();
    this.adminService.updateDoctor(id, snapshot).subscribe({
      next: () => {
        this.patchDoctorInLists(id, snapshot);
        this.editSaving = false;
        this.closeEditModal();
        this.alertService.success('Doctor updated successfully!');
        this.syncView();
      },
      error: (err) => {
        this.editSaving = false;
        console.error('Error updating doctor:', err);
        const e = err?.error;
        let msg = e?.message as string | undefined;
        if (!msg && e?.errors && typeof e.errors === 'object') {
          const parts = Object.values(e.errors).flat() as string[];
          msg = parts.filter(Boolean).join(' ');
        }
        this.alertService.error(msg || 'Error updating doctor. Please try again.');
        this.syncView();
      }
    });
  }

  async deleteDoctor(id: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'Delete doctor',
      message: 'Are you sure you want to delete this doctor? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    const ix = this.doctors.findIndex((d) => d.id === id);
    const removed = ix >= 0 ? this.doctors[ix] : null;
    if (removed) {
      this.doctors.splice(ix, 1);
      this.applyFilters();
      this.syncView();
    }
    this.adminService.deleteDoctor(id).subscribe({
      next: () => {
        this.alertService.success('Doctor deleted successfully.');
        this.syncView();
      },
      error: (err) => {
        if (removed) {
          this.doctors.splice(ix, 0, removed);
          this.applyFilters();
        }
        console.error('Error deleting doctor:', err);
        this.alertService.error('Error deleting doctor. Please try again.');
        this.syncView();
      }
    });
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

  getDoctorDisplayDate(value?: string): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }

  getDoctorInitial(doctor: Doctor | null): string {
    const name = doctor ? (doctor.name ?? '').trim() : '';
    return name ? name.charAt(0) : 'D';
  }

}
