import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { formatPakistaniCnicDisplay } from '../common/shared/pak-input-format.directive';

export interface Doctor {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  specialization?: string;
  /** Pakistani national ID (formatted when displayed). */
  cnic?: string;
  hospital?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient {
  // CNIC-first identity key for patient workflows.
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  cnic?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  /** Required when registering a new patient (API). */
  city?: string;
  province?: string;
  medicalHistory?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Prescription {
  id?: string;
  patientId: string;
  image?: File | string;
  ocrText?: string;
  aiAnalysis?: string;
  medications?: Medication[];
  notes?: string;
  createdAt?: string;
}

interface ApiEnvelope<T> {
  message?: string;
  data: T;
  total?: number;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

/** Response from FastAPI POST /ocr/prescription */
export interface PrescriptionOcrMedicine {
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
}

export interface PrescriptionOcrData {
  raw_text: string;
  medicines: PrescriptionOcrMedicine[];
  doctor_notes: string | null;
  confidence: { value: number; label: string };
}

export interface PrescriptionOcrEnvelope {
  success: boolean;
  data: PrescriptionOcrData | null;
  error: string | null;
}

export interface Xray {
  id?: string;
  patientId: string;
  image?: File | string;
  aiAnalysis?: string;
  findings?: string;
  recommendations?: string;
  createdAt?: string;
}

export interface Message {
  id?: string;
  to: string; // patient ID
  from?: string; // doctor ID
  content: string;
  medicalRecordId?: string;
  channel?: string;
  timestamp?: string;
  read?: boolean;
}

export interface PatientAnalytics {
  patientId: string;
  totalVisits: number;
  totalPrescriptions: number;
  totalXrays: number;
  lastVisit?: string;
  healthTrends?: {
    date: string;
    metric: string;
    value: number;
  }[];
  medications?: {
    name: string;
    adherence: number;
  }[];
}

export interface Document {
  id?: string;
  patientId: string;
  name: string;
  type: 'prescription' | 'xray' | 'report' | 'other';
  file?: File | string;
  size?: number;
  uploadedAt?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
}

/** Row from GET /api/doctor/patients/{patientId}/records */
export interface PatientMedicalRecord {
  id: string;
  patientId?: string;
  recordDate: string;
  diagnosis: string;
  treatment: string;
  disease: string;
  description: string;
  reportFilePath?: string | null;
  doctorName?: string;
  hospitalName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private baseUrl = `${environment.apiUrl}/api/doctor`;
  private adminBaseUrl = `${environment.apiUrl}/api/admin`;
  private authBaseUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  /** POST multipart `file` to AI service; requires X-API-Key when enabled on the service. */
  prescriptionOcr(image: File): Observable<PrescriptionOcrEnvelope> {
    const url = this.prescriptionOcrUrl();
    const form = new FormData();
    form.append('file', image);
    let headers = new HttpHeaders();
    if (environment.ocrApiKey) {
      headers = headers.set('X-API-Key', environment.ocrApiKey);
    }
    return this.http.post<PrescriptionOcrEnvelope>(url, form, { headers });
  }

  private prescriptionOcrUrl(): string {
    const path = '/ocr/prescription';
    const base = (environment.ocrApiBaseUrl ?? '').replace(/\/$/, '');
    return base ? `${base}${path}` : path;
  }

  private extractData<T>() {
    return (source: Observable<any>): Observable<T> =>
      source.pipe(map((response) => response?.data ?? response?.Data));
  }

  private normalizeCnic(cnic: string): string {
    return (cnic || '').replace(/\D/g, '');
  }

  private readonly localPatientCacheKey = 'doctor_registered_patients_cache';

  private getLocalPatientsCache(): Patient[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.localPatientCacheKey);
      return raw ? (JSON.parse(raw) as Patient[]) : [];
    } catch {
      return [];
    }
  }

  private saveLocalPatientToCache(patient: Patient): void {
    if (typeof localStorage === 'undefined') return;
    const current = this.getLocalPatientsCache();
    const key = (patient.id || '').trim() || this.normalizeCnic(patient.cnic || '');
    const deduped = current.filter((p) => {
      const pKey = (p.id || '').trim() || this.normalizeCnic(p.cnic || '');
      return pKey !== key;
    });
    deduped.unshift(patient);
    localStorage.setItem(this.localPatientCacheKey, JSON.stringify(deduped.slice(0, 200)));
  }

  // Get all doctors
  getDoctors(): Observable<Doctor[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${this.adminBaseUrl}/doctors`).pipe(
      this.extractData<any[]>(),
      map((rows) => (rows ?? []).map((d) => this.normalizeDoctorListRow(d))),
      catchError(() => of([]))
    );
  }

  private normalizeDoctorListRow(d: any): Doctor {
    const rawCnic = d?.cnic ?? d?.CNIC ?? d?.license ?? '';
    const digits = String(rawCnic).replace(/\D/g, '');
    const cnic = digits.length === 13 ? formatPakistaniCnicDisplay(digits) : String(rawCnic ?? '').trim();
    return {
      id: String(d?.id ?? d?.Id ?? ''),
      name: String(d?.name ?? d?.FullName ?? ''),
      fullName: d?.FullName ?? d?.name,
      email: String(d?.email ?? d?.Email ?? ''),
      phone: d?.phone ?? d?.PhoneNumber,
      specialization: String(d?.specialization ?? d?.specialty ?? d?.Specialty ?? ''),
      cnic,
      hospital: d?.hospital ?? d?.HospitalName ?? d?.hospitalName,
      createdAt: d?.createdAt,
      updatedAt: d?.updatedAt,
    };
  }

  // Get doctor by ID
  getDoctorById(id: string): Observable<Doctor> {
    return this.getDoctors().pipe(
      map((doctors) => doctors.find((doctor) => doctor.id === id) as Doctor)
    );
  }

  // Create new doctor
  createDoctor(doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.adminBaseUrl}/doctors`, doctor);
  }

