import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Prefer token from AuthService, but fall back to localStorage in case
    // AuthService hasn't restored state yet (prevents accidental 401s).
    let token = this.authService.getToken();
    if (!token && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('currentUser');
        const parsed = stored ? JSON.parse(stored) : null;
        token = parsed?.token || null;
      } catch {
        token = null;
      }
    }

    // If token exists, attach Authorization header.
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}