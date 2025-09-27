'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function GoogleAuthTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Use window.location for OAuth redirect
      window.location.href = '/api/auth/google';
    } catch (err) {
      setError('Failed to sign in with Google. Check your configuration.');
      console.error('Google OAuth error:', err);
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google OAuth Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Test Google OAuth integration. Make sure you've configured your Google Cloud Console credentials.
          </p>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                <strong>Success:</strong> Google OAuth is working! Check your browser for the OAuth flow.
              </p>
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing Google OAuth...' : 'Test Google Sign-In'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Required Environment Variables:</strong></p>
          <p>• GOOGLE_CLIENT_ID</p>
          <p>• GOOGLE_CLIENT_SECRET</p>
          <p>• BETTER_AUTH_URL (should be http://localhost:3001)</p>
        </div>
      </CardContent>
    </Card>
  );
}
