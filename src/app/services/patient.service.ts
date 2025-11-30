import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  medicalHistory?: string;
  cnic?: string;
  cnicVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalHistory {
  id: string;
  date: string;
  type: 'prescription' | 'xray' | 'test' | 'visit' | 'metric';
  title: string;
  description?: string;
  doctorName?: string;
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
}

export interface TestReport {
  id?: string;
  file: File | string;
  fileName?: string;
  analysis?: string;
  uploadedAt?: string;
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

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private baseUrl = '/api/patient';

  constructor(private http: HttpClient) {}

  // Get all patients (admin/doctor use)
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>('/api/patients');
  }

  // Get patient by ID
  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`/api/patients/${id}`);
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
    return this.http.get<any>(`/api/patients/${patientId}/medical-history`);
  }

  // Patient Portal APIs

  // GET /api/patient/history → Medical records
  getHistory(): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/history`);
  }

  // POST /api/patient/metrics { vitals }
  addMetrics(metrics: HealthMetric): Observable<HealthMetric> {
    return this.http.post<HealthMetric>(`${this.baseUrl}/metrics`, metrics);
  }

  // Get metrics history
  getMetrics(): Observable<HealthMetric[]> {
    return this.http.get<HealthMetric[]>(`${this.baseUrl}/metrics`);
  }

  // POST /api/patient/chatbot { query } → AI response
  sendChatbotQuery(message: ChatbotMessage): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>(`${this.baseUrl}/chatbot`, message);
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
    return this.http.get<Doctor[]>(`${this.baseUrl}/doctors`, { params });
  }

  // POST /api/patient/reports { document } → Upload/AI analysis
  uploadReport(file: File): Observable<TestReport> {
    const formData = new FormData();
    formData.append('document', file);
    return this.http.post<TestReport>(`${this.baseUrl}/reports`, formData);
  }

  // Get uploaded reports
  getReports(): Observable<TestReport[]> {
    return this.http.get<TestReport[]>(`${this.baseUrl}/reports`);
  }

  // GET /api/patient/prescriptions
  getPrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.baseUrl}/prescriptions`);
  }

  // GET /api/patient/xrays
  getXrays(): Observable<Xray[]> {
    return this.http.get<Xray[]>(`${this.baseUrl}/xrays`);
  }

  // Upload documents (general)
  uploadDocument(file: File, type?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (type) formData.append('type', type);
    return this.http.post<any>(`${this.baseUrl}/documents`, formData);
  }

  // Get notifications
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications`);
  }

  // Mark notification as read
  markNotificationRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  // Get access records with search
  getAccessRecords(search?: string): Observable<MedicalHistory[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/records`, { params });
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
}

