import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}

interface ApiEnvelope<T> {
  message?: string;
  data: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private patientBaseUrl = '/api/patient/notifications';
  private adminBaseUrl = '/api/admin/notifications';

  constructor(private http: HttpClient) {}

  // Get all notifications for patient/admin context
  getNotifications(): Observable<Notification[]> {
    return this.http.get<ApiEnvelope<Notification[]>>(this.patientBaseUrl).pipe(
      map((response) => response?.data || [])
    );
  }

  // Not currently available as a dedicated backend endpoint.
  getNotificationById(id: string): Observable<Notification> {
    return this.http.get<ApiEnvelope<Notification[]>>(this.adminBaseUrl).pipe(
      map((response) => (response?.data || []).find((item) => item.id === id) as Notification)
    );
  }

  // Filter unread from current list.
  getUnreadNotifications(): Observable<Notification[]> {
    return this.getNotifications().pipe(
      map((items) => items.filter((item) => !item.read))
    );
  }

  // Patient mark as read.
  markAsRead(id: string): Observable<Notification> {
    return this.http.put<any>(`${this.patientBaseUrl}/${id}/read`, {}).pipe(
      map(() => ({ id, userId: '', title: '', message: '', type: 'info', read: true, createdAt: new Date().toISOString() }))
    );
  }

  // No backend endpoint exists for bulk mark-all.
  markAllAsRead(): Observable<void> {
    return this.http.get<ApiEnvelope<Notification[]>>(this.patientBaseUrl).pipe(
      map(() => void 0)
    );
  }

  // No delete endpoint in current controllers.
  deleteNotification(id: string): Observable<void> {
    return this.http.get<ApiEnvelope<Notification[]>>(this.adminBaseUrl).pipe(
      map(() => void 0)
    );
  }

  // Create notification in admin context.
  createNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<any>(this.adminBaseUrl, {
      medicalRecordId: (notification as any).medicalRecordId,
      message: notification.message,
      channel: (notification as any).channel || 'InApp'
    });
  }
}

