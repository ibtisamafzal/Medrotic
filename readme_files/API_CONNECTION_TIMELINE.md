# API Connection Timeline

This document tracks all API connections made between the Angular frontend and .NET backend, including files changed, endpoints connected, and configuration updates.

---

## Session 1: Initial Auth API Connection
**Date:** December 2024  
**Backend API Base URL:** `https://localhost:7124`  
**API Path:** `/api/Auth` (note: capital 'A' in Auth)

### Overview
Connected all authentication-related APIs from the .NET backend to the Angular frontend. Updated service methods, interfaces, and components to match the exact API DTOs and endpoints.

---

## APIs Connected

### ✅ 1. Login API
- **Endpoint:** `POST /api/Auth/login`
- **Status:** ✅ Connected
- **Request Format:**
  ```typescript
  {
    email: string;
    password: string;
  }
  ```
- **Response Format:**
  ```typescript
  {
    token: string;
    role: string;
    fullName: string;
  }
  ```
- **Notes:**
  - API currently only supports email login (not phone/CNIC)
  - Frontend UI still supports phone/CNIC for fallback/default credentials
  - Default credentials (admin/doctor/patient) still work as fallback

### ✅ 2. Register Patient API
- **Endpoint:** `POST /api/Auth/register-patient`
- **Status:** ✅ Connected
- **Request Format:**
  ```typescript
  {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    cnic: string; // 13 digits without dashes
    phoneNumber: string;
    dateOfBirth: string; // ISO date string
    gender: 'Male' | 'Female' | 'Other';
    city: string;
    province: string;
  }
  ```
- **Response Format:**
  ```typescript
  {
    message: string;
  }
  ```
- **Notes:**
  - CNIC is automatically formatted to 13 digits (dashes removed) before sending
  - All fields are required by API

### ✅ 3. Forgot Password API
- **Endpoint:** `POST /api/Auth/forget-password`
- **Status:** ✅ Connected
- **Request Format:**
  ```typescript
  {
    email: string;
  }
  ```
- **Response Format:**
  ```typescript
  {
    message: string;
  }
  ```
- **Notes:**
  - API only supports email (not SMS)
  - OTP is currently logged to console (needs email service implementation)
  - Frontend UI shows SMS option but converts to email for API call

### ✅ 4. Verify OTP API
- **Endpoint:** `POST /api/Auth/verify-otp`
- **Status:** ✅ Connected
- **Request Format:**
  ```typescript
  {
    email: string;
    otp: string;
  }
  ```
- **Response Format:**
  ```typescript
  {
    message: string;
    token: string; // Reset token for password reset
  }
  ```
- **Notes:**
  - Token is used for password reset
  - OTP is marked as used after verification

### ✅ 5. Resend OTP API
- **Endpoint:** `POST /api/Auth/resend-otp`
- **Status:** ✅ Connected
- **Request Format:**
  ```typescript
  {
    email: string;
  }
  ```
- **Response Format:**
  ```typescript
  {
    message: string;
  }
  ```
- **Notes:**
  - Invalidates old unused OTPs before generating new one

### ✅ 6. Reset Password API
- **Endpoint:** `POST /api/Auth/reset-password`
- **Status:** ✅ Connected
- **Request Format:**
  ```typescript
  {
    email: string;
    token: string; // From verify-otp response
    newPassword: string;
  }
  ```
- **Response Format:**
  ```typescript
  {
    message: string;
  }
  ```
- **Notes:**
  - Token is from verify-otp endpoint
  - Used OTPs are cleaned up after successful reset

### ✅ 7. Add User API (Admin Only)
- **Endpoint:** `POST /api/Auth/add-user`
- **Status:** ✅ Connected
- **Auth Required:** Yes (Admin role)
- **Request Format:**
  ```typescript
  {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'Admin' | 'Doctor';
    specialty?: string; // Required for Doctor
    experienceYears?: number; // Required for Doctor
    city?: string;
    province?: string;
    phoneNumber?: string;
    dateOfBirth?: string; // ISO date string
    gender?: 'Male' | 'Female' | 'Other';
  }
  ```
- **Response Format:**
  ```typescript
  {
    message: string;
  }
  ```
- **Notes:**
  - Only admins can add users
  - Doctors require specialty and experienceYears

### ✅ 8. Test Admin Endpoint
- **Endpoint:** `GET /api/Auth/test-admin`
- **Status:** ✅ Connected
- **Auth Required:** Yes (Admin role)
- **Response Format:**
  ```typescript
  {
    message: string;
  }
  ```

