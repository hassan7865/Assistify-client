"use client";

import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { getCountryFlag, getBrowserIcon, getOSIcon, getMessageCount } from '@/lib/visitor-icons';
import { Visitor, ChatMessage, getChatDuration } from '../../types';

interface VisitorInfoPanelProps {
  visitor: Visitor;
  chatMessages?: ChatMessage[];
}

const VisitorInfoPanel: React.FC<VisitorInfoPanelProps> = ({ visitor, chatMessages = [] }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');



  useEffect(() => {
    setName(visitor.metadata?.name || '');
    setEmail(visitor.metadata?.email || '');
  }, [visitor.metadata?.name, visitor.metadata?.email]);

  return (
    <div className="flex flex-col overflow-y-auto h-full custom-scrollbar">
      <div className="p-3 space-y-3">
        {/* Visitor Profile */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 space-y-2">
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
            </div>
          </div>
          <textarea
            placeholder="Add visitor notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

      

        {/* Tags */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Tags</h3>
          <input
            type="text"
            placeholder="Add chat tags"
            className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>


        {/* Visitor Statistics */}
        <div className="grid grid-cols-2 gap-2">
          {/* Message Count */}
          <div className="bg-white shadow-sm p-2 flex flex-col items-center justify-center">
            <div className="text-center p-1 bg-gray-50 text-xs w-full">
              <div className="font-bold text-gray-900 text-xs">{getMessageCount({ message_count: visitor.message_count || 0 })}</div>
            </div>
            <h3 className="text-xs text-gray-900 mt-1 text-center">Message count</h3>
          </div>

          {/* Time on Site */}
          <div className="bg-white shadow-sm p-2 flex flex-col items-center justify-center">
            <div className="text-center p-1 bg-gray-50 text-xs w-full">
              <div className="font-bold text-gray-900 text-xs">{getChatDuration(visitor.started_at)}</div>
            </div>
            <h3 className="text-xs text-gray-900 mt-1 text-center">Time on site</h3>
          </div>
        </div>

        {/* Visitor Path */}
        <div className="bg-white shadow-sm p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Visitor Path</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 flex items-center justify-center">
                <span>↓</span>
              </div>
              <span className="truncate">{visitor.metadata?.page_url || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              <span className="truncate">{visitor.metadata?.referrer || '-'}</span>
            </div>
          </div>
        </div>

        {/* Zendesk Support */}
        <div className="bg-white shadow-sm p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Zendesk Support</h3>
          <div className="space-y-2">
            <div className="text-xs text-blue-600 underline cursor-pointer">
              (Set ticket assignee)
            </div>
            <div className="text-xs text-gray-600">Current ticket -</div>
            <div className="text-xs text-gray-600">Previous tickets -</div>
            <button className="w-full bg-gray-200 hover:bg-gray-300 text-xs py-1 px-2 text-gray-700">
              Create ticket
            </button>
          </div>
        </div>

        {/* Visitor Technical Details */}
        <div className="bg-white shadow-sm p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Visitor Technical Details</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <div>
              <span className="font-medium">Location</span> {visitor.metadata?.city || 'Unknown'}, {visitor.metadata?.country || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Browser</span> {visitor.metadata?.browser || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Platform</span> {visitor.metadata?.os || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Device</span> {visitor.metadata?.device_type || '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorInfoPanel;