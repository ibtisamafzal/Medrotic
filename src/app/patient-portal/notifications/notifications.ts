import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientService, Notification } from '../../services/patient.service';
import { Subscription } from 'rxjs';
import { portalUpdated$ } from '../../services/patient.service';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications implements OnInit, OnDestroy {
  loading = false;
  notifications: Notification[] = [];
  private sub?: Subscription;

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.loadNotifications();
    this.sub = portalUpdated$.subscribe(() => this.loadNotifications());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadNotifications() {
    this.loading = true;
    this.patientService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.loading = false;
      }
    });
  }

  markAsRead(notification: Notification) {
    if (notification.read) return;

    this.patientService.markNotificationRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      }
    });
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      update: '🔄',
      result: '📊',
      approval: '✓',
      reminder: '⏰'
    };
    return icons[type] || '📢';
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}
