import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

const ADMIN_LIST_PAGE_SIZE = '500';
import { Observable, forkJoin, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { formatPakistaniCnicDisplay } from '../common/shared/pak-input-format.directive';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  /** National ID (Pakistani CNIC), formatted #####-#######-# when 13 digits are available. */
  cnic: string;
  specialization: string;
  phone?: string;
  city?: string;
  province?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  experienceYears?: number;
  hospitalId?: string;
  hospitalName?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

/** Payload for admin "Add doctor" — all fields required by the API; no invented defaults. */
export interface AdminAddDoctorPayload extends Partial<Doctor> {
  /** 13-digit Pakistani CNIC (with or without dashes in UI). */
  cnic: string;
  password: string;
  city: string;
  province: string;
  /** HTML date input value `yyyy-MM-dd` */
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  experienceYears: number;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  status: 'active' | 'inactive';
  /** Account verification gate (synced with User Verification). */
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  status: 'pending' | 'verified' | 'rejected';
  createdAt?: string;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  source?: string;
  detail?: string;
  category?: string;
  actorUserId?: string;
  resourceId?: string;
  resourceType?: string;
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
  filePath?: string;
}

export interface Analytics {
  totalPatients: number;
  totalDoctors: number;
  totalUsers: number;
  activeAppointments: number;
  patientGrowth: { month: string; count: number }[];
  doctorGrowth: { month: string; count: number }[];
  kpis: {
    /** Null when the platform does not record this metric. */
    avgResponseTime: number | null;
    systemUptime: number | null;
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
    return this.http.get<ApiEnvelope<any[]>>(`${this.baseUrl}/doctors`).pipe(
      this.extractData<any[]>(),
      map((rows) => (rows ?? []).map((d) => this.normalizeAdminDoctorRow(d)))
    );
  }

  private normalizeAdminDoctorRow(d: any): Doctor {
    const rawCnic = d?.cnic ?? d?.CNIC ?? d?.license ?? '';
    const digits = String(rawCnic).replace(/\D/g, '');
    const cnic = digits.length === 13 ? formatPakistaniCnicDisplay(digits) : String(rawCnic ?? '').trim();
    const st = (d?.status ?? 'verified') as string;
    const status: Doctor['status'] =
      st === 'pending' || st === 'rejected' || st === 'verified' ? st : 'verified';
    return {
      id: String(d?.id ?? d?.Id ?? ''),
      name: String(d?.name ?? d?.FullName ?? ''),
      email: String(d?.email ?? d?.Email ?? ''),
      cnic,
      specialization: String(d?.specialization ?? d?.specialty ?? d?.Specialty ?? ''),
      phone: d?.phone ?? d?.PhoneNumber ?? undefined,
      city: d?.city ?? d?.City ?? undefined,
      province: d?.province ?? d?.Province ?? undefined,
      dateOfBirth: d?.dateOfBirth ?? d?.DateOfBirth ?? undefined,
      gender: d?.gender ?? d?.Gender ?? undefined,
      experienceYears: d?.experienceYears ?? d?.ExperienceYears ?? undefined,
      hospitalId: d?.hospitalId ?? d?.HospitalId ?? undefined,
      hospitalName: d?.hospitalName ?? d?.HospitalName ?? undefined,
      status,
      createdAt: d?.createdAt ?? d?.CreatedAt,
      updatedAt: d?.updatedAt ?? d?.UpdatedAt,
    };
  }

  getDoctorById(id: string): Observable<Doctor> {
    return this.getDoctors().pipe(map((doctors) => doctors.find((doctor) => doctor.id === id) as Doctor));
  }

  addDoctor(payloadIn: AdminAddDoctorPayload): Observable<Doctor> {
    const cnicDigits = (payloadIn.cnic ?? '').replace(/\D/g, '');
    if (cnicDigits.length !== 13) {
      return throwError(() => ({
        error: { message: 'CNIC must be exactly 13 digits.' }
      }));
    }

    const rawPhone = (payloadIn.phone ?? '').replace(/\D/g, '');
    if (rawPhone.length < 10) {
      return throwError(() => ({
        error: { message: 'A valid phone number (at least 10 digits) is required.' }
      }));
    }
    let n = rawPhone;
    if (n.startsWith('0')) {
      n = '92' + n.slice(1);
    } else if (!n.startsWith('92')) {
      n = '92' + n;
    }
    const phoneNumber = '+' + n;

    const fullName = (payloadIn.name ?? '').trim();
    const email = (payloadIn.email ?? '').trim();
    const city = (payloadIn.city ?? '').trim();
    const province = (payloadIn.province ?? '').trim();
    if (fullName.length < 3) {
      return throwError(() => ({ error: { message: 'Full name must be at least 3 characters.' } }));
    }
    if (!email) {
      return throwError(() => ({ error: { message: 'Email is required.' } }));
    }
    if (city.length < 2 || province.length < 2) {
      return throwError(() => ({ error: { message: 'City and province are required.' } }));
    }

    const spec = (payloadIn.specialization ?? '').trim();
    if (!spec) {
      return throwError(() => ({ error: { message: 'Specialization is required.' } }));
    }

    const exp = payloadIn.experienceYears;
    if (exp == null || exp < 0 || exp > 50) {
      return throwError(() => ({ error: { message: 'Experience years must be between 0 and 50.' } }));
    }

    const dob = (payloadIn.dateOfBirth ?? '').trim();
    if (!dob) {
      return throwError(() => ({ error: { message: 'Date of birth is required.' } }));
    }

    const password = (payloadIn.password ?? '').trim();
    const pwStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{6,}$/;
    if (!pwStrong.test(password)) {
      return throwError(() => ({
        error: {
          message:
            'Password must be at least 6 characters and include uppercase, lowercase, a digit, and a special character.'
        }
      }));
    }

    const payload = {
      fullName,
      email,
      password,
      cnic: cnicDigits,
      role: 'Doctor',
      specialty: spec,
      experienceYears: exp,
      phoneNumber,
      city,
      province,
      dateOfBirth: new Date(dob + 'T12:00:00.000Z').toISOString(),
      gender: payloadIn.gender
    };
    return this.http.post<Doctor>(`${this.baseUrl}/doctors`, payload);
  }

  updateDoctor(id: string, doctor: Partial<Doctor>): Observable<Doctor> {
    const cnicDigits = doctor.cnic ? doctor.cnic.replace(/\D/g, '') : undefined;
    
    let phoneNumber = doctor.phone;
    if (phoneNumber) {
      const rawPhone = phoneNumber.replace(/\D/g, '');
      if (rawPhone.length >= 10) {
        let n = rawPhone;
        if (n.startsWith('0')) {
          n = '92' + n.slice(1);
        } else if (!n.startsWith('92')) {
          n = '92' + n;
        }
        phoneNumber = '+' + n;
      }
    }

    const payload = {
      fullName: doctor.name,
      email: doctor.email,
      cnic: cnicDigits,
      specialty: doctor.specialization,
      phoneNumber: phoneNumber,
      city: doctor.city,
      province: doctor.province,
      dateOfBirth: doctor.dateOfBirth,
      gender: doctor.gender,
      experienceYears: doctor.experienceYears,
      hospitalId: doctor.hospitalId
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
    const params = new HttpParams().set('page', '1').set('pageSize', ADMIN_LIST_PAGE_SIZE);
    return this.http
      .get<ApiEnvelope<Patient[]>>(`${this.baseUrl}/patients`, { params })
      .pipe(this.extractData<Patient[]>());
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
    return this.http.get<any>(`${this.baseUrl}/repository`).pipe(
      this.extractData<RepositoryItem[]>(),
      map((items) => (items ?? []).map((item) => this.normalizeRepositoryItem(item)))
    );
  }

  uploadRepositoryItem(file: File): Observable<RepositoryItem> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('type', 'document');
    return this.http.post<any>(`${this.baseUrl}/repository/upload`, formData).pipe(
      this.extractData<RepositoryItem>(),
      map((item) => this.normalizeRepositoryItem(item))
    );
  }

  updateRepositoryItem(id: string, payload: Partial<RepositoryItem>): Observable<RepositoryItem> {
    return this.http.put<any>(`${this.baseUrl}/repository/${id}`, payload).pipe(
      this.extractData<RepositoryItem>(),
      map((item) => this.normalizeRepositoryItem(item))
    );
  }

  deleteRepositoryItem(id: string): Observable<void> {
    return this.http.delete<any>(`${this.baseUrl}/repository/${id}`).pipe(map(() => void 0));
  }

  private normalizeRepositoryItem(item: any): RepositoryItem {
    return {
      id: String(item?.id ?? item?.Id ?? ''),
      name: String(item?.name ?? item?.Name ?? '').trim(),
      type: (item?.type ?? item?.Type ?? 'document') as RepositoryItem['type'],
      size: Number(item?.size ?? item?.Size ?? 0),
      uploadedAt: String(item?.uploadedAt ?? item?.UploadedAt ?? new Date().toISOString()),
      uploadedBy: item?.uploadedBy ?? item?.UploadedBy ?? undefined,
      filePath: item?.filePath ?? item?.FilePath ?? undefined,
    };
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

        const totalAdmins = summaryData?.totalAdmins ?? summaryData?.TotalAdmins ?? 0;
        const totalUsers =
          (summaryData?.totalPatients ?? 0) +
          (summaryData?.totalDoctors ?? 0) +
          totalAdmins;

        return {
          totalPatients: summaryData?.totalPatients ?? 0,
          totalDoctors: summaryData?.totalDoctors ?? 0,
          totalUsers,
          activeAppointments: summaryData?.activeAppointments ?? summaryData?.ActiveAppointments ?? 0,
          patientGrowth: summaryData?.patientGrowth ?? [],
          doctorGrowth: summaryData?.doctorGrowth ?? [],
          kpis: {
            avgResponseTime: kpisData?.avgResponseTime ?? kpisData?.AvgResponseTime ?? null,
            systemUptime: kpisData?.systemUptime ?? kpisData?.SystemUptime ?? null,
            activeUsers: kpisData?.activeUsers ?? kpisData?.ActiveUsers ?? 0,
            dataStorage: kpisData?.dataStorage ?? kpisData?.DataStorage ?? 0
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

