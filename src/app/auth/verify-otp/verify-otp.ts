import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService, VerifyOTPRequest } from '../auth.service';
import { Header } from '../../common/header/header';
import { Footer } from '../../common/footer/footer';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Header, Footer],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.scss'
})
export class VerifyOTP implements OnInit {
  otp: string = '';
  email: string = '';
  phone: string = '';
  type: 'password_reset' | 'registration' | 'login' = 'password_reset';
  
  loading: boolean = false;
  error: string = '';
  resending: boolean = false;
  countdown: number = 0;
  canResend: boolean = false;

  constructor(
    private authService: AuthService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get email/phone and type from query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.phone = params['phone'] || '';
      this.type = params['type'] || 'password_reset';
    });

    // Start countdown timer
    this.startCountdown();
  }

  /**
   * Start countdown timer for resend OTP
   */
  startCountdown(): void {
    this.countdown = 60; // 60 seconds
    this.canResend = false;
    
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.canResend = true;
      }
    }, 1000);
  }

  /**
   * Handle OTP input (auto-submit when 6 digits entered)
   */
  onOTPInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Only digits
    value = value.slice(0, 6); // Max 6 digits
    this.otp = value;
    input.value = value;

    // Auto-submit when 6 digits entered
    if (value.length === 6) {
      this.onVerify();
    }
  }

  /**
   * Handle OTP paste
   */
  onOTPPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    this.otp = digits;
    
    // Update all input fields
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input, index) => {
      (input as HTMLInputElement).value = digits[index] || '';
    });

    // Auto-submit if 6 digits
    if (digits.length === 6) {
      this.onVerify();
    }
  }

  /**
   * Handle backspace to move to previous input
   */
  onOTPKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = document.querySelector(`.otp-input[data-index="${index - 1}"]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  }

  /**
   * Focus next input when digit entered
   */
  onOTPKeyUp(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    
    if (input.value && index < 5) {
      const nextInput = document.querySelector(`.otp-input[data-index="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  /**
   * Validate OTP before submission
   */
  validateOTP(): boolean {
    this.error = '';

    if (!this.otp || this.otp.length !== 6) {
      this.error = 'Please enter the complete 6-digit OTP';
      return false;
    }

    if (!/^\d{6}$/.test(this.otp)) {
      this.error = 'OTP must contain only digits';
      return false;
    }

    return true;
  }

  /**
   * Handle OTP verification
   */
  onVerify(): void {
    if (!this.validateOTP()) {
      return;
    }

    this.loading = true;
    this.error = '';

    const request: VerifyOTPRequest = {
      otp: this.otp,
      type: this.type
    };

    if (this.email) {
      request.email = this.email;
    }
    if (this.phone) {
      request.phone = this.phone;
    }

    this.authService.verifyOTP(request).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.verified) {
          // Redirect based on type
          if (this.type === 'password_reset') {
            // Redirect to reset password with token
            this.router.navigate(['/auth/reset-password'], {
              queryParams: { token: response.token }
            });
          } else if (this.type === 'registration') {
            // Registration verified, redirect to login
            this.router.navigate(['/auth/login'], {
              queryParams: { verified: 'true' }
            });
          } else {
            // Login OTP verified
            this.router.navigate(['/home']);
          }
        } else {
          this.error = 'Invalid OTP. Please try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'OTP verification failed. Please try again.';
        console.error('OTP verification error:', err);
        // Clear OTP on error
        this.otp = '';
        const inputs = document.querySelectorAll('.otp-input');
        inputs.forEach(input => (input as HTMLInputElement).value = '');
        // Focus first input
        const firstInput = document.querySelector('.otp-input[data-index="0"]') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }
    });
  }

  /**
   * Resend OTP
   */
  onResendOTP(): void {
    if (!this.canResend) {
      return;
    }

    this.resending = true;
    this.error = '';

    this.authService.resendOTP(this.email || undefined, this.phone || undefined).subscribe({
      next: (response) => {
        this.resending = false;
        if (response.otpSent) {
          this.startCountdown();
          // Show success message briefly
          const successMsg = this.email 
            ? 'OTP has been resent to your email.' 
            : 'OTP has been resent to your phone.';
          // You could show a toast notification here
        }
      },
      error: (err) => {
        this.resending = false;
        this.error = err.error?.message || 'Failed to resend OTP. Please try again.';
        console.error('Resend OTP error:', err);
      }
    });
  }

  /**
   * Get OTP input value for display
   */
  getOTPDigit(index: number): string {
    return this.otp[index] || '';
  }
}

