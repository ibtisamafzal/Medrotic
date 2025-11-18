import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private http: HttpClient) {}

  // Get all notifications for current user
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>('/api/notifications');
  }

  // Get notification by ID
  getNotificationById(id: string): Observable<Notification> {
    return this.http.get<Notification>(`/api/notifications/${id}`);
  }

  // Get unread notifications
  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>('/api/notifications/unread');
  }

  // Mark notification as read
  markAsRead(id: string): Observable<Notification> {
    return this.http.put<Notification>(`/api/notifications/${id}/read`, {});
  }

  // Mark all notifications as read
  markAllAsRead(): Observable<void> {
    return this.http.put<void>('/api/notifications/read-all', {});
  }

  // Delete notification
  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`/api/notifications/${id}`);
  }

  // Create notification (admin/doctor only)
  createNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>('/api/notifications', notification);
  }
}

