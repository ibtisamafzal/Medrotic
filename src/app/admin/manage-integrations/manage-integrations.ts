import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Integration } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { DashboardTableActionsComponent } from '../../common/shared/dashboard-table-actions.component';

@Component({
  selector: 'app-manage-integrations',
  imports: [CommonModule, FormsModule, DashboardTableActionsComponent],
  templateUrl: './manage-integrations.html',
  styleUrl: './manage-integrations.scss',
})
export class ManageIntegrations implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  integrations: Integration[] = [];
  showAddModal = false;
  selectedIntegration: Integration | null = null;
  showEditModal = false;

  newIntegration = {
    name: '',
    type: 'api' as 'ehr' | 'api' | 'external',
    endpoint: '',
    status: 'inactive' as 'active' | 'inactive' | 'error'
  };

  constructor(
    private adminService: AdminService,
    private alertService: AlertService,
    private confirmDialog: ConfirmDialogService
  ) {}

  private syncView(): void {
    this.cdr.markForCheck();
  }

  ngOnInit() {
    this.loadIntegrations();
  }

  loadIntegrations() {
    this.adminService.getIntegrations().subscribe({
      next: (integrations) => {
        this.integrations = integrations;
        this.syncView();
      },
      error: (err) => {
        console.error('Error loading integrations:', err);
        this.syncView();
      }
    });
  }

  openAddModal() {
    this.newIntegration = { name: '', type: 'api', endpoint: '', status: 'inactive' };
    this.showAddModal = true;
    this.syncView();
  }

  closeAddModal() {
    this.showAddModal = false;
    this.syncView();
  }

  addIntegration() {
    this.adminService.createIntegration(this.newIntegration).subscribe({
      next: () => {
        this.loadIntegrations();
        this.closeAddModal();
        this.syncView();
      },
      error: (err) => {
        console.error('Error adding integration:', err);
        this.alertService.error('Error adding integration. Please try again.');
        this.syncView();
      }
    });
  }

  openEditModal(integration: Integration) {
    this.selectedIntegration = { ...integration };
    this.showEditModal = true;
    this.syncView();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedIntegration = null;
    this.syncView();
  }

  updateIntegration() {
    if (!this.selectedIntegration) return;

    this.adminService.updateIntegration(this.selectedIntegration.id, this.selectedIntegration).subscribe({
      next: () => {
        this.loadIntegrations();
        this.closeEditModal();
        this.syncView();
      },
      error: (err) => {
        console.error('Error updating integration:', err);
        this.alertService.error('Error updating integration. Please try again.');
        this.syncView();
      }
    });
  }

  async deleteIntegration(id: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'Delete integration',
      message: 'Are you sure you want to delete this integration?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    const ix = this.integrations.findIndex((i) => i.id === id);
    const removed = ix >= 0 ? this.integrations[ix] : null;
    if (removed) {
      this.integrations.splice(ix, 1);
      this.syncView();
    }
    this.adminService.deleteIntegration(id).subscribe({
      next: () => {
        this.syncView();
      },
      error: (err) => {
        if (removed) {
          this.integrations.splice(ix, 0, removed);
        }
        console.error('Error deleting integration:', err);
        this.alertService.error('Error deleting integration. Please try again.');
        this.syncView();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'badge bg-success';
      case 'inactive':
        return 'badge bg-secondary';
      case 'error':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
