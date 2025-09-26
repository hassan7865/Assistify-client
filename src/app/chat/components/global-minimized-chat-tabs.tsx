"use client";

import React from 'react';
import { useGlobalChat } from '@/contexts/global-chat-context';
import MinimizedChatTabs from '../visitors/components/minimized-chat-tabs';

const GlobalMinimizedChatTabs: React.FC = () => {
  const { minimizedChats, selectedVisitor, maximizeChat, closeMinimizedChat } = useGlobalChat();

  return (
    <MinimizedChatTabs
      minimizedChats={minimizedChats}
      selectedVisitor={selectedVisitor}
      onMaximize={maximizeChat}
      onClose={closeMinimizedChat}
    />
  );
};

export default GlobalMinimizedChatTabs;
