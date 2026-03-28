import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DoctorService, Document, Patient } from '../../services/doctor.service';
import { DashboardTableActionsComponent } from '../../common/shared/dashboard-table-actions.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-document-storage',
  imports: [CommonModule, FormsModule, RouterModule, DashboardTableActionsComponent],
  templateUrl: './document-storage.html',
  styleUrl: './document-storage.scss',
})
export class DocumentStorage implements OnInit {
  documents: Document[] = [];
  patients: Patient[] = [];
  selectedPatient: string = '';
  loading = false;
  uploading = false;
  selectedFile: File | null = null;
  newDocument: Partial<Document> = {
    patientId: '',
    name: '',
    type: 'other'
  };

  constructor(
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef,
    private confirmDialog: ConfirmDialogService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadDocuments();
    this.loadPatients();
  }

  loadDocuments() {
    this.loading = true;
    const patientId = this.selectedPatient || undefined;
    this.doctorService.getDocuments(patientId).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        // Mock data for development
        this.documents = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadPatients() {
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.patients = [];
        this.alertService.error('Could not load patients. Check your connection and try again.');
        this.cdr.markForCheck();
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.newDocument.name = this.selectedFile.name;
    }
  }

  onPatientFilterChange() {
    this.loadDocuments();
  }

  uploadDocument() {
    if (!this.selectedFile || !this.newDocument.patientId) return;

    this.uploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('patientId', this.newDocument.patientId);
    formData.append('name', this.newDocument.name || this.selectedFile.name);
    formData.append('type', this.newDocument.type || 'other');

    this.doctorService.uploadDocument(formData).subscribe({
      next: (document) => {
        this.documents.push(document);
        this.selectedFile = null;
        this.newDocument = { patientId: '', name: '', type: 'other' };
        this.uploading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error uploading document:', err);
        this.uploading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async deleteDocument(id: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'Delete document',
      message: 'Are you sure you want to delete this document? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    const ix = this.documents.findIndex((d) => d.id === id);
    const removed = ix >= 0 ? this.documents[ix] : null;
    if (removed) {
      this.documents.splice(ix, 1);
      this.cdr.markForCheck();
    }
    this.doctorService.deleteDocument(id).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (removed) {
          this.documents.splice(ix, 0, removed);
        }
        console.error('Error deleting document:', err);
        this.cdr.markForCheck();
      }
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
}
