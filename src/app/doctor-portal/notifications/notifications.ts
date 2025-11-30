import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../services/doctor.service';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications implements OnInit {
  notifications: any[] = [];
  loading = false;

  constructor(private doctorService: DoctorService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading = true;
    // Mock notifications - in real app, this would come from API
    setTimeout(() => {
      this.notifications = [
        { id: '1', message: 'New patient registered: John Doe', type: 'info', timestamp: new Date(), read: false },
        { id: '2', message: 'Prescription uploaded for patient: Jane Smith', type: 'success', timestamp: new Date(Date.now() - 3600000), read: false },
        { id: '3', message: 'X-Ray analysis completed', type: 'info', timestamp: new Date(Date.now() - 7200000), read: true },
        { id: '4', message: 'New message from patient: Mike Johnson', type: 'warning', timestamp: new Date(Date.now() - 86400000), read: true }
      ];
      this.loading = false;
    }, 500);
  }

  markAsRead(notification: any) {
    notification.read = true;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
  }
}
