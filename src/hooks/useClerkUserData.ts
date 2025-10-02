import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

interface ClerkUserData {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export function useClerkUserData(userId?: string) {
  const { user: currentUser } = useUser();
  const [userData, setUserData] = useState<ClerkUserData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setUserData(null);
      return;
    }

    // If it's the current user, use Clerk's user data directly
    if (currentUser && currentUser.id === userId) {
      setUserData({
        id: currentUser.id,
        name: currentUser.fullName || currentUser.firstName || 'User',
        email: currentUser.primaryEmailAddress?.emailAddress || 'user@example.com',
        avatar: currentUser.imageUrl || null
      });
      return;
    }

    // For other users, we need to fetch from our database
    // This is a limitation of Clerk - we can't fetch other users' data client-side
    setLoading(true);
    
    // For now, we'll return null for other users
    // In a real app, you'd need a server-side API to fetch other users' Clerk data
    setUserData(null);
    setLoading(false);
  }, [userId, currentUser]);

  return { userData, loading };
}
