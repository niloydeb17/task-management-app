'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    // Check for Google OAuth cookies
    const checkGoogleAuth = async () => {
      try {
        console.log('Checking cookies:', document.cookie);
        const isGoogleAuth = document.cookie.includes('google_auth=true');
        console.log('Google auth cookie found:', isGoogleAuth);
        
        if (isGoogleAuth) {
          const name = getCookie('user_name') || '';
          const email = getCookie('user_email') || '';
          console.log('User data from cookies:', { name, email });
          
          if (name && email) {
            const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b35&color=ffffff&size=128`;
            console.log('Generated avatar URL:', imageUrl);
            
            // Get the first team from the database as default
            let defaultTeamId = null;
            try {
              const { data: teamsData, error: teamError } = await supabase
                .from('teams')
                .select('id')
                .limit(1);
              
              if (teamError) {
                console.error('Error fetching teams:', teamError);
              } else if (teamsData && teamsData.length > 0) {
                defaultTeamId = teamsData[0].id;
                console.log('Default team ID:', defaultTeamId);
              }
            } catch (error) {
              console.error('Error fetching default team:', error);
            }
            
            const user = {
              id: email, // Use email as ID for simplicity
              email,
              name,
              emailVerified: true,
              image: imageUrl,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              teamId: defaultTeamId,
              role: 'member',
            };
            console.log('Setting Google user:', user);
            setGoogleUser(user);
          }
        }
      } catch (error) {
        console.error('Error in checkGoogleAuth:', error);
      } finally {
        setAuthCheckComplete(true);
      }
    };

    checkGoogleAuth();
  }, []);

  // Set loading to false only when both session check and auth check are complete
  useEffect(() => {
    if (!isPending && authCheckComplete) {
      setIsLoading(false);
    }
  }, [isPending, authCheckComplete]);

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift() || null;
      // Decode URL-encoded values
      return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    return null;
  };

  const value: AuthContextType = {
    user: googleUser || session?.user || null,
    session: session || null,
    isLoading,
    isAuthenticated: !!googleUser || !!session?.user,
  };

  // Debug logging
  console.log('AuthProvider state:', {
    googleUser,
    sessionUser: session?.user,
    isLoading,
    isAuthenticated: value.isAuthenticated,
    finalUser: value.user
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
