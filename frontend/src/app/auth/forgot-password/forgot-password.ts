import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, ForgotPasswordRequest } from '../auth.service';
import { Header } from '../../common/header/header';
import { Footer } from '../../common/footer/footer';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Header, Footer],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  email: string = '';
  phone: string = '';
  method: 'email' | 'sms' = 'email';
  loading: boolean = false;
  error: string = '';
  success: boolean = false;
  message: string = '';

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}

  /**
   * Format phone input
   */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    // Format as +92 XXX XXXXXXX
    if (value.startsWith('92')) {
      value = '+92' + value.substring(2);
    } else if (value.startsWith('0')) {
      value = '+92' + value.substring(1);
    } else if (!value.startsWith('+92')) {
      value = '+92' + value;
    }
    
    // Format with spaces
    if (value.length > 4) {
      value = value.slice(0, 4) + ' ' + value.slice(4);
    }
    if (value.length > 8) {
      value = value.slice(0, 8) + ' ' + value.slice(8);
    }
    
    this.phone = value;
    input.value = value;
  }

  /**
   * Validate form before submission
   */
  validateForm(): boolean {
    this.error = '';

    if (this.method === 'email') {
      if (!this.email.trim()) {
        this.error = 'Email is required';
        return false;
      }
      if (!this.authService.validateEmail(this.email)) {
        this.error = 'Please enter a valid email address';
        return false;
      }
    } else {
      if (!this.phone.trim()) {
        this.error = 'Phone number is required';
        return false;
      }
      if (!this.authService.validatePhone(this.phone)) {
        this.error = 'Please enter a valid phone number';
        return false;
      }
    }

    return true;
  }

  /**
   * Handle forgot password form submission
   */
  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;
    this.message = '';

    const request: ForgotPasswordRequest = {
      method: this.method
    };

    if (this.method === 'email') {
      request.email = this.email.trim();
    } else {
      request.phone = this.phone.trim();
    }

    this.authService.forgotPassword(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        this.message = response.message || 
          (this.method === 'email' 
            ? 'Password reset instructions have been sent to your email.' 
            : 'An OTP has been sent to your phone number.');

        // Redirect to OTP verification if SMS method
        if (this.method === 'sms' && response.otpSent) {
          setTimeout(() => {
            this.router.navigate(['/auth/verify-otp'], {
              queryParams: {
                phone: this.phone,
                type: 'password_reset'
              }
            });
          }, 2000);
        } else if (this.method === 'email') {
          // For email, show success message and option to go back to login
          setTimeout(() => {
            this.router.navigate(['/auth/login'], {
              queryParams: { resetSent: 'true' }
            });
          }, 3000);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to send reset instructions. Please try again.';
        console.error('Forgot password error:', err);
      }
    });
  }
}
