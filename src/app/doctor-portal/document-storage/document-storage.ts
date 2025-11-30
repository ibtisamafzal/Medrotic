import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DoctorService, Document, Patient } from '../../services/doctor.service';

@Component({
  selector: 'app-document-storage',
  imports: [CommonModule, FormsModule, RouterModule],
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

  constructor(private doctorService: DoctorService) {}

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
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        // Mock data for development
        this.documents = [];
        this.loading = false;
      }
    });
  }

  loadPatients() {
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        // Mock data for development
        this.patients = [
          { id: '1', name: 'John Doe', cnic: '12345-1234567-1', phone: '+923001234567', email: 'john@example.com', status: 'active' },
          { id: '2', name: 'Jane Smith', cnic: '12345-1234567-2', phone: '+923001234568', email: 'jane@example.com', status: 'active' },
          { id: '3', name: 'Mike Johnson', cnic: '12345-1234567-3', phone: '+923001234569', email: 'mike@example.com', status: 'active' }
        ];
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
      },
      error: (err) => {
        console.error('Error uploading document:', err);
        this.uploading = false;
      }
    });
  }

  deleteDocument(id: string) {
    if (confirm('Are you sure you want to delete this document?')) {
      this.doctorService.deleteDocument(id).subscribe({
        next: () => {
          this.documents = this.documents.filter(d => d.id !== id);
        },
        error: (err) => {
          console.error('Error deleting document:', err);
        }
      });
    }
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
}
