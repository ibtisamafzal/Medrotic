import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  constructor(private http: HttpClient) {}

  // Get all documents
  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>('/api/documents');
  }

  // Get document by ID
  getDocumentById(id: string): Observable<Document> {
    return this.http.get<Document>(`/api/documents/${id}`);
  }

  // Get documents by patient ID
  getDocumentsByPatient(patientId: string): Observable<Document[]> {
    return this.http.get<Document[]>(`/api/documents/patient/${patientId}`);
  }

  // Get documents by type
  getDocumentsByType(type: string): Observable<Document[]> {
    return this.http.get<Document[]>(`/api/documents/type/${type}`);
  }

  // Upload document
  uploadDocument(file: File, patientId: string, type: string, description?: string): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    formData.append('type', type);
    if (description) {
      formData.append('description', description);
    }
    return this.http.post<Document>('/api/documents/upload', formData);
  }

  // Delete document
  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`/api/documents/${id}`);
  }

  // Download document
  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`/api/documents/${id}/download`, { responseType: 'blob' });
  }
}

