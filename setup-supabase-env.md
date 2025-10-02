# Supabase Environment Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. Replace the placeholder values in your `.env.local` file

## Supabase Project Setup

1. Enable Authentication in your Supabase project
2. Configure Google OAuth provider in Authentication > Providers
3. Set up the redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

## Database Setup

Run the following migrations in your Supabase project:

1. `008_supabase_auth_migration.sql` - Sets up user profiles and triggers
2. `009_update_rls_policies.sql` - Updates RLS policies for Supabase Auth

## Google OAuth Setup

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
4. Copy the client ID and secret to Supabase Auth settings
