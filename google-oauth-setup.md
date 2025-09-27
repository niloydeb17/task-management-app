# Google OAuth Setup Guide for BetterAuth

## Quick Setup Checklist

- [ ] Create Google Cloud Project
- [ ] Enable required APIs
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 credentials
- [ ] Update environment variables
- [ ] Test Google sign-in

## Detailed Steps

### 1. Google Cloud Console Setup

1. **Visit Google Cloud Console**: https://console.cloud.google.com/
2. **Create New Project**:
   - Click "Select a project" → "New Project"
   - Name: "TaskFlow Auth"
   - Click "Create"

### 2. Enable Required APIs

1. **Go to APIs & Services → Library**
2. **Enable these APIs**:
   - Google+ API
   - Google OAuth2 API
   - Google Identity API

### 3. Configure OAuth Consent Screen

1. **Go to APIs & Services → OAuth consent screen**
2. **Choose "External" user type**
3. **Fill in required fields**:
   ```
   App name: TaskFlow
   User support email: your-email@example.com
   Developer contact: your-email@example.com
   ```
4. **Add scopes**:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
5. **Add test users** (for development):
   - Add your email and any test emails

### 4. Create OAuth 2.0 Credentials

1. **Go to APIs & Services → Credentials**
2. **Click "Create Credentials" → "OAuth 2.0 Client IDs"**
3. **Configure**:
   - Application type: "Web application"
   - Name: "TaskFlow Web Client"
4. **Add Authorized Redirect URIs**:
   ```
   http://localhost:3001/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
5. **Click "Create" and copy the credentials**

### 5. Update Environment Variables

Add to your `.env.local` file:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Update URLs to match your dev server port
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 6. Test Google Sign-In

1. **Restart your development server**:
   ```bash
   npm run dev
   ```
2. **Visit your app**: http://localhost:3001
3. **Try to access a protected route** (like /dashboard)
4. **Click "Continue with Google"** in the login form
5. **Complete the OAuth flow**

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:
   - Check that your redirect URI in Google Console matches exactly
   - Make sure you're using the correct port (3001 in your case)

2. **"invalid_client" error**:
   - Verify your Client ID and Client Secret are correct
   - Check that the credentials are properly set in .env.local

3. **"access_denied" error**:
   - Make sure you've added your email to test users
   - Check that the OAuth consent screen is properly configured

4. **Environment variables not loading**:
   - Restart your development server after updating .env.local
   - Make sure .env.local is in the project root

### Testing with Multiple Users:

1. Add multiple email addresses to "Test users" in Google Console
2. Test sign-in with different Google accounts
3. Verify that each user gets their own session and data

## Production Deployment

When deploying to production:

1. **Update redirect URIs** in Google Console:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
2. **Update environment variables**:
   ```bash
   BETTER_AUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
3. **Publish your OAuth consent screen** (if ready for public use)

## Security Notes

- Keep your Client Secret secure and never commit it to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console
