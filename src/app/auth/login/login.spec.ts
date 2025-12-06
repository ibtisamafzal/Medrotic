import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login';
import { AuthService } from '../auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AuthService', [
      'login',
      'loginWithGoogle',
      'validateEmail',
      'validatePhone',
      'validateCNIC',
      'formatCNIC'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        RouterTestingModule,
        FormsModule
      ],
      providers: [
        { provide: AuthService, useValue: spy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with email as default login method', () => {
    expect(component.loginMethod).toBe('email');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalse();
  });

  it('should get correct identifier label based on login method', () => {
    component.loginMethod = 'email';
    expect(component.getIdentifierLabel()).toBe('Email Address');
    
    component.loginMethod = 'phone';
    expect(component.getIdentifierLabel()).toBe('Phone Number');
    
    component.loginMethod = 'cnic';
    expect(component.getIdentifierLabel()).toBe('CNIC (National Identity Card Number)');
  });

  it('should get correct identifier placeholder based on login method', () => {
    component.loginMethod = 'email';
    expect(component.getIdentifierPlaceholder()).toBe('Enter your email address');
    
    component.loginMethod = 'phone';
    expect(component.getIdentifierPlaceholder()).toBe('Enter your phone number');
    
    component.loginMethod = 'cnic';
    expect(component.getIdentifierPlaceholder()).toBe('12345-1234567-1');
  });

  it('should validate form correctly', () => {
    authServiceSpy.validateEmail.and.returnValue(true);
    authServiceSpy.validatePhone.and.returnValue(true);
    authServiceSpy.validateCNIC.and.returnValue(true);

    // Test email validation
    component.loginMethod = 'email';
    component.email = 'test@example.com';
    component.password = 'password123';
    expect(component.validateForm()).toBeTrue();

    // Test empty email
    component.email = '';
    expect(component.validateForm()).toBeFalse();
    expect(component.error).toBe('Email is required');

    // Test invalid email
    component.email = 'invalid-email';
    authServiceSpy.validateEmail.and.returnValue(false);
    expect(component.validateForm()).toBeFalse();
    expect(component.error).toBe('Please enter a valid email address');

    // Test password validation
    component.email = 'test@example.com';
    authServiceSpy.validateEmail.and.returnValue(true);
    component.password = 'short';
    expect(component.validateForm()).toBeFalse();
    expect(component.error).toBe('Password must be at least 8 characters');
  });

  it('should handle identifier value getter and setter', () => {
    component.loginMethod = 'email';
    component.identifierValue = 'test@example.com';
    expect(component.email).toBe('test@example.com');
    
    component.loginMethod = 'phone';
    component.identifierValue = '+92 300 1234567';
    expect(component.phone).toBe('+92 300 1234567');
    
    component.loginMethod = 'cnic';
    component.identifierValue = '12345-1234567-1';
    expect(component.cnic).toBe('12345-1234567-1');
  });
});