# Authentication Protection & Redirects

## Overview
Complete view protection and authentication redirect system ensuring proper access control across the application.

## Protection Components

### 1. **ProtectedRoute Component**
Location: `/src/components/common/protected-route.component.tsx`

A reusable wrapper component for route-level protection.

**Props:**
- `children: React.ReactNode` - The component to protect
- `requireAuth?: boolean` - Whether authentication is required (default: `true`)
- `redirectTo?: string` - Where to redirect if access is denied

**Behavior:**
- Shows loading state while checking auth
- Redirects unauthenticated users from protected routes
- Redirects authenticated users from auth-only routes

### 2. **ProtectedViewComponent**
Location: `/src/components/layout/protected-view.component.tsx`

A component-level protection wrapper used within screens.

**Behavior:**
- Automatically redirects to `/auth/login` if not authenticated
- Returns `null` during loading
- Renders children only when authenticated

## Protected Routes

### Auth Routes (Authenticated users CANNOT access)
These routes redirect to `/app/home` if user is already logged in:

✅ `/auth/login` - Login screen  
✅ `/auth/signup` - Signup screen  
✅ `/auth/forgot-password` - Forgot password  
✅ `/auth/reset-password` - Reset password with OTP  

**Implementation:**
```tsx
<ProtectedRoute requireAuth={false} redirectTo="/app/home">
  <LoginScreen />
</ProtectedRoute>
```

### App Routes (Authentication REQUIRED)
These routes redirect to `/auth/login` if user is not authenticated:

✅ `/app/home` - Main dashboard  
✅ `/app/*` - All app routes (future)  

**Implementation:**
```tsx
<ProtectedRoute requireAuth={true} redirectTo="/auth/login">
  <HomeAppScreen />
</ProtectedRoute>
```

### Public Routes (No restrictions)
These routes are accessible by everyone:

✅ `/` - Landing page (redirects authenticated users to `/app/home`)

## Redirect Flow

### Unauthenticated User Journey
```
User visits /app/home
  ↓
ProtectedRoute checks auth
  ↓
Not authenticated
  ↓
Redirect to /auth/login
  ↓
User logs in
  ↓
Redirect to /app/home
```

### Authenticated User Journey
```
User visits /auth/login
  ↓
ProtectedRoute checks auth
  ↓
Already authenticated
  ↓
Redirect to /app/home
```

### Landing Page Flow
```
User visits /
  ↓
Check authentication
  ↓
If authenticated → Redirect to /app/home
If not → Show landing page
```

## Authentication State

The `useAuth()` hook provides:
- `user: User | null` - Current user object
- `isAuthenticated: boolean` - Auth status
- `isLoading: boolean` - Loading state
- `error: Error | null` - Any auth errors

## Loading States

All protected routes show appropriate loading states:

**ProtectedRoute Loading:**
```tsx
<View className="flex-1 items-center justify-center bg-black">
  <Text className="text-white text-lg font-outfit">Loading...</Text>
</View>
```

**Landing Page Loading:**
Same loading component shown while checking authentication

## Usage Examples

### Protecting a New Route

1. **Create the screen component**
```tsx
// src/app/(app)/settings.screen.tsx
export default function SettingsScreen() {
  const { user } = useAuth()
  
  return (
    <ProtectedViewComponent>
      {/* Your screen content */}
    </ProtectedViewComponent>
  )
}
```

2. **Create the route file**
```tsx
// src/routes/app/settings.tsx
import SettingsScreen from '@/app/(app)/settings.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/settings')({
  component: () => (
    <ProtectedRoute requireAuth={true} redirectTo="/auth/login">
      <SettingsScreen />
    </ProtectedRoute>
  ),
})
```

### Creating Auth-Only Route

```tsx
// For routes only accessible when NOT logged in
export const Route = createFileRoute('/auth/some-page')({
  component: () => (
    <ProtectedRoute requireAuth={false} redirectTo="/app/home">
      <SomeAuthScreen />
    </ProtectedRoute>
  ),
})
```

### Creating Public Route

