"use client";

import React from 'react';
import { useGlobalChat } from '@/contexts/global-chat-context';
import VisitorDetailsPopup from '@/app/dashboard/visitors/components/visitor-details-popup';
import MinimizedChatTabs from '@/app/dashboard/visitors/components/minimized-chat-tabs';

const GlobalChatComponents: React.FC = () => {
  const {
    selectedVisitor,
    isChatOpen,
    showEndChatDialog,
    minimizedChats,
    closeChat,
    minimizeChat,
    maximizeChat,
    closeMinimizedChat,
    setShowEndChatDialog,
    handleEndChat,
    currentAgent,
  } = useGlobalChat();

  return (
    <>
      {/* Global Visitor Chat Dialog */}
      {selectedVisitor && isChatOpen && (
        <VisitorDetailsPopup
          visitor={selectedVisitor}
          selectedAgent={currentAgent || undefined}
          isOpen={isChatOpen}
          showEndChatDialog={showEndChatDialog}
          onClose={closeChat}
          onMinimize={minimizeChat}
          onEndChat={handleEndChat}
          setShowEndChatDialog={setShowEndChatDialog}
        />
      )}
      
      {/* Global Minimized Chat Tabs */}
      <MinimizedChatTabs
        minimizedChats={minimizedChats}
        onMaximize={maximizeChat}
        onClose={closeMinimizedChat}
      />
    </>
  );
};

export default GlobalChatComponents;
