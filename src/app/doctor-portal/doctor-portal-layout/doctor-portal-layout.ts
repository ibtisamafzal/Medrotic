import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-doctor-portal-layout',
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './doctor-portal-layout.html',
  styleUrl: './doctor-portal-layout.scss',
})
export class DoctorPortalLayout {
  sidebarCollapsed = false;
  currentUser$;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser;
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    this.authService.logout();
  }
}

