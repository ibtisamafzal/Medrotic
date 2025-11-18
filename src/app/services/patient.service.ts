import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  medicalHistory?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  constructor(private http: HttpClient) {}

  // Get all patients
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>('/api/patients');
  }

  // Get patient by ID
  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`/api/patients/${id}`);
  }

  // Create new patient
  createPatient(patient: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>('/api/patients', patient);
  }

  // Update patient
  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`/api/patients/${id}`, patient);
  }

  // Delete patient
  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`/api/patients/${id}`);
  }

  // Get patient medical history
  getPatientMedicalHistory(patientId: string): Observable<any> {
    return this.http.get<any>(`/api/patients/${patientId}/medical-history`);
  }
}

