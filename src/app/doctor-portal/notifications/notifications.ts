import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../services/doctor.service';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  /** Patient-linked messages / alerts from the same API used in Secure Communication. */
  notifications: Array<{
    id?: string;
    message: string;
    timestamp?: string;
    read?: boolean;
    type: 'info' | 'success' | 'warning';
  }> = [];
  loading = false;
  loadError: string | null = null;

  constructor(private doctorService: DoctorService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.loadError = null;
    this.doctorService.getMessages().subscribe({
      next: (msgs) => {
        this.notifications = (msgs || []).map((m) => ({
          id: m.id,
          message: m.content ?? '',
          timestamp: m.timestamp,
          read: !!m.read,
          type: 'info' as const,
        }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.notifications = [];
        this.loadError = 'Notifications could not be loaded. Check your connection and try again.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  markAsRead(notification: { read?: boolean }) {
    notification.read = true;
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
  }
}
