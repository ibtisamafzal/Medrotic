import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

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

interface ApiEnvelope<T> {
  message?: string;
  data: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private patientBaseUrl = '/api/patient/records';
  private doctorBaseUrl = '/api/doctor/patients';

  constructor(private http: HttpClient) {}

  // Prescriptions are part of records in current backend.
  getPrescriptions(): Observable<Prescription[]> {
    return this.http.get<ApiEnvelope<Prescription[]>>(this.patientBaseUrl).pipe(
      map((response) => response?.data || [])
    );
  }

  // Filter from fetched records.
  getPrescriptionById(id: string): Observable<Prescription> {
    return this.getPrescriptions().pipe(
      map((items) => items.find((item) => item.id === id) as Prescription)
    );
  }

  // No dedicated endpoint; use doctor records list for patient.
  getPrescriptionsByPatient(patientId: string): Observable<Prescription[]> {
    return this.http.get<ApiEnvelope<Prescription[]>>(`${this.doctorBaseUrl}/${patientId}/records`).pipe(
      map((response) => response?.data || [])
    );
  }

  // Current API does not support filtering by doctor ID directly.
  getPrescriptionsByDoctor(doctorId: string): Observable<Prescription[]> {
    return throwError(() => new Error('Backend endpoint for prescriptions by doctor is not available.'));
  }

  // Create via doctor patient record endpoint.
  createPrescription(prescription: Partial<Prescription>): Observable<Prescription> {
    if (!prescription.patientId) {
      return throwError(() => new Error('patientId is required to create prescription.'));
    }
    return this.http.post<Prescription>(`${this.doctorBaseUrl}/${prescription.patientId}/records`, prescription);
  }

  // Update via doctor patient record endpoint.
  updatePrescription(id: string, prescription: Partial<Prescription>): Observable<Prescription> {
    if (!prescription.patientId) {
      return throwError(() => new Error('patientId is required to update prescription.'));
    }
    return this.http.put<Prescription>(`${this.doctorBaseUrl}/${prescription.patientId}/records/${id}`, prescription);
  }

  // Delete via doctor patient record endpoint.
  deletePrescription(id: string): Observable<void> {
    return throwError(() => new Error('patientId is required; use doctor record delete endpoint from doctor workflow.'));
  }
}

