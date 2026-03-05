import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoggedIn: boolean = false;
  dropdownOpen: boolean = false;
  navOpen: boolean = false;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  toggleNav(): void {
    this.navOpen = !this.navOpen;
  }

  closeNav(): void {
    this.navOpen = false;
  }

  getDashboardRoute(): string {
    if (!this.currentUser) return '/home';
    switch (this.currentUser.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'doctor':
        return '/doctor-portal/dashboard';
      case 'patient':
        return '/patient-portal/dashboard';
      default:
        return '/home';
    }
  }

  getProfileRoute(): string {
    if (!this.currentUser) return '/home';
    switch (this.currentUser.role) {
      case 'admin':
        return '/admin/profile';
      case 'doctor':
        return '/doctor-portal/profile';
      case 'patient':
        return '/patient-portal/profile-settings';
      default:
        return '/home';
    }
  }

  getAccountSettingsRoute(): string {
    if (!this.currentUser) return '/home';
    switch (this.currentUser.role) {
      case 'admin':
        return '/admin/account-settings';
      case 'doctor':
        return '/doctor-portal/account-settings';
      case 'patient':
        return '/patient-portal/profile-settings';
      default:
        return '/home';
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeDropdown();
  }

  getUserInitials(): string {
    if (!this.currentUser || !this.currentUser.name) return 'U';
    const names = this.currentUser.name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return this.currentUser.name[0].toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.closeDropdown();
    }
  }
}
