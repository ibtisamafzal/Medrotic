import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // First check if user is logged in
    if (!this.authService.isLoggedIn()) {
      console.warn('User not authenticated');
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Check if token is expired
    if (this.authService.isTokenExpired()) {
      console.warn('Token expired');
      this.authService.logout();
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url, reason: 'expired' }
      });
    }

    // Get expected roles from route data
    const expectedRoles = route.data['roles'] as string[];
    const userRole = this.authService.getUserRole();

    if (!expectedRoles || expectedRoles.length === 0) {
      // No role restriction, allow access
      return true;
    }

    // Check if user has required role
    if (userRole && expectedRoles.includes(userRole)) {
      return true;
    }

    // User doesn't have required role
    console.warn(`Access denied. Required roles: ${expectedRoles.join(', ')}, User role: ${userRole}`);
    
    // Redirect to appropriate dashboard based on user role
    switch (userRole) {
      case 'admin':
        return this.router.createUrlTree(['/admin/dashboard']);
      case 'doctor':
        return this.router.createUrlTree(['/doctor-portal/dashboard']);
      case 'patient':
        return this.router.createUrlTree(['/patient-portal/dashboard']);
      default:
        return this.router.createUrlTree(['/auth/login']);
    }
  }
}