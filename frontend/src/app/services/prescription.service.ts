import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medications: Medication[];
  diagnosis?: string;
  notes?: string;
  date: string;
  createdAt?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  constructor(private http: HttpClient) {}

  // Get all prescriptions
  getPrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>('/api/prescriptions');
  }

  // Get prescription by ID
  getPrescriptionById(id: string): Observable<Prescription> {
    return this.http.get<Prescription>(`/api/prescriptions/${id}`);
  }

  // Get prescriptions by patient ID
  getPrescriptionsByPatient(patientId: string): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`/api/prescriptions/patient/${patientId}`);
  }

  // Get prescriptions by doctor ID
  getPrescriptionsByDoctor(doctorId: string): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`/api/prescriptions/doctor/${doctorId}`);
  }

  // Create new prescription
  createPrescription(prescription: Partial<Prescription>): Observable<Prescription> {
    return this.http.post<Prescription>('/api/prescriptions', prescription);
  }

  // Update prescription
  updatePrescription(id: string, prescription: Partial<Prescription>): Observable<Prescription> {
    return this.http.put<Prescription>(`/api/prescriptions/${id}`, prescription);
  }

  // Delete prescription
  deletePrescription(id: string): Observable<void> {
    return this.http.delete<void>(`/api/prescriptions/${id}`);
  }
}

