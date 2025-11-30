import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DoctorService, Prescription, Patient } from '../../services/doctor.service';

@Component({
  selector: 'app-upload-prescription',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './upload-prescription.html',
  styleUrl: './upload-prescription.scss',
})
export class UploadPrescription implements OnInit {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  patientId: string = '';
  patients: Patient[] = [];
  prescription: Partial<Prescription> = {
    patientId: '',
    notes: '',
    medications: []
  };
  loading = false;
  uploading = false;
  ocrText = '';
  aiAnalysis = '';
  showAiAnalysis = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.patientId = params['patientId'] || '';
      this.prescription.patientId = this.patientId;
    });
    this.loadPatients();
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
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  processOCR() {
    if (!this.selectedFile) return;
    
    this.loading = true;
    // Simulate OCR processing
    setTimeout(() => {
      this.ocrText = 'Sample OCR text extracted from prescription image...';
      this.loading = false;
    }, 2000);
  }

  processAI() {
    if (!this.selectedFile) return;
    
    this.loading = true;
    // Simulate AI analysis
    setTimeout(() => {
      this.aiAnalysis = 'AI Analysis: Detected medications include Paracetamol 500mg, Amoxicillin 250mg. Recommended dosage: 3 times daily for 7 days.';
      this.showAiAnalysis = true;
      this.loading = false;
    }, 2000);
  }

  addMedication() {
    if (!this.prescription.medications) {
      this.prescription.medications = [];
    }
    this.prescription.medications.push({
      name: '',
      dosage: '',
      frequency: '',
      duration: ''
    });
  }

  removeMedication(index: number) {
    if (this.prescription.medications) {
      this.prescription.medications.splice(index, 1);
    }
  }

  onSubmit() {
    if (!this.selectedFile || !this.prescription.patientId) {
      return;
    }

    this.uploading = true;
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('patientId', this.prescription.patientId);
    if (this.prescription.notes) {
      formData.append('notes', this.prescription.notes);
    }
    if (this.ocrText) {
      formData.append('ocrText', this.ocrText);
    }
    if (this.aiAnalysis) {
      formData.append('aiAnalysis', this.aiAnalysis);
    }
    if (this.prescription.medications) {
      formData.append('medications', JSON.stringify(this.prescription.medications));
    }

    this.doctorService.uploadPrescription(formData).subscribe({
      next: (prescription) => {
        this.uploading = false;
        this.router.navigate(['/doctor-portal/patient-details', this.prescription.patientId]);
      },
      error: (err) => {
        console.error('Error uploading prescription:', err);
        this.uploading = false;
      }
    });
  }
}
