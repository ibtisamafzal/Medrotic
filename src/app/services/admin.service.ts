import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  license: string;
  specialization: string;
  phone?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  source?: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'ehr' | 'api' | 'external';
  status: 'active' | 'inactive' | 'error';
  endpoint?: string;
  lastSync?: string;
}

export interface RepositoryItem {
  id: string;
  name: string;
  type: 'document' | 'image' | 'data';
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface Analytics {
  totalPatients: number;
  totalDoctors: number;
  totalUsers: number;
  activeAppointments: number;
  patientGrowth: { month: string; count: number }[];
  doctorGrowth: { month: string; count: number }[];
  kpis: {
    avgResponseTime: number;
    systemUptime: number;
    activeUsers: number;
    dataStorage: number;
  };
}

export interface Notification {
  id?: string;
  message: string;
  targets: string[]; // user IDs or roles
  type: 'push' | 'email' | 'sms';
  scheduledAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  // Doctors
  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.baseUrl}/doctors`);
  }

  getDoctorById(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.baseUrl}/doctors/${id}`);
  }

  addDoctor(doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.baseUrl}/doctors`, doctor);
  }

  updateDoctor(id: string, doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.baseUrl}/doctors/${id}`, doctor);
  }

  deleteDoctor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/doctors/${id}`);
  }

  verifyDoctor(id: string, verified: boolean): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.baseUrl}/doctors/${id}/verify`, { verified });
  }

  // Patients
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/patients`);
  }

  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/patients/${id}`);
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/patients/${id}`, patient);
  }

  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/patients/${id}`);
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  approveUser(id: string): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}/approve`, {});
  }

  rejectUser(id: string): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}/reject`, {});
  }

  updateUserRole(id: string, role: string): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}/role`, { role });
  }

  // System Health
  getSystemLogs(limit?: number): Observable<SystemLog[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<SystemLog[]>(`${this.baseUrl}/logs`, { params });
  }

  getErrorReports(): Observable<SystemLog[]> {
    return this.http.get<SystemLog[]>(`${this.baseUrl}/logs/errors`);
  }

  getPerformanceStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/performance`);
  }

  // Integrations
  getIntegrations(): Observable<Integration[]> {
    return this.http.get<Integration[]>(`${this.baseUrl}/integrations`);
  }

  createIntegration(integration: Partial<Integration>): Observable<Integration> {
    return this.http.post<Integration>(`${this.baseUrl}/integrations`, integration);
  }

  updateIntegration(id: string, integration: Partial<Integration>): Observable<Integration> {
    return this.http.put<Integration>(`${this.baseUrl}/integrations/${id}`, integration);
  }

  deleteIntegration(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/integrations/${id}`);
  }

  // Repository
  getRepositoryItems(): Observable<RepositoryItem[]> {
    return this.http.get<RepositoryItem[]>(`${this.baseUrl}/repository`);
  }

  uploadRepositoryItem(file: File): Observable<RepositoryItem> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<RepositoryItem>(`${this.baseUrl}/repository/upload`, formData);
  }

  deleteRepositoryItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/repository/${id}`);
  }

  // Analytics
  getAnalytics(): Observable<Analytics> {
    return this.http.get<Analytics>(`${this.baseUrl}/analytics`);
  }

  getKPIs(): Observable<Analytics['kpis']> {
    return this.http.get<Analytics['kpis']>(`${this.baseUrl}/analytics/kpis`);
  }

  // Notifications
  sendNotification(notification: Notification): Observable<Notification> {
    return this.http.post<Notification>(`${this.baseUrl}/notifications`, notification);
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications`);
  }
}

