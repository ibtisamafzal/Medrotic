# Default User Configuration

## Development User Credentials

For development and testing purposes, default users have been configured for Admin, Doctor, and Patient roles.

### Default Admin Login Details

- **Email:** `admin@medrotic.com`
- **Password:** `Admin@123`
- **Role:** `admin`

### Default Doctor Login Details

- **Email:** `doctor@medrotic.com`
- **Password:** `Doctor@123`
- **Role:** `doctor`

### Default Patient Login Details

- **Email:** `patient@medrotic.com`
- **Password:** `Patient@123`
- **Role:** `patient`

### How to Use

#### Admin Login:
1. Navigate to the login page: `/auth/login`
2. Select **Role:** `Admin`
3. Enter the email: `admin@medrotic.com`
4. Enter the password: `Admin@123`
5. Click "Sign In"

After successful login, you will be automatically redirected to the admin dashboard at `/admin/dashboard`.

#### Doctor Login:
1. Navigate to the login page: `/auth/login`
2. Select **Role:** `Doctor`
3. Enter the email: `doctor@medrotic.com`
4. Enter the password: `Doctor@123`
5. Click "Sign In"

After successful login, you will be automatically redirected to the doctor portal dashboard at `/doctor-portal/dashboard`.

#### Patient Login:
1. Navigate to the login page: `/auth/login`
2. Select **Role:** `Patient`
3. Enter the email: `patient@medrotic.com`
4. Enter the password: `Patient@123`
5. Click "Sign In"

After successful login, you will be automatically redirected to the patient portal dashboard at `/patient-portal/dashboard`.

### Important Notes

⚠️ **This is for development only!**

- These credentials work **only in development mode**
- In production, these default credentials will **NOT work**
- All production users must be created through the backend API
- The backend team will handle creating real admin users in production

### Location

The default user configuration is located in:
- `src/app/config/default-admin.ts` - Default credentials and helper functions for admin, doctor, and patient
- `src/app/auth/auth.service.ts` - Login logic that checks for default admin, doctor, and patient credentials

### Removing Default Users (Before Production)

Before deploying to production, you should:

1. Remove or disable the default admin, doctor, and patient checks in `auth.service.ts`
2. Remove the `default-admin.ts` file or ensure it's not imported
3. Ensure all users are created through the backend API
4. Test that the default credentials no longer work

