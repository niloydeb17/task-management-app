import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
  }

  const redirectUri = `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`;
  const scope = 'openid email profile';
  const state = Math.random().toString(36).substring(7);
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code&` +
    `state=${state}`;

  return NextResponse.redirect(googleAuthUrl);
}
