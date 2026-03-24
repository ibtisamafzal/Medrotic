import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-patient-portal-layout',
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './patient-portal-layout.html',
  styleUrl: './patient-portal-layout.scss',
})
export class PatientPortalLayout {
  sidebarCollapsed = false;

  constructor(private authService: AuthService) {}

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    this.authService.logout();
  }
}

