# Environment Setup for BetterAuth

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bijbjbsncbbwajokvxck.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpamJqYnNuY2Jid2Fqb2t2eGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTQyNjAsImV4cCI6MjA3NDUzMDI2MH0.GJ5SKp4r35LsoM82bgAel3ykE_75deybhQunLqYFWd4

# BetterAuth Configuration
BETTER_AUTH_SECRET=your-secret-key-here-change-this-in-production-make-it-long-and-random
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth (Optional - for social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Database Setup

The BetterAuth setup is configured to work with your existing Supabase database. Make sure your Supabase project is running and accessible.

## Testing Authentication

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000` to see the landing page with auth test component
3. Try to access `/dashboard` - you should be redirected to the login form
4. Create a new account or sign in to test the authentication flow
5. Once authenticated, you can test realtime collaboration features

## Features Implemented

- ✅ BetterAuth integration with Supabase
- ✅ Email/password authentication
- ✅ Google OAuth (if configured)
- ✅ Protected routes for all main pages
- ✅ Authentication context and hooks
- ✅ Login/signup forms
- ✅ Session management
- ✅ User data integration with existing components

## Next Steps for Realtime Collaboration

With authentication now working, you can:

1. Test user-specific data in the kanban boards
2. Implement realtime updates with user presence
3. Add user-specific task assignments
4. Test cross-team collaboration features
5. Implement team-based access control
