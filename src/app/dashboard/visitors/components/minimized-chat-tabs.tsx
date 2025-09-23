"use client";

import React from 'react';
import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MinimizedChat {
  visitor_id: string;
  visitor_name?: string;
  agent_name?: string;
  status: string;
  lastMessage?: string;
  timestamp?: string;
}

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
    <div className="fixed bottom-0 z-40" style={{ left: 'calc(16rem)' }}>
      <div className="flex gap-2">
        {minimizedChats.map((chat) => (
          <div
            key={chat.visitor_id}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 min-w-0 flex-shrink-0 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            onClick={() => onMaximize(chat.visitor_id)}
          >
            {/* Chat icon */}
            <MessageCircle className="h-4 w-4 text-white flex-shrink-0" />
            
            {/* Visitor ID */}
            <div className="text-white text-sm font-medium whitespace-nowrap">
              #{chat.visitor_id.substring(0, 8)}
            </div>
            
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(chat.visitor_id);
              }}
              className="h-5 w-5 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 ml-auto transition-colors duration-200"
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
