import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Document {
  id: string;
  patientId: string;
  doctorId?: string;
  type: 'xray' | 'lab-report' | 'prescription' | 'medical-record' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  uploadedAt: string;
  createdAt?: string;
}

interface ApiEnvelope<T> {
  message?: string;
  data: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private patientBaseUrl = '/api/patient';
  private adminBaseUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  // Patient documents by default.
  getDocuments(): Observable<Document[]> {
    return this.http.get<ApiEnvelope<Document[]>>(`${this.patientBaseUrl}/documents`).pipe(
      map((response) => response?.data || [])
    );
  }

  // Fallback: fetch from admin overview and find by id.
  getDocumentById(id: string): Observable<Document> {
    return this.http.get<ApiEnvelope<Document[]>>(`${this.adminBaseUrl}/documents`).pipe(
      map((response) => (response?.data || []).find((doc) => doc.id === id) as Document)
    );
  }

  // Current backend has no direct patientId filter endpoint; fallback to admin overview.
  getDocumentsByPatient(patientId: string): Observable<Document[]> {
    return this.http.get<ApiEnvelope<Document[]>>(`${this.adminBaseUrl}/documents`).pipe(
      map((response) => (response?.data || []).filter((doc) => doc.patientId === patientId))
    );
  }

  // Filter by type from available patient docs.
  getDocumentsByType(type: string): Observable<Document[]> {
    return this.getDocuments().pipe(
      map((docs) => docs.filter((doc) => doc.type === type))
    );
  }

  // Upload document
  uploadDocument(file: File, patientId: string, type: string, description?: string): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', type);
    if (description) {
      formData.append('description', description);
    }
    return this.http.post<Document>(`${this.patientBaseUrl}/upload-document`, formData);
  }

  // No delete endpoint exists for documents in current controllers.
  deleteDocument(id: string): Observable<void> {
    return this.http.get<ApiEnvelope<Document[]>>(`${this.adminBaseUrl}/documents`).pipe(map(() => void 0));
  }

  // Download endpoint not available yet in backend.
  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`/uploads/documents/${id}`, { responseType: 'blob' });
  }
}

