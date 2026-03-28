import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DoctorService, Xray, Patient } from '../../services/doctor.service';

@Component({
  selector: 'app-upload-xray',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './upload-xray.html',
  styleUrl: './upload-xray.scss',
})
export class UploadXray implements OnInit {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  patientId: string = '';
  patients: Patient[] = [];
  xray: Partial<Xray> = {
    patientId: '',
    findings: '',
    recommendations: ''
  };
  loading = false;
  uploading = false;
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
      this.xray.patientId = this.patientId;
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
        this.patients = [];
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

  processAI() {
    if (!this.selectedFile) return;
    
    this.loading = true;
    // Simulate AI analysis
    setTimeout(() => {
      this.aiAnalysis = 'AI Analysis: No acute abnormalities detected. Lungs appear clear. Heart size is within normal limits. No evidence of pneumonia or pleural effusion.';
      this.xray.findings = 'Normal chest X-ray. No significant findings.';
      this.xray.recommendations = 'Continue routine follow-up. No immediate intervention required.';
      this.showAiAnalysis = true;
      this.loading = false;
    }, 3000);
  }

  onSubmit() {
    if (!this.selectedFile || !this.xray.patientId) {
      return;
    }

    this.uploading = true;
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('patientId', this.xray.patientId);
    if (this.xray.findings) {
      formData.append('findings', this.xray.findings);
    }
    if (this.xray.recommendations) {
      formData.append('recommendations', this.xray.recommendations);
    }
    if (this.aiAnalysis) {
      formData.append('aiAnalysis', this.aiAnalysis);
    }

    this.doctorService.uploadXray(formData).subscribe({
      next: (xray) => {
        this.uploading = false;
        this.router.navigate(['/doctor-portal/patient-details', this.xray.patientId]);
      },
      error: (err) => {
        console.error('Error uploading xray:', err);
        this.uploading = false;
      }
    });
  }
}
