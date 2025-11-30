import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, RepositoryItem } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-manage-repository',
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-repository.html',
  styleUrl: './manage-repository.scss',
})
export class ManageRepository implements OnInit {
  items: RepositoryItem[] = [];
  searchTerm = '';
  typeFilter: 'all' | 'document' | 'image' | 'data' = 'all';

  constructor(
    private adminService: AdminService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.adminService.getRepositoryItems().subscribe({
      next: (items) => {
        this.items = items;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading repository items:', err);
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
        },
        error: (err) => {
          console.error('Error uploading file:', err);
          this.alertService.error('Error uploading file. Please try again.');
        }
      });
    }
  }

  deleteItem(id: string) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.adminService.deleteRepositoryItem(id).subscribe({
        next: () => {
          this.loadItems();
        },
        error: (err) => {
          console.error('Error deleting item:', err);
          this.alertService.error('Error deleting item. Please try again.');
        }
      });
    }
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
