import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DoctorService, Message, Patient } from '../../services/doctor.service';

@Component({
  selector: 'app-secure-communication',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './secure-communication.html',
  styleUrl: './secure-communication.scss',
})
export class SecureCommunication implements OnInit {
  patients: Patient[] = [];
  patientSidebarFilter = '';
  selectedPatient: Patient | null = null;
  messages: Message[] = [];
  newMessage = '';
  loading = false;
  sending = false;

  constructor(
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    this.loading = true;
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.patients = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredSidebarPatients(): Patient[] {
    const q = this.patientSidebarFilter.trim().toLowerCase();
    if (!q) return this.patients;
    return this.patients.filter(
      (p) =>
        (p.name ?? '').toLowerCase().includes(q) ||
        (p.cnic ?? '').toLowerCase().includes(q) ||
        (p.phone ?? '').toLowerCase().includes(q)
    );
  }

  trackPatientId(_index: number, p: Patient): string {
    return String(p.id);
  }

  selectPatient(patient: Patient) {
    this.selectedPatient = patient;
    this.loadMessages(patient.id);
  }

  loadMessages(patientId: string) {
    this.doctorService.getMessages(patientId).subscribe({
      next: (messages) => {
        this.messages = messages.sort((a, b) => {
          const dateA = new Date(a.timestamp || 0).getTime();
          const dateB = new Date(b.timestamp || 0).getTime();
          return dateA - dateB;
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.messages = [];
        this.cdr.markForCheck();
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedPatient) return;

    this.sending = true;
    const message: Message = {
      to: this.selectedPatient.id,
      content: this.newMessage
    };

    this.doctorService.sendMessage(message).subscribe({
      next: (sentMessage) => {
        this.messages.push(sentMessage);
        this.newMessage = '';
        this.sending = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.sending = false;
        this.cdr.markForCheck();
      }
    });
  }
}
