"use client";

import React from 'react';
import { X, MessageCircle, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface from './chat-interface';
import VisitorInfoPanel from './visitor-info-panel';

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
  onClose: () => void;
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
  onClose,
  onChatEnded
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-[60%] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-900 text-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-medium text-white">{visitor.metadata?.name || 'Anonymous Visitor'}</span>
            <span className="text-gray-300 ml-2">({visitor.visitor_id})</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="h-8 w-8 p-0 text-white hover:bg-gray-800 rounded flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <ChatInterface 
          visitor={visitor}
          selectedAgent={selectedAgent}
          onClose={onClose}
          onChatEnded={onChatEnded}
        />

        {/* Right Panel - Visitor Info */}
        <VisitorInfoPanel visitor={visitor} />
      </div>
    </div>
  );
};

export default VisitorDetailsPopup;