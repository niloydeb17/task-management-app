# Clerk Environment Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Clerk Authentication
# Get these from your Clerk Dashboard: https://dashboard.clerk.com/last-active?path=api-keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY

# Optional: Customize Clerk URLs (uncomment and modify as needed)
# NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
# NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
# NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## How to Get Your Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select an existing one
3. Navigate to **API Keys** in the sidebar
4. Copy your **Publishable Key** and **Secret Key**
5. Replace `YOUR_PUBLISHABLE_KEY` and `YOUR_SECRET_KEY` in your `.env.local` file

## Important Notes

- Never commit your `.env.local` file to version control
- The `.env.local` file is already in `.gitignore`
- Make sure to restart your development server after adding the environment variables
