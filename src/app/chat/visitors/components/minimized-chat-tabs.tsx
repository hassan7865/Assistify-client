"use client";

import React from 'react';
import { X, MessageCircle } from 'lucide-react';
import { MinimizedChat } from '../../types';

interface MinimizedChatTabsProps {
  minimizedChats: MinimizedChat[];
  onMaximize: (visitorId: string) => void;
  onClose: (visitorId: string) => void;
}

const MinimizedChatTabs: React.FC<MinimizedChatTabsProps> = ({
  minimizedChats,
  onMaximize,
  onClose
}) => {
  if (minimizedChats.length === 0) return null;

  return (
    <div className="fixed bottom-0 z-40" style={{ left: 'calc(13rem)' }}>
      <div className="flex gap-2">
        {minimizedChats.map((chat) => (
          <div
            key={chat.visitor_id}
            className="group flex items-center bg-gray-700 hover:bg-gray-600 min-w-0 flex-shrink-0 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden relative"
            onClick={() => onMaximize(chat.visitor_id)}
            style={{
              width: '7rem', // Slightly narrower
              height: '1.75rem', // Shorter height
              borderRadius: '0.375rem 0.375rem 0 0', // Slightly less rounded
              padding: '0.125rem 0.5rem' // Tighter padding
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.height = '2rem'; // Grow on hover
              e.currentTarget.style.padding = '0.25rem 0.5rem'; // More padding on hover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.height = '1.75rem'; // Back to normal
              e.currentTarget.style.padding = '0.125rem 0.5rem'; // Normal padding
            }}
          >
            {/* Chat icon - always visible */}
            <MessageCircle className="h-4 w-4 text-white flex-shrink-0" />
            
            {/* Visitor ID - always visible with better font */}
            <div className="text-white text-xs font-medium whitespace-nowrap ml-2 flex-1 text-center">
              #{chat.visitor_id.substring(0, 6)}
            </div>
            
            {/* Close button - only visible on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(chat.visitor_id);
              }}
              className="h-4 w-4 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MinimizedChatTabs;
