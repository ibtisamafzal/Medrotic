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
  email?: string;
  password: string;
  role?: 'admin' | 'doctor' | 'patient'; // Optional for API, but kept for fallback
  rememberMe?: boolean;
  phone?: string;
  cnic?: string;
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
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    // If we restored an old mock token (no `iss` claim), the backend will reject it with 401.
    // Only keep tokens that look like real backend JWTs.
    if (parsedUser?.token) {
      const decoded = this.decodeToken(parsedUser.token);
      if (!decoded?.iss) {
        if (this.isBrowser) {
          localStorage.removeItem('currentUser');
          localStorage.removeItem('rememberMe');
        }
      }
    }
    this.currentUserSubject = new BehaviorSubject<User | null>(
      (parsedUser?.token && this.decodeToken(parsedUser.token)?.iss) ? parsedUser : null
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

  /**
   * Keeps UI real-time in sync after profile edits (without requiring logout/login).
   * Updates only the user's display name; token/role stay unchanged.
   */
  public updateCurrentUserName(newName: string): void {
    const current = this.currentUserSubject.value;
    if (!current) return;

    const trimmed = (newName ?? '').trim();
    const updated: User = {
      ...current,
      name: trimmed || current.name
    };

    this.currentUserSubject.next(updated);

    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(updated));
    }
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      // JWT payload is base64url (uses '-' and '_' instead of '+' and '/').
      // Convert to base64 so `atob` can decode it.
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(padded));
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
    const identifier = (credentials.email || credentials.phone || credentials.cnic || '').trim();
    if (!identifier) {
      return throwError(() => new Error('Email, phone, or CNIC is required for login'));
    }

    const apiRequest = {
      identifier,
      // Backward compatibility: old backend expects Email field.
      // New backend ignores it and uses `identifier`.
      email: credentials.email || identifier,
      password: credentials.password
    };

    return this.http.post<LoginResponse>(`${this.API_BASE}/login`, apiRequest).pipe(
      map(response => {
        // Convert API response to User format
        const user: User = {
          id: '', // API doesn't return id
          email: credentials.email || '',
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

  /**
   * Auto-login user after registration/OTP verification
   * This method logs in the user using their email and stores the token
   */
  autoLoginAfterRegistration(email: string, token: string): void {
    // Decode token to get user info
    const decoded = this.decodeToken(token);
    if (decoded) {
      // Extract user information from token
      const role = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'patient';
      const name = decoded.name || decoded.fullName || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';
      
      const user: User = {
        id: decoded.sub || decoded.id || '',
        email: email,
        role: role.toLowerCase() as 'admin' | 'doctor' | 'patient',
        name: name,
        token: token
      };
      
      if (this.isBrowser && user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      this.currentUserSubject.next(user);
    }
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedEmail');
    }
    this.currentUserSubject.next(null);
    // Note: SessionService will be stopped by app component monitoring auth state
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get time until token expiration in minutes
   */
  getTokenExpirationMinutes(): number | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return null;

    const expirationDate = new Date(decoded.exp * 1000);
    const now = new Date();
    return (expirationDate.getTime() - now.getTime()) / (1000 * 60);
  }

  /**
   * Check if user should be remembered based on rememberMe setting
   */
  shouldRememberUser(): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem('rememberMe') === 'true';
  }

  /**
   * Restore user session if rememberMe is enabled
   */
  restoreSessionIfRemembered(): void {
    if (!this.isBrowser) return;
    
    if (this.shouldRememberUser()) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          // Check if token is still valid
          if (user.token) {
            const decoded = this.decodeToken(user.token);
            // Reject old mock tokens (they don't include `iss` claim).
            if (!decoded?.iss) {
              localStorage.removeItem('rememberMe');
              localStorage.removeItem('currentUser');
              this.currentUserSubject.next(null);
              return;
            }

            if (!this.isTokenExpired()) {
              this.currentUserSubject.next(user);
            } else {
              // Token expired, clear rememberMe
              localStorage.removeItem('rememberMe');
              localStorage.removeItem('currentUser');
            }
          } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('currentUser');
          }
        } catch (error) {
          console.error('Error restoring session:', error);
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('currentUser');
          this.currentUserSubject.next(null);
        }
      }
    }
  }
}