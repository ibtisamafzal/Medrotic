import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Protected routes - use client-side rendering (requires authentication)
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'doctor-portal/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'patient-portal/**',
    renderMode: RenderMode.Client
  },
  // Auth routes - use client-side rendering
  {
    path: 'auth/**',
    renderMode: RenderMode.Client
  },
  // Public routes - can be prerendered
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
