import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { AlertService } from '../../services/alert.service';

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

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

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
      this.alertService.warning('Please select a file first.');
      return;
    }

    this.uploading = true;
    this.patientService.uploadDocument(this.selectedFile, this.documentType).subscribe({
      next: (result) => {
        this.uploading = false;
        this.alertService.success('Document uploaded successfully.');
        this.selectedFile = null;
        this.documentType = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error uploading document:', err);
        this.alertService.error('Error uploading document. Please try again.');
        this.uploading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
