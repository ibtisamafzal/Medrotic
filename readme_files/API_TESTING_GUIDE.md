# API Testing Guide

This guide provides comprehensive instructions for testing all API connections in the Medrotic application.

## Prerequisites

1. **Backend API Running**: Ensure the .NET API is running on `https://localhost:7124`
2. **Frontend Running**: Start the Angular development server (`ng serve`)
3. **Database**: Ensure the database is set up and migrations are applied

## Testing Methods

### 1. Automated Unit Tests

Run the comprehensive test suite:

```bash
npm test -- api-connection-tests.spec.ts
```

This will test:
- ✅ Login API
- ✅ Register Patient API
- ✅ Forgot Password API
- ✅ Verify OTP API
- ✅ Resend OTP API
- ✅ Reset Password API
- ✅ Add User API (Admin)
- ✅ Test Endpoints (Role-based)
- ✅ Error Handling
- ✅ URL Formatting

### 2. Manual Testing via Swagger

1. Navigate to `https://localhost:7124/swagger`
2. Test each endpoint manually:

#### Login Endpoint
```json
POST /api/Auth/login
{
  "email": "admin@medrotic.com",
  "password": "Admin@123"
}
```

#### Register Patient
```json
POST /api/Auth/register-patient
{
  "fullName": "Test Patient",
  "email": "patient@test.com",
  "password": "Test@123",
  "confirmPassword": "Test@123",
  "cnic": "1234512345671",
  "phoneNumber": "+923001234567",
  "dateOfBirth": "1990-01-01T00:00:00",
  "gender": "Male",
  "city": "Lahore",
  "province": "Punjab"
}
```

#### Forgot Password
```json
POST /api/Auth/forget-password
{
  "email": "admin@medrotic.com"
}
```

#### Verify OTP
```json
POST /api/Auth/verify-otp
{
  "email": "admin@medrotic.com",
  "otp": "123456"
}
```

#### Reset Password
```json
POST /api/Auth/reset-password
{
  "email": "admin@medrotic.com",
  "token": "<token-from-verify-otp>",
  "newPassword": "NewPassword@123"
}
```

### 3. Frontend Integration Testing

#### Test Login Flow

1. Navigate to `/auth/login`
2. Enter credentials:
   - Email: `admin@medrotic.com`
   - Password: `Admin@123`
   - Role: `admin`
3. Click "Login"
4. Verify:
   - ✅ Redirects to admin dashboard
   - ✅ Token is stored in localStorage
   - ✅ User object is created

#### Test Registration Flow

1. Navigate to `/auth/register`
2. Fill in all required fields:
   - Full Name: `Test Patient`
   - Email: `newpatient@test.com`
   - Phone: `+92 300 1234567`
   - CNIC: `12345-1234567-1`
   - Password: `Test@123`
   - Confirm Password: `Test@123`
   - Date of Birth: `1990-01-01`
   - Gender: `Male`
   - City: `Lahore`
   - Province: `Punjab`
3. Click "Register"
4. Verify:
   - ✅ Success message appears
   - ✅ Redirects to login page
   - ✅ User can login with new credentials

#### Test Forgot Password Flow

1. Navigate to `/auth/forgot-password`
2. Enter email: `admin@medrotic.com`
3. Click "Send Reset Link"
4. Check console for OTP (currently logged to console)
5. Navigate to `/auth/verify-otp`
6. Enter OTP from console
7. Verify:
   - ✅ Token is received
   - ✅ Redirects to reset password page
8. Enter new password
9. Verify:
   - ✅ Password is reset
   - ✅ Can login with new password

#### Test Role-Based Endpoints

1. Login as Admin
2. Open browser console
3. Run:
```javascript
// Test Admin endpoint
fetch('https://localhost:7124/api/Auth/test-admin', {
  headers: {
    'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('currentUser')).token
  }
}).then(r => r.json()).then(console.log)
```

