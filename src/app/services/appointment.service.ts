import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  private baseUrl = '/api/doctor/appointments';

  constructor(private http: HttpClient) {}

  // Get all appointments
  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.baseUrl);
  }

  // Get appointment by ID
  getAppointmentById(id: string): Observable<Appointment> {
    return this.getAppointments().pipe(
      map((appointments) => appointments.find((item) => item.id === id) as Appointment)
    );
  }

  // Get appointments by patient ID
  getAppointmentsByPatient(patientId: string): Observable<Appointment[]> {
    return this.getAppointments().pipe(
      map((appointments) => appointments.filter((item) => item.patientId === patientId))
    );
  }

  // Get appointments by doctor ID
  getAppointmentsByDoctor(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.baseUrl);
  }

  // Create new appointment
  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(this.baseUrl, appointment);
  }

  // Update appointment
  updateAppointment(id: string, appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/${id}`, appointment);
  }

  // Cancel appointment
  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.baseUrl}/${id}`);
  }

  // Delete appointment
  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

