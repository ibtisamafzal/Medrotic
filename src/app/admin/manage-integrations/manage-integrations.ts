import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Integration } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-manage-integrations',
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-integrations.html',
  styleUrl: './manage-integrations.scss',
})
export class ManageIntegrations implements OnInit {
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
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadIntegrations();
  }

  loadIntegrations() {
    this.adminService.getIntegrations().subscribe({
      next: (integrations) => {
        this.integrations = integrations;
      },
      error: (err) => {
        console.error('Error loading integrations:', err);
      }
    });
  }

  openAddModal() {
    this.newIntegration = { name: '', type: 'api', endpoint: '', status: 'inactive' };
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  addIntegration() {
    this.adminService.createIntegration(this.newIntegration).subscribe({
      next: () => {
        this.loadIntegrations();
        this.closeAddModal();
      },
      error: (err) => {
        console.error('Error adding integration:', err);
        this.alertService.error('Error adding integration. Please try again.');
      }
    });
  }

  openEditModal(integration: Integration) {
    this.selectedIntegration = { ...integration };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedIntegration = null;
  }

  updateIntegration() {
    if (!this.selectedIntegration) return;
    
    this.adminService.updateIntegration(this.selectedIntegration.id, this.selectedIntegration).subscribe({
      next: () => {
        this.loadIntegrations();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Error updating integration:', err);
        this.alertService.error('Error updating integration. Please try again.');
      }
    });
  }

  deleteIntegration(id: string) {
    if (confirm('Are you sure you want to delete this integration?')) {
      this.adminService.deleteIntegration(id).subscribe({
        next: () => {
          this.loadIntegrations();
        },
        error: (err) => {
          console.error('Error deleting integration:', err);
          this.alertService.error('Error deleting integration. Please try again.');
        }
      });
    }
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
