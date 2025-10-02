'use client';

import React from 'react';

interface MessageProps {
  children: React.ReactNode;
  from?: 'user' | 'assistant';
}

export function Message({ children, from }: MessageProps) {
  return (
    <div className={`message ${from ? `message-${from}` : ''}`}>
      {children}
    </div>
  );
}

export function MessageContent({ children }: MessageProps) {
  return (
    <div className="message-content">
      {children}
    </div>
  );
}
