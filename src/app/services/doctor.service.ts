import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Doctor {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
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

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private baseUrl = `${environment.apiUrl}/api/doctor`;
  private adminBaseUrl = `${environment.apiUrl}/api/admin`;
  private authBaseUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

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
    return this.http.get<ApiEnvelope<Doctor[]>>(`${this.adminBaseUrl}/doctors`).pipe(
      this.extractData<Doctor[]>(),
      catchError(() => of([]))
    );
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
  getDoctorPatients(doctorId: string): Observable<any[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${this.adminBaseUrl}/patients`).pipe(
      this.extractData<any[]>(),
      catchError(() => of([]))
    );
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
      }),
      catchError(() => of(this.getLocalPatientsCache()))
    );
  }

  getPatientById(id: string): Observable<Patient> {
    return this.getPatients().pipe(
      map((patients) => patients.find((patient) => patient.id === id) as Patient)
    );
  }

  registerPatient(patient: Partial<Patient>): Observable<Patient> {
    const normalizedCnic = this.normalizeCnic(patient.cnic || '');
    const upsertPayload = {
      fullName: patient.name || patient.fullName || '',
      cnic: normalizedCnic,
      email: patient.email || null,
      phoneNumber: patient.phone || null,
      dateOfBirth: patient.dateOfBirth || null,
      gender: patient.gender || null,
      city: '',
      province: '',
      createPortalAccount: !!patient.email
    };

    return this.http.post<any>(`${this.baseUrl}/patients/upsert-by-cnic`, upsertPayload).pipe(
      map((response) => response?.data ?? response?.Data ?? response),
      catchError((error) => {
        // Compatibility fallback for backend instances not yet updated
        // with /api/doctor/patients/upsert-by-cnic.
        if (error?.status !== 404) {
          return throwError(() => error);
        }

        const fallbackEmail =
          (patient.email || '').trim() ||
          `${normalizedCnic || Date.now()}@noaccount.medrotic.local`;
        const genderValue =
          patient.gender === 'female' ? 'Female' :
          patient.gender === 'other' ? 'Other' :
          'Male';

        const legacyPayload = {
          fullName: patient.name || patient.fullName || 'Patient',
          email: fallbackEmail,
          password: 'Patient@123!',
          confirmPassword: 'Patient@123!',
          cnic: normalizedCnic,
          phoneNumber: (patient.phone || '03001234567').replace(/\s/g, ''),
          dateOfBirth: patient.dateOfBirth || '1990-01-01T00:00:00.000Z',
          gender: genderValue,
          city: 'Sahiwal',
          province: 'Punjab'
        };

        return this.http.post<any>(`${this.authBaseUrl}/register-patient`, legacyPayload).pipe(
          map(() => {
            const created = {
            id: '',
            name: legacyPayload.fullName,
            email: legacyPayload.email,
            phone: legacyPayload.phoneNumber,
            cnic: normalizedCnic,
            status: 'active'
            } as Patient;
            this.saveLocalPatientToCache(created);
            return created;
          })
        );
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
    return this.http.get<ApiEnvelope<Message[]>>(`${this.baseUrl}/messages`, { params }).pipe(
      this.extractData<Message[]>(),
      catchError(() => of([]))
    );
  }

  // Patient Analytics APIs
  getPatientAnalytics(patientId: string): Observable<PatientAnalytics> {
    return this.http.get<any>(`${this.baseUrl}/analytics`).pipe(
      map((response) => response?.data ?? response),
      catchError(() => of({} as PatientAnalytics))
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
      this.extractData<Document[]>(),
      map((docs) => docs || []),
      catchError(() => of([]))
    );
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documents/${id}`);
  }
}

