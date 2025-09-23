"use client";

import React, { useEffect, useState } from 'react';
import { User, HelpCircle, ArrowDown } from 'lucide-react';
import { getCountryFlag, getBrowserIcon, getOSIcon } from '@/lib/visitor-icons';

interface VisitorInfoPanelProps {
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
  chatMessages?: Array<{
    id: string;
    sender: 'visitor' | 'agent' | 'system';
    sender_id?: string;
    message: string;
    timestamp: string;
    status?: 'read';
  }>;
}

const VisitorInfoPanel: React.FC<VisitorInfoPanelProps> = ({ visitor, chatMessages = [] }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');


  // Calculate chat duration from visitor start time
  const getChatDuration = () => {
    if (!visitor.started_at) return '0m';
    
    const startTime = new Date(visitor.started_at).getTime();
    const currentTime = new Date().getTime();
    const durationMs = currentTime - startTime;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  useEffect(() => {
    setName(visitor.metadata?.name || '');
    setEmail(visitor.metadata?.email || '');
  }, [visitor.metadata?.name, visitor.metadata?.email]);

  return (
    <div className="flex flex-col bg-white overflow-y-auto h-full">
      <div className="p-2 space-y-3">
        {/* Visitor Avatar and Details */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div className="w-full space-y-2">
            <input
              type="text"
              placeholder="Add name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Add email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="tel"
              placeholder="Add phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              placeholder="Add visitor notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>


        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-gray-50">
            <div className="text-sm font-bold text-gray-900">{chatMessages.length}</div>
            <div className="text-xs text-gray-600">Messages</div>
          </div>
          <div className="text-center p-2 bg-gray-50">
            <div className="text-sm font-bold text-gray-900">{getChatDuration()}</div>
            <div className="text-xs text-gray-600">Duration</div>
          </div>
        </div>

        {/* Current Ticket */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Current ticket</h3>
          <div className="border-t border-gray-200 pt-2">
            <div className="text-sm text-gray-500">No current ticket</div>
          </div>
        </div>

        {/* Metadata Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Metadata</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div><span className="font-medium">IP:</span> {visitor.metadata?.ip_address || 'Unknown'}</div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Country:</span> 
              {getCountryFlag(visitor.metadata?.country)}
              <span>{visitor.metadata?.country || 'Unknown'}</span>
            </div>
            <div><span className="font-medium">City:</span> {visitor.metadata?.city || 'Unknown'}</div>
            <div><span className="font-medium">Region:</span> {visitor.metadata?.region || 'Unknown'}</div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Browser:</span> 
              {getBrowserIcon(visitor.metadata?.browser, visitor.metadata?.user_agent)}
              <span>{visitor.metadata?.browser || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">OS:</span> 
              {getOSIcon(visitor.metadata?.os, visitor.metadata?.user_agent)}
              <span>{visitor.metadata?.os || 'Unknown'}</span>
            </div>
            <div><span className="font-medium">Device:</span> {visitor.metadata?.device_type || 'Unknown'}</div>
            <div><span className="font-medium">Referrer:</span> {visitor.metadata?.referrer || 'Direct'}</div>
            <div><span className="font-medium">Page URL:</span> 
              <div className="break-all text-xs">{visitor.metadata?.page_url || 'Unknown'}</div>
            </div>
            <div><span className="font-medium">User Agent:</span> 
              <div className="break-all text-xs">{visitor.metadata?.user_agent || 'Unknown'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorInfoPanel;