import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService, ResetPasswordRequest } from '../auth.service';
import { Header } from '../../common/header/header';
import { Footer } from '../../common/footer/footer';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Header, Footer],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  email: string = ''; // Added for request
  
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  loading: boolean = false;
  error: string = '';
  success: boolean = false;

  eyeOpenIcon = '/assets/images/icons/eye-open-outline.svg';
  eyeOffIcon = '/assets/images/icons/eye-off-outline.svg';

  constructor(
    private authService: AuthService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      
      if (!this.token) {
        this.error = 'Invalid or missing reset token. Please request a new password reset.';
        setTimeout(() => {
          this.router.navigate(['/auth/forgot-password']);
        }, 3000);
      }
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  validateForm(): boolean {
    this.error = '';

    if (!this.newPassword) {
      this.error = 'New password is required';
      return false;
    }

    if (this.newPassword.length < 8) {
      this.error = 'Password must be at least 8 characters long';
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(this.newPassword)) {
      this.error = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      return false;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    if (!this.token) {
      this.error = 'Invalid reset token. Please request a new password reset.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    const request: ResetPasswordRequest = {
      token: this.token,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.authService.resetPassword(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        
        setTimeout(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { passwordReset: 'true' }
          });
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to reset password. The token may have expired. Please request a new password reset.';
        console.error('Reset password error:', err);
      }
    });
  }
}