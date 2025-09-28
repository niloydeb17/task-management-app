import { createAuthClient } from 'better-auth/react';

// Get the base URL, with fallback to current origin
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log('Auth client baseURL:', origin);
    return origin;
  }
  const fallback = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log('Auth client baseURL (fallback):', fallback);
  return fallback;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