### ✅ 9. Test Doctor Endpoint
- **Endpoint:** `GET /api/Auth/test-doctor`
- **Status:** ✅ Connected
- **Auth Required:** Yes (Doctor role)
- **Response Format:**
  ```typescript
  {
    message: string;
  }
  ```

### ✅ 10. Test Patient Endpoint
- **Endpoint:** `GET /api/Auth/test-patient`
- **Status:** ✅ Connected
- **Auth Required:** Yes (Patient role)
- **Response Format:**
  ```typescript
  {
    message: string;
  }
  ```

---

## Files Changed

### Core Service Files

#### 1. `src/app/auth/auth.service.ts`
**Changes Made:**
- ✅ Added import for `environment` from `../../environments/environment`
- ✅ Updated `API_BASE` to use environment variable: `${environment.apiUrl}/api/Auth`
- ✅ Fixed API path to use capital 'A' in Auth (was lowercase)
- ✅ Updated `LoginRequest` interface:
  - Made email optional for UI purposes (phone/cnic support)
  - Added phone and cnic fields for UI
  - API still requires email
- ✅ Replaced `RegisterRequest` with `RegisterPatientRequest`:
  - Changed `name` to `fullName`
  - Changed `phone` to `phoneNumber`
  - Added `confirmPassword` field
  - Updated field types to match API DTOs
- ✅ Updated `ForgotPasswordRequest`:
  - Removed phone and method fields
  - Now only supports email (API limitation)
- ✅ Updated `VerifyOTPRequest`:
  - Removed phone field
  - Removed type field (not used by API)
  - Now only supports email
- ✅ Updated `ResetPasswordRequest`:
  - Added `email` field (required by API)
  - Removed `confirmPassword` (not sent to API)
- ✅ Added `AddUserRequest` interface
- ✅ Added `LoginResponse` interface
- ✅ Updated `login()` method:
  - Added email validation check
  - Changed from `tap` to `map` operator
  - Converts API response to User format
  - Only sends email and password to API
- ✅ Updated `register()` method:
  - Accepts `RegisterPatientRequest`
  - Formats CNIC to 13 digits (removes dashes)
- ✅ Updated `forgotPassword()` method:
  - Only accepts email
  - Updated response type
- ✅ Updated `verifyOTP()` method:
  - Only accepts email and OTP
  - Updated response type to include token
- ✅ Updated `resendOTP()` method:
  - Only accepts email parameter
  - Updated response type
- ✅ Updated `resetPassword()` method:
  - Includes email in request
  - Updated response type
- ✅ Added `addUser()` method (new)
- ✅ Added `testAdmin()` method (new)
- ✅ Added `testDoctor()` method (new)
- ✅ Added `testPatient()` method (new)

### Component Files

#### 2. `src/app/auth/register/register.ts`
**Changes Made:**
- ✅ Updated import to use `RegisterPatientRequest` instead of `RegisterRequest`
- ✅ Updated validation:
  - Email is now required (not optional)
  - Phone number is now required (not optional)
  - Gender validation added for 'Male', 'Female', 'Other'
- ✅ Updated `onRegister()` method:
  - Creates `RegisterPatientRequest` with correct field names
  - Formats CNIC to 13 digits (removes dashes)
  - Formats phone number (removes spaces)
  - Converts date of birth to ISO string
  - Sends all required fields to API
- ✅ Updated error handling to check both `message` and `Message` properties

#### 3. `src/app/auth/forgot-password/forgot-password.ts`
**Changes Made:**
- ✅ Removed SMS support from API calls (kept in UI for future)
- ✅ Updated validation to only require email
- ✅ Updated `onSubmit()` method:
  - Only sends email to API
  - Navigates to verify-otp with email parameter
- ✅ Added phone input handler (for UI, but not used in API call)
- ✅ Added method selection (email/sms) but SMS shows error message

#### 4. `src/app/auth/verify-otp/verify-otp.ts`
**Changes Made:**
- ✅ Removed phone support from API calls
- ✅ Updated `ngOnInit()` to only get email from query params
- ✅ Updated `onVerify()` method:
  - Only sends email and OTP to API
  - Handles token from API response correctly
  - Passes email to reset-password route
- ✅ Updated `onResendOTP()` method:
  - Only accepts email parameter
  - Updated response handling
- ✅ Added `message` property for display

