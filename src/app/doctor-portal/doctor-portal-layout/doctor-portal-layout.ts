import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor-portal-layout',
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './doctor-portal-layout.html',
  styleUrl: './doctor-portal-layout.scss',
})
export class DoctorPortalLayout {
  sidebarCollapsed = false;

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}

