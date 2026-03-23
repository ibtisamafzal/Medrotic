import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, ForgotPasswordRequest } from '../auth.service';
import { Header } from '../../common/header/header';
import { Footer } from '../../common/footer/footer';
import { PakInputFormatDirective } from '../../common/shared/pak-input-format.directive';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Header, Footer, PakInputFormatDirective],
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
    } else if (this.method === 'sms') {
      if (!this.phone.trim()) {
        this.error = 'Phone number is required';
        return false;
      }
      if (!this.authService.validatePhone(this.phone)) {
        this.error = 'Please enter a valid phone number';
        return false;
      }
      // Convert phone to email for API (API only supports email)
      // In a real scenario, you'd need backend support for SMS-based password reset
      this.error = 'SMS password reset is not yet supported. Please use email.';
      return false;
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

    // API only supports email, so use email regardless of method selected
    const request: ForgotPasswordRequest = {
      email: this.email.trim()
    };

    this.authService.forgotPassword(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        this.message = response.message || 'OTP has been sent to your email. Please check your inbox.';

        // Navigate to OTP verification
        setTimeout(() => {
          this.router.navigate(['/auth/verify-otp'], {
            queryParams: {
              email: this.email,
              type: 'password_reset'
            }
          });
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || err.error?.Message || 'Failed to send reset instructions. Please try again.';
        console.error('Forgot password error:', err);
      }
    });
  }
}