  // Update doctor
  updateDoctor(id: string, doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.adminBaseUrl}/doctors/${id}`, doctor);
  }

  // Delete doctor
  deleteDoctor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminBaseUrl}/doctors/${id}`);
  }

  // Get doctor's patients
  getDoctorPatients(_doctorId: string): Observable<any[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${this.adminBaseUrl}/patients`).pipe(this.extractData<any[]>());
  }

  // Patient Management APIs
  getPatients(search?: string): Observable<Patient[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<any>(`${this.baseUrl}/patients`, { params }).pipe(
      this.extractData<Patient[]>(),
      map((items) => {
        const apiPatients = (items || []).map((p: any) => ({
          ...p,
          name: p.name ?? p.fullName ?? '',
          phone: p.phone ?? p.phoneNumber ?? p.phone ?? '',
          status: p.status ?? 'active'
        })) as Patient[];
        const localPatients = this.getLocalPatientsCache();
        const merged = [...apiPatients];
        for (const p of localPatients) {
          const exists = merged.some((m) =>
            (m.id && p.id && m.id === p.id) ||
            (!!m.cnic && !!p.cnic && this.normalizeCnic(m.cnic) === this.normalizeCnic(p.cnic))
          );
          if (!exists) merged.push(p);
        }
        if (!search) return merged;
        const term = search.toLowerCase().trim();
        const normalizedSearch = this.normalizeCnic(search);
        return merged.filter((p) =>
          (p.name || '').toLowerCase().includes(term) ||
          (p.email || '').toLowerCase().includes(term) ||
          (p.phone || '').toLowerCase().includes(term) ||
          (p.cnic || '').toLowerCase().includes(term) ||
          (!!normalizedSearch && this.normalizeCnic(p.cnic || '') === normalizedSearch)
        );
      })
    );
  }

  getPatientById(id: string): Observable<Patient> {
    return this.getPatients().pipe(
      map((patients) => patients.find((patient) => patient.id === id) as Patient)
    );
  }

  /**
   * Resolves route param (user id or CNIC) to a patient from the API.
   * Prefer this over getPatientById when the URL may contain a 13-digit CNIC.
   */
  resolvePatient(routeParam: string): Observable<Patient | null> {
    const term = (routeParam || '').trim();
    if (!term) return of(null);

    const digits = this.normalizeCnic(term);
    if (digits.length === 13) {
      return this.lookupPatientByCnic(digits).pipe(
        switchMap((res) => {
          if (res.exists && res.data) {
            return of(this.mapLookupPatient(res.data));
          }
          return this.findPatientInCachedLists(term);
        })
      );
    }

    return this.findPatientInCachedLists(term);
  }

  private mapLookupPatient(data: Patient & { city?: string; province?: string }): Patient {
    const addr =
      data.address ||
      [data.city, data.province].filter((x) => !!x && String(x).trim()).join(', ') ||
      undefined;
    return {
      id: data.id,
      name: data.name ?? data.fullName ?? '',
      fullName: data.fullName ?? data.name,
      email: data.email ?? '',
      phone: data.phone ?? '',
      cnic: data.cnic ?? '',
      dateOfBirth: data.dateOfBirth,
      gender: this.normalizeGender(data.gender),
      address: addr,
      medicalHistory: data.medicalHistory,
      status: data.status ?? 'active'
    };
  }

  private normalizeGender(g: string | undefined): 'male' | 'female' | 'other' | undefined {
    if (!g) return undefined;
    const x = g.toLowerCase();
    if (x === 'male' || x === 'female' || x === 'other') return x;
    if (g === 'Male') return 'male';
    if (g === 'Female') return 'female';
    if (g === 'Other') return 'other';
    return undefined;
  }

  private findPatientInCachedLists(term: string): Observable<Patient | null> {
    return this.getPatients(term).pipe(
      switchMap((fromSearch) => {
        const found = this.pickPatient(fromSearch, term);
        if (found) return of(found);
        return this.getPatients().pipe(map((all) => this.pickPatient(all, term)));
      })
    );
  }

  private pickPatient(patients: Patient[], term: string): Patient | null {
    if (!patients?.length) return null;
    const byId = patients.find((p) => p.id === term);
    if (byId) return byId;
    const n = this.normalizeCnic(term);
    if (n.length >= 11) {
      const byCnic = patients.find((p) => this.normalizeCnic(p.cnic || '') === n);
      if (byCnic) return byCnic;
    }
    return patients.find((p) => (p.cnic || '').replace(/\s/g, '') === term.replace(/\s/g, '')) || null;
  }

  getPatientRecordsList(patientId: string, page = 1, pageSize = 50): Observable<PatientMedicalRecord[]> {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    return this.http
      .get<any>(`${this.baseUrl}/patients/${encodeURIComponent(patientId)}/records`, { params })
      .pipe(
        map((res) => {
          const rows = res?.data ?? res?.Data ?? [];
          return (rows as any[]).map((r) => this.normalizeMedicalRecord(r));
        }),
        catchError(() => of([]))
      );
  }

  private normalizeMedicalRecord(r: any): PatientMedicalRecord {
    return {
      id: String(r.id ?? r.Id ?? ''),
      patientId: r.patientId ?? r.PatientId,
      recordDate: this.normalizeRecordDate(r.recordDate ?? r.RecordDate),
      diagnosis: String(r.diagnosis ?? r.Diagnosis ?? ''),
      treatment: String(r.treatment ?? r.Treatment ?? ''),
      disease: String(r.disease ?? r.Disease ?? ''),
      description: String(r.description ?? r.Description ?? ''),
      reportFilePath: r.reportFilePath ?? r.ReportFilePath ?? null,
      doctorName: r.doctorName ?? r.DoctorName ?? '',
      hospitalName: r.hospitalName ?? r.HospitalName ?? ''
    };
  }

  private normalizeRecordDate(v: unknown): string {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object' && v !== null) {
      try {
        return new Date(String(v)).toISOString();
      } catch {
        return String(v);
      }
    }
    return String(v);
  }

  registerPatient(patient: Partial<Patient>): Observable<Patient> {
    const normalizedCnic = this.normalizeCnic(patient.cnic || '');
    if (normalizedCnic.length !== 13) {
      return throwError(() => ({ error: { message: 'A valid 13-digit CNIC is required.' } }));
    }

    const fullName = (patient.name || patient.fullName || '').trim();
    if (fullName.length < 3) {
      return throwError(() => ({ error: { message: 'Full name must be at least 3 characters.' } }));
    }

    const city = (patient.city || '').trim();
    const province = (patient.province || '').trim();
    if (city.length < 2 || province.length < 2) {
      return throwError(() => ({ error: { message: 'City and province are required.' } }));
    }

    const rawPhone = (patient.phone || '').replace(/\D/g, '');
    if (rawPhone.length < 10) {
      return throwError(() => ({ error: { message: 'A valid phone number (at least 10 digits) is required.' } }));
    }
    let n = rawPhone;
    if (n.startsWith('0')) n = '92' + n.slice(1);
    else if (!n.startsWith('92')) n = '92' + n;
    const phoneNumber = '+' + n;

    const genderApi =
      patient.gender === 'female' ? 'Female' :
      patient.gender === 'other' ? 'Other' :
      'Male';

    const upsertPayload = {
      fullName,
      cnic: normalizedCnic,
      email: (patient.email || '').trim() || null,
      phoneNumber,
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString() : null,
      gender: genderApi,
      city,
      province,
      createPortalAccount: !!(patient.email || '').trim()
    };

    return this.http.post<any>(`${this.baseUrl}/patients/upsert-by-cnic`, upsertPayload).pipe(
      map((response) => {
        const data = response?.data ?? response?.Data ?? response;
        const created = {
          id: String(data?.id ?? data?.Id ?? ''),
          name: fullName,
          email: (patient.email || '').trim() || '',
          phone: phoneNumber,
          cnic: normalizedCnic,
          status: 'active' as const
        };
        if (created.id) this.saveLocalPatientToCache(created);
        return created;
      })
    );
  }

  lookupPatientByCnic(cnic: string): Observable<{ exists: boolean; data?: Patient }> {
    const normalizedCnic = this.normalizeCnic(cnic);
    return this.http.get<any>(`${this.baseUrl}/patients/lookup-by-cnic/${normalizedCnic}`).pipe(
      map((response) => ({
        exists: !!(response?.exists ?? response?.Exists),
        data: (response?.data ?? response?.Data) as Patient | undefined
      })),
      catchError(() =>
        this.getPatients(normalizedCnic).pipe(
          map((patients) => {
            const match = (patients || []).find((p) => this.normalizeCnic(p.cnic || '') === normalizedCnic);
            return match ? { exists: true, data: match } : { exists: false };
          }),
          catchError(() => of({ exists: false }))
        )
      )
    );
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.adminBaseUrl}/patients/${id}`, patient);
  }

  // Doctor profile APIs
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/profile`);
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/profile`, profile);
  }

  // Prescription APIs
  uploadPrescription(prescription: FormData | Prescription): Observable<Prescription> {
    const patientId = prescription instanceof FormData
      ? prescription.get('patientId')?.toString()
      : prescription.patientId;
    if (!patientId) {
      throw new Error('patientId is required to upload prescription.');
    }
    return this.http.post<Prescription>(`${this.baseUrl}/patients/${patientId}/records`, prescription);
  }

  getPrescriptions(patientId?: string): Observable<Prescription[]> {
    return this.http.get<any>(`${this.baseUrl}/prescriptions`).pipe(
      this.extractData<any[]>(),
      map((items) => {
        const list = (items || []) as any[];
        const filtered = patientId ? list.filter((x) => x.patientId === patientId) : list;
        return filtered as Prescription[];
      }),
      catchError(() => of([]))
    );
  }

  getPrescriptionById(id: string): Observable<Prescription> {
    return this.getPrescriptions().pipe(
      map((prescriptions) => prescriptions.find((item) => item.id === id) as Prescription)
    );
  }

  // X-Ray APIs
  uploadXray(xray: FormData | Xray): Observable<Xray> {
    const patientId = xray instanceof FormData ? xray.get('patientId')?.toString() : xray.patientId;
    if (!patientId) {
      throw new Error('patientId is required to upload xray.');
    }
    return this.http.post<Xray>(`${this.baseUrl}/patients/${patientId}/records`, xray);
  }

  getXrays(patientId?: string): Observable<Xray[]> {
    return this.http.get<any>(`${this.baseUrl}/xrays`).pipe(
      this.extractData<any[]>(),
      map((items) => {
        const list = (items || []) as any[];
        const filtered = patientId ? list.filter((x) => x.patientId === patientId) : list;
        // Map `analysis` -> `aiAnalysis` for UI compatibility.
        return filtered.map((x) => ({
          ...x,
          aiAnalysis: x.aiAnalysis ?? x.analysis,
          findings: x.findings ?? undefined,
          recommendations: x.recommendations ?? undefined
        })) as Xray[];
      }),
      catchError(() => of([]))
    );
  }

  getXrayById(id: string): Observable<Xray> {
    return this.getXrays().pipe(
      map((xrays) => xrays.find((item) => item.id === id) as Xray)
    );
  }

  // Secure Communication APIs
  sendMessage(message: Message): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}/patients/${message.to}/notifications`, {
      medicalRecordId: message.medicalRecordId,
      message: message.content,
      channel: message.channel || 'InApp'
    });
  }

  getMessages(patientId?: string): Observable<Message[]> {
    let params = new HttpParams();
    if (patientId) params = params.set('patientId', patientId);
    return this.http.get<any>(`${this.baseUrl}/messages`, { params }).pipe(
      map((response) => {
        const rows = (response?.data ?? response?.Data ?? []) as any[];
        return (rows || []).map((m) => ({
          id: m.id ?? m.Id,
          to: m.to ?? m.To ?? '',
          from: m.from ?? m.From,
          content: m.content ?? m.Content ?? '',
          medicalRecordId: m.medicalRecordId ?? m.MedicalRecordId,
          channel: m.channel ?? m.Channel,
          timestamp: m.timestamp ?? m.Timestamp ?? m.sentAt,
          read: m.read ?? m.Read ?? m.isRead
        })) as Message[];
      })
    );
  }

  // Patient Analytics APIs
  getPatientAnalytics(patientId: string): Observable<PatientAnalytics> {
    return this.http.get<any>(`${this.baseUrl}/patients/${encodeURIComponent(patientId)}/analytics`).pipe(
      map((response) => {
        const d = response?.data ?? response?.Data ?? {};
        return {
          patientId: String(d.patientId ?? d.PatientId ?? patientId),
          totalVisits: Number(d.totalVisits ?? d.TotalVisits ?? 0),
          totalPrescriptions: Number(d.totalPrescriptions ?? d.TotalPrescriptions ?? 0),
          totalXrays: Number(d.totalXrays ?? d.TotalXrays ?? 0),
          lastVisit: d.lastVisit ?? d.LastVisit,
          healthTrends: d.healthTrends ?? d.HealthTrends ?? [],
          medications: d.medications ?? d.Medications ?? []
        } as PatientAnalytics;
      })
    );
  }

  // Patient records APIs
  getPatientRecords(patientId: string, page = 1, pageSize = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/patients/${patientId}/records?page=${page}&pageSize=${pageSize}`);
  }

  updatePatientRecord(patientId: string, recordId: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/patients/${patientId}/records/${recordId}`, payload);
  }

  deletePatientRecord(patientId: string, recordId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/patients/${patientId}/records/${recordId}`);
  }

  approveAIResult(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/ai-results/${id}/approve`, {});
  }

  // Appointment APIs (same backend routes as AppointmentService).
  addAppointment(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/appointments`, payload);
  }

  getAppointments(page = 1, pageSize = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/appointments?page=${page}&pageSize=${pageSize}`);
  }

  updateAppointment(id: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/appointments/${id}`, payload);
  }

  deleteAppointment(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/appointments/${id}`);
  }

  // Document Storage APIs
  uploadDocument(document: FormData | Document): Observable<Document> {
    const patientId = document instanceof FormData
      ? document.get('patientId')?.toString()
      : document.patientId;
    if (!patientId) {
      throw new Error('patientId is required to upload document.');
    }
    return this.http.post<Document>(`${this.baseUrl}/patients/${patientId}/records`, document);
  }

  getDocuments(patientId?: string): Observable<Document[]> {
    const params: HttpParams | undefined = patientId ? new HttpParams().set('patientId', patientId) : undefined;
    return this.http.get<any>(`${this.baseUrl}/documents`, { params } as any).pipe(
      this.extractData<any[]>(),
      map((docs) =>
        (docs || []).map((d: any) => ({
          id: d.id,
          patientId: d.patientId,
          name: d.name ?? d.fileName ?? 'Document',
          type: d.type ?? 'other',
          file: d.fileUrl ?? d.filePath ?? d.file,
          size: d.size,
          uploadedAt: d.uploadedAt ?? d.createdAt,
          verificationStatus: d.verificationStatus,
          verifiedBy: d.verifiedBy,
          verifiedAt: d.verifiedAt
        })) as Document[]
      ),
      catchError(() => of([]))
    );
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documents/${id}`);
  }
}

