import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get token from auth service
    const token = this.authService.getToken();
    
    // If token exists, user is logged in, and token is not expired, add Authorization header
    if (token && this.authService.isLoggedIn() && !this.authService.isTokenExpired()) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else if (token && this.authService.isTokenExpired()) {
      // Token expired, logout user
      console.warn('JWT token expired, logging out...');
      this.authService.logout();
    }

    return next.handle(request);
  }
}