```tsx
// For routes accessible by everyone (no protection needed)
export const Route = createFileRoute('/about')({
  component: AboutScreen,
})
```

## Security Features

### Token Management
- Tokens stored in `localStorage`
- Automatically included in API requests
- Cleared on logout
- Checked on every protected route

### Session Validation
- Session query runs on app load
- Automatically refetches on window focus (disabled by default)
- Retries once on failure
- 5-minute stale time for performance

### Logout Functionality
```tsx
const logout = useLogout()

const handleLogout = () => {
  logout.mutate(undefined, {
    onSuccess: () => {
      navigate({ to: '/auth/login' })
    },
  })
}
```

**Logout Actions:**
- Clears all localStorage tokens
- Invalidates all TanStack Query caches
- Redirects to login page

## Protected Screens

### Home Screen (`/app/home`)
- Displays user profile (avatar with initials)
- Shows user information (name, email)
- Account status
- Member since date
- Logout button

**Features:**
- User avatar with initials
- Logout functionality
- Protected content display
- Consistent design with landing page

## Best Practices

### 1. **Always Use Protection**
Every app route should use either:
- `ProtectedRoute` wrapper (route level)
- `ProtectedViewComponent` wrapper (component level)
- Both for extra security

### 2. **Handle Loading States**
```tsx
if (isLoading) {
  return <LoadingComponent />
}
```

### 3. **Redirect Appropriately**
- Auth routes → `/app/home`
- App routes → `/auth/login`
- Landing → `/app/home` (if authenticated)

### 4. **Check Auth State**
```tsx
const { isAuthenticated, isLoading } = useAuth()

if (isLoading) return <Loading />
if (!isAuthenticated) return <Redirect />
```

### 5. **Clear Errors**
Auth errors are automatically handled by TanStack Query and displayed in forms.

## Testing Auth Flow

### Manual Test Checklist
- [ ] Visit `/app/home` when not logged in → Redirects to login
- [ ] Log in successfully → Redirects to `/app/home`
- [ ] Visit `/auth/login` when logged in → Redirects to home
- [ ] Refresh page when logged in → Stays logged in
- [ ] Logout → Redirects to login
- [ ] Navigate to landing page when logged in → Redirects to home
- [ ] Navigate to landing page when not logged in → Shows landing

### Edge Cases Handled
✅ Token expiration  
✅ Invalid token  
✅ Network errors  
✅ Session refresh  
✅ Multiple tabs  
✅ Browser refresh  

## Common Issues

### Issue: Infinite redirect loop
**Cause:** Conflicting redirects between components  
**Solution:** Use only one protection method per route

### Issue: Flash of unauthorized content
**Cause:** Not checking `isLoading` state  
**Solution:** Always show loading state first

### Issue: Redirect not working
**Cause:** Missing `navigate` dependency in useEffect  
**Solution:** Include all dependencies: `[isLoading, isAuthenticated, navigate]`

### Issue: Session not persisting
**Cause:** Token not being stored  
**Solution:** Check login/register mutation success handlers

## Future Enhancements

### Recommended Additions
1. **Role-based access control**
```tsx
<ProtectedRoute requireAuth={true} requiredRole="admin">
  <AdminScreen />
</ProtectedRoute>
```

2. **Subscription-based access**
```tsx
<ProtectedRoute requireSubscription={true}>
  <PremiumFeature />
</ProtectedRoute>
```

3. **Email verification gates**
```tsx
<ProtectedRoute requireVerified={true}>
  <VerifiedOnlyFeature />
</ProtectedRoute>
```

4. **Onboarding flow**
```tsx
if (user?.isFirstTime) {
  navigate({ to: '/onboarding' })
}
```

## Summary

✅ Complete route protection system  
✅ Automatic redirects based on auth status  
✅ Loading states everywhere  
✅ Logout functionality  
✅ Session persistence  
✅ Protected and public routes  
✅ Consistent design patterns  
✅ Type-safe with TypeScript  

The authentication protection system is production-ready and ensures proper access control across the entire application.

