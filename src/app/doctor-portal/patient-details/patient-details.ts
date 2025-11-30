import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DoctorService, Patient, Prescription, Xray } from '../../services/doctor.service';

@Component({
  selector: 'app-patient-details',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './patient-details.html',
  styleUrl: './patient-details.scss',
})
export class PatientDetails implements OnInit {
  patientId: string = '';
  patient: Patient | null = null;
  prescriptions: Prescription[] = [];
  xrays: Xray[] = [];
  loading = false;
  updateHistory: any[] = [];
  isEditing = false;
  editForm: Partial<Patient> = {};
  saving = false;
  newNote = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.patientId = params['id'];
      if (this.patientId) {
        this.loadPatientDetails();
        this.loadPrescriptions();
        this.loadXrays();
        this.loadUpdateHistory();
      }
    });
  }

  loadPatientDetails() {
    this.loading = true;
    this.doctorService.getPatientById(this.patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.editForm = { ...patient };
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading patient:', err);
        // Mock data for development
        this.patient = {
          id: this.patientId,
          name: 'John Doe',
          cnic: '12345-1234567-1',
          email: 'john@example.com',
          phone: '+923001234567',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          address: '123 Main Street, City',
          medicalHistory: 'No significant medical history. Regular checkups recommended.',
          status: 'active'
        };
        this.editForm = { ...this.patient };
        this.loading = false;
      }
    });
  }

  startEdit() {
    this.isEditing = true;
    this.editForm = { ...this.patient };
  }

  cancelEdit() {
    this.isEditing = false;
    this.editForm = { ...this.patient };
  }

  savePatient() {
    if (!this.patient || !this.patient.id) return;

    this.saving = true;
    this.doctorService.updatePatient(this.patient.id, this.editForm).subscribe({
      next: (updatedPatient) => {
        this.patient = updatedPatient;
        this.isEditing = false;
        this.saving = false;
        this.loadUpdateHistory();
      },
      error: (err) => {
        console.error('Error updating patient:', err);
        this.saving = false;
      }
    });
  }

  addNote() {
    if (!this.newNote.trim() || !this.patient) return;

    const updatedHistory = this.patient.medicalHistory 
      ? `${this.patient.medicalHistory}\n\n[${new Date().toLocaleString()}] ${this.newNote}`
      : `[${new Date().toLocaleString()}] ${this.newNote}`;

    const updateData = { medicalHistory: updatedHistory };
    
    this.doctorService.updatePatient(this.patient.id, updateData).subscribe({
      next: (updatedPatient) => {
        this.patient = updatedPatient;
        this.newNote = '';
        this.loadUpdateHistory();
      },
      error: (err) => {
        console.error('Error adding note:', err);
      }
    });
  }

  loadPrescriptions() {
    this.doctorService.getPrescriptions(this.patientId).subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions;
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
      }
    });
  }

  loadXrays() {
    this.doctorService.getXrays(this.patientId).subscribe({
      next: (xrays) => {
        this.xrays = xrays;
      },
      error: (err) => {
        console.error('Error loading xrays:', err);
      }
    });
  }

  loadUpdateHistory() {
    // Mock update history - in real app, this would come from API
    this.updateHistory = [
      { date: new Date(), action: 'Patient registered', by: 'Dr. Smith' },
      { date: new Date(Date.now() - 86400000), action: 'Prescription uploaded', by: 'Dr. Smith' },
      { date: new Date(Date.now() - 172800000), action: 'X-Ray uploaded', by: 'Dr. Smith' }
    ];
  }
}
