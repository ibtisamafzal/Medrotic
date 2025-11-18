import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
  hospital?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  constructor(private http: HttpClient) {}

  // Get all doctors
  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>('/api/doctors');
  }

  // Get doctor by ID
  getDoctorById(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`/api/doctors/${id}`);
  }

  // Create new doctor
  createDoctor(doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.post<Doctor>('/api/doctors', doctor);
  }

  // Update doctor
  updateDoctor(id: string, doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.put<Doctor>(`/api/doctors/${id}`, doctor);
  }

  // Delete doctor
  deleteDoctor(id: string): Observable<void> {
    return this.http.delete<void>(`/api/doctors/${id}`);
  }

  // Get doctor's patients
  getDoctorPatients(doctorId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/doctors/${doctorId}/patients`);
  }
}

