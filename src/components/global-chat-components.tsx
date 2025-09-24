"use client";

import React from 'react';
import { useGlobalChat } from '@/contexts/global-chat-context';
import VisitorDetailsPopup from '@/app/chat/visitors/components/visitor-details-popup';

const GlobalChatComponents: React.FC = () => {
  const { 
    selectedVisitor, 
    isChatOpen, 
    showEndChatDialog, 
    setShowEndChatDialog,
    closeChat,
    minimizeChat,
    handleEndChat
  } = useGlobalChat();

  if (!isChatOpen || !selectedVisitor) {
    return null;
  }

  return (
    <VisitorDetailsPopup
      visitor={selectedVisitor}
      selectedAgent={selectedVisitor.agent_name ? { id: selectedVisitor.agent_id || '', name: selectedVisitor.agent_name } : undefined}
      isOpen={isChatOpen}
      showEndChatDialog={showEndChatDialog}
      onClose={closeChat}
      onMinimize={minimizeChat}
      onEndChat={handleEndChat}
      setShowEndChatDialog={setShowEndChatDialog}
      onChatEnded={() => {
        // Handle chat ended if needed
      }}
    />
  );
};

export default GlobalChatComponents;
