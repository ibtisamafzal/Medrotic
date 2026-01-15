import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService, LoginRequest } from '../auth.service';
import { Header } from '../../common/header/header';
import { Footer } from '../../common/footer/footer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Header, Footer],
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

  // Eye icon paths (assume these exist in assets)
  eyeOpenIcon = '/assets/images/icons/eye-open-outline.svg';
  eyeOffIcon = '/assets/images/icons/eye-off-outline.svg';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '';
      console.log('Return URL:', this.returnUrl);
    });
    
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
  }

  onCNICInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.authService.formatCNIC(input.value);
    this.cnic = formatted;
    input.value = formatted;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('92')) {
      value = '+92' + value.substring(2);
    } else if (value.startsWith('0')) {
      value = '+92' + value.substring(1);
    } else if (!value.startsWith('+92')) {
      value = '+92' + value;
    }
    
    if (value.length > 4) {
      value = value.slice(0, 4) + ' ' + value.slice(4);
    }
    if (value.length > 8) {
      value = value.slice(0, 8) + ' ' + value.slice(8);
    }
    
    this.phone = value;
    input.value = value;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  validateForm(): boolean {
    this.error = '';

    if (this.loginMethod === 'email') {
      if (!this.email.trim()) {
        this.error = 'Email is required';
        return false;
      }
      if (!this.authService.validateEmail(this.email)) {
        this.error = 'Please enter a valid email address';
        return false;
      }
    } else if (this.loginMethod === 'phone') {
      if (!this.phone.trim()) {
        this.error = 'Phone number is required';
        return false;
      }
      if (!this.authService.validatePhone(this.phone)) {
        this.error = 'Please enter a valid phone number';
        return false;
      }
    } else if (this.loginMethod === 'cnic') {
      if (!this.cnic.trim()) {
        this.error = 'CNIC is required';
        return false;
      }
      if (!this.authService.validateCNIC(this.cnic)) {
        this.error = 'Please enter a valid CNIC (format: 12345-1234567-1)';
        return false;
      }
    }

    if (!this.password) {
      this.error = 'Password is required';
      return false;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters';
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

    // API only accepts email, so convert phone/cnic to email format
    // For now, require email login - phone/cnic would need backend support
    let emailForLogin = '';
    
    if (this.loginMethod === 'email') {
      emailForLogin = this.email.trim();
    } else if (this.loginMethod === 'phone') {
      // Convert phone to email format (would need backend support)
      // For now, show error
      this.error = 'Phone login is not yet supported. Please use email.';
      this.loading = false;
      return;
    } else if (this.loginMethod === 'cnic') {
      // Convert CNIC to email format (would need backend support)
      // For now, show error
      this.error = 'CNIC login is not yet supported. Please use email.';
      this.loading = false;
      return;
    }

    if (!emailForLogin) {
      this.error = 'Email is required';
      this.loading = false;
      return;
    }

    const loginRequest: LoginRequest = {
      email: emailForLogin,
      password: this.password,
      role: this.selectedRole,
      rememberMe: this.rememberMe
    };

    this.authService.login(loginRequest).subscribe({
      next: (user) => {
        this.loading = false;
        console.log('Login successful, user:', user);
        console.log('Return URL:', this.returnUrl);
        
        if (this.rememberMe && this.loginMethod === 'email') {
          localStorage.setItem('rememberedEmail', this.email);
        }

        if (this.returnUrl) {
          console.log('Navigating to return URL:', this.returnUrl);
          this.router.navigateByUrl(this.returnUrl).then(
            (success) => {
              if (!success) {
                console.error('Navigation failed, redirecting by role');
                this.redirectByRole(user.role);
              }
            }
          ).catch((error) => {
            console.error('Navigation error:', error);
            this.redirectByRole(user.role);
          });
        } else {
          console.log('No return URL, redirecting by role');
          this.redirectByRole(user.role);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
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
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.redirectByRole(user.role);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Google sign-in failed. Please try again.';
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