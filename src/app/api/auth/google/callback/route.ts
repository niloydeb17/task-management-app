import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/?error=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/?error=token_error`);
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // For now, just redirect to dashboard with success
    return NextResponse.redirect(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/dashboard?google_auth=success&name=${encodeURIComponent(userData.name)}&email=${encodeURIComponent(userData.email)}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/?error=oauth_error`);
  }
}
