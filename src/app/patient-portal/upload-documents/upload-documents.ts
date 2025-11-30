import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-upload-documents',
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-documents.html',
  styleUrl: './upload-documents.scss',
})
export class UploadDocuments implements OnInit {
  uploading = false;
  selectedFile: File | null = null;
  documentType = '';
  uploadedDocuments: any[] = [];

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    // Load uploaded documents if needed
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadDocument() {
    if (!this.selectedFile) {
      alert('Please select a file first');
      return;
    }

    this.uploading = true;
    this.patientService.uploadDocument(this.selectedFile, this.documentType).subscribe({
      next: (result) => {
        this.uploading = false;
        alert('Document uploaded successfully');
        this.selectedFile = null;
        this.documentType = '';
      },
      error: (err) => {
        console.error('Error uploading document:', err);
        alert('Error uploading document. Please try again.');
        this.uploading = false;
      }
    });
  }
}
