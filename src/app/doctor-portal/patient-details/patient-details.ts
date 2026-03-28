import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  DoctorService,
  Document,
  Patient,
  PatientMedicalRecord
} from '../../services/doctor.service';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-patient-details',
  imports: [CommonModule, FormsModule, RouterModule, PakInputFormatDirective],
  templateUrl: './patient-details.html',
  styleUrl: './patient-details.scss',
})
export class PatientDetails implements OnInit {
  patientId = '';
  /** Resolved user id (GUID) used for API calls — may differ from route param when param is CNIC. */
  apiPatientId = '';
  patient: Patient | null = null;
  medicalRecords: PatientMedicalRecord[] = [];
  documents: Document[] = [];
  activityTimeline: { date: Date; title: string; detail: string; meta: string }[] = [];

  loading = false;
  recordsLoading = false;
  docsLoading = false;
  loadError: string | null = null;
  recordsError: string | null = null;

  isEditing = false;
  editForm: Partial<Patient> = {};
  saving = false;
  saveError: string | null = null;

  readonly apiOrigin = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.patientId = params['id'] || '';
      if (this.patientId) {
        this.loadPatientDetails();
      }
    });
  }

  loadPatientDetails() {
    this.loading = true;
    this.loadError = null;
    this.patient = null;
    this.medicalRecords = [];
    this.documents = [];
    this.activityTimeline = [];

    this.doctorService.resolvePatient(this.patientId).subscribe({
      next: (patient) => {
        this.loading = false;
        if (!patient?.id) {
          this.loadError =
            'Patient not found. Use a valid patient id from your list, or the full 13-digit CNIC.';
          this.cdr.markForCheck();
          return;
        }
        this.patient = patient;
        this.apiPatientId = patient.id;
        this.editForm = { ...patient };
        this.loadMedicalRecords();
        this.loadDocuments();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading patient:', err);
        this.loading = false;
        this.loadError = 'Could not load patient. Check your connection and try again.';
        this.cdr.markForCheck();
      }
    });
  }

  loadMedicalRecords() {
    if (!this.apiPatientId) return;
    this.recordsLoading = true;
    this.recordsError = null;
    this.doctorService.getPatientRecordsList(this.apiPatientId, 1, 100).subscribe({
      next: (rows) => {
        this.recordsLoading = false;
        this.medicalRecords = rows.sort(
          (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
        );
        this.buildActivityTimeline();
      },
      error: (err) => {
        console.error('Error loading records:', err);
        this.recordsLoading = false;
        this.recordsError = 'Could not load medical records.';
      }
    });
  }

  loadDocuments() {
    if (!this.apiPatientId) return;
    this.docsLoading = true;
    this.doctorService.getDocuments(this.apiPatientId).subscribe({
      next: (docs) => {
        this.docsLoading = false;
        this.documents = docs || [];
      },
      error: () => {
        this.docsLoading = false;
        this.documents = [];
      }
    });
  }

  private buildActivityTimeline() {
    this.activityTimeline = this.medicalRecords.slice(0, 25).map((r) => ({
      date: this.parseDate(r.recordDate),
      title: r.diagnosis || 'Medical record',
      detail: [r.disease, r.treatment].filter(Boolean).join(' · ') || r.description.slice(0, 120),
      meta: r.doctorName ? `Dr. ${r.doctorName}` : 'Record'
    }));
  }

  parseDate(iso: string): Date {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  startEdit() {
    if (!this.patient) return;
    this.isEditing = true;
    this.saveError = null;
    this.editForm = { ...this.patient };
  }

  cancelEdit() {
    this.isEditing = false;
    this.saveError = null;
    if (this.patient) this.editForm = { ...this.patient };
  }

  savePatient() {
    if (!this.patient?.id) return;
    this.saving = true;
    this.saveError = null;
    this.doctorService.updatePatient(this.patient.id, this.editForm).subscribe({
      next: () => {
        Object.assign(this.patient!, this.editForm);
        this.isEditing = false;
        this.saving = false;
        this.loadPatientDetails();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error updating patient:', err);
        this.saving = false;
        this.saveError =
          (err.error && (err.error.message || err.error.Message)) || 'Update failed.';
        this.cdr.markForCheck();
      }
    });
  }

  fileUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${this.apiOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  attachmentKind(record: PatientMedicalRecord): 'pdf' | 'image' | 'none' {
    const p = (record.reportFilePath || '').toLowerCase();
    if (!p) return 'none';
    if (p.endsWith('.pdf')) return 'pdf';
    if (/\.(jpg|jpeg|png|webp|gif)$/.test(p)) return 'image';
    return 'none';
  }

  attachmentLabel(record: PatientMedicalRecord): string {
    const k = this.attachmentKind(record);
    if (k === 'pdf') return 'PDF';
    if (k === 'image') return 'Image';
    return 'No file';
  }

  displayGender(g: string | undefined): string {
    if (!g) return '—';
    return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
  }

  displayDob(d: string | undefined): string {
    if (!d) return '—';
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? d : x.toLocaleDateString();
  }

  documentUrl(d: Document): string {
    const p = typeof d.file === 'string' ? d.file : '';
    return this.fileUrl(p);
  }

  patientInitials(): string {
    const n = (this.patient?.name || '?').trim();
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (n.slice(0, 2) || '?').toUpperCase();
  }
}
