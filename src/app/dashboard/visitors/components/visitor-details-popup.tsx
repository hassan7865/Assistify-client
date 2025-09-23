"use client";

import React from 'react';
import { X, MessageCircle, Smartphone, Monitor, Target, ChevronDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface from './chat-interface';
import VisitorInfoPanel from './visitor-info-panel';
import { useGlobalChat } from '@/contexts/global-chat-context';
import { getCountryFlag } from '@/lib/visitor-icons';

interface VisitorDetailsPopupProps {
  visitor: {
    visitor_id: string;
    status: string;
    agent_id?: string;
    agent_name?: string;
    started_at?: string;
    session_id?: string;
    metadata?: {
      name?: string;
      email?: string;
      ip_address?: string;
      country?: string;
      city?: string;
      region?: string;
      timezone?: string;
      user_agent?: string;
      referrer?: string;
      page_url?: string;
      device_type?: string;
      browser?: string;
      os?: string;
    };
  };
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

interface ChatMessage {
  id: string;
  sender: 'visitor' | 'agent' | 'system';
  sender_id?: string;
  message: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
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
  const { chatMessages, isSwitchingVisitor, isEndingChat } = useGlobalChat();




  if (!isOpen) return null;

  return (
    <div 
      key={visitor.visitor_id} 
      className="fixed right-0 top-0 h-full w-[40%] bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-50"
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
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-gray-800 text-white">
        <div className="flex items-center gap-2">
          {getCountryFlag(visitor.metadata?.country)}
          <span className="text-xs font-medium text-white">Visitor {visitor.visitor_id}</span>
          <div className="flex items-center gap-1">
            <Smartphone className="h-3 w-3 text-green-500" />
            <Monitor className="h-3 w-3 text-white" />
            <Target className="h-3 w-3 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs text-white hover:bg-gray-700 px-2 py-1">
            Actions
            <ChevronDown className="h-2 w-2 ml-1" />
          </Button>
          <button 
            onClick={onMinimize}
            className="h-5 w-5 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600"
          >
            <Minus className="h-2 w-2 text-white" />
          </button>
          <button 
            onClick={onClose}
            className="h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600"
          >
            <X className="h-2 w-2 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showEndChatDialog ? (
          /* End Chat Dialog Content */
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-sm w-full">
              <h3 className="text-xs font-semibold text-gray-900 mb-2">
                End chat?
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                To minimize this chat instead, click the minimize button or outside the chat window.
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
                      <span>Ending...</span>
                    </div>
                  ) : (
                    'End chat'
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
            <div className="flex-1 flex flex-col">
              <ChatInterface 
                visitor={visitor}
                selectedAgent={selectedAgent}
                onClose={onClose}
                onChatEnded={onChatEnded}
              />
            </div>

            {/* Right Panel - Visitor Info */}
            <div className="w-60 border-l border-gray-200">
              <VisitorInfoPanel visitor={visitor} chatMessages={chatMessages} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VisitorDetailsPopup;