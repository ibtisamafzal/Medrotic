import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Patient {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  medicalHistory?: string;
  cnic?: string;
  city?: string;
  province?: string;
  gender?: string;
  cnicVerified?: boolean;
  profilePictureUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalHistory {
  id: string;
  date: string;
  recordDate?: string;
  type: 'prescription' | 'xray' | 'test' | 'visit' | 'metric';
  title: string;
  description?: string;
  doctorName?: string;
  hospitalName?: string;
  diagnosis?: string;
  treatment?: string;
  disease?: string;
  symptoms?: string;
  notes?: string;
  fileName?: string;
  filePath?: string;
  reportFilePath?: string | null;
  currentState?: string;
  source?: 'record' | 'document' | 'metric';
  attachments?: string[];
  createdAt: string;
}

export interface HealthMetric {
  id?: string;
  date: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bloodSugar?: number;
  symptoms?: string;
  notes?: string;
}

export interface ChatbotMessage {
  query: string;
  context?: any;
}

export interface ChatbotResponse {
  response: string;
  suggestions?: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  city: string;
  experience: number;
  qualifications?: string[];
  hospital?: string;
  phone?: string;
  email?: string;
  rating?: number;
  profilePictureUrl?: string;
}

// Emits whenever patient-visible portal data changes (e.g., new metrics, profile update).
// Components can subscribe to keep UI real-time without full page reload.
const portalUpdatedSubject = new Subject<void>();

export const portalUpdated$ = portalUpdatedSubject.asObservable();

export function notifyPortalUpdated(): void {
  portalUpdatedSubject.next();
}

export interface TestReport {
  id?: string;
  file: File | string;
  fileName?: string;
  analysis?: string;
  filePath?: string;
  documentType?: string;
  currentState?: string;
  uploadedAt?: string;
}

/** Row from GET /api/patient/appointments */
export interface PatientAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  appointmentDate: string;
  status?: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  instructions?: string;
  createdAt: string;
}

export interface Xray {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  fileName: string;
  fileUrl: string;
  analysis?: string;
  uploadedAt: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'update' | 'result' | 'approval' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface ApiEnvelope<T> {
  message?: string;
  data: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  // Important: use absolute backend URL.
  // Relative `/api/...` hits the Angular dev server (localhost:4200) which redirects,
  // so patient portal pages appear "static" instead of loading real backend data.
  private baseUrl = `${environment.apiUrl}/api/patient`;

  constructor(private http: HttpClient) {}

  private extractData<T>() {
    // Backend responses are typically of form `{ message, data, total }`
    // but some implementations might return PascalCase. Support both.
    return (source: Observable<any>): Observable<T> =>
      source.pipe(map((response) => response?.data ?? response?.Data));
  }

  private extractFileName(filePath?: string): string {
    if (!filePath) return '';
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1] || '';
  }

  private mapRecordToMedicalHistory(item: any): MedicalHistory {
    const reportFilePath: string =
      item.reportFilePath ?? item.ReportFilePath ?? item.filePath ?? '';

    const lower = (reportFilePath || '').toLowerCase();
    const type: MedicalHistory['type'] =
      lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')
        ? 'xray'
        : lower.endsWith('.pdf')
          ? 'prescription'
          : 'test';

    const title: string =
      item.title ??
      item.disease ??
      item.Disease ??
      item.diagnosis ??
      item.Diagnosis ??
      item.description ??
      item.Description ??
      '';

    return {
      id: item.id ?? item.Id ?? '',
      date: item.date ?? item.recordDate ?? item.createdAt ?? new Date().toISOString(),
      recordDate: item.recordDate ?? item.RecordDate,
      type,
      title,
      description: item.description ?? item.Description ?? item.notes ?? item.Notes,
      doctorName: item.doctorName ?? item.DoctorName,
      hospitalName: item.hospitalName ?? item.HospitalName,
      diagnosis: item.diagnosis ?? item.Diagnosis,
      treatment: item.treatment ?? item.Treatment,
      disease: item.disease ?? item.Disease,
      symptoms: item.symptoms ?? item.Symptoms,
      notes: item.notes ?? item.Notes,
      fileName: item.fileName ?? item.FileName ?? this.extractFileName(reportFilePath),
      filePath: reportFilePath || undefined,
      reportFilePath: reportFilePath || null,
      currentState: item.currentState ?? item.CurrentState,
      source: 'record',
      attachments: reportFilePath ? [reportFilePath] : [],
      createdAt: item.createdAt ?? item.CreatedAt ?? item.recordDate ?? item.RecordDate ?? new Date().toISOString()
    };
  }

