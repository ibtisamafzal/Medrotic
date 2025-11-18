import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  selectedRole: 'admin' | 'doctor' | 'patient' = 'patient';
  loading: boolean = false;
  error: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password, this.selectedRole).subscribe({
      next: (user) => {
        this.loading = false;
        // Redirect based on role
        switch (user.role) {
          case 'admin':
            this.router.navigate(['/admin/dashboard']);
            break;
          case 'doctor':
            this.router.navigate(['/doctor-portal/dashboard']);
            break;
          case 'patient':
            this.router.navigate(['/patient-portal/dashboard']);
            break;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Login failed. Please check your credentials.';
        console.error('Login error:', err);
      }
    });
  }
}