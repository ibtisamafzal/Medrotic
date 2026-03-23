import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
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
  isScrolled: boolean = false;
  isTransitionEnabled: boolean = false;
  isDarkMode: boolean = false;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled = window.scrollY > 20;
      setTimeout(() => {
        this.isTransitionEnabled = true;
      }, 50);
      this.initDarkMode();
    }

    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      // With zoneless change detection, ensure header reflects updates immediately.
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('medrotic-theme', this.isDarkMode ? 'dark' : 'light');
    }
  }

  private initDarkMode(): void {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('medrotic-theme') : null;
    this.isDarkMode = saved === 'dark'; // Only activate if user previously clicked it
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
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

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }
}
