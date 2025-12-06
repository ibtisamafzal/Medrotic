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
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.phone = params['phone'] || '';
      this.type = params['type'] || 'password_reset';
    });

    this.startCountdown();
  }

  startCountdown(): void {
    this.countdown = 60;
    this.canResend = false;
    
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.canResend = true;
      }
    }, 1000);
  }

  onOTPInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    value = value.slice(0, 6);
    this.otp = value;
    input.value = value;

    if (value.length === 6) {
      this.onVerify();
    }
  }

  onOTPPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    this.otp = digits;
    
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input, index) => {
      (input as HTMLInputElement).value = digits[index] || '';
    });

    if (digits.length === 6) {
      this.onVerify();
    }
  }

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

  onOTPKeyUp(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    
    if (input.value && index < 5) {
      const nextInput = document.querySelector(`.otp-input[data-index="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

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
          if (this.type === 'password_reset') {
            this.router.navigate(['/auth/reset-password'], {
              queryParams: { token: response.token }
            });
          } else if (this.type === 'registration') {
            this.router.navigate(['/auth/login'], {
              queryParams: { verified: 'true' }
            });
          } else {
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
        this.otp = '';
        const inputs = document.querySelectorAll('.otp-input');
        inputs.forEach(input => (input as HTMLInputElement).value = '');
        const firstInput = document.querySelector('.otp-input[data-index="0"]') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }
    });
  }

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
        }
      },
      error: (err) => {
        this.resending = false;
        this.error = err.error?.message || 'Failed to resend OTP. Please try again.';
        console.error('Resend OTP error:', err);
      }
    });
  }

  getOTPDigit(index: number): string {
    return this.otp[index] || '';
  }
}