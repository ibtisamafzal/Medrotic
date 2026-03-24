import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { DoctorService } from '../../services/doctor.service';
import { AuthService, User } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { portalUpdated$ } from '../../services/patient.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  currentUser: User | null = null;
  loading = true;
  private authSub?: Subscription;
  private portalSub?: Subscription;
  private navSub?: Subscription;
  private refreshInFlight = false;
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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Keep welcome header real-time (zoneless mode needs explicit CD).
    this.currentUser = this.authService.currentUserValue;
    this.authSub = this.authService.currentUser.subscribe((u) => {
      this.currentUser = u;
      this.cdr.markForCheck();
    });

    // Refresh doctor dashboard when portal-visible patient changes happen
    // (e.g., doctor profile edit may trigger a portal update too).
    this.portalSub = portalUpdated$.subscribe(() => {
      this.syncWelcomeFromBackendAndLoad();
    });

    // Also refresh when navigating back/forward to this dashboard.
    this.navSub = this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;
      const url = event.urlAfterRedirects || event.url || '';
      if (url.includes('/doctor-portal/dashboard')) {
        this.syncWelcomeFromBackendAndLoad();
      }
    });

    this.syncWelcomeFromBackendAndLoad();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.portalSub?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  getRgbFromHex(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '52, 97, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  private reloadAll(): void {
    this.loadMetrics();
    this.loadRecentPatients();
    this.loadAssignedPatients();
    this.loadRecentUploads();
  }

  private syncWelcomeFromBackendAndLoad(): void {
    if (this.refreshInFlight) return;
    this.refreshInFlight = true;

    this.doctorService.getProfile().subscribe({
      next: (resp) => {
        const data = resp?.data ?? resp?.Data ?? resp ?? {};
        const name = data?.FullName ?? data?.fullName ?? data?.name ?? data?.Name ?? '';
        if (name) this.authService.updateCurrentUserName(String(name).trim());

        this.reloadAll();
        this.cdr.markForCheck();
        this.refreshInFlight = false;
      },
      error: (err) => {
        console.error('Error syncing doctor dashboard:', err);
        this.reloadAll();
        this.cdr.markForCheck();
        this.refreshInFlight = false;
      }
    });
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
      this.cdr.markForCheck();
    };
    
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.metrics.totalPatients = patients.length;
        this.metrics.activePatients = patients.filter(p => p.status === 'active').length;
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.metrics.totalPatients = 0;
        this.metrics.activePatients = 0;
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
        this.metrics.totalPrescriptions = 0;
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
        this.metrics.totalXrays = 0;
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
        this.metrics.pendingMessages = 0;
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
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading recent patients:', err);
        this.recentPatients = [];
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading assigned patients:', err);
        this.assignedPatients = [];
        this.cdr.markForCheck();
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
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error loading xrays:', err);
            this.recentUploads = prescriptionUploads.slice(0, 10);
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
        this.recentUploads = [];
        this.cdr.markForCheck();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
