# Authentication Migration Guide: Better Auth → Supabase Auth

This guide covers the complete migration from Better Auth to Supabase Authentication.

## What Changed

### 1. Authentication System
- **Before**: Better Auth with SQLite in-memory database
- **After**: Supabase Authentication with PostgreSQL

### 2. Database Schema
- **Before**: Custom users table with Better Auth integration
- **After**: Supabase's built-in `auth.users` table with a `public.users` profile table

### 3. Authentication Flow
- **Before**: Custom OAuth implementation with Better Auth
- **After**: Supabase's built-in OAuth providers (Google, GitHub, etc.)

## Migration Steps

### 1. Environment Setup

Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Migration

Run these migrations in your Supabase project:

1. **008_supabase_auth_migration.sql** - Sets up user profiles and triggers
2. **009_update_rls_policies.sql** - Updates RLS policies for Supabase Auth

### 3. Dependencies Updated

**Removed:**
- `@better-auth/cli`
- `better-auth`
- `@types/pg`
- `pg`
- `kysely`

**Kept:**
- `@supabase/supabase-js`
- `@supabase/ssr`

### 4. Code Changes

#### Authentication Client (`src/lib/auth-client.ts`)
- Replaced Better Auth client with Supabase client
- Added React context for authentication state
- Implemented Supabase auth methods

#### Server-side Auth (`src/lib/auth.ts`)
- Added server-side Supabase client
- Implemented `getServerUser()` and `requireAuth()` functions

#### Components Updated
- `AuthProvider.tsx` - Now uses Supabase auth context
- `LoginForm.tsx` - Updated to use Supabase auth methods
- `ProtectedRoute.tsx` - Updated to use new auth context

#### API Routes
- Removed Better Auth API routes
- Added Supabase auth callback route (`/auth/callback`)
- Added signout route (`/api/auth/signout`)

### 5. Database Schema Changes

#### New Tables
- `public.users` - User profiles linked to `auth.users`
- Automatic user profile creation via database triggers

#### Updated Policies
- RLS policies updated to work with Supabase Auth
- User can view/update their own profile
- Team members can view each other
- Proper team-based access control

### 6. Authentication Flow

#### Sign Up
1. User signs up with email/password
2. Supabase creates user in `auth.users`
3. Trigger automatically creates profile in `public.users`
4. User is redirected to dashboard

#### Sign In
1. User signs in with email/password or OAuth
2. Supabase handles authentication
3. User session is managed by Supabase
4. User is redirected to dashboard

#### OAuth (Google)
1. User clicks "Continue with Google"
2. Redirected to Supabase OAuth flow
3. After authentication, redirected to `/auth/callback`
4. Supabase handles the OAuth callback
5. User is redirected to dashboard

## Benefits of Migration

### 1. Simplified Authentication
- No need to manage authentication logic
- Built-in OAuth providers
- Automatic session management

### 2. Better Security
- Supabase handles security best practices
- Built-in rate limiting
- Secure session management

### 3. Scalability
- PostgreSQL database instead of SQLite
- Better performance for production
- Built-in real-time capabilities

### 4. Developer Experience
- Less custom code to maintain
- Better TypeScript support
- Comprehensive documentation

## Testing the Migration

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Authentication
1. Navigate to `/login`
2. Try signing up with email/password
3. Try signing in with Google OAuth
4. Verify user can access protected routes
5. Test sign out functionality

### 3. Verify Database
1. Check that user profiles are created in `public.users`
2. Verify RLS policies are working
3. Test team-based access control

## Troubleshooting

### Common Issues

1. **Environment Variables**
   - Ensure Supabase URL and keys are correct
   - Check that `.env.local` is in the project root

2. **OAuth Configuration**
   - Verify Google OAuth is configured in Supabase
   - Check redirect URLs are correct

3. **Database Issues**
   - Ensure migrations have been run
   - Check RLS policies are enabled
   - Verify triggers are working

4. **Session Issues**
   - Clear browser cookies and local storage
   - Check middleware configuration
   - Verify Supabase client configuration

### Getting Help

- Check Supabase documentation: https://supabase.com/docs
- Review authentication guides: https://supabase.com/docs/guides/auth
- Check RLS policies: https://supabase.com/docs/guides/auth/row-level-security

## Next Steps

1. Configure additional OAuth providers if needed
2. Set up email templates for authentication
3. Implement user profile management
4. Add team invitation system
5. Set up production environment variables
