"use client";

import React from 'react';
import { X, ChevronDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface from './chat-interface';
import VisitorInfoPanel from './visitor-info-panel';
import { useGlobalChat } from '@/contexts/global-chat-context';
import { getCountryFlag, getBrowserIcon, getOSIcon } from '@/lib/visitor-icons';
import { Visitor, ChatMessage } from '../../types';

interface VisitorDetailsPopupProps {
  visitor: Visitor;
  selectedAgent?: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  showEndChatDialog: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onEndChat: () => void;
  setShowEndChatDialog: (show: boolean) => void;
  onChatEnded?: () => void;
}

const VisitorDetailsPopup: React.FC<VisitorDetailsPopupProps> = ({ 
  visitor, 
  selectedAgent,
  isOpen, 
  showEndChatDialog,
  onClose,
  onMinimize,
  onEndChat,
  setShowEndChatDialog,
  onChatEnded
}) => {
  const { chatMessages, isSwitchingVisitor, isEndingChat, currentAgent, hasActiveConnection, closeMinimizedChat } = useGlobalChat();
  
  // Determine if we should show end chat dialog or just close
  // Show dialog only if: connected, visitor hasn't left, and visitor is not offline
  const shouldShowEndDialog = hasActiveConnection && !visitor.hasLeft && !visitor.isDisconnected && currentAgent?.id;




  if (!isOpen) return null;

  return (
    <div 
      key={visitor.visitor_id} 
      className="fixed right-0 top-0 h-full w-[600px] bg-gray-100 shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-50 border-l border-gray-500 pb-4"
    >
      {/* Switching Overlay */}
      {isSwitchingVisitor && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Switching visitor...</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-[#303030] text-white">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-sm bg-[#10418c] flex items-center justify-center flex-shrink-0">
          <img 
            src="/user.png" 
            alt="User" 
            className="w-4 h-4 object-contain"
          />
          </div>
         
          <span style={{ fontSize: '14px' }} className="font-medium text-white">{visitor.visitor_details?.first_name || visitor.visitor_id.substring(0, 8)}</span>
          {getCountryFlag(visitor.metadata?.country)}
          {getBrowserIcon(visitor.metadata?.browser, visitor.metadata?.user_agent, 'h-3 w-3')}
          {getOSIcon(visitor.metadata?.os, visitor.metadata?.user_agent, 'h-3 w-3')}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs text-white px-3 py-2 bg-[#858585] rounded-none h-7 hover:text-white hover:bg-[#858585]">
            Actions
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
          <button 
            onClick={() => {
              // If visitor is disconnected, just minimize without session cleanup
              if (visitor.isDisconnected) {
                onMinimize();
              } else {
                onMinimize();
              }
            }}
            className={`h-7 w-7 rounded-full flex items-center justify-center bg-[#858585] cursor-pointer`}
            title={visitor.isDisconnected ? 'Minimize chat (visitor disconnected)' : 'Minimize chat'}
          >
            <Minus className="h-3 w-3 text-white" />
          </button>
          <button 
            onClick={() => {
              // Always call onClose - handleCloseWithDialog will determine the behavior
              // based on connection status, visitor state, etc.
              onClose();
            }}
            className="h-7 w-7 rounded-full flex items-center justify-center bg-[#858585] cursor-pointer"
            title={
              visitor.isDisconnected 
                ? 'Close chat (visitor offline)' 
                : visitor.hasLeft
                  ? 'Close chat (visitor left)' 
                  : !hasActiveConnection 
                    ? 'Close chat (not connected)' 
                    : 'Leave chat'
            }
          >
            <X className="h-3 w-3 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showEndChatDialog && shouldShowEndDialog ? (
          /* Leave Chat Dialog Content */
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-sm w-full">
              <h3 className="text-xs font-semibold text-gray-900 mb-2">
                Leave chat?
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                You will leave this conversation. The visitor will remain connected and can still chat with other agents.
              </p>
              
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={onEndChat}
                  disabled={isEndingChat}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEndingChat ? (
                    <div className="flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Leaving...</span>
                    </div>
                  ) : (
                    'Leave chat'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEndChatDialog(false)}
                  disabled={isEndingChat}
                  className="text-xs px-3 py-1 rounded-none border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Left Panel - Chat */}
            <div className="flex-1 flex flex-col min-w-0">
              <ChatInterface 
                visitor={visitor}
                selectedAgent={selectedAgent}
                onClose={onClose}
                onChatEnded={onChatEnded}
              />
            </div>

            {/* Right Panel - Visitor Info */}
            <div className="w-60">
              <VisitorInfoPanel visitor={visitor} chatMessages={chatMessages} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VisitorDetailsPopup;