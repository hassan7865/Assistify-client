"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Check, Eye, MessageCircle, ChevronDown, User, Mail, Phone, Edit2, MapPin, Monitor, Clock, Globe } from 'lucide-react';

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
  onClose
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const chatWebSocketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize form fields when visitor data changes
  useEffect(() => {
    setName(visitor.metadata?.name || '');
    setEmail(visitor.metadata?.email || '');
  }, [visitor.metadata?.name, visitor.metadata?.email]);

  // Fetch existing chat messages when popup opens
  useEffect(() => {
    if (isOpen && visitor.session_id) {
      fetchExistingChatMessages();
    }
  }, [isOpen, visitor.session_id]);

     const fetchExistingChatMessages = async () => {
     try {
       const response = await fetch(`http://localhost:8000/api/v1/chat/visitor-messages/${visitor.visitor_id}`);
       
       if (response.ok) {
         const data = await response.json();
         
         if (data.success && data.messages) {
           // Convert backend message format to frontend format
           const convertedMessages = data.messages.map((msg: any) => ({
             id: `${msg.timestamp}-${Math.random()}`,
             sender: msg.sender_type === 'visitor' ? 'visitor' : 
                    msg.sender_type === 'agent' ? 'agent' : 'system',
             sender_id: msg.sender_id,
             message: msg.message,
             timestamp: msg.timestamp,
             status: 'delivered'
           }));
           setChatMessages(convertedMessages);
         }
       }
     } catch (error) {
       console.error('Error fetching existing chat messages:', error);
     }
   };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectChat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Start chat - connects as AGENT (not visitor) to match working implementation
  const startChat = useCallback(() => {
    if (!visitor.session_id || !selectedAgent?.id) {
      alert('No session ID available or no agent selected');
      return;
    }

    setChatStarted(true);
    // Don't clear existing messages - keep conversation history
    connectChatWebSocket();
  }, [visitor.session_id, selectedAgent?.id]);

  const connectChatWebSocket = useCallback(() => {
    if (!visitor.session_id || !selectedAgent?.id || isConnecting || chatWebSocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    setIsConnecting(true);
    const WS_BASE = 'ws://localhost:8000';
    
    // Use the SAME endpoint format as the working AgentDashboard component
    // Connect as AGENT, not visitor
    const wsUrl = `${WS_BASE}/ws/chat/${visitor.session_id}/agent/${selectedAgent.id}`;
    console.log('Connecting to chat WebSocket as agent:', wsUrl);
    
    try {
      chatWebSocketRef.current = new WebSocket(wsUrl);

      chatWebSocketRef.current.onopen = () => {
        console.log('Chat WebSocket connected as agent');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Clear any existing reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Add connection message
        setChatMessages(prev => [...prev, {
          id: `${Date.now()}-connection`,
          sender: 'system',
          message: 'Connected to chat session as agent',
          timestamp: new Date().toISOString(),
          status: 'sent'
        }]);
      };

      chatWebSocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Chat WebSocket message:', data);
          
          if (data.type === 'chat_message') {
            setChatMessages(prev => [...prev, {
              id: `${Date.now()}-${Math.random()}`,
              sender: data.sender_type === 'visitor' ? 'visitor' : 
                     data.sender_type === 'agent' ? 'agent' : 'system',
              sender_id: data.sender_id,
              message: data.message,
              timestamp: data.timestamp || new Date().toISOString(),
              status: 'delivered'
            }]);
          } else if (data.type === 'chat_connected') {
            console.log('Chat connected:', data);
            setChatMessages(prev => [...prev, {
              id: `${Date.now()}-established`,
              sender: 'system',
              message: 'Chat session established',
              timestamp: new Date().toISOString(),
              status: 'sent'
            }]);
          } else if (data.type === 'typing_indicator') {
            console.log('Typing indicator:', data.is_typing);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      chatWebSocketRef.current.onclose = (event) => {
        console.log('Chat WebSocket closed', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Attempt to reconnect after a delay if the connection wasn't closed intentionally and chat is still started
        if (event.code !== 1000 && chatStarted) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connectChatWebSocket();
          }, 3000);
        }
      };

      chatWebSocketRef.current.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnecting(false);
    }
  }, [visitor.session_id, selectedAgent?.id, isConnecting, chatStarted]);

  const disconnectChat = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (chatWebSocketRef.current) {
      chatWebSocketRef.current.close(1000, 'Chat ended');
      chatWebSocketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setChatStarted(false);
    setChatMessages([]);
  }, []);

  const sendChatMessage = useCallback(() => {
    if (!chatMessage.trim() || !chatWebSocketRef.current || chatWebSocketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Use the same message format as the working AgentDashboard
    const message = {
      type: 'chat_message',
      message: chatMessage.trim()
    };

    // Send via WebSocket - let the server echo it back to display it
    try {
      chatWebSocketRef.current.send(JSON.stringify(message));
      console.log('Message sent via WebSocket:', message);
      
      // Don't add to local state here - wait for the server to echo it back
      // This prevents duplicate messages
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message only if sending fails
      setChatMessages(prev => [...prev, {
        id: `${Date.now()}-error`,
        sender: 'system',
        message: 'Failed to send message. Connection error.',
        timestamp: new Date().toISOString(),
        status: 'sent'
      }]);
    }
    
    setChatMessage("");
  }, [chatMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }, [sendChatMessage]);

  // Early return after all hooks
  if (!isOpen) return null;

  const getConnectionStatus = () => {
    if (isConnecting) return { text: 'Connecting...', color: 'bg-yellow-500' };
    if (isConnected) return { text: 'Connected', color: 'bg-green-500' };
    return { text: 'Disconnected', color: 'bg-red-500' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="fixed right-0 top-0 h-screen w-[60%] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-900 text-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connectionStatus.color}`}></div>
          <div>
            <span className="font-medium text-white">{visitor.metadata?.name || 'Anonymous Visitor'}</span>
            <span className="text-gray-300 ml-2">({visitor.visitor_id})</span>
            <span className="text-xs text-gray-400 ml-2">
              {connectionStatus.text}
            </span>
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
        <div className="flex-1 flex flex-col border-r border-gray-200">
          {/* Chat Header */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white">
            <div className="px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600 bg-blue-50">
              Current Chat
            </div>
          </div>
          
          {/* Chat Content */}
          {!chatStarted ? (
            // Show start chat button when chat not started
            <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">Start Chat</p>
                <p className="text-sm mb-4">Click below to connect to this visitor's chat session</p>
                <button 
                  onClick={startChat}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={!visitor.session_id || !selectedAgent?.id}
                >
                  {visitor.session_id && selectedAgent?.id ? 'Start Chat' : 'No Session or Agent Available'}
                </button>
                {!selectedAgent && (
                  <p className="text-xs text-red-500 mt-2">No agent selected. Please select an agent first.</p>
                )}
              </div>
            </div>
          ) : (
            // Show chat interface when chat started
            <>
              {/* Chat Controls */}
              <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-50">
                                 <div className="flex justify-between items-center">
                   <div className="text-sm text-gray-600">
                     Agent: {selectedAgent?.name}
                   </div>
                  <button 
                    onClick={disconnectChat}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors"
                  >
                    End Chat
                  </button>
                </div>
              </div>

              {/* Messages - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium">No messages yet</p>
                      <p className="text-sm">Waiting for messages...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'agent' ? 'justify-end' : ''}`}>
                        {message.sender === 'visitor' && (
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {visitor.metadata?.name?.split(' ').map((n: string) => n[0]).join('') || 'V'}
                          </div>
                        )}
                        
                        <div className={`max-w-[70%] ${message.sender === 'agent' ? 'order-first' : ''}`}>
                          <div className={`p-3 rounded-lg ${
                            message.sender === 'visitor' 
                              ? 'bg-white border border-gray-200' 
                              : message.sender === 'system'
                              ? 'bg-gray-100 border border-gray-200 text-gray-700'
                              : 'bg-blue-600 text-white'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          </div>
                          <div className={`flex items-center gap-2 mt-1 text-xs ${
                            message.sender === 'visitor' ? 'text-gray-500' : message.sender === 'system' ? 'text-gray-600' : 'text-blue-600'
                          }`}>
                            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                            {message.sender === 'agent' && message.status && (
                              <span className="text-xs">
                                {message.status === 'sent' && '✓'}
                                {message.status === 'delivered' && '✓✓'}
                                {message.status === 'read' && '✓✓'}
                              </span>
                            )}
                          </div>
                        </div>

                        {message.sender === 'agent' && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {selectedAgent?.name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input - Sticky at bottom */}
              <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <textarea
                    placeholder="Type your message as the agent..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <button 
                    onClick={sendChatMessage}
                    disabled={!chatMessage.trim() || !isConnected}
                    className="self-end px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isConnecting ? 'Connecting...' : isConnected ? 'Send' : 'Disconnected'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Visitor Info */}
        <div className="w-96 flex flex-col bg-gray-50 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Visitor Details */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Visitor Details
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Add name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Add email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Add phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Edit2 className="w-5 h-5" />
                  Notes
                </h3>
              </div>
              <div className="p-4">
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add visitor notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Tags</h3>
              </div>
              <div className="p-4">
                <input 
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Add tags (comma separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            

            {/* Visitor Stats */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Visitor Information</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="text-lg font-bold text-gray-900">{visitor.agent_id ? 'Assigned' : 'Unassigned'}</div>
                    <div className="text-xs text-gray-600">Status</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                                         <div className="text-lg font-bold text-gray-900">{visitor.agent_name || 'Unassigned'}</div>
                    <div className="text-xs text-gray-600">Agent</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div><span className="font-medium">Country:</span> {visitor.metadata?.country || 'Unknown'}</div>
                <div><span className="font-medium">Region:</span> {visitor.metadata?.region || 'Unknown'}</div>
                <div><span className="font-medium">City:</span> {visitor.metadata?.city || 'Unknown'}</div>
                <div><span className="font-medium">IP:</span> {visitor.metadata?.ip_address || 'Unknown'}</div>
                <div><span className="font-medium">Timezone:</span> {visitor.metadata?.timezone || 'Unknown'}</div>
              </div>
            </div>

            {/* Device Info */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Device Info
                </h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div><span className="font-medium">Browser:</span> {visitor.metadata?.browser || 'Unknown'}</div>
                <div><span className="font-medium">OS:</span> {visitor.metadata?.os || 'Unknown'}</div>
                <div><span className="font-medium">Device:</span> {visitor.metadata?.device_type || 'Unknown'}</div>
                <div><span className="font-medium">User Agent:</span> <span className="text-xs break-all">{visitor.metadata?.user_agent || 'Unknown'}</span></div>
              </div>
            </div>

            {/* Session Details */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Session Details
                </h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div><span className="font-medium">Started:</span> {visitor.started_at ? new Date(visitor.started_at).toLocaleString() : 'Unknown'}</div>
                <div><span className="font-medium">Status:</span> {visitor.status}</div>
                <div><span className="font-medium">Session ID:</span> <span className="text-xs break-all">{visitor.session_id || 'Unknown'}</span></div>
                <div><span className="font-medium">Referrer:</span> <span className="text-xs break-all">{visitor.metadata?.referrer || 'Direct'}</span></div>
                <div><span className="font-medium">Page URL:</span> <span className="text-xs break-all">{visitor.metadata?.page_url || 'Unknown'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorDetailsPopup;