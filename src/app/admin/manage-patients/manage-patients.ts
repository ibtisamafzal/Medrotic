import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Patient } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { VerificationSyncService } from '../../services/verification-sync.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { Subscription } from 'rxjs';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';
import { DashboardTableActionsComponent } from '../../common/shared/dashboard-table-actions.component';

@Component({
  selector: 'app-manage-patients',
  imports: [CommonModule, FormsModule, PakInputFormatDirective, DashboardTableActionsComponent],
  templateUrl: './manage-patients.html',
  styleUrl: './manage-patients.scss',
})
export class ManagePatients implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private verificationSub?: Subscription;

  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  selectedPatient: Patient | null = null;
  profilePatient: Patient | null = null;

  showEditModal = false;
  showProfileModal = false;
  showApproveModal = false;
  patientToApprove: Patient | null = null;
  approveSubmitting = false;
  editSaving = false;

  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  constructor(
    private adminService: AdminService,
    private alertService: AlertService,
    private verificationSync: VerificationSyncService,
    private confirmDialog: ConfirmDialogService
  ) {}

  private syncView(): void {
    this.cdr.markForCheck();
  }

  ngOnInit() {
    this.loadPatients();
    this.verificationSub = this.verificationSync.changed$.subscribe(() => this.loadPatients());
  }

  ngOnDestroy(): void {
    this.verificationSub?.unsubscribe();
  }

  loadPatients() {
    this.adminService.getPatients().subscribe({
      next: (patients) => {
        this.patients = (patients ?? []).map((raw: any) => this.normalizePatient(raw));
        this.applyFilters();
        this.syncView();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.syncView();
      }
    });
  }

  private normalizePatient(raw: any): Patient {
    const vRaw = (raw?.verificationStatus ?? raw?.VerificationStatus ?? 'verified') as string;
    const v = String(vRaw).toLowerCase() as NonNullable<Patient['verificationStatus']>;
    const verificationStatus: Patient['verificationStatus'] =
      v === 'pending' || v === 'rejected' || v === 'verified' ? v : 'verified';
    const statusRaw = (raw?.status ?? raw?.Status ?? 'active') as string;
    return {
      id: String(raw?.id ?? raw?.Id ?? ''),
      name: String(raw?.name ?? raw?.Name ?? ''),
      email: String(raw?.email ?? raw?.Email ?? ''),
      phone: raw?.phone ?? raw?.phoneNumber ?? raw?.PhoneNumber ?? undefined,
      dateOfBirth: raw?.dateOfBirth ?? raw?.DateOfBirth ?? undefined,
      status: statusRaw === 'inactive' ? 'inactive' : 'active',
      verificationStatus,
      createdAt: raw?.createdAt ?? raw?.CreatedAt,
      updatedAt: raw?.updatedAt ?? raw?.UpdatedAt,
    };
  }

  patientStatusLabel(p: Patient): string {
    const v = p.verificationStatus ?? 'verified';
    if (v === 'pending') return 'Pending verification';
    if (v === 'rejected') return 'Rejected';
    return p.status === 'active' ? 'Active' : 'Inactive';
  }

  patientStatusBadgeClass(p: Patient): string {
    const v = p.verificationStatus ?? 'verified';
    if (v === 'pending') return 'badge bg-warning text-dark';
    if (v === 'rejected') return 'badge bg-danger';
    return p.status === 'active' ? 'badge bg-success' : 'badge bg-secondary';
  }

  private patchPatientInLists(id: string, patch: Partial<Patient>) {
    const i = this.patients.findIndex((p) => p.id === id);
    if (i >= 0) this.patients[i] = { ...this.patients[i], ...patch };
    if (this.selectedPatient?.id === id) {
      this.selectedPatient = { ...this.selectedPatient, ...patch };
    }
    if (this.profilePatient?.id === id) {
      this.profilePatient = { ...this.profilePatient, ...patch };
    }
    this.applyFilters();
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

  viewPatientProfile(patient: Patient) {
    this.profilePatient = { ...patient };
    this.showProfileModal = true;
    this.syncView();
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.profilePatient = null;
    this.syncView();
  }

  openEditModal(patient: Patient) {
    this.selectedPatient = { ...patient };
    this.showEditModal = true;
    this.syncView();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedPatient = null;
    this.syncView();
  }

  updatePatient() {
    if (!this.selectedPatient) return;
    const id = this.selectedPatient.id;
    const snapshot = { ...this.selectedPatient };
    this.editSaving = true;
    this.syncView();
    this.adminService.updatePatient(id, snapshot).subscribe({
      next: () => {
        this.patchPatientInLists(id, snapshot);
        this.editSaving = false;
        this.closeEditModal();
        this.alertService.success('Patient updated successfully!');
        this.syncView();
      },
      error: (err) => {
        this.editSaving = false;
        console.error('Error updating patient:', err);
        this.alertService.error('Error updating patient. Please try again.');
        this.syncView();
      }
    });
  }

  async deletePatient(id: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'Delete patient',
      message: 'Are you sure you want to delete this patient? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    const ix = this.patients.findIndex((p) => p.id === id);
    const removed = ix >= 0 ? this.patients[ix] : null;
    if (removed) {
      this.patients.splice(ix, 1);
      this.applyFilters();
      this.syncView();
    }
    this.adminService.deletePatient(id).subscribe({
      next: () => {
        this.alertService.success('Patient deleted successfully.');
        this.syncView();
      },
      error: (err) => {
        if (removed) {
          this.patients.splice(ix, 0, removed);
          this.applyFilters();
        }
        console.error('Error deleting patient:', err);
        this.alertService.error('Error deleting patient. Please try again.');
        this.syncView();
      }
    });
  }
}
