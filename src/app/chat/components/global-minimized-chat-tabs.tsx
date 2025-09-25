"use client";

import React from 'react';
import { useGlobalChat } from '@/contexts/global-chat-context';
import MinimizedChatTabs from '../visitors/components/minimized-chat-tabs';

const GlobalMinimizedChatTabs: React.FC = () => {
  const { minimizedChats, maximizeChat, closeMinimizedChat } = useGlobalChat();

  return (
    <MinimizedChatTabs
      minimizedChats={minimizedChats}
      onMaximize={maximizeChat}
      onClose={closeMinimizedChat}
    />
  );
};

export default GlobalMinimizedChatTabs;
