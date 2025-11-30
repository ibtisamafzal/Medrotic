/**
 * Default Admin User Configuration
 * 
 * This file contains default admin credentials for development/testing purposes.
 * In production, these should be removed and all users should be created via the backend.
 * 
 * WARNING: This is for development only. Never commit real credentials to version control.
 */

import { User } from '../auth/auth.service';
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@medrotic.com',
  password: 'Admin@123',
  role: 'admin' as const
};

/**
 * Create a default admin user object
 */
export function createDefaultAdminUser(): User {
  // Generate a simple JWT-like token for development
  // Format: header.payload.signature (all base64 encoded)
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    id: 'admin-default-001',
    email: DEFAULT_ADMIN_CREDENTIALS.email,
    role: 'admin',
    name: 'Default Admin',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
  };
  
  // Create proper JWT format: header.payload.signature
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa('dev-signature'); // Mock signature for development
  const token = `${encodedHeader}.${encodedPayload}.${signature}`;
  
  return {
    id: 'admin-default-001',
    email: DEFAULT_ADMIN_CREDENTIALS.email,
    name: 'Default Admin',
    role: 'admin',
    token: token
  };
}

/**
 * Check if credentials match default admin
 */
export function isDefaultAdminCredentials(email: string, password: string, role: string): boolean {
  return (
    email === DEFAULT_ADMIN_CREDENTIALS.email &&
    password === DEFAULT_ADMIN_CREDENTIALS.password &&
    role === DEFAULT_ADMIN_CREDENTIALS.role
  );
}

/**
 * Mock login for default admin (development only)
 */
export function mockDefaultAdminLogin(): Observable<User> {
  const user = createDefaultAdminUser();
  return of(user).pipe(delay(500)); // Simulate network delay
}

