import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService, LoginRequest } from '../auth.service';
import { Header } from '../../common/header/header';
import { Footer } from '../../common/footer/footer';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';
import { AlertService } from '../../services/alert.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Header, Footer, PakInputFormatDirective],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  // Login credentials
  email: string = '';
  phone: string = '';
  cnic: string = '';
  password: string = '';
  selectedRole: 'admin' | 'doctor' | 'patient' = 'patient';
  rememberMe: boolean = false;
  
  // UI state
  loginMethod: 'email' | 'phone' | 'cnic' = 'email';
  showPassword: boolean = false;
  loading: boolean = false;
  error: string = '';
  
  // Return URL for redirect after login
  returnUrl: string = '';

  // Eye icon paths (use the SVGs from public/images/svg-icons)
  eyeOpenIcon = '/images/svg-icons/eye-open-light.svg';
  eyeOffIcon = '/images/svg-icons/eye-disable-light.svg';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '';
      
      // Handle query params for registration success
      if (params['registered'] === 'true') {
        this.alertService.success('Registration successful! Please log in to continue.');
      }
      
      if (params['verified'] === 'true') {
        this.alertService.success('Email verified successfully! Please log in to continue.');
      }
      
      if (params['email']) {
        this.email = params['email'];
      }
      
      if (params['reason'] === 'expired') {
        this.alertService.warning('Your session has expired. Please log in again.');
      }
    });
    
    // Restore Remember Me state
    if (typeof localStorage !== 'undefined') {
      const remembered = localStorage.getItem('rememberMe');
      if (remembered === 'true') {
        this.rememberMe = true;
        const storedEmail = localStorage.getItem('rememberedEmail');
        if (storedEmail) {
          this.email = storedEmail;
        }
      }
    }
    
    // If already logged in, redirect to dashboard
    if (this.authService.isLoggedIn()) {
      const user = this.authService.currentUserValue;
      if (user) {
        this.redirectByRole(user.role);
      }
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  validateForm(): boolean {
    this.error = '';

    if (this.loginMethod === 'email') {
      if (!this.email.trim()) {
        this.error = 'Email address is required';
        return false;
      }
      if (!this.authService.validateEmail(this.email)) {
        this.error = 'Please enter a valid email address (e.g., user@example.com)';
        return false;
      }
    } else if (this.loginMethod === 'phone') {
      if (!this.phone.trim()) {
        this.error = 'Phone number is required';
        return false;
      }
      if (!this.authService.validatePhone(this.phone)) {
        this.error = 'Please enter a valid Pakistani phone number (e.g., +92 300 1234567)';
        return false;
      }
    } else if (this.loginMethod === 'cnic') {
      if (!this.cnic.trim()) {
        this.error = 'CNIC is required';
        return false;
      }
      if (!this.authService.validateCNIC(this.cnic)) {
        this.error = 'Please enter a valid CNIC in format: 12345-1234567-1';
        return false;
      }
    }

    if (!this.password) {
      this.error = 'Password is required';
      return false;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters long';
      return false;
    }

    return true;
  }

  onLogin(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = '';

    let loginRequest: LoginRequest | null = null;
    
    if (this.loginMethod === 'email') {
      loginRequest = {
        email: this.email.trim(),
        password: this.password,
        role: this.selectedRole,
        rememberMe: this.rememberMe
      };
    } else if (this.loginMethod === 'phone') {
      loginRequest = {
        phone: this.phone.trim(),
        password: this.password,
        role: this.selectedRole,
        rememberMe: this.rememberMe
      };
    } else if (this.loginMethod === 'cnic') {
      loginRequest = {
        cnic: this.cnic.trim(),
        password: this.password,
        role: this.selectedRole,
        rememberMe: this.rememberMe
      };
    }

    if (!loginRequest) {
      this.error = 'Please select a valid login method.';
      this.loading = false;
      return;
    }

    this.authService.login(loginRequest).subscribe({
      next: (user) => {
        this.loading = false;
        
        // Handle Remember Me
        if (this.rememberMe && this.loginMethod === 'email') {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberedEmail', this.email);
          }
        } else {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedEmail');
          }
        }
        
        // Start session monitoring
        this.sessionService.startSessionMonitoring();
        
        // Show success message
        this.alertService.success(`Welcome back, ${user.name || 'User'}!`);
        
        // Navigate to dashboard or return URL
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl).then(
            (success) => {
              if (!success) {
                this.redirectByRole(user.role);
              }
            }
          ).catch((error) => {
            console.error('Navigation error:', error);
            this.redirectByRole(user.role);
          });
        } else {
          this.redirectByRole(user.role);
        }
      },
      error: (err) => {
        this.loading = false;
        
        // Improved error handling
        let errorMessage = 'Login failed. Please check your credentials and try again.';
        
        if (err.status === 401 || err.status === 403) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (err.status === 0 || err.status >= 500) {
          errorMessage = 'Server error. Please try again later or contact support if the problem persists.';
        } else if (err.status === 404) {
          errorMessage = 'Service not found. Please check your connection and try again.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        this.error = errorMessage;
        this.alertService.error(errorMessage);
        console.error('Login error:', err);
      }
    });
  }

  onGoogleLogin(): void {
    this.loading = true;
    this.error = '';

    this.authService.loginWithGoogle(this.selectedRole).subscribe({
      next: (user) => {
        this.loading = false;
        
        // Start session monitoring
        this.sessionService.startSessionMonitoring();
        
        this.alertService.success(`Welcome, ${user.name || 'User'}!`);
        
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.redirectByRole(user.role);
        }
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || 'Google sign-in failed. Please try again or use email/password login.';
        this.error = errorMessage;
        this.alertService.error(errorMessage);
        console.error('Google login error:', err);
      }
    });
  }

  private redirectByRole(role: string): void {
    switch (role.toLowerCase()) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'doctor':
        this.router.navigate(['/doctor-portal/dashboard']);
        break;
      case 'patient':
        this.router.navigate(['/patient-portal/dashboard']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }

  getIdentifierPlaceholder(): string {
    switch (this.loginMethod) {
      case 'email':
        return 'Enter your email address';
      case 'phone':
        return 'Enter your phone number';
      case 'cnic':
        return '12345-1234567-1';
      default:
        return '';
    }
  }

  getIdentifierLabel(): string {
    switch (this.loginMethod) {
      case 'email':
        return 'Email Address';
      case 'phone':
        return 'Phone Number';
      case 'cnic':
        return 'CNIC (National Identity Card Number)';
      default:
        return '';
    }
  }

  get identifierValue(): string {
    switch (this.loginMethod) {
      case 'email':
        return this.email;
      case 'phone':
        return this.phone;
      case 'cnic':
        return this.cnic;
      default:
        return '';
    }
  }

  set identifierValue(value: string) {
    switch (this.loginMethod) {
      case 'email':
        this.email = value;
        break;
      case 'phone':
        this.phone = value;
        break;
      case 'cnic':
        this.cnic = value;
        break;
    }
  }
}