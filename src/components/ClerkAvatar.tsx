'use client';

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

interface ClerkAvatarProps {
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ClerkAvatar({ 
  assigneeId, 
  assigneeName, 
  assigneeAvatar, 
  className = "w-5 h-5",
  size = 'sm'
}: ClerkAvatarProps) {
  const { user: currentUser } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('U');

  useEffect(() => {
    // If it's the current user, use Clerk's real-time data
    if (currentUser && assigneeId === currentUser.id) {
      console.log('Using current user real-time data:', {
        id: currentUser.id,
        imageUrl: currentUser.imageUrl,
        fullName: currentUser.fullName
      });
      setAvatarUrl(currentUser.imageUrl || null);
      setDisplayName(
        currentUser.fullName || 
        currentUser.firstName || 
        'User'
      );
      return;
    }

    // For other users, use the stored data from database
    // This is a limitation - we can't fetch other users' real-time data from Clerk client-side
    console.log('Using stored data for other user:', {
      assigneeId,
      assigneeName,
      assigneeAvatar
    });
    setAvatarUrl(assigneeAvatar || null);
    setDisplayName(assigneeName || 'U');
  }, [currentUser, assigneeId, assigneeAvatar, assigneeName]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={className}>
      <AvatarImage 
        src={avatarUrl || undefined} 
        alt={displayName}
        onError={() => setAvatarUrl(null)} // Fallback to initials if image fails
      />
      <AvatarFallback className="text-xs">
        {getInitials(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}
