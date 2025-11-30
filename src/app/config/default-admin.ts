/**
 * Default User Configuration
 * 
 * This file contains default user credentials for development/testing purposes.
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

export const DEFAULT_DOCTOR_CREDENTIALS = {
  email: 'doctor@medrotic.com',
  password: 'Doctor@123',
  role: 'doctor' as const
};

export const DEFAULT_PATIENT_CREDENTIALS = {
  email: 'patient@medrotic.com',
  password: 'Patient@123',
  role: 'patient' as const
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
 * Create a default doctor user object
 */
export function createDefaultDoctorUser(): User {
  // Generate a simple JWT-like token for development
  // Format: header.payload.signature (all base64 encoded)
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    id: 'doctor-default-001',
    email: DEFAULT_DOCTOR_CREDENTIALS.email,
    role: 'doctor',
    name: 'Default Doctor',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
  };
  
  // Create proper JWT format: header.payload.signature
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa('dev-signature'); // Mock signature for development
  const token = `${encodedHeader}.${encodedPayload}.${signature}`;
  
  return {
    id: 'doctor-default-001',
    email: DEFAULT_DOCTOR_CREDENTIALS.email,
    name: 'Default Doctor',
    role: 'doctor',
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
 * Check if credentials match default doctor
 */
export function isDefaultDoctorCredentials(email: string, password: string, role: string): boolean {
  return (
    email === DEFAULT_DOCTOR_CREDENTIALS.email &&
    password === DEFAULT_DOCTOR_CREDENTIALS.password &&
    role === DEFAULT_DOCTOR_CREDENTIALS.role
  );
}

/**
 * Mock login for default admin (development only)
 */
export function mockDefaultAdminLogin(): Observable<User> {
  const user = createDefaultAdminUser();
  return of(user).pipe(delay(500)); // Simulate network delay
}

/**
 * Create a default patient user object
 */
export function createDefaultPatientUser(): User {
  // Generate a simple JWT-like token for development
  // Format: header.payload.signature (all base64 encoded)
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    id: 'patient-default-001',
    email: DEFAULT_PATIENT_CREDENTIALS.email,
    role: 'patient',
    name: 'Default Patient',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
  };
  
  // Create proper JWT format: header.payload.signature
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa('dev-signature'); // Mock signature for development
  const token = `${encodedHeader}.${encodedPayload}.${signature}`;
  
  return {
    id: 'patient-default-001',
    email: DEFAULT_PATIENT_CREDENTIALS.email,
    name: 'Default Patient',
    role: 'patient',
    token: token
  };
}

/**
 * Check if credentials match default patient
 */
export function isDefaultPatientCredentials(email: string, password: string, role: string): boolean {
  return (
    email === DEFAULT_PATIENT_CREDENTIALS.email &&
    password === DEFAULT_PATIENT_CREDENTIALS.password &&
    role === DEFAULT_PATIENT_CREDENTIALS.role
  );
}

/**
 * Mock login for default doctor (development only)
 */
export function mockDefaultDoctorLogin(): Observable<User> {
  const user = createDefaultDoctorUser();
  return of(user).pipe(delay(500)); // Simulate network delay
}

/**
 * Mock login for default patient (development only)
 */
export function mockDefaultPatientLogin(): Observable<User> {
  const user = createDefaultPatientUser();
  return of(user).pipe(delay(500)); // Simulate network delay
}

