import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

interface ApiEnvelope<T> {
  message?: string;
  data: T;
  total?: number;
}

export interface Hospital {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  contactNumber?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  private extractData<T>() {
    return (source: Observable<any>): Observable<T> =>
      source.pipe(map((response) => response?.data ?? response?.Data));
  }

  // Doctors
  getDoctors(): Observable<Doctor[]> {
    return this.http.get<ApiEnvelope<Doctor[]>>(`${this.baseUrl}/doctors`).pipe(this.extractData<Doctor[]>());
  }

  getDoctorById(id: string): Observable<Doctor> {
    return this.getDoctors().pipe(map((doctors) => doctors.find((doctor) => doctor.id === id) as Doctor));
  }

  addDoctor(doctor: Partial<Doctor>): Observable<Doctor> {
    const cnicDigits = (doctor.license ?? '').replace(/\D/g, '');
    const payload = {
      fullName: doctor.name ?? '',
      email: doctor.email ?? '',
      password: 'Doctor@123',
      cnic: cnicDigits.length === 13 ? cnicDigits : '3520212345672',
      role: 'Doctor',
      specialty: doctor.specialization ?? '',
      experienceYears: 1,
      phoneNumber: doctor.phone ?? '',
      city: 'Sahiwal',
      province: 'Punjab',
      dateOfBirth: '1990-01-01T00:00:00.000Z',
      gender: 'Male'
    };
    return this.http.post<Doctor>(`${this.baseUrl}/doctors`, payload);
  }

  updateDoctor(id: string, doctor: Partial<Doctor>): Observable<Doctor> {
    const payload = {
      fullName: doctor.name,
      email: doctor.email,
      cnic: doctor.license,
      specialty: doctor.specialization,
      phoneNumber: doctor.phone
    };
    return this.http.put<Doctor>(`${this.baseUrl}/doctors/${id}`, payload);
  }

