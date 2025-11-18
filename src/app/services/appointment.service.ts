import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  reason?: string;
  notes?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(private http: HttpClient) {}

  // Get all appointments
  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>('/api/appointments');
  }

  // Get appointment by ID
  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`/api/appointments/${id}`);
  }

  // Get appointments by patient ID
  getAppointmentsByPatient(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`/api/appointments/patient/${patientId}`);
  }

  // Get appointments by doctor ID
  getAppointmentsByDoctor(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`/api/appointments/doctor/${doctorId}`);
  }

  // Create new appointment
  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>('/api/appointments', appointment);
  }

  // Update appointment
  updateAppointment(id: string, appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`/api/appointments/${id}`, appointment);
  }

  // Cancel appointment
  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.put<Appointment>(`/api/appointments/${id}/cancel`, {});
  }

  // Delete appointment
  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`/api/appointments/${id}`);
  }
}

