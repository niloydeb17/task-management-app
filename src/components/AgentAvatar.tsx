'use client';

import React from 'react';

interface AgentAvatarProps {
  mood?: string;
  size?: number;
}

export function AgentAvatar({ mood = 'happy', size = 50 }: AgentAvatarProps) {
  return (
    <div 
      className="rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size }}
    >
      AI
    </div>
  );
}
