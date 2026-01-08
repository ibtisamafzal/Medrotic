# Complete Guide: Connecting .NET APIs to Angular Frontend

This guide will teach you how to connect your .NET backend APIs to your Angular frontend, one endpoint at a time.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Configure API Base URL](#step-1-configure-api-base-url)
3. [Step 2: Understanding the Connection Flow](#step-2-understanding-the-connection-flow)
4. [Step 3: Connecting Auth APIs](#step-3-connecting-auth-apis)
5. [Step 4: Testing Your Connections](#step-4-testing-your-connections)
6. [Step 5: Error Handling](#step-5-error-handling)
7. [Step 6: Best Practices](#step-6-best-practices)

---

## Prerequisites

Before you start, make sure:
- ✅ Your .NET backend is running (check Swagger UI)
- ✅ You know the backend URL (e.g., `http://localhost:5000` or `https://localhost:5001`)
- ✅ Angular project is set up and running
- ✅ You have `HttpClient` configured in your Angular app (already done in your project)

---

## Step 1: Configure API Base URL

### 1.1 Create Environment Files

First, create environment configuration files to store your API base URL.

**Create `src/environments/environment.ts`** (for development):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000' // Change this to your .NET backend URL
};
```

**Create `src/environments/environment.prod.ts`** (for production):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com' // Your production API URL
};
```

### 1.2 Update Angular Configuration

Open `angular.json` and ensure environment files are configured in the `fileReplacements` section:

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

### 1.3 Update Auth Service to Use Environment

Modify `src/app/auth/auth.service.ts` to use the environment variable:

```typescript
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Add this import

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private isBrowser: boolean;
  private readonly API_BASE = `${environment.apiUrl}/api/Auth`; // Updated to use environment and capital A

  // ... rest of your code
}
```

**Important Note:** Your .NET API uses `/api/Auth` (capital A), so make sure to use the correct casing!

---

## Step 2: Understanding the Connection Flow

Here's how Angular connects to your .NET API:

```
Angular Component
    ↓
Angular Service (AuthService)
    ↓
HttpClient (Angular)
    ↓
JWT Interceptor (adds token)
    ↓
.NET Backend API
    ↓
Response back to Angular
```

### Key Concepts:

1. **Service Layer**: Services handle all API calls (like `AuthService`)
2. **HttpClient**: Angular's built-in HTTP client for making requests
3. **Interceptors**: Automatically add headers (like JWT tokens) to requests
4. **Observables**: Handle asynchronous API responses

---

## Step 3: Connecting Auth APIs

Let's connect each Auth API endpoint one by one. Based on your Swagger UI, here are the endpoints:

### API 1: POST `/api/Auth/login`

**Purpose:** User login with email/phone/CNIC, password, and role.

**Step-by-Step:**

1. **Check the existing method** in `auth.service.ts`:
   - The `login()` method already exists at line 132
   - It's already configured to call `${this.API_BASE}/login`

2. **Verify the endpoint matches your .NET API:**
   - Your .NET API: `/api/Auth/login`
   - Current code: `${this.API_BASE}/login` (which becomes `/api/Auth/login` if API_BASE is correct)

3. **Test it in a component:**

```typescript
// In your login component (src/app/auth/login/login.ts)
import { Component } from '@angular/core';
import { AuthService, LoginRequest } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm = {
    email: '',
    password: '',
    role: 'patient' as 'admin' | 'doctor' | 'patient'
  };
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    const loginRequest: LoginRequest = {
      email: this.loginForm.email,
      password: this.loginForm.password,
      role: this.loginForm.role
    };

    this.authService.login(loginRequest).subscribe({
      next: (user) => {
        console.log('Login successful:', user);
        // Redirect based on role
        if (user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else if (user.role === 'doctor') {
          this.router.navigate(['/doctor-portal/dashboard']);
        } else {
          this.router.navigate(['/patient-portal/dashboard']);
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
```

**What happens:**
- User fills form → Component calls `authService.login()`
- Service sends POST to `/api/Auth/login` with credentials
- Backend validates and returns user + JWT token
- Service stores token in localStorage
- Component redirects user to appropriate dashboard

---

### API 2: POST `/api/Auth/register-patient`

**Purpose:** Register a new patient (CNIC-based registration).

**Step-by-Step:**

1. **Check if method exists** in `auth.service.ts`:
   - The `register()` method exists at line 211
   - It calls `${this.API_BASE}/register`

2. **Update if needed:**
   - Your .NET API uses `/api/Auth/register-patient`
   - Update the service method:

```typescript
// In auth.service.ts, update the register method:
register(userData: RegisterRequest): Observable<any> {
  // Change endpoint to match your .NET API
  return this.http.post<any>(`${this.API_BASE}/register-patient`, userData);
}
```

3. **Use in registration component:**

```typescript
// In your register component
import { AuthService, RegisterRequest } from '../auth.service';

export class RegisterComponent {
  registerForm = {
    name: '',
    email: '',
    phone: '',
    cnic: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: ''
  };
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    // Validate CNIC format
    if (!this.authService.validateCNIC(this.registerForm.cnic)) {
      this.errorMessage = 'Invalid CNIC format. Use format: 12345-1234567-1';
      return;
    }

    // Validate passwords match
    if (this.registerForm.password !== this.registerForm.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    const registerRequest: RegisterRequest = {
      name: this.registerForm.name,
      email: this.registerForm.email,
      phone: this.registerForm.phone,
      cnic: this.registerForm.cnic,
      password: this.registerForm.password,
      role: 'patient',
      dateOfBirth: this.registerForm.dateOfBirth,
      gender: this.registerForm.gender
    };

    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.successMessage = 'Registration successful! Please verify your OTP.';
        // Navigate to OTP verification page
      },
      error: (error) => {
        console.error('Registration failed:', error);
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
```

---

### API 3: POST `/api/Auth/add-user`

**Purpose:** Add a new user (admin functionality - for adding doctors/admins).

**Step-by-Step:**

1. **Add new method to `auth.service.ts`:**

```typescript
// Add this interface at the top of auth.service.ts
export interface AddUserRequest {
  name: string;
  email?: string;
  phone?: string;
  cnic?: string;
  password: string;
  role: 'admin' | 'doctor' | 'patient';
  specialization?: string; // For doctors
  licenseNumber?: string; // For doctors
}

// Add this method to AuthService class
/**
 * Add new user (admin only)
 * Used for adding doctors or other admins
 */
addUser(userData: AddUserRequest): Observable<any> {
  return this.http.post<any>(`${this.API_BASE}/add-user`, userData);
}
```

2. **Use in admin component:**

```typescript
// In your admin component for adding users
import { AuthService, AddUserRequest } from '../auth/auth.service';

export class AddUserComponent {
  userForm = {
    name: '',
    email: '',
    phone: '',
    cnic: '',
    password: '',
    role: 'doctor' as 'admin' | 'doctor' | 'patient',
    specialization: '',
    licenseNumber: ''
  };

  constructor(private authService: AuthService) {}

  onSubmit() {
    const addUserRequest: AddUserRequest = {
      name: this.userForm.name,
      email: this.userForm.email,
      phone: this.userForm.phone,
      cnic: this.userForm.cnic,
      password: this.userForm.password,
      role: this.userForm.role,
      specialization: this.userForm.specialization,
      licenseNumber: this.userForm.licenseNumber
    };

    this.authService.addUser(addUserRequest).subscribe({
      next: (response) => {
        console.log('User added successfully:', response);
        alert('User added successfully!');
      },
      error: (error) => {
        console.error('Failed to add user:', error);
        alert(error.error?.message || 'Failed to add user');
      }
    });
  }
}
```

---

### API 4: POST `/api/Auth/forget-password`

**Purpose:** Request password reset via email or SMS.

**Step-by-Step:**

1. **Check existing method:**
   - The `forgotPassword()` method exists at line 219
   - It calls `${this.API_BASE}/forgot-password`

2. **Update endpoint if needed:**
   - Your .NET API uses `/api/Auth/forget-password` (note: "forget" not "forgot")
   - Update the method:

```typescript
// In auth.service.ts, update the forgotPassword method:
forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string; otpSent: boolean }> {
  return this.http.post<{ message: string; otpSent: boolean }>(
    `${this.API_BASE}/forget-password`, // Changed from forgot-password to forget-password
    request
  );
}
```

3. **Use in forgot password component:**

```typescript
// In your forgot-password component
import { AuthService, ForgotPasswordRequest } from '../auth.service';

export class ForgotPasswordComponent {
  form = {
    email: '',
    phone: '',
    method: 'email' as 'email' | 'sms'
  };
  message = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    const request: ForgotPasswordRequest = {
      email: this.form.email || undefined,
      phone: this.form.phone || undefined,
      method: this.form.method
    };

    this.authService.forgotPassword(request).subscribe({
      next: (response) => {
        console.log('OTP sent:', response);
        this.message = response.message;
        // Navigate to OTP verification page
      },
      error: (error) => {
        console.error('Failed to send OTP:', error);
        this.message = error.error?.message || 'Failed to send OTP';
      }
    });
  }
}
```

---

### API 5: POST `/api/Auth/verify-otp`

**Purpose:** Verify OTP for password reset, registration, or login.

**Step-by-Step:**

1. **Check existing method:**
   - The `verifyOTP()` method exists at line 229
   - It calls `${this.API_BASE}/verify-otp`

2. **Use in verify OTP component:**

```typescript
// In your verify-otp component
import { AuthService, VerifyOTPRequest } from '../auth.service';
import { Router } from '@angular/router';

export class VerifyOtpComponent {
  form = {
    email: '',
    phone: '',
    otp: '',
    type: 'password_reset' as 'password_reset' | 'registration' | 'login'
  };
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    const request: VerifyOTPRequest = {
      email: this.form.email || undefined,
      phone: this.form.phone || undefined,
      otp: this.form.otp,
      type: this.form.type
    };

    this.authService.verifyOTP(request).subscribe({
      next: (response) => {
        console.log('OTP verified:', response);
        if (response.verified) {
          if (response.token) {
            // Store token if provided
            const user = {
              token: response.token,
              // ... other user data
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          
          // Navigate based on OTP type
          if (this.form.type === 'password_reset') {
            this.router.navigate(['/auth/reset-password'], {
              queryParams: { token: response.token }
            });
          } else {
            this.router.navigate(['/auth/login']);
          }
        }
      },
      error: (error) => {
        console.error('OTP verification failed:', error);
        this.errorMessage = error.error?.message || 'Invalid OTP';
      }
    });
  }
}
```

---

### API 6: POST `/api/Auth/reset-password`

**Purpose:** Reset password with token from OTP verification.

**Step-by-Step:**

1. **Check existing method:**
   - The `resetPassword()` method exists at line 249
   - It calls `${this.API_BASE}/reset-password`

2. **Use in reset password component:**

```typescript
// In your reset-password component
import { AuthService, ResetPasswordRequest } from '../auth.service';
import { ActivatedRoute, Router } from '@angular/router';

export class ResetPasswordComponent {
  form = {
    newPassword: '',
    confirmPassword: ''
  };
  token = '';
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Get token from query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  onSubmit() {
    if (this.form.newPassword !== this.form.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    const request: ResetPasswordRequest = {
      token: this.token,
      newPassword: this.form.newPassword,
      confirmPassword: this.form.confirmPassword
    };

    this.authService.resetPassword(request).subscribe({
      next: (response) => {
        console.log('Password reset successful:', response);
        this.successMessage = 'Password reset successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Password reset failed:', error);
        this.errorMessage = error.error?.message || 'Failed to reset password';
      }
    });
  }
}
```

---

### API 7: POST `/api/Auth/resend-otp`

**Purpose:** Resend OTP to user.

**Step-by-Step:**

1. **Check existing method:**
   - The `resendOTP()` method exists at line 239
   - It calls `${this.API_BASE}/resend-otp`

2. **Use in component:**

```typescript
// In your OTP verification component, add a resend button
resendOTP() {
  const email = this.form.email; // Get from form or stored value
  const phone = this.form.phone; // Get from form or stored value

  this.authService.resendOTP(email, phone).subscribe({
    next: (response) => {
      console.log('OTP resent:', response);
      alert('OTP has been resent to your email/phone');
    },
    error: (error) => {
      console.error('Failed to resend OTP:', error);
      alert(error.error?.message || 'Failed to resend OTP');
    }
  });
}
```

---

### API 8: GET `/api/Auth/test-admin`

**Purpose:** Test endpoint for admin authentication.

**Step-by-Step:**

1. **Add method to `auth.service.ts`:**

```typescript
/**
 * Test admin endpoint (for testing authentication)
 */
testAdmin(): Observable<any> {
  return this.http.get<any>(`${this.API_BASE}/test-admin`);
}
```

2. **Use in admin component:**

```typescript
// Test admin access
testAdminAccess() {
  this.authService.testAdmin().subscribe({
    next: (response) => {
      console.log('Admin test successful:', response);
    },
    error: (error) => {
      console.error('Admin test failed:', error);
    }
  });
}
```

---

### API 9: GET `/api/Auth/test-doctor`

**Purpose:** Test endpoint for doctor authentication.

**Step-by-Step:**

1. **Add method to `auth.service.ts`:**

```typescript
/**
 * Test doctor endpoint (for testing authentication)
 */
testDoctor(): Observable<any> {
  return this.http.get<any>(`${this.API_BASE}/test-doctor`);
}
```

---

### API 10: GET `/api/Auth/test-patient`

**Purpose:** Test endpoint for patient authentication.

**Step-by-Step:**

1. **Add method to `auth.service.ts`:**

```typescript
/**
 * Test patient endpoint (for testing authentication)
 */
testPatient(): Observable<any> {
  return this.http.get<any>(`${this.API_BASE}/test-patient`);
}
```

---

## Step 4: Testing Your Connections

### 4.1 Test in Browser DevTools

1. Open your Angular app in browser
2. Open DevTools (F12) → Network tab
3. Perform an action (e.g., login)
4. Check the Network tab:
   - Look for the API call
   - Check Request URL (should be `http://localhost:5000/api/Auth/login`)
   - Check Request Headers
   - Check Response

### 4.2 Test with Console Logs

Add console logs to see what's happening:

```typescript
login(credentials: LoginRequest): Observable<User> {
  console.log('Sending login request to:', `${this.API_BASE}/login`);
  console.log('Request body:', credentials);
  
  return this.http.post<User>(`${this.API_BASE}/login`, credentials).pipe(
    tap(user => {
      console.log('Login response:', user);
      // ... rest of code
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Login error:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.error);
      return throwError(() => error);
    })
  );
}
```

### 4.3 Common Issues and Solutions

**Issue 1: CORS Error**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/Auth/login' 
from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Solution:** Configure CORS in your .NET backend:
```csharp
// In your .NET Startup.cs or Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

app.UseCors("AllowAngular");
```

**Issue 2: 404 Not Found**
- Check the API URL is correct
- Check the endpoint path matches exactly (case-sensitive)
- Verify your .NET backend is running

**Issue 3: 401 Unauthorized**
- Check if JWT token is being sent
- Verify token is valid and not expired
- Check Authorization header format: `Bearer <token>`

---

## Step 5: Error Handling

### 5.1 Create Error Handler Service

Create `src/app/services/error-handler.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Bad request';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Forbidden. You do not have permission.';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || `Error: ${error.status}`;
      }
    }

    console.error('Error details:', error);
    return throwError(() => new Error(errorMessage));
  }
}
```

### 5.2 Use in Services

```typescript
import { ErrorHandlerService } from './error-handler.service';

constructor(
  private http: HttpClient,
  private errorHandler: ErrorHandlerService
) {}

login(credentials: LoginRequest): Observable<User> {
  return this.http.post<User>(`${this.API_BASE}/login`, credentials).pipe(
    catchError((error: HttpErrorResponse) => this.errorHandler.handleError(error))
  );
}
```

---

## Step 6: Best Practices

### 6.1 Always Use Services

✅ **DO:**
```typescript
// In component
this.authService.login(credentials).subscribe(...)
```

❌ **DON'T:**
```typescript
// Directly in component
this.http.post(...).subscribe(...)
```

### 6.2 Handle Loading States

```typescript
export class LoginComponent {
  isLoading = false;

  onSubmit() {
    this.isLoading = true;
    this.authService.login(credentials).subscribe({
      next: (user) => {
        this.isLoading = false;
        // Handle success
      },
      error: (error) => {
        this.isLoading = false;
        // Handle error
      }
    });
  }
}
```

### 6.3 Use TypeScript Interfaces

Always define interfaces for request/response:

```typescript
export interface LoginRequest {
  email?: string;
  phone?: string;
  cnic?: string;
  password: string;
  role: 'admin' | 'doctor' | 'patient';
  rememberMe?: boolean;
}
```

### 6.4 Validate Before Sending

```typescript
onSubmit() {
  if (!this.form.email && !this.form.phone && !this.form.cnic) {
    this.errorMessage = 'Please provide email, phone, or CNIC';
    return;
  }

  if (!this.form.password) {
    this.errorMessage = 'Password is required';
    return;
  }

  // Proceed with API call
}
```

### 6.5 Store Tokens Securely

The JWT interceptor already handles adding tokens. Make sure:
- Tokens are stored in localStorage (for web)
- Tokens are validated before use
- Expired tokens trigger logout

---

## Quick Reference: All Auth Endpoints

| Endpoint | Method | Service Method | Status |
|----------|--------|----------------|--------|
| `/api/Auth/login` | POST | `login()` | ✅ Exists |
| `/api/Auth/register-patient` | POST | `register()` | ⚠️ Needs update |
| `/api/Auth/add-user` | POST | - | ❌ Add new method |
| `/api/Auth/forget-password` | POST | `forgotPassword()` | ⚠️ Needs update |
| `/api/Auth/verify-otp` | POST | `verifyOTP()` | ✅ Exists |
| `/api/Auth/reset-password` | POST | `resetPassword()` | ✅ Exists |
| `/api/Auth/resend-otp` | POST | `resendOTP()` | ✅ Exists |
| `/api/Auth/test-admin` | GET | - | ❌ Add new method |
| `/api/Auth/test-doctor` | GET | - | ❌ Add new method |
| `/api/Auth/test-patient` | GET | - | ❌ Add new method |

---

## Next Steps

After connecting Auth APIs, you can follow the same pattern for:
- Patient APIs (`/api/patient/*` or `/api/patients/*`)
- Doctor APIs (`/api/doctor/*` or `/api/doctors/*`)
- Admin APIs (`/api/admin/*`)
- Appointment APIs
- Prescription APIs
- And more...

**Remember:** The pattern is always the same:
1. Create/update service method
2. Define TypeScript interfaces
3. Use in component
4. Handle success/error
5. Test in browser

---

## Summary

You've learned:
- ✅ How to configure API base URL using environment files
- ✅ How to connect each Auth API endpoint
- ✅ How to handle responses and errors
- ✅ Best practices for API integration
- ✅ How to test your connections

**Key Takeaways:**
1. Always use services for API calls
2. Define TypeScript interfaces for type safety
3. Handle loading states and errors
4. Test in browser DevTools
5. Match endpoint paths exactly (case-sensitive)

Happy coding! 🚀

