import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-portal-layout',
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './patient-portal-layout.html',
  styleUrl: './patient-portal-layout.scss',
})
export class PatientPortalLayout {
  sidebarCollapsed = false;

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}

