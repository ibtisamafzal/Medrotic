import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  name: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private isBrowser: boolean;

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

  // Login method
  login(email: string, password: string, role: 'admin' | 'doctor' | 'patient'): Observable<User> {
    return this.http.post<User>('/api/auth/login', { email, password, role }).pipe(
      tap(user => {
        // Store user in localStorage after successful login (only in browser)
        if (this.isBrowser && user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
      })
    );
  }

  // Logout
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // Register method
  register(userData: any): Observable<any> {
    return this.http.post<any>('/api/auth/register', userData);
  }

  // Forgot password
  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>('/api/auth/forgot-password', { email });
  }

  // Reset password
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>('/api/auth/reset-password', { token, newPassword });
  }
}