4. Repeat for `test-doctor` and `test-patient` endpoints
5. Verify:
   - ✅ Admin can access test-admin
   - ✅ Doctor can access test-doctor
   - ✅ Patient can access test-patient
   - ✅ Unauthorized access returns 401

## Common Issues and Solutions

### Issue 1: CORS Error

**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**: 
- Verify CORS is configured in `Program.cs`
- Check that frontend origin `http://localhost:4200` is allowed
- Ensure `AllowCredentials()` is called

### Issue 2: 401 Unauthorized

**Error**: `401 Unauthorized` on protected endpoints

**Solution**:
- Check JWT token is being sent in Authorization header
- Verify token is not expired
- Ensure user has correct role for endpoint

### Issue 3: 400 Bad Request

**Error**: `400 Bad Request` with validation errors

**Solution**:
- Check request body matches API DTO structure
- Verify all required fields are provided
- Check field formats (email, CNIC, phone, etc.)

### Issue 4: 404 Not Found

**Error**: `404 Not Found`

**Solution**:
- Verify API is running
- Check endpoint URL is correct (capital A in `/api/Auth`)
- Ensure route matches controller route

### Issue 5: SSL Certificate Error

**Error**: `NET::ERR_CERT_AUTHORITY_INVALID`

**Solution**:
- For development, accept the self-signed certificate
- Or configure proper SSL certificate
- Or use HTTP instead of HTTPS for local development

## Test Checklist

### Authentication APIs
- [ ] Login with email
- [ ] Login with default admin credentials (fallback)
- [ ] Login error handling
- [ ] Register new patient
- [ ] Register validation errors
- [ ] Forgot password
- [ ] Verify OTP
- [ ] Resend OTP
- [ ] Reset password
- [ ] Add user (admin only)
- [ ] Test admin endpoint
- [ ] Test doctor endpoint
- [ ] Test patient endpoint

### Data Validation
- [ ] Email format validation
- [ ] CNIC format validation (13 digits)
- [ ] Phone number format validation
- [ ] Password strength validation
- [ ] Required field validation

### Error Handling
- [ ] Network errors
- [ ] 400 Bad Request
- [ ] 401 Unauthorized
- [ ] 403 Forbidden
- [ ] 404 Not Found
- [ ] 500 Server Error

### Security
- [ ] JWT token is sent in requests
- [ ] Token expiration handling
- [ ] Role-based access control
- [ ] CORS configuration

## API Endpoints Summary

| Endpoint | Method | Auth Required | Role Required |
|----------|--------|---------------|---------------|
| `/api/Auth/login` | POST | No | - |
| `/api/Auth/register-patient` | POST | No | - |
| `/api/Auth/add-user` | POST | Yes | Admin |
| `/api/Auth/forget-password` | POST | No | - |
| `/api/Auth/verify-otp` | POST | No | - |
| `/api/Auth/resend-otp` | POST | No | - |
| `/api/Auth/reset-password` | POST | No | - |
| `/api/Auth/test-admin` | GET | Yes | Admin |
| `/api/Auth/test-doctor` | GET | Yes | Doctor |
| `/api/Auth/test-patient` | GET | Yes | Patient |

## Notes

1. **Default Admin Credentials**: 
   - Email: `admin@medrotic.com`
   - Password: `Admin@123`

2. **OTP Display**: Currently, OTPs are logged to console. In production, implement email/SMS service.

3. **CNIC Format**: API expects 13 digits without dashes, but frontend displays with dashes.

4. **Phone Format**: API accepts phone numbers, but ensure proper formatting.

5. **Token Storage**: Tokens are stored in localStorage. Consider using httpOnly cookies for production.

## Next Steps

After verifying all APIs work correctly:
1. Implement email service for OTP delivery
2. Implement SMS service for OTP delivery
3. Add phone/CNIC login support in backend
4. Add change password endpoint
5. Add Google OAuth integration
6. Implement refresh token mechanism


