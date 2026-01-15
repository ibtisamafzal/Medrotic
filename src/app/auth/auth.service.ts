import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
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
  email?: string; // Optional - can use phone/cnic for UI, but API requires email
  password: string;
  role?: 'admin' | 'doctor' | 'patient'; // Optional for API, but kept for fallback
  rememberMe?: boolean;
  phone?: string; // For UI purposes
  cnic?: string; // For UI purposes
}

export interface RegisterPatientRequest {
  fullName: string; // API uses FullName
  email: string;
  password: string;
  confirmPassword: string;
  cnic: string; // 13 digits without dashes
  phoneNumber: string; // API uses PhoneNumber
  dateOfBirth: string; // ISO date string
  gender: 'Male' | 'Female' | 'Other';
  city: string;
  province: string;
}

export interface ForgotPasswordRequest {
  email: string; // API only supports email
}

export interface VerifyOTPRequest {
  email: string; // API only supports email
  otp: string;
}

export interface ResetPasswordRequest {
  email: string; // Required by API
  token: string; // From verify-otp response
  newPassword: string;
}

export interface AddUserRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'Admin' | 'Doctor';
  specialty?: string; // Required for Doctor
  experienceYears?: number; // Required for Doctor
  city?: string;
  province?: string;
  phoneNumber?: string;
  dateOfBirth?: string; // ISO date string
  gender?: 'Male' | 'Female' | 'Other';
}

export interface LoginResponse {
  token: string;
  role: string;
  fullName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private isBrowser: boolean;
  private readonly API_BASE = `${environment.apiUrl}/api/Auth`; // Use environment and capital A

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
    // Convert phone/cnic to email if needed (API only accepts email)
    // For now, we'll require email - phone/cnic login would need backend support
    if (!credentials.email) {
      return throwError(() => new Error('Email is required for login'));
    }

    // Check for default credentials first (fallback)
    const role = credentials.role || 'patient';
    if (credentials.email && isDefaultAdminCredentials(credentials.email, credentials.password, role)) {
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

    if (credentials.email && isDefaultDoctorCredentials(credentials.email, credentials.password, role)) {
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

    if (credentials.email && isDefaultPatientCredentials(credentials.email, credentials.password, role)) {
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

    // API call - API only accepts email and password
    const apiRequest = {
      email: credentials.email,
      password: credentials.password
    };

    return this.http.post<LoginResponse>(`${this.API_BASE}/login`, apiRequest).pipe(
      map(response => {
        // Convert API response to User format
        const user: User = {
          id: '', // API doesn't return id
          email: credentials.email,
          role: response.role.toLowerCase() as 'admin' | 'doctor' | 'patient',
          name: response.fullName,
          token: response.token
        };
        if (this.isBrowser && user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (credentials.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
        }
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterPatientRequest): Observable<{ message: string }> {
    // Format CNIC to 13 digits without dashes
    const formattedData = {
      ...userData,
      cnic: userData.cnic.replace(/\D/g, '') // Remove all non-digits
    };
    return this.http.post<{ message: string }>(`${this.API_BASE}/register-patient`, formattedData);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_BASE}/forget-password`,
      request
    );
  }

  verifyOTP(request: VerifyOTPRequest): Observable<{ message: string; token: string }> {
    return this.http.post<{ message: string; token: string }>(
      `${this.API_BASE}/verify-otp`,
      request
    );
  }

  resendOTP(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_BASE}/resend-otp`,
      { email }
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
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

  /**
   * Add new user (admin only)
   * Used for adding doctors or other admins
   */
  addUser(userData: AddUserRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_BASE}/add-user`,
      userData
    );
  }

  /**
   * Test admin endpoint (for testing authentication)
   */
  testAdmin(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.API_BASE}/test-admin`);
  }

  /**
   * Test doctor endpoint (for testing authentication)
   */
  testDoctor(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.API_BASE}/test-doctor`);
  }

  /**
   * Test patient endpoint (for testing authentication)
   */
  testPatient(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.API_BASE}/test-patient`);
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