  deleteDoctor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/doctors/${id}`);
  }

  verifyDoctor(id: string, verified: boolean): Observable<Doctor> {
    return this.http.put<any>(`${this.baseUrl}/doctors/${id}/verify`, { verified }).pipe(
      map(() => ({} as Doctor))
    );
  }

  // Patients
  getPatients(): Observable<Patient[]> {
    return this.http.get<ApiEnvelope<Patient[]>>(`${this.baseUrl}/patients`).pipe(this.extractData<Patient[]>());
  }

  getPatientById(id: string): Observable<Patient> {
    return this.getPatients().pipe(
      map((patients) => patients.find((patient) => patient.id === id) as Patient)
    );
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    const payload = {
      fullName: patient.name,
      email: patient.email,
      phoneNumber: patient.phone,
      dateOfBirth: patient.dateOfBirth
    };
    return this.http.put<Patient>(`${this.baseUrl}/patients/${id}`, payload);
  }

  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/patients/${id}`);
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<any>(`${this.baseUrl}/users`).pipe(this.extractData<User[]>());
  }

  approveUser(id: string): Observable<User> {
    return this.http.put<any>(`${this.baseUrl}/users/${id}/approve`, {}).pipe(
      map(() => ({ id } as User))
    );
  }

  rejectUser(id: string): Observable<User> {
    return this.http.put<any>(`${this.baseUrl}/users/${id}/reject`, {}).pipe(
      map(() => ({ id } as User))
    );
  }

  updateUserRole(id: string, role: string): Observable<User> {
    return this.http.put<any>(`${this.baseUrl}/users/${id}/role`, { role }).pipe(
      map(() => ({ id, role } as unknown as User))
    );
  }

  // System Health
  getSystemLogs(limit?: number): Observable<SystemLog[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<any>(`${this.baseUrl}/logs`, { params }).pipe(this.extractData<SystemLog[]>());
  }

  getErrorReports(): Observable<SystemLog[]> {
    return this.http.get<any>(`${this.baseUrl}/logs/errors`).pipe(this.extractData<SystemLog[]>());
  }

  getPerformanceStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/performance`).pipe(this.extractData<any>());
  }

  // Integrations
  getIntegrations(): Observable<Integration[]> {
    return this.http.get<any>(`${this.baseUrl}/integrations`).pipe(this.extractData<Integration[]>());
  }

  createIntegration(integration: Partial<Integration>): Observable<Integration> {
    return this.http.post<any>(`${this.baseUrl}/integrations`, integration).pipe(
      map((res) => (res?.data ?? res?.Data ?? integration) as Integration)
    );
  }

  updateIntegration(id: string, integration: Partial<Integration>): Observable<Integration> {
    return this.http.put<any>(`${this.baseUrl}/integrations/${id}`, integration).pipe(
      map((res) => (res?.data ?? res?.Data ?? { id, ...integration }) as Integration)
    );
  }

  deleteIntegration(id: string): Observable<void> {
    return this.http.delete<any>(`${this.baseUrl}/integrations/${id}`).pipe(map(() => void 0));
  }

  // Repository
  getRepositoryItems(): Observable<RepositoryItem[]> {
    return this.http.get<any>(`${this.baseUrl}/repository`).pipe(this.extractData<RepositoryItem[]>());
  }

  uploadRepositoryItem(file: File): Observable<RepositoryItem> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('type', 'document');
    return this.http.post<any>(`${this.baseUrl}/repository/upload`, formData).pipe(
      this.extractData<RepositoryItem>()
    );
  }

  deleteRepositoryItem(id: string): Observable<void> {
    return this.http.delete<any>(`${this.baseUrl}/repository/${id}`).pipe(map(() => void 0));
  }

  // Analytics
  getAnalytics(): Observable<Analytics> {
    // Backend `GET /analytics` returns summary counters, while `GET /analytics/kpis` returns KPI metrics.
    // The admin UI expects both in a single payload.
    return forkJoin({
      summary: this.http.get<any>(`${this.baseUrl}/analytics`),
      kpis: this.http.get<any>(`${this.baseUrl}/analytics/kpis`)
    }).pipe(
      map(({ summary, kpis }) => {
        const summaryData = summary?.data ?? summary?.Data ?? summary ?? {};
        const kpisData = kpis?.data ?? kpis?.Data ?? kpis ?? {};

        const totalUsers =
          (summaryData?.totalPatients ?? 0) +
          (summaryData?.totalDoctors ?? 0) +
          (summaryData?.totalAdmins ?? 0);

        return {
          totalPatients: summaryData?.totalPatients ?? 0,
          totalDoctors: summaryData?.totalDoctors ?? 0,
          totalUsers,
          activeAppointments: 0, // Not currently provided by backend
          patientGrowth: [], // Not currently provided by backend
          doctorGrowth: [], // Not currently provided by backend
          kpis: {
            avgResponseTime: kpisData?.avgResponseTime ?? 0,
            systemUptime: kpisData?.systemUptime ?? 0,
            activeUsers: kpisData?.activeUsers ?? 0,
            dataStorage: kpisData?.dataStorage ?? 0
          }
        } as Analytics;
      })
    );
  }

  getKPIs(): Observable<Analytics['kpis']> {
    return this.http.get<any>(`${this.baseUrl}/analytics/kpis`).pipe(
      this.extractData<Analytics['kpis']>()
    );
  }

  // Notifications
  sendNotification(notification: Notification): Observable<any> {
    const channel =
      notification.type === 'push' ? 'Push' :
      notification.type === 'email' ? 'Email' :
      notification.type === 'sms' ? 'SMS' :
      'Push';

    const message = notification.message;
    const providedMedicalRecordId = (notification as any).medicalRecordId as string | undefined;

    if (providedMedicalRecordId) {
      return this.http.post<any>(`${this.baseUrl}/notifications`, { medicalRecordId: providedMedicalRecordId, message, channel });
    }

    // Backend requires a `medicalRecordId`. Until the UI provides record selection,
    // we attach the notification to the most recent record as a best-effort integration.
    return this.getMedicalRecordsOverview(1, 1).pipe(
      map((records) => records?.[0]?.id ?? records?.[0]?.Id ?? null),
      switchMap((medicalRecordId) => {
        if (!medicalRecordId) {
          return throwError(() => new Error('No medical records available to send admin notification.'));
        }
        return this.http.post<any>(`${this.baseUrl}/notifications`, { medicalRecordId, message, channel });
      })
    );
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<any>(`${this.baseUrl}/notifications`).pipe(
      this.extractData<any[]>(),
      map((items) => (items || []).map((n) => {
        const channel = (n.channel ?? '').toString().toLowerCase();
        const type: Notification['type'] =
          channel === 'email' ? 'email' :
          channel === 'sms' ? 'sms' :
          'push';

        return {
          id: n.id ?? n.Id,
          message: n.message ?? '',
          type,
          targets: n.patientName ? [n.patientName] : [],
          scheduledAt: n.sentAt ?? n.SentAt
        } as Notification;
      }))
    );
  }

  markNotificationAsRead(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  getMedicalRecordsOverview(page = 1, pageSize = 50): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/medical-records?page=${page}&pageSize=${pageSize}`).pipe(
      this.extractData<any[]>()
    );
  }

  getDocumentsOverview(page = 1, pageSize = 50): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/documents?page=${page}&pageSize=${pageSize}`).pipe(
      this.extractData<any[]>()
    );
  }

  getAIResults(page = 1, pageSize = 50): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/ai-results?page=${page}&pageSize=${pageSize}`).pipe(
      this.extractData<any[]>()
    );
  }

  approveAIResult(id: string, approvedByDoctorId: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/ai-results/${id}/approve`, { approvedByDoctorId });
  }

  // Hospitals
  getHospitals(): Observable<Hospital[]> {
    return this.http.get<ApiEnvelope<Hospital[]>>(`${this.baseUrl}/hospitals`).pipe(this.extractData<Hospital[]>());
  }

  getHospitalById(id: string): Observable<Hospital> {
    return this.http.get<ApiEnvelope<Hospital>>(`${this.baseUrl}/hospitals/${id}`).pipe(this.extractData<Hospital>());
  }

  addHospital(hospital: Hospital): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/hospitals`, hospital);
  }

  updateHospital(id: string, hospital: Partial<Hospital>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/hospitals/${id}`, hospital);
  }

  deleteHospital(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/hospitals/${id}`);
  }

  // Admins
  getAdmins(): Observable<User[]> {
    return this.http.get<ApiEnvelope<User[]>>(`${this.baseUrl}/admins`).pipe(this.extractData<User[]>());
  }

  addAdmin(adminData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admins`, adminData);
  }

  updateAdmin(id: string, adminData: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admins/${id}`, adminData);
  }

  deleteAdmin(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admins/${id}`);
  }

  // Admin profile
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/profile`);
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/profile`, profile);
  }
}

