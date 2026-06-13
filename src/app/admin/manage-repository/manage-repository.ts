import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, RepositoryItem } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { DashboardTableActionsComponent } from '../../common/shared/dashboard-table-actions.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-manage-repository',
  imports: [CommonModule, FormsModule, DashboardTableActionsComponent],
  templateUrl: './manage-repository.html',
  styleUrl: './manage-repository.scss',
})
export class ManageRepository implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  items: RepositoryItem[] = [];
  filteredItems: RepositoryItem[] = [];
  searchTerm = '';
  typeFilter: 'all' | 'document' | 'image' | 'data' = 'all';
  selectedItem: RepositoryItem | null = null;
  showViewModal = false;
  showRenameModal = false;
  renameSaving = false;
  renameForm = { name: '' };

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
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredItems = this.items.filter((item) => {
      const matchesSearch = !term ||
        item.name.toLowerCase().includes(term) ||
        (item.uploadedBy ?? '').toLowerCase().includes(term) ||
        (item.filePath ?? '').toLowerCase().includes(term);
      const matchesType = this.typeFilter === 'all' || item.type === this.typeFilter;
      return matchesSearch && matchesType;
    });
  }

  openViewModal(item: RepositoryItem) {
    this.selectedItem = { ...item };
    this.showViewModal = true;
    this.syncView();
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedItem = null;
    this.syncView();
  }

  openRenameModal(item: RepositoryItem) {
    this.selectedItem = { ...item };
    this.renameForm = { name: item.name };
    this.showRenameModal = true;
    this.syncView();
  }

  closeRenameModal() {
    this.showRenameModal = false;
    this.selectedItem = null;
    this.renameForm = { name: '' };
    this.syncView();
  }

  saveRename() {
    if (!this.selectedItem) return;
    const name = (this.renameForm.name ?? '').trim();
    if (!name) {
      this.alertService.error('Document name is required.');
      return;
    }

    this.renameSaving = true;
    this.syncView();
    this.adminService.updateRepositoryItem(this.selectedItem.id, { name }).subscribe({
      next: (updated) => {
        this.items = this.items.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
        this.applyFilters();
        this.renameSaving = false;
        this.closeRenameModal();
        this.alertService.success('Document renamed successfully.');
        this.syncView();
      },
      error: (err) => {
        this.renameSaving = false;
        console.error('Error renaming repository item:', err);
        const msg = err?.error?.message ?? err?.error?.Message ?? 'Error renaming document. Please try again.';
        this.alertService.error(typeof msg === 'string' ? msg : 'Error renaming document. Please try again.');
        this.syncView();
      }
    });
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

  getPreviewUrl(item: RepositoryItem): string {
    return item.filePath ? `${environment.apiUrl}${item.filePath}` : '';
  }

  isImage(item: RepositoryItem): boolean {
    const url = this.getPreviewUrl(item).toLowerCase();
    return item.type === 'image' || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(url);
  }

  isPdf(item: RepositoryItem): boolean {
    return /\.pdf(\?|#|$)/i.test(this.getPreviewUrl(item));
  }
}
