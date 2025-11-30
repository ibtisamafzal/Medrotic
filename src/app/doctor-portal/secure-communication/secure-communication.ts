import { Component, OnInit } from '@angular/core';
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
  selectedPatient: Patient | null = null;
  messages: Message[] = [];
  newMessage = '';
  loading = false;
  sending = false;

  constructor(private doctorService: DoctorService) {}

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    this.loading = true;
    this.doctorService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        // Mock data for development
        this.patients = [
          { id: '1', name: 'John Doe', cnic: '12345-1234567-1', phone: '+923001234567', email: 'john@example.com', status: 'active' },
          { id: '2', name: 'Jane Smith', cnic: '12345-1234567-2', phone: '+923001234568', email: 'jane@example.com', status: 'active' },
          { id: '3', name: 'Mike Johnson', cnic: '12345-1234567-3', phone: '+923001234569', email: 'mike@example.com', status: 'active' }
        ];
        this.loading = false;
      }
    });
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
      },
      error: (err) => {
        console.error('Error loading messages:', err);
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
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.sending = false;
      }
    });
  }
}
