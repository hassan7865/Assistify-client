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
  const { chatMessages, isSwitchingVisitor, isEndingChat, currentAgent } = useGlobalChat();
  
  // Check if current agent can end this chat (only the assigned agent can end it)
  const canEndChat = visitor.agent_id && currentAgent?.id && visitor.agent_id === currentAgent.id;




  if (!isOpen) return null;

  return (
    <div 
      key={visitor.visitor_id} 
      className="fixed right-0 top-0 h-full w-[600px] bg-gray-100 shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-50 border-l border-gray-500"
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
         
          <span style={{ fontSize: '14px' }} className="font-medium text-white">Visitor #{visitor.visitor_id.substring(0, 8)}</span>
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
            onClick={onMinimize}
            className={`h-7 w-7 rounded-full flex items-center justify-center bg-[#858585] cursor-pointer`}
            title={canEndChat ? 'Minimize chat' : 'Close chat (not assigned to you)'}
          >
            <Minus className="h-3 w-3 text-white" />
          </button>
          <button 
            onClick={canEndChat ? onClose : () => {}} // Only allow closing if agent can end chat
            className={`h-7 w-7 rounded-full flex items-center justify-center bg-[#858585] ${
              !canEndChat ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            title={canEndChat ? 'Close chat' : 'Only the assigned agent can end this chat'}
          >
            <X className="h-3 w-3 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showEndChatDialog ? (
          /* End Chat Dialog Content */
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-sm w-full">
              {canEndChat ? (
                <>
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
                </>
              ) : (
                <>
                  <h3 className="text-xs font-semibold text-gray-900 mb-2">
                    Cannot end chat
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Only Agent {visitor.agent_name} can end this chat. You can close this dialog instead.
                  </p>
                  
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowEndChatDialog(false)}
                      className="text-xs px-3 py-1 rounded-none border border-gray-300"
                    >
                      Close
                    </Button>
                  </div>
                </>
              )}
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