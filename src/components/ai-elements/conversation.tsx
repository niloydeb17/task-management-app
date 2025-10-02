'use client';

import React from 'react';

interface ConversationProps {
  children: React.ReactNode;
  className?: string;
}

export function Conversation({ children, className }: ConversationProps) {
  return (
    <div className={`conversation ${className || ''}`}>
      {children}
    </div>
  );
}

export function ConversationContent({ children, className }: ConversationProps) {
  return (
    <div className={`conversation-content ${className || ''}`}>
      {children}
    </div>
  );
}

interface ConversationEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ConversationEmptyState({ 
  title = "No messages yet. Start a conversation!", 
  description,
  icon 
}: ConversationEmptyStateProps) {
  return (
    <div className="conversation-empty">
      {icon}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