#### 5. `src/app/auth/reset-password/reset-password.ts`
**Changes Made:**
- ✅ Updated `ngOnInit()` to get email from query params
- ✅ Updated `onSubmit()` method:
  - Includes email in request
  - Updated error handling to check both `message` and `Message`
- ✅ Added email validation check

#### 6. `src/app/auth/login/login.ts`
**Status:** No changes required
- ✅ Already compatible with updated service
- ✅ UI supports email/phone/CNIC but API only uses email
- ✅ Fallback to default credentials still works

### Configuration Files

#### 7. `src/environments/environment.ts`
**Status:** Already configured
- ✅ API URL: `https://localhost:7124`
- ✅ No changes needed

#### 8. `src/environments/environment.prod.ts`
**Status:** Already configured
- ✅ Production API URL placeholder
- ✅ No changes needed

### Interceptor Files

#### 9. `src/app/interceptors/jwt-interceptor.ts`
**Status:** Already configured
- ✅ JWT interceptor already set up
- ✅ Adds Authorization header with Bearer token
- ✅ Handles token expiration
- ✅ No changes needed

#### 10. `src/app/app.config.ts`
**Status:** Already configured
- ✅ JWT interceptor already registered
- ✅ No changes needed

---

## Configuration Summary

### Environment Variables
- **Development API URL:** `https://localhost:7124`
- **API Base Path:** `/api/Auth` (capital A)
- **Full API Base:** `${environment.apiUrl}/api/Auth`

### Authentication
- **Token Storage:** localStorage
- **Token Format:** JWT Bearer token
- **Interceptor:** Automatically adds Authorization header
- **Token Expiration:** Checked by interceptor

---

## Known Limitations

1. **Login Method:**
   - API only supports email login
   - Phone and CNIC login are not yet implemented in backend
   - Frontend UI still supports phone/CNIC for fallback/default credentials

2. **OTP Delivery:**
   - OTPs are currently logged to console
   - Need to implement email service in backend
   - SMS support not available

3. **Password Reset:**
   - Currently only supports email
   - SMS support not available
   - Frontend UI shows SMS option but shows error message

4. **Google OAuth:**
   - Not yet implemented in backend
   - Frontend method exists but will fail

5. **Change Password:**
   - Endpoint not yet available in backend
   - Frontend method exists but will fail

---

## Testing Status

- ✅ All endpoints connected
- ✅ Request/response formats match API DTOs
- ✅ Error handling implemented
- ✅ Type safety maintained
- ✅ JWT interceptor configured
- ⚠️ Manual testing recommended
- ⚠️ Unit tests may need updates

---

## Next Steps

### Backend Enhancements Needed:
1. Add phone/CNIC login support
2. Implement email service for OTP delivery
3. Implement SMS service for OTP delivery
4. Add change password endpoint
5. Add Google OAuth support

### Frontend Enhancements:
1. Add loading indicators (some already exist)
2. Improve error messages
3. Add retry logic for failed requests
4. Add request timeout handling
5. Update unit tests to match new interfaces

---

## API Response Codes

- `200 OK`: Success
- `400 Bad Request`: Validation error or bad data
- `401 Unauthorized`: Authentication required or invalid credentials
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Endpoint not found
- `500 Internal Server Error`: Server error

---

## Default Credentials (Fallback)

These work as fallback when API is not available:
- **Admin:**
  - Email: `admin@medrotic.com`
  - Password: `Admin@123`
- **Doctor:**
  - Email: `doctor@medrotic.com`
  - Password: `Doctor@123`
- **Patient:**
  - Email: `patient@medrotic.com`
  - Password: `Patient@123`

---

## Notes

- All API endpoints use HTTPS
- CORS is configured in backend for `http://localhost:4200`
- JWT tokens are stored in localStorage
- Token expiration is checked by interceptor
- Error messages support both `message` and `Message` properties for compatibility
- CNIC formatting: automatically removes dashes before sending (13 digits)
- Date formatting: converts to ISO string format for API

---

## Future API Connections

This section will be updated as more APIs are connected:

### Pending APIs:
- [ ] Patient Management APIs
- [ ] Doctor Management APIs
- [ ] Admin Management APIs
- [ ] Appointment APIs
- [ ] Prescription APIs
- [ ] Document Management APIs
- [ ] Notification APIs
- [ ] Analytics APIs

---

**Last Updated:** 16 January 2026
**Session:** Initial Auth API Connection  
**Status:** ✅ Complete
