"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Edit2, MapPin, Monitor, Globe, Download } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatConversation } from '../hooks/use-chat-history';
import { getCountryFlag, getBrowserIcon, getOSIcon, getDeviceIcon } from '@/lib/visitor-icons';
import { getConversationVisitorName, getConversationAgentName } from '../../types';
import HistoryChatInterface from './history-chat-interface';

interface HistorySidebarProps {
  conversation: ChatConversation;
  onClose: () => void;
  isClosing?: boolean;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ conversation, onClose, isClosing = false }) => {
  const [activeTab, setActiveTab] = useState('transcript');
  const [name, setName] = useState(conversation.metadata?.name || '');
  const [email, setEmail] = useState(conversation.metadata?.email || '');
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours < 1) return "Just now";
      return `${diffInHours} hrs ago`;
    }
    
    // For 24+ hours, show format like "Oct 01 6:03 AM"
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };


  const getConversationDuration = () => {
    try {
      const created = new Date(conversation.created_at);
      const updated = new Date(conversation.updated_at);
      const duration = updated.getTime() - created.getTime();
      const minutes = Math.floor(duration / (1000 * 60));
      const seconds = Math.floor((duration % (1000 * 60)) / 1000);
      
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }
      return `${seconds}s`;
    } catch {
      return 'Unknown';
    }
  };

  const getLocationString = () => {
    const { city, region, country } = conversation.metadata || {};
    const parts = [city, region, country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col relative">
      {/* Loading Overlay - Only show when closing */}
      {isClosing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Closing...</span>
          </div>
        </div>
      )}
      {/* Tabs Container */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <TabsList className="grid w-auto grid-cols-2 rounded-none bg-gray-100 border-b border-gray-200 h-auto p-0 gap-0">
              <TabsTrigger 
                value="transcript" 
                className="rounded-none bg-transparent shadow-none border-0 data-[state=active]:bg-blue-50 data-[state=active]:text-gray-900 data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-blue-300 py-1 px-2 font-bold text-xs cursor-pointer"
              >
                Transcript
              </TabsTrigger>
              <TabsTrigger 
                value="userinfo" 
                className="rounded-none bg-transparent shadow-none border-0 data-[state=active]:bg-blue-50 data-[state=active]:text-gray-900 data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-blue-300 py-1 px-2 font-bold text-xs cursor-pointer"
              >
                User info
              </TabsTrigger>
            </TabsList>
            
            {/* Action Icons */}
            <div className="flex items-center gap-1">
              {activeTab === 'transcript' && (
                <Button 
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 bg-gray-100 hover:bg-gray-200 rounded-sm"
                  title="Download transcript"
                >
                  <Download className="h-3 w-3 text-gray-600" />
                </Button>
              )}
              {activeTab === 'userinfo' && (
                <Button 
                  variant="destructive"
                  className="bg-[#cd3642] hover:bg-[#cd3642]/90 h-7  text-white font-semibold text-xs px-1 rounded-sm"
               
                >
                  Ban Visitor
                </Button>
              )}
              <Button 
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6 bg-gray-100 hover:bg-gray-200 rounded-sm"
              >
                <X className="h-3 w-3 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* User Info Tab */}
          <TabsContent value="userinfo" className="flex-1 overflow-y-auto m-0 p-3 custom-scrollbar">
            <div className="space-y-3">
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
                    <input
                        type="text"
                        placeholder="Add name"
                      defaultValue={conversation.metadata?.name || ''}
                      className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-xs"
                      />
                    <input
                        type="email"
                        placeholder="Add email"
                      defaultValue={conversation.metadata?.email || ''}
                      className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-xs"
                      />
                      
                  </div>
                </div>
                <input
                        type="tel"
                        placeholder="Add phone number"
                      className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white rounded-xs"
                    />
                <textarea
                  placeholder="Add visitor notes"
                  rows={3}
                  className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none bg-white rounded-xs"
                      />
                    </div>


              {/* Visitor Statistics */}
              <div className="bg-white shadow-sm p-2">
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                  {/* Past Visits */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <div className="text-sm font-bold text-gray-900">11</div>
                    <div className="text-xs text-gray-600 text-center">Past visits</div>
                  </div>
                  
                  {/* Message Count */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <div className="text-sm font-bold text-gray-900">{conversation.message_count || 0}</div>
                    <div className="text-xs text-gray-600 text-center">Past chats</div>
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
                          href={conversation.metadata?.page_url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="truncate text-gray-600 hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          {conversation.metadata?.page_url || '-'}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                        <p>{conversation.metadata?.page_url || 'No page URL available'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a 
                          href={conversation.metadata?.referrer || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="truncate text-gray-600 hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          {conversation.metadata?.referrer || '-'}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border border-gray-200 text-gray-900 [&>svg]:hidden">
                        <p>{conversation.metadata?.referrer || 'No referrer available'}</p>
                      </TooltipContent>
                    </Tooltip>
                      </div>
                    </div>
                      </div>

              {/* Visitor Technical Details */}
              <div className="bg-white shadow-sm p-3">
                <div className="space-y-1 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Location</span><br />
                    {conversation.metadata?.city || 'Unknown'}, {conversation.metadata?.country || 'Unknown'}
                    </div>
                  <div>
                    <span className="font-medium">Browser</span><br />
                    {conversation.metadata?.browser || 'Unknown'}
                      </div>
                  <div>
                    <span className="font-medium">Platform</span><br />
                    {conversation.metadata?.os || 'Unknown'}
                    </div>
                  <div>
                    <span className="font-medium">Device</span><br />
                    {conversation.metadata?.device_type || '-'}
                      </div>
                  <div>
                    <span className="font-medium">IP address</span><br />
                    {conversation.metadata?.ip_address || '-'}
                    </div>
                  <div>
                    <span className="font-medium">Hostname</span><br />
                    {'-'}
                      </div>
                  <div>
                    <span className="font-medium">User agent</span><br />
                    <span className="break-all">{conversation.metadata?.user_agent || '-'}</span>
                      </div>
                      </div>
                    </div>
            </div>
          </TabsContent>

          {/* Conversation Tab */}
          <TabsContent value="transcript" className="flex-1 m-0 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {/* Conversation Details */}
               <div className="space-y-3 mb-6">
                 <div className="flex gap-2 text-sm">
                   <span className="text-gray-600 text-xs w-24">Rating:</span>
                   <span className="text-gray-900 text-xs">—</span>
                </div>
                 <div className="flex gap-2 text-sm">
                   <span className="text-gray-600 text-xs w-24">Comment:</span>
                   <span className="text-gray-900 text-xs">—</span>
                </div>
                 <div className="flex gap-2 text-sm">
                   <span className="text-gray-600 text-xs w-24">Support ticket:</span>
                   <span className="text-blue-600 cursor-pointer text-xs">Create ticket</span>
                </div>
                 <div className="flex gap-2 text-sm">
                   <span className="text-gray-600 text-xs w-24">Tags:</span>
                  <div className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 cursor-pointer">
                    <Edit2 className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Dotted Line */}
              <div className="border-b border-dashed border-gray-300 mb-6"></div>

              {/* Chat Messages */}
              <HistoryChatInterface 
                conversation={conversation}
                selectedAgent={{
                  id: conversation.agent_id || '',
                  name: conversation.agent_info?.name || ''
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HistorySidebar;