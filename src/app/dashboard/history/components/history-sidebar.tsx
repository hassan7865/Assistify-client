"use client";

import React, { useState } from 'react';
import { X, User, Edit2, MapPin, Monitor, Clock, Globe, MessageCircle, Check } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface ChatHistoryItem {
  id: string;
  name: string;
  agent: string;
  time: string;
  rating: number | null;
  messages: number;
  lastMessage: string;
}

interface ChatMessage {
  id: string;
  sender: 'visitor' | 'agent';
  message: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface HistorySidebarProps {
  visitor: ChatHistoryItem;
  onClose: () => void;
}

const mockChatMessages: ChatMessage[] = [
  {
    id: "1",
    sender: 'visitor',
    message: "Hi, I'm interested in your book publishing services",
    timestamp: "10:22 PM"
  },
  {
    id: "2",
    sender: 'agent',
    message: "Hello! Welcome to Ivory Publishers. I'd be happy to help you with book publishing. What type of book are you looking to publish?",
    timestamp: "10:23 PM",
    status: 'read'
  },
  {
    id: "3",
    sender: 'visitor',
    message: "I have a non-fiction manuscript about business strategy. About 50,000 words.",
    timestamp: "10:25 PM"
  },
  {
    id: "4",
    sender: 'agent',
    message: "That sounds great! We specialize in non-fiction business books. Could you tell me more about your target audience and timeline?",
    timestamp: "10:26 PM",
    status: 'read'
  },
  {
    id: "5",
    sender: 'visitor',
    message: "I'm targeting small business owners and entrepreneurs. Hoping to publish within 6 months.",
    timestamp: "10:28 PM"
  },
  {
    id: "6",
    sender: 'agent',
    message: "Perfect! That's a great timeline for a quality publication. Our business book publishing package includes professional editing, cover design, formatting, and marketing support. Would you like me to send you our detailed proposal?",
    timestamp: "10:30 PM",
    status: 'read'
  },
  {
    id: "7",
    sender: 'visitor',
    message: "Yes, that would be great! Can you also tell me about pricing?",
    timestamp: "10:32 PM"
  },
  {
    id: "8",
    sender: 'agent',
    message: "Absolutely! I'll send you our comprehensive proposal with pricing details. Our business book package starts at $2,500 and includes everything I mentioned plus distribution to major platforms.",
    timestamp: "10:33 PM",
    status: 'read'
  }
];

const HistorySidebar: React.FC<HistorySidebarProps> = ({ visitor, onClose }) => {
  const [activeTab, setActiveTab] = useState('userinfo');
  const [name, setName] = useState(visitor.name || visitor.id);
  const [email, setEmail] = useState("johnsonmarejo@yahoo.com");
  const [phone, setPhone] = useState("253-590-9520");
  const [notes, setNotes] = useState("Interested in book publishing services. Has a manuscript ready.");

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div>
            <span className="font-medium text-white">{visitor.name || 'Anonymous'}</span>
            <span className="text-gray-300 ml-2">({visitor.id})</span>
          </div>
        </div>
        <Button 
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-white hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
        </Button>
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
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <Input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Add phone"
                    />
                  </div>
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
                  <CardTitle className="text-lg">Visitor Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <Card className="p-4">
                      <div className="text-3xl font-bold text-gray-900">2</div>
                      <div className="text-sm text-muted-foreground">Past visits</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-3xl font-bold text-gray-900">1</div>
                      <div className="text-sm text-muted-foreground">Past chats</div>
                    </Card>
                  </div>
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
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                      <span className="text-muted-foreground">google.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                      <span className="text-muted-foreground">Turn Heads & Pages - Bold Book Branding That Sells</span>
                    </div>
                  </div>
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
                {mockChatMessages.map((message) => (
                  <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'agent' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                      message.sender === 'visitor' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {message.sender === 'visitor' 
                        ? (visitor.name ? visitor.name.split(' ').map(n => n[0]).join('') : 'V')
                        : 'A'
                      }
                    </div>
                    
                    <div className="max-w-[70%] min-w-0">
                      <Card className={`${
                        message.sender === 'visitor' 
                          ? 'bg-white' 
                          : 'bg-primary text-primary-foreground border-primary'
                      }`}>
                        <CardContent className="p-3">
                          <p className="text-sm break-words">{message.message}</p>
                        </CardContent>
                      </Card>
                      <div className={`flex items-center gap-2 mt-1 px-1 ${
                        message.sender === 'agent' ? 'justify-end' : ''
                      }`}>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                        {message.sender === 'agent' && message.status && (
                          <Check className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HistorySidebar;
