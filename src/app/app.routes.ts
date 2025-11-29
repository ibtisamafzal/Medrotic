import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';
import { RoleGuard } from './guards/role-guard';
import { Home } from './common/home/home';
import { About } from './common/about/about';
import { Services } from './common/services/services';
import { Contact } from './common/contact/contact';
import { Faq } from './common/faq/faq';
import { Terms } from './common/terms/terms';
import { Privacy } from './common/privacy/privacy';

export const routes: Routes = [
  // Public routes - Common pages
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: Home
  },
  {
    path: 'about',
    component: About
  },
  {
    path: 'services',
    component: Services
  },
  {
    path: 'contact',
    component: Contact
  },
  {
    path: 'faq',
    component: Faq
  },
  {
    path: 'terms',
    component: Terms
  },
  {
    path: 'privacy',
    component: Privacy
  },
  
  // Auth routes (public)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)
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