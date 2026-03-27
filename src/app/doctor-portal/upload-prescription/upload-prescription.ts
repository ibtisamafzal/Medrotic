import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
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
  uploadError: string | null = null;
  ocrText = '';
  /** Last OCR doctor_notes from AI service (shown in AI summary). */
  ocrDoctorNotes: string | null = null;
  ocrConfidenceLabel: string | null = null;
  aiAnalysis = '';
  showAiAnalysis = false;

  /** Maps to API AddPatientRecordDto — required for POST /patients/{id}/records */
  recordDiagnosis = 'Prescription (OCR)';
  recordDisease = 'Prescription';
  recordDateStr = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    this.recordDateStr = new Date().toISOString().split('T')[0];
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
    this.ocrDoctorNotes = null;
    this.ocrConfidenceLabel = null;
    this.doctorService.prescriptionOcr(this.selectedFile).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          const d = res.data;
          this.ocrText = d.raw_text;
          this.ocrDoctorNotes = d.doctor_notes;
          this.ocrConfidenceLabel = d.confidence?.label ?? null;
          this.prescription.medications = (d.medicines ?? []).map((m) => ({
            name: m.name ?? '',
            dosage: m.dosage ?? '',
            frequency: m.frequency ?? '',
            duration: m.duration ?? ''
          }));
        } else {
          this.ocrText = res.error ?? 'OCR returned no data.';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.ocrText =
          'OCR request failed. Start the AI service on port 8000, run `ng serve` with proxy (see proxy.conf.json), and ensure environment.ocrApiKey matches the service.';
      }
    });
  }

  processAI() {
    if (!this.selectedFile) return;

    const meds = (this.prescription.medications ?? []).filter((m) => m.name?.trim());
    if (!meds.length && !this.ocrText) {
      this.aiAnalysis = 'Run Process OCR first to extract medications from the image.';
      this.showAiAnalysis = true;
      return;
    }

    this.loading = true;
    const lines = meds.map((m) => {
      const bits = [m.name, m.dosage].filter(Boolean).join(' ').trim();
      const freq = m.frequency ? ` — ${m.frequency}` : '';
      const dur = m.duration ? ` (${m.duration})` : '';
      return `${bits}${freq}${dur}`;
    });
    const conf = this.ocrConfidenceLabel ? ` Confidence: ${this.ocrConfidenceLabel}.` : '';
    const notes = this.ocrDoctorNotes ? ` Doctor notes: ${this.ocrDoctorNotes}.` : '';
    this.aiAnalysis = meds.length
      ? `Detected medications: ${lines.join('; ')}.${notes}${conf}`
      : `Extracted text only (no structured medications).${notes}${conf}`;
    this.showAiAnalysis = true;
    this.loading = false;
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

  private buildTreatmentFromMedications(): string {
    const meds = (this.prescription.medications ?? []).filter((m) => m.name?.trim());
    if (!meds.length) {
      return 'OCR prescription — see description for details.';
    }
    return meds
      .map((m) =>
        [m.name, m.dosage, m.frequency, m.duration].filter((x) => x?.trim()).join(' ').trim()
      )
      .join('; ');
  }

  private buildDescription(): string {
    const parts: string[] = [];
    if (this.ocrText) parts.push(`OCR text:\n${this.ocrText}`);
    if (this.prescription.notes) parts.push(`Doctor notes:\n${this.prescription.notes}`);
    if (this.aiAnalysis) parts.push(`Summary:\n${this.aiAnalysis}`);
    let s = parts.join('\n\n').trim();
    if (s.length < 10) {
      s = 'Prescription upload record.\n\n' + (s || 'No additional details.');
    }
    return this.clip(s, 1000);
  }

  /** Shown in UI; same payload as sent to API (10–1000 chars). */
  getDescriptionPreview(): string {
    return this.buildDescription();
  }

  private clip(s: string, max: number): string {
    if (s.length <= max) return s;
    return s.slice(0, max);
  }

  private formatUploadError(err: HttpErrorResponse): string {
    const e = err.error as Record<string, unknown> | null;
    if (!e) return err.message || 'Upload failed.';
    if (typeof e === 'string') return e;
    const msg = (e['message'] ?? e['Message']) as string | undefined;
    if (msg) return msg;
    const errors = e['errors'] ?? e['Errors'];
    if (errors && typeof errors === 'object') {
      const lines: string[] = [];
      for (const [key, val] of Object.entries(errors)) {
        if (Array.isArray(val)) lines.push(...val.map((v) => `${key}: ${v}`));
        else lines.push(`${key}: ${String(val)}`);
      }
      if (lines.length) return lines.join(' ');
    }
    return err.statusText || 'Upload failed.';
  }

  onSubmit() {
    if (!this.selectedFile || !this.prescription.patientId) {
      return;
    }

    this.uploading = true;
    this.uploadError = null;

    const formData = new FormData();
    formData.append('patientId', this.prescription.patientId);
    formData.append('ReportFile', this.selectedFile, this.selectedFile.name);
    formData.append('Diagnosis', this.clip(this.recordDiagnosis, 500));
    formData.append('Treatment', this.clip(this.buildTreatmentFromMedications(), 500));
    formData.append('Disease', this.clip(this.recordDisease, 200));
    formData.append('Description', this.buildDescription());
    formData.append('RecordDate', this.recordDateStr);

    this.doctorService.uploadPrescription(formData).subscribe({
      next: () => {
        this.uploading = false;
        this.router.navigate(['/doctor-portal/patient-details', this.prescription.patientId]);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error uploading prescription:', err);
        this.uploading = false;
        this.uploadError = this.formatUploadError(err);
      }
    });
  }
}
