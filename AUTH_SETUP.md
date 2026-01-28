# Authentication System Documentation

## Overview
Complete authentication system integrated with CloudV2 backend using TanStack Query and React Router.

## Features Implemented

### 1. **Authentication Screens**
- ✅ Login Screen (`/auth/login`)
- ✅ Signup Screen (`/auth/signup`)
- ✅ Forgot Password Screen (`/auth/forgot-password`)
- ✅ Reset Password Screen (`/auth/reset-password`)

### 2. **Backend Integration**
- ✅ Full integration with CloudV2 API (`/api/v1/auth/*`)
- ✅ Token-based authentication (JWT)
- ✅ Refresh token support
- ✅ Session management

### 3. **TanStack Query Hooks**
Located in `/src/hooks/use-auth.hook.ts`:

- `useLogin()` - Login with email/password
- `useRegister()` - Create new account
- `useGoogleAuth()` - Google OAuth authentication
- `useRequestPasswordReset()` - Request password reset OTP
- `useVerifyRecoveryOTP()` - Verify OTP code
- `useResetPassword()` - Reset password with OTP
- `useSession()` - Get current user session
- `useLogout()` - Logout user
- `useCheckEmail()` - Check email availability
- `useAuthState()` - Get current auth state

### 4. **Auth Context**
Located in `/src/providers/auth.provider.tsx`:

Provides global auth state:
```typescript
const { user, isAuthenticated, isLoading, error } = useAuth()
```

### 5. **Components**
- **Input Component** (`/src/components/common/input.component.tsx`)
  - Password visibility toggle
  - Error states
  - Helper text
  - Left/right icons
  - Full accessibility support

## Usage Examples

### Login Flow
```typescript
const login = useLogin()

login.mutate(
  { email: 'user@example.com', password: 'password' },
  {
    onSuccess: (response) => {
      // Tokens are automatically stored
      // Session is automatically fetched
      navigate({ to: '/' })
    },
    onError: (error) => {
      // Handle error
    }
  }
)
```

### Signup Flow
```typescript
const register = useRegister()

register.mutate(
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123'
  },
  {
    onSuccess: () => navigate({ to: '/' }),
    onError: (error) => console.error(error)
  }
)
```

### Password Reset Flow
1. User requests reset on forgot password screen
2. Backend sends OTP to email
3. User enters OTP on reset password screen
4. OTP is verified
5. User creates new password
6. Password is reset successfully

### Check Auth State
```typescript
const { user, isAuthenticated, isLoading } = useAuth()

if (isLoading) return <LoadingScreen />
if (!isAuthenticated) return <LoginScreen />

return <Dashboard user={user} />
```

## API Endpoints Used

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/google` - Google Auth
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/session` - Get Session
- `POST /api/v1/auth/refresh-token` - Refresh Token

### Password Reset
- `POST /api/v1/auth/request-validation` - Request reset OTP
- `POST /api/v1/auth/verify-recovery-code` - Verify OTP
- `POST /api/v1/auth/recover-account` - Reset password

### Email
- `GET /api/v1/auth/email-check/:email` - Check availability

## Token Storage
- Access Token: `localStorage.getItem('authToken')`
- Refresh Token: `localStorage.getItem('refreshToken')`

Tokens are automatically:
- Stored on successful login/register
- Sent in Authorization header for authenticated requests
- Removed on logout
- Used for session queries

## Environment Variables

Create a `.env.local` file in the root:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_ENVIRONMENT=development
```

Default values are set in `/src/env.ts`.

## Design Standards

All auth screens follow the same design pattern as `AppScreen`:
- TopNotch component for status bar
- Two-row grid layout (2 rows header, 6 rows content)
- LinearGradient backgrounds
- Consistent color scheme from `colors.shared.ts`
- Font families: BBH Sans Bartle (headings), Outfit (body text)
- TouchableOpacity for interactive elements
- Input components with icons and validation

## Error Handling

All mutations handle errors consistently:
- Display error messages from backend
- Form validation before submission
- Field-level error states
- Clear errors on field change
- Loading states during requests

## Type Safety

Full TypeScript support with types defined in:
- `/src/shared/types/auth.types.ts` - Auth request/response types
- All hooks are fully typed
- API client is fully typed

## Testing

### Manual Testing Checklist
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Register new account
- [ ] Register with existing email
- [ ] Request password reset
- [ ] Verify OTP code
- [ ] Reset password
- [ ] Session persistence on page refresh
- [ ] Logout functionality
- [ ] Navigation between auth screens

## Next Steps

### Recommended Enhancements
1. Add Google OAuth integration (frontend)
2. Add biometric authentication (mobile)
3. Add "Remember me" functionality
4. Add rate limiting indicators
5. Add email verification flow
6. Add 2FA support
7. Add password strength indicator
8. Add social login (Facebook, Apple)

## Troubleshooting

### Common Issues

**Issue: API requests failing**
- Check backend is running on `http://localhost:3000`
- Verify environment variables are set correctly
- Check CORS settings on backend

**Issue: Tokens not persisting**
- Check localStorage is enabled
- Verify token is being stored on login success

**Issue: Session not loading**
- Ensure token exists in localStorage
- Check backend session endpoint is working
- Verify token hasn't expired

**Issue: Routes not working**
- Run `npm run dev` to regenerate route tree
- Check route files exist in `/src/routes/auth/`

## Security Notes

- Passwords are never stored in plain text
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- All auth endpoints use HTTPS in production
- Password validation enforces minimum 6 characters
- OTPs expire after set time (backend controlled)
- Rate limiting should be implemented on backend