  // Get all patients (admin/doctor use)
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${environment.apiUrl}/api/patients`);
  }

  // Get patient by ID
  getPatientById(id: string): Observable<Patient> {
    if (id === 'current') {
      return this.http.get<any>(`${this.baseUrl}/profile`).pipe(
        this.extractData<any>(),
        map((data) => {
          const dobRaw = data?.dateOfBirth ?? data?.DateOfBirth ?? '';
          const dob =
            typeof dobRaw === 'string' ? dobRaw.split('T')[0] : (dobRaw as any);

          const fullName = data?.fullName ?? data?.FullName ?? '';
          const phoneNumber = data?.phoneNumber ?? data?.PhoneNumber ?? '';
          const cnic = data?.cnic ?? data?.CNIC ?? '';
          const city = data?.city ?? data?.City ?? '';
          const province = data?.province ?? data?.Province ?? '';

          return {
            id: 'current',
            name: fullName,
            fullName,
            email: data?.email ?? data?.Email ?? '',
            phone: phoneNumber,
            phoneNumber,
            cnic,
            city,
            province,
            address: [city, province].filter((x: string) => !!x).join(', '),
            dateOfBirth: dob,
            gender: data?.gender ?? data?.Gender,
            profilePictureUrl: data?.profilePictureUrl ?? data?.ProfilePictureUrl ?? data?.profilePicturePath ?? data?.ProfilePicturePath ?? undefined
          } as Patient;
        }),
        catchError(() => of({ id: 'current', name: '', email: '' } as Patient))
      );
    }
    return this.http.get<Patient>(`${environment.apiUrl}/api/patients/${id}`).pipe(
      catchError(() => of({ id, name: '', email: '' } as Patient))
    );
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

  // Get patient medical history (old endpoint)
  getPatientMedicalHistory(patientId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/patients/${patientId}/medical-history`);
  }

  // Patient Portal APIs

  // GET /api/patient/history → Medical records
  getHistory(): Observable<MedicalHistory[]> {
    const fromRecords$ = this.http
      .get<any>(`${this.baseUrl}/records`)
      .pipe(this.extractData<any[]>(), map((items) => (items || []).map((item) => this.mapRecordToMedicalHistory(item))), catchError(() => of([])));

    const fromDocs$ = this.http
      .get<any>(`${this.baseUrl}/documents`)
      .pipe(
        this.extractData<any[]>(),
        map((docs) =>
          (docs || []).map((d) => {
            const docType = (d.type ?? d.documentType ?? '').toString().toLowerCase();
            const type: MedicalHistory['type'] =
              docType.includes('xray') || docType === 'xray' ? 'xray'
              : docType.includes('pres') || docType === 'prescription' ? 'prescription'
              : docType.includes('report') || docType.includes('lab') || docType === 'report' ? 'test'
              : 'visit';
            const filePath = d.filePath ?? d.FilePath ?? d.file ?? d.File ?? '';

            return {
              id: d.id ?? d.Id ?? '',
              date: d.uploadedAt ?? d.createdAt ?? new Date().toISOString(),
              type,
              title: d.name ?? d.fileName ?? d.DocumentType ?? d.documentType ?? 'Document',
              description: d.currentState ?? d.currentState ?? d.CurrentState,
              fileName: d.fileName ?? d.FileName ?? this.extractFileName(filePath),
              filePath: filePath || undefined,
              reportFilePath: filePath || null,
              currentState: d.currentState ?? d.CurrentState,
              doctorName: '',
              source: 'document',
              attachments: [],
              createdAt: d.createdAt ?? d.uploadedAt ?? new Date().toISOString()
            } as MedicalHistory;
          })
        ),
        catchError(() => of([]))
      );

    // Include patient metrics in the timeline.
    const fromMetrics$ = this.getMetrics().pipe(
      map((metrics) =>
        (metrics || []).map((m) => ({
          id: m.id ?? '',
          date: m.date ?? new Date().toISOString(),
          recordDate: m.date,
          type: 'metric' as MedicalHistory['type'],
          title: 'Health Metrics',
          description: m.symptoms ?? m.notes ?? '',
          doctorName: '',
          symptoms: m.symptoms,
          notes: m.notes,
          source: 'metric',
          attachments: [],
          createdAt: m.date ?? new Date().toISOString()
        })) as MedicalHistory[]
      ),
      catchError(() => of([]))
    );

    return forkJoin({ fromRecords: fromRecords$, fromDocs: fromDocs$, fromMetrics: fromMetrics$ }).pipe(
      map(({ fromRecords, fromDocs, fromMetrics }) => [...fromRecords, ...fromDocs, ...fromMetrics])
    );
  }

  // POST /api/patient/metrics { vitals }
  addMetrics(metrics: HealthMetric): Observable<HealthMetric> {
    return this.http.post<HealthMetric>(`${this.baseUrl}/metrics`, metrics);
  }

  // Get metrics history
  getMetrics(): Observable<HealthMetric[]> {
    return this.http.get<any>(`${this.baseUrl}/metrics`).pipe(
      this.extractData<any[]>(),
      map((items) =>
        (items || []).map((m) => ({
          id: m.id ?? m.Id,
          date: m.date ?? m.Date,
          bloodPressure: m.bloodPressure ?? m.BloodPressure,
          heartRate: m.heartRate ?? m.HeartRate,
          temperature: m.temperature ?? m.Temperature,
          weight: m.weight ?? m.Weight,
          height: m.height ?? m.Height,
          bloodSugar: m.bloodSugar ?? m.BloodSugar,
          symptoms: m.symptoms ?? m.Symptoms,
          notes: m.notes ?? m.Notes
        }))
      ),
    );
  }

  // POST /api/patient/chatbot { query } → AI response
  sendChatbotQuery(message: ChatbotMessage): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>(`${this.baseUrl}/chatbot`, message).pipe(
      catchError(() => of({
        response: 'Chatbot API is not available yet. Please try again later.'
      }))
    );
  }

  // GET /api/patient/doctors?filters={city, specialty, disease, experience}
  searchDoctors(filters?: {
    city?: string;
    specialty?: string;
    disease?: string;
    experience?: number;
  }): Observable<Doctor[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.city) params = params.set('city', filters.city);
      if (filters.specialty) params = params.set('specialty', filters.specialty);
      if (filters.disease) params = params.set('disease', filters.disease);
      if (filters.experience) params = params.set('experience', filters.experience.toString());
    }
    return this.http.get<any>(`${this.baseUrl}/doctors`, { params }).pipe(
      this.extractData<Doctor[]>(),
      map((rows) => (rows || []).map((doctor) => this.normalizeDoctorSearchResult(doctor))),
      catchError(() => of([]))
    );
  }

  private normalizeDoctorSearchResult(d: any): Doctor {
    const qualifications = Array.isArray(d?.qualifications ?? d?.Qualifications)
      ? (d.qualifications ?? d.Qualifications).map((item: unknown) => String(item).trim()).filter(Boolean)
      : [];
    const ratingValue = Number(d?.rating ?? d?.Rating ?? NaN);
    const experienceValue = Number(d?.experience ?? d?.ExperienceYears ?? d?.experienceYears ?? 0);

    return {
      id: String(d?.id ?? d?.Id ?? ''),
      name: String(d?.name ?? d?.FullName ?? d?.fullName ?? '').trim(),
      specialty: String(d?.specialty ?? d?.Specialty ?? d?.specialization ?? d?.Specialization ?? '').trim(),
      city: String(d?.city ?? d?.City ?? '').trim(),
      experience: Number.isFinite(experienceValue) ? experienceValue : 0,
      qualifications,
      hospital: String(d?.hospital ?? d?.Hospital ?? d?.HospitalName ?? '').trim() || undefined,
      phone: String(d?.phone ?? d?.PhoneNumber ?? '').trim() || undefined,
      email: String(d?.email ?? d?.Email ?? '').trim() || undefined,
      rating: Number.isFinite(ratingValue) ? ratingValue : undefined,
      profilePictureUrl: d?.profilePictureUrl ?? d?.ProfilePictureUrl ?? d?.profilePicturePath ?? d?.ProfilePicturePath ?? undefined
    };
  }

  /** Scheduled appointments for the logged-in patient (from database). */
  getMyAppointments(page = 1, pageSize = 50): Observable<{ data: PatientAppointment[]; total: number }> {
    return this.http
      .get<any>(`${this.baseUrl}/appointments?page=${page}&pageSize=${pageSize}`)
      .pipe(
        map((r) => {
          const raw = (r?.data ?? r?.Data ?? []) as any[];
          const data = (raw || []).map((a) => ({
            id: String(a.id ?? a.Id ?? ''),
            patientId: String(a.patientId ?? a.PatientId ?? ''),
            doctorId: String(a.doctorId ?? a.DoctorId ?? ''),
            doctorName: a.doctorName ?? a.DoctorName ?? '',
            appointmentDate: (a.appointmentDate ?? a.AppointmentDate ?? '').toString(),
            status: a.status ?? a.Status,
            notes: a.notes ?? a.Notes
          })) as PatientAppointment[];
          return {
            data,
            total: r?.total ?? r?.Total ?? data.length
          };
        })
      );
  }

  // POST /api/patient/reports { document } → Upload/AI analysis
  uploadReport(file: File): Observable<TestReport> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', 'report');
    return this.http.post<TestReport>(`${this.baseUrl}/upload-document`, formData);
  }

  // Get uploaded reports
  getReports(): Observable<TestReport[]> {
    return this.http.get<any>(`${this.baseUrl}/documents`).pipe(
      this.extractData<any[]>(),
      map((items) =>
        (items || []).map((d) => {
          const filePath = d.filePath ?? d.FilePath ?? '';
          return {
            id: d.id ?? d.Id,
            file: filePath,
            filePath,
            fileName: this.extractFileName(filePath),
            documentType: d.documentType ?? d.DocumentType,
            currentState: d.currentState ?? d.CurrentState,
            analysis: '',
            uploadedAt: d.uploadedAt ?? d.UploadedAt
          } as TestReport;
        })
      ),
      catchError(() => of([]))
    );
  }

  // GET /api/patient/prescriptions
  getPrescriptions(): Observable<Prescription[]> {
    const fromRecords$ = this.http
      .get<any>(`${this.baseUrl}/prescriptions`)
      .pipe(this.extractData<any[]>(), catchError(() => of([])));

    const fromDocs$ = this.http
      .get<any>(`${this.baseUrl}/documents`)
      .pipe(
        this.extractData<any[]>(),
        map((docs) =>
          (docs || [])
            .filter((d) => {
              const docType = (d.type ?? d.documentType ?? '').toString().toLowerCase();
              return docType === 'prescription' || docType.includes('pres');
            })
            .map((d) => ({
              id: d.id ?? d.Id ?? '',
              patientId: d.patientId ?? d.PatientId ?? '',
              doctorId: '',
              doctorName: d.currentState ? 'Doctor' : 'Uploaded by patient',
              date: d.uploadedAt ?? d.createdAt ?? new Date().toISOString(),
              medications: [],
              instructions: undefined,
              createdAt: d.createdAt ?? d.uploadedAt ?? new Date().toISOString()
            })) as Prescription[]
        ),
        catchError(() => of([]))
      );

    return forkJoin({ fromRecords: fromRecords$, fromDocs: fromDocs$ }).pipe(
      map(({ fromRecords, fromDocs }) => ([...(fromRecords || []), ...(fromDocs || [])]) as Prescription[])
    );
  }

  // GET /api/patient/xrays
  getXrays(): Observable<Xray[]> {
    const fromRecords$ = this.http
      .get<any>(`${this.baseUrl}/xrays`)
      .pipe(this.extractData<any[]>(), catchError(() => of([])));

    const fromDocs$ = this.http
      .get<any>(`${this.baseUrl}/documents`)
      .pipe(
        this.extractData<any[]>(),
        map((docs) =>
          (docs || [])
            .filter((d) => {
              const docType = (d.type ?? d.documentType ?? '').toString().toLowerCase();
              if (docType === 'xray' || docType.includes('xray')) return true;
              // Also infer from file extension when type isn't perfect.
              const fileName: string = d.fileName ?? d.filePath ?? d.FilePath ?? '';
              const lower = (fileName || '').toLowerCase();
              return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
            })
            .map((d) => ({
              id: d.id ?? d.Id ?? '',
              patientId: d.patientId ?? d.PatientId ?? '',
              doctorId: '',
              doctorName: '',
              fileName: d.fileName ?? d.name ?? '',
              fileUrl: d.fileUrl ?? d.filePath ?? d.FilePath ?? '',
              analysis: undefined,
              uploadedAt: d.uploadedAt ?? d.createdAt ?? new Date().toISOString(),
              createdAt: d.createdAt ?? d.uploadedAt ?? new Date().toISOString()
            })) as Xray[]
        ),
        catchError(() => of([]))
      );

    return forkJoin({ fromRecords: fromRecords$, fromDocs: fromDocs$ }).pipe(
      map(({ fromRecords, fromDocs }) => ([...(fromRecords || []), ...(fromDocs || [])]) as Xray[])
    );
  }

  // Upload documents (general)
  uploadDocument(file: File, type?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (type) formData.append('documentType', type);
    return this.http.post<any>(`${this.baseUrl}/upload-document`, formData);
  }

  // Get notifications
  getNotifications(): Observable<Notification[]> {
    return this.http.get<any>(`${this.baseUrl}/notifications`).pipe(
      this.extractData<any[]>(),
      map((items) =>
        (items || []).map((n) => {
          const channel: string = n.channel ?? n.Channel ?? '';
          return {
            id: n.id ?? n.Id ?? '',
            type: 'update',
            title: channel || 'Notification',
            message: n.message ?? n.Message ?? '',
            read: n.isRead ?? n.IsRead ?? false,
            createdAt: n.sentAt ?? n.SentAt ?? new Date().toISOString()
          } as Notification;
        })
      ),
      catchError(() => of([]))
    );
  }

  // Mark notification as read
  markNotificationRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  // Get access records with search
  getAccessRecords(search?: string): Observable<MedicalHistory[]> {
    // Component does client-side search; return the full dataset here.
    return this.getHistory();
  }

  // Export records
  exportRecords(format: 'pdf' | 'csv' = 'pdf'): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/records/export?format=${format}`, {
      responseType: 'blob'
    });
  }

  // Verify CNIC
  verifyCNIC(cnic: string): Observable<{ verified: boolean; message?: string }> {
    return this.http.post<{ verified: boolean; message?: string }>(`${this.baseUrl}/verify-cnic`, { cnic });
  }

  // Update profile
  updateProfile(profile: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/profile`, profile);
  }

  uploadProfilePicture(file: File): Observable<{ profilePictureUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${environment.apiUrl}/api/profile/upload-picture`, formData).pipe(
      map((res) => ({
        profilePictureUrl: res?.profilePictureUrl ?? res?.ProfilePictureUrl ?? ''
      }))
    );
  }

  // Explicit profile getter for available backend API.
  getProfile(): Observable<Patient> {
    return this.http.get<ApiEnvelope<Patient>>(`${this.baseUrl}/profile`).pipe(this.extractData<Patient>());
  }

  // Connects to POST /api/patient/upload-history.
  uploadMedicalHistory(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/upload-history`, data);
  }

  // Connects to GET /api/patient/analytics.
  getPersonalAnalytics(): Observable<any> {
    return this.http.get<ApiEnvelope<any>>(`${this.baseUrl}/analytics`).pipe(this.extractData<any>());
  }
}

