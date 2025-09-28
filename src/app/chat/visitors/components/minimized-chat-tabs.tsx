"use client";

import React from 'react';
import { X, MessageCircle } from 'lucide-react';
import { Visitor } from '../../types';

interface MinimizedChatTabsProps {
  minimizedChats: Visitor[];
  selectedVisitor: Visitor | null;
  onMaximize: (visitorId: string) => void;
  onClose: (visitorId: string) => void;
}

const MinimizedChatTabs: React.FC<MinimizedChatTabsProps> = ({
  minimizedChats,
  selectedVisitor,
  onMaximize,
  onClose
}) => {
  if (minimizedChats.length === 0) return null;

  return (
    <div className="fixed bottom-0 z-40" style={{ left: 'calc(13rem)' }}>
      <div className="flex gap-2">
        {minimizedChats.map((chat) => {
          // Check if this chat is currently active (selectedVisitor matches this chat)
          const isActive = selectedVisitor?.visitor_id === chat.visitor_id;
          
          return (
            <div
              key={chat.visitor_id}
              className={`group flex items-center min-w-0 flex-shrink-0 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden relative ${
                isActive 
                  ? 'bg-gray-600 hover:bg-gray-500 border-t-2 border-gray-400' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => onMaximize(chat.visitor_id)}
              style={{
                width: '7rem',
                height: '1.75rem', // Same height for all chats
                borderRadius: '0.375rem 0.375rem 0 0',
                padding: '0.125rem 0.5rem', // Same padding for all chats
                marginBottom: '0', // Ensure it sits flush with bottom
                transform: 'translateY(0)' // Ensure no vertical offset
              }}
              onMouseEnter={(e) => {
                // No height changes on hover to maintain consistent positioning
              }}
              onMouseLeave={(e) => {
                // No height changes on hover to maintain consistent positioning
              }}
            >
              {/* Chat icon - always visible */}
              <MessageCircle className="h-4 w-4 text-white flex-shrink-0" />
              
              {/* Visitor ID - always visible with better font */}
              <div className="text-white text-xs font-medium whitespace-nowrap ml-2 flex-1 text-center">
                #{chat.visitor_id.substring(0, 6)}
              </div>
              
              {/* Close button - only visible on hover and not for active chats */}
              {!isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(chat.visitor_id);
                  }}
                  className="h-4 w-4 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MinimizedChatTabs;
