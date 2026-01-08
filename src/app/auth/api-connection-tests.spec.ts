/**
 * Comprehensive API Connection Tests
 * 
 * This file contains tests for all API endpoints connected to the frontend.
 * Run these tests to verify that all API connections are working correctly.
 * 
 * To run: npm test -- api-connection-tests.spec.ts
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, LoginRequest, RegisterRequest, ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest } from './auth.service';
import { environment } from '../../environments/environment';

describe('API Connection Tests', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiBase = `${environment.apiUrl}/api/Auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Login API', () => {
    it('should send login request with correct format', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'Test@123',
        role: 'patient'
      };

      service.login(loginRequest).subscribe(response => {
        expect(response).toBeTruthy();
        expect(response.token).toBeDefined();
        expect(response.role).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiBase}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'Test@123'
      });

      req.flush({
        token: 'mock-jwt-token',
        role: 'Patient',
        fullName: 'Test User'
      });
    });

    it('should handle login errors correctly', () => {
      const loginRequest: LoginRequest = {
        email: 'wrong@example.com',
        password: 'WrongPassword',
        role: 'patient'
      };

      service.login(loginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/login`);
      req.flush({ message: 'Invalid email or password.' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Register Patient API', () => {
    it('should send registration request with correct format', () => {
      const registerRequest: RegisterRequest = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Test@123',
        confirmPassword: 'Test@123',
        cnic: '1234512345671',
        phoneNumber: '+923001234567',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        city: 'Lahore',
        province: 'Punjab'
      };

      service.register(registerRequest).subscribe(response => {
        expect(response.message).toContain('successfully');
      });

      const req = httpMock.expectOne(`${apiBase}/register-patient`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.fullName).toBe('John Doe');
      expect(req.request.body.email).toBe('john@example.com');
      expect(req.request.body.cnic).toBe('1234512345671');
      expect(req.request.body.phoneNumber).toBe('+923001234567');

      req.flush({ message: 'Patient registered successfully.' });
    });

    it('should handle registration validation errors', () => {
      const registerRequest: RegisterRequest = {
        fullName: 'John Doe',
        email: 'existing@example.com',
        password: 'Test@123',
        confirmPassword: 'Test@123',
        cnic: '1234512345671',
        phoneNumber: '+923001234567',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        city: 'Lahore',
        province: 'Punjab'
      };

      service.register(registerRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/register-patient`);
      req.flush({ message: 'Email already registered.' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Forgot Password API', () => {
    it('should send forgot password request with email', () => {
      const forgotRequest: ForgotPasswordRequest = {
        email: 'test@example.com'
      };

      service.forgotPassword(forgotRequest).subscribe(response => {
        expect(response.message).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiBase}/forget-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com' });

      req.flush({ message: 'OTP sent to your email.' });
    });

    it('should handle email not found error', () => {
      const forgotRequest: ForgotPasswordRequest = {
        email: 'notfound@example.com'
      };

      service.forgotPassword(forgotRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/forget-password`);
      req.flush({ message: 'Email not found.' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Verify OTP API', () => {
    it('should send verify OTP request with correct format', () => {
      const verifyRequest: VerifyOTPRequest = {
        email: 'test@example.com',
        otp: '123456'
      };

      service.verifyOTP(verifyRequest).subscribe(response => {
        expect(response.token).toBeDefined();
        expect(response.message).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiBase}/verify-otp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        otp: '123456'
      });

      req.flush({
        message: 'OTP verified.',
        token: 'reset-token-123'
      });
    });

    it('should handle invalid OTP error', () => {
      const verifyRequest: VerifyOTPRequest = {
        email: 'test@example.com',
        otp: '000000'
      };

      service.verifyOTP(verifyRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/verify-otp`);
      req.flush({ message: 'Invalid or expired OTP.' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Resend OTP API', () => {
    it('should send resend OTP request', () => {
      service.resendOTP('test@example.com').subscribe(response => {
        expect(response.message).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiBase}/resend-otp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com' });

      req.flush({ message: 'New OTP sent to your email.' });
    });
  });

  describe('Reset Password API', () => {
    it('should send reset password request with correct format', () => {
      const resetRequest: ResetPasswordRequest = {
        email: 'test@example.com',
        token: 'reset-token-123',
        newPassword: 'NewPassword@123'
      };

      service.resetPassword(resetRequest).subscribe(response => {
        expect(response.message).toContain('successfully');
      });

      const req = httpMock.expectOne(`${apiBase}/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        token: 'reset-token-123',
        newPassword: 'NewPassword@123'
      });

      req.flush({ message: 'Password reset successfully.' });
    });

    it('should handle invalid token error', () => {
      const resetRequest: ResetPasswordRequest = {
        email: 'test@example.com',
        token: 'invalid-token',
        newPassword: 'NewPassword@123'
      };

      service.resetPassword(resetRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/reset-password`);
      req.flush({ message: 'Invalid token.' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Add User API (Admin Only)', () => {
    it('should send add user request for doctor', () => {
      const addUserData = {
        fullName: 'Dr. Jane Smith',
        email: 'doctor@example.com',
        password: 'Doctor@123',
        confirmPassword: 'Doctor@123',
        role: 'Doctor' as 'Admin' | 'Doctor',
        specialty: 'Cardiology',
        experienceYears: 5,
        city: 'Karachi',
        province: 'Sindh',
        phoneNumber: '+923001234567',
        dateOfBirth: '1985-01-01',
        gender: 'Female' as 'Male' | 'Female' | 'Other'
      };

      service.addUser(addUserData).subscribe(response => {
        expect(response.message).toContain('successfully');
      });

      const req = httpMock.expectOne(`${apiBase}/add-user`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.role).toBe('Doctor');
      expect(req.request.body.specialty).toBe('Cardiology');

      req.flush({ message: 'Doctor added successfully.' });
    });

    it('should require authentication for add user', () => {
      const addUserData = {
        fullName: 'Admin User',
        email: 'admin2@example.com',
        password: 'Admin@123',
        confirmPassword: 'Admin@123',
        role: 'Admin' as 'Admin' | 'Doctor'
      };

      service.addUser(addUserData).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/add-user`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Test Endpoints (Role-based)', () => {
    it('should call test-admin endpoint', () => {
      service.testAdmin().subscribe(response => {
        expect(response.message).toBe('Admin access granted.');
      });

      const req = httpMock.expectOne(`${apiBase}/test-admin`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toContain('Bearer');

      req.flush({ message: 'Admin access granted.' });
    });

    it('should call test-doctor endpoint', () => {
      service.testDoctor().subscribe(response => {
        expect(response.message).toBe('Doctor access granted.');
      });

      const req = httpMock.expectOne(`${apiBase}/test-doctor`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toContain('Bearer');

      req.flush({ message: 'Doctor access granted.' });
    });

    it('should call test-patient endpoint', () => {
      service.testPatient().subscribe(response => {
        expect(response.message).toBe('Patient access granted.');
      });

      const req = httpMock.expectOne(`${apiBase}/test-patient`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toContain('Bearer');

      req.flush({ message: 'Patient access granted.' });
    });
  });

  describe('API Endpoint URLs', () => {
    it('should use correct base URL from environment', () => {
      expect(environment.apiUrl).toBeDefined();
      expect(environment.apiUrl).toContain('localhost:7124');
    });

    it('should use capital A in Auth controller path', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'Test@123',
        role: 'patient'
      };

      service.login(loginRequest).subscribe();

      const req = httpMock.expectOne(`${apiBase}/login`);
      expect(req.request.url).toContain('/api/Auth');
      expect(req.request.url).not.toContain('/api/auth');

      req.flush({
        token: 'mock-token',
        role: 'Patient',
        fullName: 'Test User'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'Test@123',
        role: 'patient'
      };

      service.login(loginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiBase}/login`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle 500 server errors', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'Test@123',
        role: 'patient'
      };

      service.login(loginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/login`);
      req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});


