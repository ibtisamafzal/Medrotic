import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Check if user is logged in
    if (this.authService.isLoggedIn()) {
      // Check if token is expired
      if (this.authService.isTokenExpired()) {
        console.warn('Token expired, logging out...');
        this.authService.logout();
        return this.router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url, reason: 'expired' }
        });
      }
      
      return true;
    }

    // Not logged in, redirect to login with return URL
    console.warn('User not authenticated, redirecting to login...');
    return this.router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}