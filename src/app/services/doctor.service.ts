import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface Patient {
  id: string;
  name: string;
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
  private baseUrl = '/api/doctor';

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

  // Patient Management APIs
  getPatients(search?: string): Observable<Patient[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Patient[]>(`${this.baseUrl}/patients`, { params });
  }

  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/patients/${id}`);
  }

  registerPatient(patient: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(`${this.baseUrl}/patients`, patient);
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/patients/${id}`, patient);
  }

  // Prescription APIs
  uploadPrescription(prescription: FormData | Prescription): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.baseUrl}/prescriptions`, prescription);
  }

  getPrescriptions(patientId?: string): Observable<Prescription[]> {
    let params = new HttpParams();
    if (patientId) {
      params = params.set('patientId', patientId);
    }
    return this.http.get<Prescription[]>(`${this.baseUrl}/prescriptions`, { params });
  }

  getPrescriptionById(id: string): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.baseUrl}/prescriptions/${id}`);
  }

  // X-Ray APIs
  uploadXray(xray: FormData | Xray): Observable<Xray> {
    return this.http.post<Xray>(`${this.baseUrl}/xrays`, xray);
  }

  getXrays(patientId?: string): Observable<Xray[]> {
    let params = new HttpParams();
    if (patientId) {
      params = params.set('patientId', patientId);
    }
    return this.http.get<Xray[]>(`${this.baseUrl}/xrays`, { params });
  }

  getXrayById(id: string): Observable<Xray> {
    return this.http.get<Xray>(`${this.baseUrl}/xrays/${id}`);
  }

  // Secure Communication APIs
  sendMessage(message: Message): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}/messages`, message);
  }

  getMessages(patientId?: string): Observable<Message[]> {
    let params = new HttpParams();
    if (patientId) {
      params = params.set('patientId', patientId);
    }
    return this.http.get<Message[]>(`${this.baseUrl}/messages`, { params });
  }

  // Patient Analytics APIs
  getPatientAnalytics(patientId: string): Observable<PatientAnalytics> {
    return this.http.get<PatientAnalytics>(`${this.baseUrl}/analytics/${patientId}`);
  }

  // Document Storage APIs
  uploadDocument(document: FormData | Document): Observable<Document> {
    return this.http.post<Document>(`${this.baseUrl}/documents`, document);
  }

  getDocuments(patientId?: string): Observable<Document[]> {
    let params = new HttpParams();
    if (patientId) {
      params = params.set('patientId', patientId);
    }
    return this.http.get<Document[]>(`${this.baseUrl}/documents`, { params });
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documents/${id}`);
  }
}

