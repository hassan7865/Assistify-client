"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Edit2, MapPin, Monitor, Globe, Download, Ban } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChatConversation } from '../hooks/use-chat-history';
import { getCountryFlag, getBrowserIcon, getOSIcon, getDeviceIcon } from '@/lib/visitor-icons';

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
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getVisitorName = () => {
    return conversation.metadata?.name || 
           conversation.visitor_id?.substring(0, 8) || 
           'Anonymous';
  };

  const getAgentName = () => {
    if (conversation.agent_info) {
      return conversation.agent_info.name;
    }
    return conversation.agent_id ? 'Agent' : 'Unassigned';
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
    <div className="h-screen w-full bg-white flex flex-col relative">
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
            <TabsList className="grid w-auto grid-cols-2 rounded-none bg-transparent h-auto p-0 gap-0">
              <TabsTrigger 
                value="transcript" 
                className="rounded-none bg-transparent shadow-none border-0 data-[state=active]:bg-blue-100 data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 py-1 px-2 font-medium text-2xs"
              >
                Transcript
              </TabsTrigger>
              <TabsTrigger 
                value="userinfo" 
                className="rounded-none bg-transparent shadow-none border-0 data-[state=active]:bg-blue-100 data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 py-1 px-2 font-medium text-2xs"
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
                  className="bg-red-600 hover:bg-red-700 h-7 rounded-none text-white text-xs px-1"
               
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
          <TabsContent value="userinfo" className="flex-1 overflow-y-auto m-0 p-3 bg-white">
            <div className="space-y-4">
              {/* Visitor Details */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Profile Icon */}
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Input Fields */}
                    <div className="flex-1 space-y-3">
                      <Input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Add name"
                        className="h-7 w-full text-xs border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-400 bg-white"
                      />
                      
                      <Input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Add email"
                        className="h-7 w-full text-xs border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-400 bg-white"
                      />
                      
                      <Input 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Add phone number"
                        className="h-7 w-full text-xs border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-400 bg-white"
                      />
                    </div>
                  </div>
                  
                  {/* Notes - Full Width */}
                  <div className="mt-3">
                    <Textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add visitor notes"
                      rows={3}
                      className="resize-none h-16 w-full text-xs border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-400 bg-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Agent Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Agent Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conversation.agent_info ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Name</label>
                        <div className="text-xs text-gray-600">{conversation.agent_info.name}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Email</label>
                        <div className="text-xs text-gray-600">{conversation.agent_info.email}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Role</label>
                        <Badge variant="secondary" className="text-xs px-2 py-0">{conversation.agent_info.role}</Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {conversation.agent_id ? 'Agent information not available' : 'No agent assigned'}
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* Visitor Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Conversation Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <Card className="p-2">
                      <div className="text-lg font-bold text-gray-900">{conversation.message_count}</div>
                      <div className="text-xs text-muted-foreground">Messages</div>
                    </Card>
                    <Card className="p-2">
                      <div className="text-lg font-bold text-gray-900">{getConversationDuration()}</div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Device & Browser Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Device & Browser
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {conversation.metadata?.browser && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Browser:</span>
                      <div className="flex items-center gap-1">
                        {getBrowserIcon(conversation.metadata.browser, conversation.metadata.user_agent, 'h-3 w-3')}
                        <span className="font-medium">{conversation.metadata.browser}</span>
                      </div>
                    </div>
                  )}
                  {conversation.metadata?.os && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">OS:</span>
                      <div className="flex items-center gap-1">
                        {getOSIcon(conversation.metadata.os, conversation.metadata.user_agent, 'h-3 w-3')}
                        <span className="font-medium">{conversation.metadata.os}</span>
                      </div>
                    </div>
                  )}
                  {conversation.metadata?.device_type && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Device:</span>
                      <div className="flex items-center gap-1">
                        {getDeviceIcon(conversation.metadata.device_type, conversation.metadata.user_agent, 'h-3 w-3')}
                        <span className="font-medium">{conversation.metadata.device_type}</span>
                      </div>
                    </div>
                  )}
                  {conversation.metadata?.user_agent && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">User Agent:</span>
                      <div className="text-xs text-gray-600 bg-gray-100 p-1 rounded break-all">
                        {conversation.metadata.user_agent}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location & Network
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {getLocationString() && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Location:</span>
                      <div className="flex items-center gap-1">
                        {getCountryFlag(conversation.metadata?.country, { width: '12px', height: '9px' })}
                        <span className="font-medium">{getLocationString()}</span>
                      </div>
                    </div>
                  )}
                  {conversation.metadata?.timezone && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Timezone:</span>
                      <span className="font-medium">{conversation.metadata.timezone}</span>
                    </div>
                  )}
                  {conversation.metadata?.ip_address && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="font-medium font-mono">{conversation.metadata.ip_address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Visitor Path */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Visitor Path
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {conversation.metadata?.referrer && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Referrer:</span>
                      <div className="text-xs text-teal-600 bg-teal-50 p-1 rounded break-all">
                        {conversation.metadata.referrer}
                      </div>
                    </div>
                  )}
                  {conversation.metadata?.page_url && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Current Page:</span>
                      <div className="text-xs text-teal-600 bg-teal-50 p-1 rounded break-all">
                        {conversation.metadata.page_url}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Conversation Tab */}
          <TabsContent value="transcript" className="flex-1 m-0 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {/* Conversation Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rating:</span>
                  <span className="text-gray-900">—</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Comment:</span>
                  <span className="text-gray-900">—</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Support ticket:</span>
                  <span className="text-blue-600 cursor-pointer">Create ticket</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tags:</span>
                  <div className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 cursor-pointer">
                    <Edit2 className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Dotted Line */}
              <div className="border-b border-dashed border-gray-300 mb-6"></div>

              {/* Chat Messages */}
              <div className="space-y-4">
                {/* Join Messages */}
                <div className="text-center text-sm text-gray-500 italic">
                  <div className="flex justify-between items-center">
                    <span>{getAgentName()} has joined.</span>
                    <span className="text-xs text-gray-400">{formatTime(conversation.created_at)}</span>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500 italic">
                  <div className="flex justify-between items-center">
                    <span>{getVisitorName()} has joined.</span>
                    <span className="text-xs text-gray-400">{formatTime(conversation.created_at)}</span>
                  </div>
                </div>

                {/* Agent Message */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">{getAgentName()}</span>
                    <span className="text-xs text-gray-500">{formatTime(conversation.created_at)}</span>
                  </div>
                  <div className="text-sm text-gray-900">
                    Hi! Thanks for stopping by.
                  </div>
                </div>

                {/* Interactive Question */}
                <div className="space-y-3">
                  <div className="text-sm text-gray-900">
                    What services are you looking for?
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                      <input type="radio" name="services" className="w-3 h-3" />
                      Book Publishing
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                      <input type="radio" name="services" className="w-3 h-3" />
                      Multi-Platform Publishing
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                      <input type="radio" name="services" className="w-3 h-3" />
                      Custom Illustrations
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                      <input type="radio" name="services" className="w-3 h-3" />
                      Editing & Proofreading
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                      <input type="radio" name="services" className="w-3 h-3" />
                      Marketing & Promotion
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                      <input type="radio" name="services" className="w-3 h-3" />
                      Book Writing Services
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                      <input type="radio" name="services" className="w-3 h-3" />
                      All of the Above
                    </label>
                  </div>
                </div>

                {/* Leave Message */}
                <div className="text-center text-sm text-gray-500 italic">
                  <div className="flex justify-between items-center">
                    <span>{getVisitorName()} has left.</span>
                    <span className="text-xs text-gray-400">{formatTime(conversation.updated_at)}</span>
                  </div>
                </div>

                {/* Dotted Line */}
                <div className="border-b border-dashed border-gray-300 mt-6"></div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HistorySidebar;