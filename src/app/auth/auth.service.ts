import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { isDefaultAdminCredentials, createDefaultAdminUser } from '../config/default-admin';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  cnic?: string;
  role: 'admin' | 'doctor' | 'patient';
  name: string;
  token: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  cnic?: string;
  password: string;
  role: 'admin' | 'doctor' | 'patient';
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email?: string;
  phone?: string;
  cnic: string; // Required for patients
  password: string;
  name: string;
  role: 'patient'; // Only patients can self-register
  dateOfBirth?: string;
  gender?: string;
}

export interface ForgotPasswordRequest {
  email?: string;
  phone?: string;
  method: 'email' | 'sms';
}

export interface VerifyOTPRequest {
  email?: string;
  phone?: string;
  otp: string;
  type: 'password_reset' | 'registration' | 'login';
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private isBrowser: boolean;
  private readonly API_BASE = '/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Load user from localStorage on service initialization (only in browser)
    const storedUser = this.isBrowser ? localStorage.getItem('currentUser') : null;
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.currentUserValue && !!this.currentUserValue.token;
  }

  // Get user role
  getUserRole(): string | null {
    return this.currentUserValue?.role || null;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.currentUserValue?.role === role;
  }

  // Get JWT token
  getToken(): string | null {
    return this.currentUserValue?.token || null;
  }

  // Decode JWT token (basic implementation - you might want to use a library like jwt-decode)
  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const expirationDate = new Date(decoded.exp * 1000);
    return expirationDate < new Date();
  }

  /**
   * Login with email/phone/CNIC, password, and role
   * HIPAA Note: Password is hashed on server-side, never sent in plain text in production
   */
  login(credentials: LoginRequest): Observable<User> {
    // DEVELOPMENT MODE: Check for default admin credentials
    // This allows testing the admin portal without backend setup
    if (credentials.email && isDefaultAdminCredentials(credentials.email, credentials.password, credentials.role)) {
      const defaultAdmin = createDefaultAdminUser();
      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(defaultAdmin));
        if (credentials.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
      }
      this.currentUserSubject.next(defaultAdmin);
      return new Observable(observer => {
        observer.next(defaultAdmin);
        observer.complete();
      });
    }

    // In production, password should be hashed client-side before sending
    // For now, this is a placeholder - backend should handle hashing
    return this.http.post<User>(`${this.API_BASE}/login`, credentials).pipe(
      tap(user => {
        // Store user in localStorage after successful login (only in browser)
        if (this.isBrowser && user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (credentials.rememberMe) {
            // Store remember me preference
            localStorage.setItem('rememberMe', 'true');
          }
        }
        this.currentUserSubject.next(user);
      }),
      catchError((error: HttpErrorResponse) => {
        // If backend is not available and it's a network error, 
        // we could fall back to default admin in development
        // But for now, just throw the error
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new patient (CNIC-based)
   * Only patients can self-register; doctors/admins are registered by admin
   */
  register(userData: RegisterRequest): Observable<any> {
    // HIPAA Note: Password should be hashed on server-side
    return this.http.post<any>(`${this.API_BASE}/register`, userData);
  }

  /**
   * Request password reset via email or SMS
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string; otpSent: boolean }> {
    return this.http.post<{ message: string; otpSent: boolean }>(
      `${this.API_BASE}/forgot-password`,
      request
    );
  }

  /**
   * Verify OTP for password reset, registration, or login
   */
  verifyOTP(request: VerifyOTPRequest): Observable<{ verified: boolean; token?: string }> {
    return this.http.post<{ verified: boolean; token?: string }>(
      `${this.API_BASE}/verify-otp`,
      request
    );
  }

  /**
   * Resend OTP
   */
  resendOTP(email?: string, phone?: string): Observable<{ message: string; otpSent: boolean }> {
    return this.http.post<{ message: string; otpSent: boolean }>(
      `${this.API_BASE}/resend-otp`,
      { email, phone }
    );
  }

  /**
   * Reset password with token from OTP verification
   */
  resetPassword(request: ResetPasswordRequest): Observable<{ message: string; success: boolean }> {
    // HIPAA Note: Password should be hashed on server-side
    return this.http.post<{ message: string; success: boolean }>(
      `${this.API_BASE}/reset-password`,
      request
    );
  }

  /**
   * Google OAuth login
   */
  loginWithGoogle(role?: 'admin' | 'doctor' | 'patient'): Observable<User> {
    return this.http.post<User>(`${this.API_BASE}/google`, { role }).pipe(
      tap(user => {
        if (this.isBrowser && user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
      })
    );
  }

  /**
   * Change password (for authenticated users)
   */
  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string; success: boolean }> {
    // HIPAA Note: Passwords should be hashed on server-side
    return this.http.post<{ message: string; success: boolean }>(
      `${this.API_BASE}/change-password`,
      { oldPassword, newPassword }
    );
  }

  /**
   * Validate CNIC format (Pakistani CNIC: 12345-1234567-1)
   */
  validateCNIC(cnic: string): boolean {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    return cnicRegex.test(cnic);
  }

  /**
   * Format CNIC input
   */
  formatCNIC(value: string): string {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as 12345-1234567-1
    if (digits.length <= 5) {
      return digits;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
  }

  /**
   * Validate phone number (Pakistani format)
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  /**
   * Validate email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Logout
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberMe');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
}