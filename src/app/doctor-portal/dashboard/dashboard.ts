import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DoctorService } from '../../services/doctor.service';
import { AuthService, User } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  currentUser: User | null = null;
  loading = true;
  metrics = {
    totalPatients: 0,
    activePatients: 0,
    totalPrescriptions: 0,
    totalXrays: 0,
    pendingMessages: 0,
    recentVisits: 0
  };

  recentPatients: any[] = [];
  assignedPatients: any[] = [];
  recentUploads: any[] = [];
  upcomingAppointments: any[] = [];

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Get current user
    this.currentUser = this.authService.currentUserValue;
    this.loadMetrics();
    this.loadRecentPatients();
    this.loadAssignedPatients();
    this.loadRecentUploads();
  }

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  loadMetrics() {
    this.loading = true;
    let completedCalls = 0;
    const totalCalls = 4;
    
    const checkComplete = () => {
      completedCalls++;
      if (completedCalls >= totalCalls) {
        this.loading = false;
      }
    };
    
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.metrics.totalPatients = patients.length;
        this.metrics.activePatients = patients.filter(p => p.status === 'active').length;
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.metrics.totalPatients = 45;
        this.metrics.activePatients = 38;
        checkComplete();
      }
    });

    this.doctorService.getPrescriptions().subscribe({
      next: (prescriptions) => {
        this.metrics.totalPrescriptions = prescriptions.length;
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
        this.metrics.totalPrescriptions = 120;
        checkComplete();
      }
    });

    this.doctorService.getXrays().subscribe({
      next: (xrays) => {
        this.metrics.totalXrays = xrays.length;
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading xrays:', err);
        this.metrics.totalXrays = 67;
        checkComplete();
      }
    });

    this.doctorService.getMessages().subscribe({
      next: (messages) => {
        this.metrics.pendingMessages = messages.filter(m => !m.read).length;
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.metrics.pendingMessages = 5;
        checkComplete();
      }
    });
  }

  loadRecentPatients() {
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.recentPatients = patients
          .sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);
      },
      error: (err) => {
        console.error('Error loading recent patients:', err);
        // Mock data for development
        this.recentPatients = [
          { id: '1', name: 'John Doe', cnic: '12345-1234567-1', phone: '+923001234567', updatedAt: new Date().toISOString() },
          { id: '2', name: 'Jane Smith', cnic: '12345-1234567-2', phone: '+923001234568', updatedAt: new Date(Date.now() - 86400000).toISOString() },
          { id: '3', name: 'Mike Johnson', cnic: '12345-1234567-3', phone: '+923001234569', updatedAt: new Date(Date.now() - 172800000).toISOString() }
        ];
      }
    });
  }

  loadAssignedPatients() {
    // In real app, this would filter by doctor assignment
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.assignedPatients = patients
          .filter(p => p.status === 'active')
          .slice(0, 10);
      },
      error: (err) => {
        console.error('Error loading assigned patients:', err);
        // Mock data for development
        this.assignedPatients = [
          { id: '1', name: 'John Doe', cnic: '12345-1234567-1', phone: '+923001234567', status: 'active' },
          { id: '2', name: 'Jane Smith', cnic: '12345-1234567-2', phone: '+923001234568', status: 'active' },
          { id: '3', name: 'Mike Johnson', cnic: '12345-1234567-3', phone: '+923001234569', status: 'active' },
          { id: '4', name: 'Sarah Williams', cnic: '12345-1234567-4', phone: '+923001234570', status: 'active' },
          { id: '5', name: 'David Brown', cnic: '12345-1234567-5', phone: '+923001234571', status: 'active' }
        ];
      }
    });
  }

  loadRecentUploads() {
    // Load recent prescriptions and x-rays
    this.doctorService.getPrescriptions().subscribe({
      next: (prescriptions) => {
        const prescriptionUploads = prescriptions
          .map(p => ({
            type: 'prescription',
            id: p.id,
            patientId: p.patientId,
            date: p.createdAt,
            title: `Prescription #${p.id}`
          }));

        this.doctorService.getXrays().subscribe({
          next: (xrays) => {
            const xrayUploads = xrays
              .map(x => ({
                type: 'xray',
                id: x.id,
                patientId: x.patientId,
                date: x.createdAt,
                title: `X-Ray #${x.id}`
              }));

            this.recentUploads = [...prescriptionUploads, ...xrayUploads]
              .sort((a, b) => {
                const dateA = new Date(a.date || 0).getTime();
                const dateB = new Date(b.date || 0).getTime();
                return dateB - dateA;
              })
              .slice(0, 10);
          },
          error: (err) => {
            console.error('Error loading xrays:', err);
            this.recentUploads = prescriptionUploads.slice(0, 10);
          }
        });
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
        // Mock data for development
        this.recentUploads = [
          { type: 'prescription', id: '1', patientId: '1', date: new Date().toISOString(), title: 'Prescription #1' },
          { type: 'xray', id: '1', patientId: '2', date: new Date(Date.now() - 3600000).toISOString(), title: 'X-Ray #1' },
          { type: 'prescription', id: '2', patientId: '3', date: new Date(Date.now() - 7200000).toISOString(), title: 'Prescription #2' }
        ];
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
