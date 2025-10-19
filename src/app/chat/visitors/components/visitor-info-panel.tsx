"use client";

import React, { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getCountryFlag, getBrowserIcon, getOSIcon } from '@/lib/visitor-icons';
import { Visitor, ChatMessage, getChatDuration } from '../../types';
import api from '@/lib/axios';
import { useGlobalChat } from '@/contexts/global-chat-context';

interface VisitorInfoPanelProps {
  visitor: Visitor;
  chatMessages?: ChatMessage[];
}

const VisitorInfoPanel: React.FC<VisitorInfoPanelProps> = ({ visitor, chatMessages = [] }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [currentDuration, setCurrentDuration] = useState('');
  const [timerActive, setTimerActive] = useState(true);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [savedName, setSavedName] = useState('');
  
  const { updateVisitorName } = useGlobalChat();

  useEffect(() => {
    // Initialize from visitor.first_name (from API) or metadata.name (legacy)
    const initialName = visitor.first_name || visitor.metadata?.name || '';
    setName(initialName);
    setSavedName(initialName);
    setEmail(visitor.metadata?.email || '');
    
    // If there's no saved name, start in editing mode
    if (!initialName) {
      setIsNameEditing(true);
    }
  }, [visitor.first_name, visitor.metadata?.name, visitor.metadata?.email]);

  // Timer effect - updates every second unless visitor is disconnected
  useEffect(() => {
    // If visitor is disconnected, freeze the timer at the current value
    if (visitor.isDisconnected && timerActive) {
      setCurrentDuration(getChatDuration(visitor.started_at));
      setTimerActive(false);
      return;
    }

    // If timer is not active (visitor disconnected), don't start interval
    if (!timerActive) {
      return;
    }

    // Update duration immediately
    setCurrentDuration(getChatDuration(visitor.started_at));

    // Set up interval to update every second
    const interval = setInterval(() => {
      setCurrentDuration(getChatDuration(visitor.started_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [visitor.started_at, visitor.isDisconnected, timerActive]);

  // Handle saving visitor name
  const handleSaveName = async () => {
    if (!name.trim()) return;

    try {
      const response = await api.put('/chat/save-visitor-name', {
        visitor_id: visitor.visitor_id,
        session_id: visitor.session_id,
        first_name: name.trim(),
        last_name: null
      });
      
      if (response.data.success) {
        setSavedName(name.trim());
        setIsNameEditing(false);
        
        // Update visitor object locally
        visitor.first_name = name.trim();
        
        // Update global state and localStorage
        updateVisitorName(visitor.visitor_id, name.trim());
      }
    } catch (error) {
      console.error('Error saving visitor name:', error);
    }
  };

  // Handle Enter key press on name input
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    }
  };

  // Handle double-click to enable editing
  const handleNameDoubleClick = () => {
    setIsNameEditing(true);
  };

  return (
    <div className="flex flex-col overflow-y-auto h-full custom-scrollbar">
      <div className="p-3 space-y-3">
        {/* Visitor Profile */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-[#10418c] rounded-lg flex items-center justify-center flex-shrink-0">
              <img 
                src="/user.png" 
                alt="User" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex-1 space-y-2">
              {isNameEditing || !savedName ? (
                <input
                  type="text"
                  placeholder="Add name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  autoFocus={isNameEditing}
                  className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-sm"
                />
              ) : (
                <div
                  onDoubleClick={handleNameDoubleClick}
                  className="w-full px-2 py-1 border border-transparent text-xs font-semibold bg-gray-50 rounded-sm cursor-pointer hover:bg-gray-100"
                  title="Double-click to edit"
                >
                  {savedName}
                </div>
              )}
              <input
                type="email"
                placeholder="Add email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-sm"
              />
             
            </div>
          </div>
          <input
                type="tel"
                placeholder="Add phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-sm"
              />
          <textarea
            placeholder="Add visitor notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none bg-white rounded-sm"
          />
        </div>

      

        {/* Tags */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Tags</h3>
          <input
            type="text"
            placeholder="Add chat tags"
            className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-sm"
          />
        </div>


        {/* Visitor Statistics */}
        <div className="bg-white shadow-sm p-2">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            {/* Past Visits */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="text-sm font-bold text-gray-900">{visitor.visitor_past_count || 0}</div>
              <div className="text-xs text-gray-600 text-center">Past visits</div>
            </div>
            
            {/* Past Chats */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="text-sm font-bold text-gray-900">{visitor.visitor_chat_count || 0}</div>
              <div className="text-xs text-gray-600 text-center">Past chats</div>
            </div>

            {/* Time on Site */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="text-sm font-bold text-gray-900">{currentDuration}</div>
              <div className="text-xs text-gray-600 text-center">Time on site</div>
            </div>
          </div>
        </div>

        {/* Visitor Path */}
        <div className="bg-white shadow-sm p-3">
          <h3 className="text-xs text-gray-900 mb-2">Visitor Path</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 flex items-center justify-center">
                <span>↓</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a 
                    href={visitor.metadata?.page_url || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="truncate text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    {visitor.metadata?.page_url || '-'}
                  </a>
                </TooltipTrigger>
                <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                  <p>{visitor.metadata?.page_url || 'No page URL available'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a 
                    href={visitor.metadata?.referrer || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="truncate text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    {visitor.metadata?.referrer || '-'}
                  </a>
                </TooltipTrigger>
                <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                  <p>{visitor.metadata?.referrer || 'No referrer available'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Zendesk Support */}
        <div className="bg-white shadow-sm p-3">
          <h3 className="text-xs text-gray-900 mb-2">Zendesk Support</h3>
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
          <div className="space-y-1 text-xs text-gray-600">
            <div>
              <span className="font-medium">Location</span><br />
              {visitor.metadata?.city || 'Unknown'}, {visitor.metadata?.country || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Browser</span><br />
              {visitor.metadata?.browser || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Platform</span><br />
              {visitor.metadata?.os || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Device</span><br />
              {visitor.metadata?.device_type || '-'}
            </div>
            <div>
              <span className="font-medium">IP address</span><br />
              {visitor.metadata?.ip_address || '-'}
            </div>
            <div>
              <span className="font-medium">Hostname</span><br />
              {'-'}
            </div>
            <div>
              <span className="font-medium">User agent</span><br />
              <span className="break-all">{visitor.metadata?.user_agent || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorInfoPanel;