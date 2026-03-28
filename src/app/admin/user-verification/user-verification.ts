import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, User } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { VerificationSyncService } from '../../services/verification-sync.service';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-user-verification',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-verification.html',
  styleUrl: './user-verification.scss',
})
export class UserVerification implements OnInit, OnDestroy {
  users: User[] = [];
  private verificationSub?: Subscription;
  pendingUsers: User[] = [];
  searchTerm = '';
  roleFilter: 'all' | 'admin' | 'doctor' | 'patient' = 'all';

  // Selection & Loading state
  selectedIds = new Set<string>();
  bulkProcessing = false;
  processingInfo: { id: string, action: 'approve' | 'reject' | 'role' } | null = null;

  // Custom Confirmation Modal state
  showConfirmModal = false;
  confirmData: { type: 'approve' | 'reject' | 'bulk-approve' | 'bulk-reject', user?: User } | null = null;

  constructor(
    private adminService: AdminService,
    private alertService: AlertService,
    private verificationSync: VerificationSyncService
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.verificationSub = this.verificationSync.changed$.subscribe(() => this.loadUsers());
  }

  ngOnDestroy(): void {
    this.verificationSub?.unsubscribe();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.selectedIds.clear();
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }

  applyFilters() {
    this.pendingUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm ||
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = this.roleFilter === 'all' || user.role === this.roleFilter;
      const isPending = user.status === 'pending';

      return matchesSearch && matchesRole && isPending;
    });
    // Remove any selectedIds that were filtered out
    const visibleIds = new Set(this.pendingUsers.map(u => u.id));
    this.selectedIds.forEach(id => { if (!visibleIds.has(id)) this.selectedIds.delete(id); });
  }

  onSearchChange() { this.applyFilters(); }
  onRoleFilterChange() { this.applyFilters(); }

  // ─── Selection ───────────────────────────────────────────
  get allSelected(): boolean {
    return this.pendingUsers.length > 0 && this.pendingUsers.every(u => this.selectedIds.has(u.id));
  }

  get someSelected(): boolean {
    return this.selectedIds.size > 0 && !this.allSelected;
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedIds.clear();
    } else {
      this.pendingUsers.forEach(u => this.selectedIds.add(u.id));
    }
  }

  toggleSelect(user: User) {
    if (this.selectedIds.has(user.id)) {
      this.selectedIds.delete(user.id);
    } else {
      this.selectedIds.add(user.id);
    }
  }

  // ─── Bulk Actions ─────────────────────────────────────────
  requestBulkApprove() {
    this.confirmData = { type: 'bulk-approve' };
    this.showConfirmModal = true;
  }

  private bulkApprove() {
    const ids = Array.from(this.selectedIds);
    if (!ids.length) return;
    this.bulkProcessing = true;
    this.showConfirmModal = false;
    forkJoin(ids.map(id => this.adminService.approveUser(id))).subscribe({
      next: () => {
        this.bulkProcessing = false;
        this.alertService.success(`${ids.length} user(s) approved successfully!`);
        this.verificationSync.notify();
      },
      error: (err) => {
        this.bulkProcessing = false;
        console.error('Error bulk approving:', err);
        this.alertService.error('Some approvals failed. Please try again.');
        this.loadUsers();
      }
    });
  }

  requestBulkReject() {
    this.confirmData = { type: 'bulk-reject' };
    this.showConfirmModal = true;
  }

  private bulkReject() {
    const ids = Array.from(this.selectedIds);
    if (!ids.length) return;
    this.bulkProcessing = true;
    this.showConfirmModal = false;
    forkJoin(ids.map(id => this.adminService.rejectUser(id))).subscribe({
      next: () => {
        this.bulkProcessing = false;
        this.alertService.success(`${ids.length} user(s) rejected.`);
        this.verificationSync.notify();
      },
      error: (err) => {
        this.bulkProcessing = false;
        console.error('Error bulk rejecting:', err);
        this.alertService.error('Some rejections failed. Please try again.');
        this.loadUsers();
      }
    });
  }

  // ─── Individual Actions ───────────────────────────────────
  requestApprove(user: User) {
    this.confirmData = { type: 'approve', user };
    this.showConfirmModal = true;
  }

  requestReject(user: User) {
    this.confirmData = { type: 'reject', user };
    this.showConfirmModal = true;
  }

  confirmAction() {
    if (!this.confirmData) return;
    const { type, user } = this.confirmData;

    if (type === 'approve' && user) this.approveUser(user);
    if (type === 'reject' && user) this.rejectUser(user);
    if (type === 'bulk-approve') this.bulkApprove();
    if (type === 'bulk-reject') this.bulkReject();
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.confirmData = null;
  }

  private approveUser(user: User) {
    this.processingInfo = { id: user.id, action: 'approve' };
    this.showConfirmModal = false; // Close modal quickly
    this.adminService.approveUser(user.id).subscribe({
      next: () => {
        this.processingInfo = null;
        this.alertService.success(`${user.name} approved successfully!`);
        this.verificationSync.notify();
      },
      error: (err) => {
        this.processingInfo = null;
        console.error('Error approving user:', err);
        this.alertService.error('Error approving user. Please try again.');
        this.loadUsers();
      }
    });
  }

  private rejectUser(user: User) {
    this.processingInfo = { id: user.id, action: 'reject' };
    this.showConfirmModal = false;
    this.adminService.rejectUser(user.id).subscribe({
      next: () => {
        this.processingInfo = null;
        this.alertService.success(`${user.name} has been rejected.`);
        this.verificationSync.notify();
      },
      error: (err) => {
        this.processingInfo = null;
        console.error('Error rejecting user:', err);
        this.alertService.error('Error rejecting user. Please try again.');
        this.loadUsers();
      }
    });
  }

  updateUserRole(user: User, role: string) {
    this.adminService.updateUserRole(user.id, role).subscribe({
      next: () => {
        this.alertService.success(`Role updated to ${role} for ${user.name}.`);
        this.verificationSync.notify();
      },
      error: (err) => {
        console.error('Error updating user role:', err);
        this.alertService.error('Error updating user role. Please try again.');
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':   return 'badge bg-danger';
      case 'doctor':  return 'badge bg-primary';
      case 'patient': return 'badge bg-success';
      default:        return 'badge bg-secondary';
    }
  }
}
