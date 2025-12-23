"use client";

import React from 'react';
import { X, WifiOff } from 'lucide-react';
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
              className={`group flex items-center min-w-0 flex-shrink-0 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden relative ${isActive
                  ? 'bg-gray-600 hover:bg-gray-500 border-t-2 border-gray-400'
                  : chat.hasUnreadMessages
                    ? 'hover:bg-[#F78E3F]'
                    : 'hover:bg-[#333333]'
                }`}
              style={{
                width: '9rem',
                height: '1.75rem', // Same height for all chats
                borderRadius: '0.375rem 0.375rem 0 0',
                padding: '0.125rem 0.5rem', // Same padding for all chats
                marginBottom: '0', // Ensure it sits flush with bottom
                transform: 'translateY(0)', // Ensure no vertical offset
                backgroundColor: chat.hasUnreadMessages ? '#F78E3F' : '#333333'
              }}
              onClick={() => onMaximize(chat.visitor_id)}
              onMouseEnter={(e) => {
                // No height changes on hover to maintain consistent positioning
              }}
              onMouseLeave={(e) => {
                // No height changes on hover to maintain consistent positioning
              }}
            >
              {/* User icon */}
              <div className="w-4 h-4 bg-[#10418c] rounded-sm flex items-center justify-center flex-shrink-0">
                <img
                  src="/user.png"
                  alt="User"
                  className="w-3 h-3 object-contain"
                />
              </div>

              {/* Visitor Name - always visible with better font */}
              <div className="text-white text-xs font-medium whitespace-nowrap ml-1 flex-1 text-center truncate">
                {chat.visitor_details?.first_name || `#${chat.visitor_id?.substring(0, 8)}`}
              </div>

              {/* Badge: Disconnected icon OR Message count - transforms to close button on hover */}
              {!isActive && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(chat.visitor_id);
                  }}
                  className={`${chat.isDisconnected
                      ? 'bg-red-500 hover:bg-red-600'
                      : chat.hasUnreadMessages
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : 'bg-gray-500 hover:bg-gray-600'
                    } text-white text-xs font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center flex-shrink-0 ml-2 cursor-pointer transition-all duration-200`}
                  title={chat.isDisconnected ? "Close chat (visitor disconnected)" : "Close chat"}
                >
                  <span className="group-hover:hidden">
                    {chat.isDisconnected ? (
                      <WifiOff className="h-2 w-2" />
                    ) : (
                      <span className="text-xs">
                        {chat.message_count || 0}
                      </span>

                    )}
                  </span>
                  <X className="h-3 w-3 hidden group-hover:block" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MinimizedChatTabs;
