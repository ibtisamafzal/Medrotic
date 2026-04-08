import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';
import { RoleGuard } from './guards/role-guard';
import { routes as authRoutes } from './auth/auth-routing-module';

export const routes: Routes = [
  // Public routes - Common pages (lazy loaded for smaller initial bundle)
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./common/home/home').then(m => m.Home)
  },
  {
    path: 'about',
    loadComponent: () => import('./common/about/about').then(m => m.About)
  },
  {
    path: 'services',
    loadComponent: () => import('./common/services/services').then(m => m.Services)
  },
  {
    path: 'contact',
    loadComponent: () => import('./common/contact/contact').then(m => m.Contact)
  },
  {
    path: 'faq',
    loadComponent: () => import('./common/faq/faq').then(m => m.Faq)
  },
  {
    path: 'terms',
    loadComponent: () => import('./common/terms/terms').then(m => m.Terms)
  },
  {
    path: 'privacy',
    loadComponent: () => import('./common/privacy/privacy').then(m => m.Privacy)
  },
  {
    path: 'refund-policy',
    loadComponent: () => import('./common/refund-policy/refund-policy').then(m => m.RefundPolicy)
  },
  {
    path: 'gdpr-compliance',
    loadComponent: () => import('./common/gdpr-compliance/gdpr-compliance').then(m => m.GdprCompliance)
  },
  {
    path: 'affiliate-policy',
    loadComponent: () => import('./common/affiliate-policy/affiliate-policy').then(m => m.AffiliatePolicy)
  },

  // Auth routes (public) - Eagerly loaded for instant "Get Started" transition
  {
    path: 'auth',
    children: authRoutes
  },

  // Admin routes - protected by role guard
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin-module').then(m => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },

  // Doctor portal routes - protected by role guard
  {
    path: 'doctor-portal',
    loadChildren: () => import('./doctor-portal/doctor-portal-module').then(m => m.DoctorPortalModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['doctor'] }
  },

  // Patient portal routes - protected by role guard
  {
    path: 'patient-portal',
    loadChildren: () => import('./patient-portal/patient-portal-module').then(m => m.PatientPortalModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['patient'] }
  },

  // Wildcard route
  {
    path: '**',
    redirectTo: '/home'
  }
];
