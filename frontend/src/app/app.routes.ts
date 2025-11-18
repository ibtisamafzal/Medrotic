import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';
import { RoleGuard } from './guards/role-guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./common/common-module').then(m => m.CommonModule)
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