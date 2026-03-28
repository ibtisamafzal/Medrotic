import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, RepositoryItem } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { DashboardTableActionsComponent } from '../../common/shared/dashboard-table-actions.component';

@Component({
  selector: 'app-manage-repository',
  imports: [CommonModule, FormsModule, DashboardTableActionsComponent],
  templateUrl: './manage-repository.html',
  styleUrl: './manage-repository.scss',
})
export class ManageRepository implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  items: RepositoryItem[] = [];
  searchTerm = '';
  typeFilter: 'all' | 'document' | 'image' | 'data' = 'all';

  constructor(
    private adminService: AdminService,
    private alertService: AlertService,
    private confirmDialog: ConfirmDialogService
  ) {}

  private syncView(): void {
    this.cdr.markForCheck();
  }

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.adminService.getRepositoryItems().subscribe({
      next: (items) => {
        this.items = items;
        this.applyFilters();
        this.syncView();
      },
      error: (err) => {
        console.error('Error loading repository items:', err);
        this.syncView();
      }
    });
  }

  applyFilters() {
    // Filtering would be done here if needed
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.adminService.uploadRepositoryItem(file).subscribe({
        next: () => {
          this.loadItems();
          this.syncView();
        },
        error: (err) => {
          console.error('Error uploading file:', err);
          this.alertService.error('Error uploading file. Please try again.');
          this.syncView();
        }
      });
    }
  }

  async deleteItem(id: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'Delete repository item',
      message: 'Are you sure you want to delete this item? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    const ix = this.items.findIndex((it) => it.id === id);
    const removed = ix >= 0 ? this.items[ix] : null;
    if (removed) {
      this.items.splice(ix, 1);
      this.syncView();
    }
    this.adminService.deleteRepositoryItem(id).subscribe({
      next: () => {
        this.syncView();
      },
      error: (err) => {
        if (removed) {
          this.items.splice(ix, 0, removed);
        }
        console.error('Error deleting item:', err);
        this.alertService.error('Error deleting item. Please try again.');
        this.syncView();
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'document':
        return '📄';
      case 'image':
        return '🖼️';
      case 'data':
        return '💾';
      default:
        return '📁';
    }
  }
}
