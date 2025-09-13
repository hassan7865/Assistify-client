"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Edit2, MapPin, Monitor, Clock, Globe, MessageCircle, Loader2, Download } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChatConversation } from '../hooks/use-chat-history';

interface HistorySidebarProps {
  conversation: ChatConversation;
  onClose: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ conversation, onClose }) => {
  const [activeTab, setActiveTab] = useState('userinfo');
  const [name, setName] = useState(conversation.metadata?.name || '');
  const [email, setEmail] = useState(conversation.metadata?.email || '');
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
    <div className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-900 text-white">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-medium text-white">{getVisitorName()}</span>
            <span className="text-gray-300 ml-2">({conversation.visitor_id?.substring(0, 8)})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-gray-800"
            title="Download transcript"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 rounded-none bg-transparent h-auto p-0 border-b border-gray-200">
            <TabsTrigger 
              value="userinfo" 
              className="rounded-none bg-transparent shadow-none border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary pb-3 pt-3 font-medium"
            >
              User Info
            </TabsTrigger>
            <TabsTrigger 
              value="conversation" 
              className="rounded-none bg-transparent shadow-none border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary pb-3 pt-3 font-medium"
            >
              Conversation
            </TabsTrigger>
          </TabsList>

          {/* User Info Tab */}
          <TabsContent value="userinfo" className="flex-1 overflow-y-auto m-0 p-4 bg-gray-50">
            <div className="space-y-6">
              {/* Visitor Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Visitor Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <Input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Add name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Add email"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Agent Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Agent Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conversation.agent_info ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <div className="text-sm text-gray-600">{conversation.agent_info.name}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="text-sm text-gray-600">{conversation.agent_info.email}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Role</label>
                        <Badge variant="secondary">{conversation.agent_info.role}</Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {conversation.agent_id ? 'Agent information not available' : 'No agent assigned'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Edit2 className="w-5 h-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add visitor notes"
                    rows={3}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              {/* Visitor Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Conversation Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <Card className="p-4">
                      <div className="text-3xl font-bold text-gray-900">{conversation.message_count}</div>
                      <div className="text-sm text-muted-foreground">Messages</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-3xl font-bold text-gray-900">{getConversationDuration()}</div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Device & Browser Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Device & Browser
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conversation.metadata?.browser && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Browser:</span>
                      <span className="font-medium">{conversation.metadata.browser}</span>
                    </div>
                  )}
                  {conversation.metadata?.os && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">OS:</span>
                      <span className="font-medium">{conversation.metadata.os}</span>
                    </div>
                  )}
                  {conversation.metadata?.device_type && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Device:</span>
                      <span className="font-medium">{conversation.metadata.device_type}</span>
                    </div>
                  )}
                  {conversation.metadata?.user_agent && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">User Agent:</span>
                      <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded break-all">
                        {conversation.metadata.user_agent}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location & Network
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getLocationString() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{getLocationString()}</span>
                    </div>
                  )}
                  {conversation.metadata?.timezone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Timezone:</span>
                      <span className="font-medium">{conversation.metadata.timezone}</span>
                    </div>
                  )}
                  {conversation.metadata?.ip_address && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="font-medium font-mono">{conversation.metadata.ip_address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Visitor Path */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Visitor Path
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conversation.metadata?.referrer && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Referrer:</span>
                      <div className="text-sm text-teal-600 bg-teal-50 p-2 rounded break-all">
                        {conversation.metadata.referrer}
                      </div>
                    </div>
                  )}
                  {conversation.metadata?.page_url && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Current Page:</span>
                      <div className="text-sm text-teal-600 bg-teal-50 p-2 rounded break-all">
                        {conversation.metadata.page_url}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ban Visitor Button */}
              <div className="pt-4">
                <Button variant="destructive" className="w-full">
                  Ban visitor
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Conversation Tab */}
          <TabsContent value="conversation" className="flex-1 m-0 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {conversation.messages && conversation.messages.length > 0 ? (
                  conversation.messages.map((message, index) => (
                    <div key={index} className={`flex gap-3 ${message.sender_type === 'client_agent' ? 'justify-end' : 'justify-start'}`}>
                      {message.sender_type === 'visitor' && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 bg-white text-gray-700 border border-gray-200">
                          {getVisitorName().split(' ').map(n => n[0]).join('') || 'V'}
                        </div>
                      )}
                      
                      <div className="max-w-[75%]">
                        <div className={`rounded-xl px-3 py-2 ${
                          message.sender_type === 'visitor' 
                            ? 'bg-white border border-gray-200 text-gray-900' 
                            : 'bg-teal-700 text-white'
                        }`}>
                          <p className="text-sm break-words">{message.message}</p>
                        </div>
                        <div className={`flex items-center gap-2 mt-1 px-2 ${
                          message.sender_type === 'client_agent' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                        </div>
                      </div>

                      {message.sender_type === 'client_agent' && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 bg-teal-700 text-white">
                          A
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No messages in this conversation</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HistorySidebar;