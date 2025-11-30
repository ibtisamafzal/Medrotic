import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Notification } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications implements OnInit {
  notifications: Notification[] = [];
  showComposeModal = false;
  
  newNotification: Notification = {
    message: '',
    targets: [],
    type: 'push',
    scheduledAt: ''
  };

  targetOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'doctors', label: 'All Doctors' },
    { value: 'patients', label: 'All Patients' },
    { value: 'admins', label: 'All Admins' }
  ];

  constructor(
    private adminService: AdminService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.adminService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
      }
    });
  }

  openComposeModal() {
    this.newNotification = { message: '', targets: [], type: 'push', scheduledAt: '' };
    this.showComposeModal = true;
  }

  closeComposeModal() {
    this.showComposeModal = false;
  }

  toggleTarget(target: string) {
    const index = this.newNotification.targets.indexOf(target);
    if (index > -1) {
      this.newNotification.targets.splice(index, 1);
    } else {
      this.newNotification.targets.push(target);
    }
  }

  sendNotification() {
    if (!this.newNotification.message || this.newNotification.targets.length === 0) {
      this.alertService.warning('Please provide a message and select at least one target.');
      return;
    }

    this.adminService.sendNotification(this.newNotification).subscribe({
      next: () => {
        this.loadNotifications();
        this.closeComposeModal();
        this.alertService.success('Notification sent successfully!');
      },
      error: (err) => {
        console.error('Error sending notification:', err);
        this.alertService.error('Error sending notification. Please try again.');
      }
    });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'push':
        return '📱';
      case 'email':
        return '📧';
      case 'sms':
        return '💬';
      default:
        return '📢';
    }
  }
}
