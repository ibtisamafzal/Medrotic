# Default Admin Configuration

## Development Admin Credentials

For development and testing purposes, a default admin user has been configured.

### Default Admin Login Details

- **Email:** `admin@medrotic.com`
- **Password:** `Admin@123`
- **Role:** `admin`

### How to Use

1. Navigate to the login page: `/auth/login`
2. Select **Role:** `Admin`
3. Enter the email: `admin@medrotic.com`
4. Enter the password: `Admin@123`
5. Click "Sign In"

After successful login, you will be automatically redirected to the admin dashboard at `/admin/dashboard`.

### Important Notes

⚠️ **This is for development only!**

- These credentials work **only in development mode**
- In production, these default credentials will **NOT work**
- All production users must be created through the backend API
- The backend team will handle creating real admin users in production

### Location

The default admin configuration is located in:
- `src/app/config/default-admin.ts` - Default credentials and helper functions
- `src/app/auth/auth.service.ts` - Login logic that checks for default admin

### Removing Default Admin (Before Production)

Before deploying to production, you should:

1. Remove or disable the default admin check in `auth.service.ts`
2. Remove the `default-admin.ts` file or ensure it's not imported
3. Ensure all admin users are created through the backend API
4. Test that the default credentials no longer work

