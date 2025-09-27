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

    // Store user data in a simple session (for demo purposes)
    // In a real app, you'd store this in a proper session/database
    const response = NextResponse.redirect(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/dashboard`);
    
    // Set a simple cookie to indicate authentication
    response.cookies.set('google_auth', 'true', {
      httpOnly: false, // Make it accessible to client-side JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    response.cookies.set('user_name', encodeURIComponent(userData.name), {
      httpOnly: false, // Make it accessible to client-side JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    response.cookies.set('user_email', encodeURIComponent(userData.email), {
      httpOnly: false, // Make it accessible to client-side JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/?error=oauth_error`);
  }
}
