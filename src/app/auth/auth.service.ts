import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { isDefaultAdminCredentials, createDefaultAdminUser, isDefaultDoctorCredentials, createDefaultDoctorUser, isDefaultPatientCredentials, createDefaultPatientUser } from '../config/default-admin';

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
  gender: string;
  city?: string;
  province?: string;
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
  private readonly API_BASE = 'https://localhost:7124/api/auth'; // Full URL for backend

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    const storedUser = this.isBrowser ? localStorage.getItem('currentUser') : null;
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue && !!this.currentUserValue.token;
  }

  getUserRole(): string | null {
    return this.currentUserValue?.role || null;
  }

  hasRole(role: string): boolean {
    return this.currentUserValue?.role === role;
  }

  getToken(): string | null {
    return this.currentUserValue?.token || null;
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const expirationDate = new Date(decoded.exp * 1000);
    return expirationDate < new Date();
  }

  login(credentials: LoginRequest): Observable<User> {
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

    if (credentials.email && isDefaultDoctorCredentials(credentials.email, credentials.password, credentials.role)) {
      const defaultDoctor = createDefaultDoctorUser();
      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(defaultDoctor));
        if (credentials.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
      }
      this.currentUserSubject.next(defaultDoctor);
      return new Observable(observer => {
        observer.next(defaultDoctor);
        observer.complete();
      });
    }

    if (credentials.email && isDefaultPatientCredentials(credentials.email, credentials.password, credentials.role)) {
      const defaultPatient = createDefaultPatientUser();
      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(defaultPatient));
        if (credentials.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
      }
      this.currentUserSubject.next(defaultPatient);
      return new Observable(observer => {
        observer.next(defaultPatient);
        observer.complete();
      });
    }

    return this.http.post<User>(`${this.API_BASE}/login`, credentials).pipe(
      tap(user => {
        if (this.isBrowser && user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (credentials.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
        }
        this.currentUserSubject.next(user);
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.API_BASE}/register-patient`, userData);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string; otpSent: boolean }> {
    return this.http.post<{ message: string; otpSent: boolean }>(
      `${this.API_BASE}/forget-password`,
      request
    );
  }

  verifyOTP(request: VerifyOTPRequest): Observable<{ verified: boolean; token?: string }> {
    return this.http.post<{ verified: boolean; token?: string }>(
      `${this.API_BASE}/verify-otp`,
      request
    );
  }

  resendOTP(email?: string, phone?: string): Observable<{ message: string; otpSent: boolean }> {
    return this.http.post<{ message: string; otpSent: boolean }>(
      `${this.API_BASE}/resend-otp`, // Add this endpoint in backend if needed
      { email, phone }
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<{ message: string; success: boolean }> {
    return this.http.post<{ message: string; success: boolean }>(
      `${this.API_BASE}/reset-password`,
      request
    );
  }

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

  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string; success: boolean }> {
    return this.http.post<{ message: string; success: boolean }>(
      `${this.API_BASE}/change-password`,
      { oldPassword, newPassword }
    );
  }

  validateCNIC(cnic: string): boolean {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    return cnicRegex.test(cnic);
  }

  formatCNIC(value: string): string {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 5) {
      return digits;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberMe');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
}