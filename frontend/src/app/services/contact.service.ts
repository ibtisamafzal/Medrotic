import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  queryType: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  constructor(private http: HttpClient) {}

  submitContactForm(data: ContactFormData): Observable<ContactResponse> {
    return this.http.post<ContactResponse>('/api/contact', data);
  }
}

