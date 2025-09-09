"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';
import { globalEventEmitter, EVENTS } from '@/lib/event-emitter';

interface ChatInterfaceProps {
  visitor: {
    visitor_id: string;
    session_id?: string;
    metadata?: {
      name?: string;
    };
  };
  selectedAgent?: {
    id: string;
    name: string;
  };
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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  visitor, 
  selectedAgent,
  onClose,
  onChatEnded
}) => {
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  
  const chatWebSocketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visitor.session_id) {
      fetchExistingChatMessages();
      setIsEndingChat(false);
      setChatStarted(false);
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, [visitor.session_id]);

  const fetchExistingChatMessages = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.VISITOR_MESSAGES}/${visitor.visitor_id}`);
      
      if (response.data.success && response.data.messages) {
        const convertedMessages = response.data.messages.map((msg: any) => ({
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
    } catch (error) {
      console.error('Error fetching existing chat messages:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (chatWebSocketRef.current) {
        chatWebSocketRef.current.close(1000, 'Component unmounting');
        chatWebSocketRef.current = null;
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const startChat = useCallback(() => {
    if (!visitor.session_id || !selectedAgent?.id) {
      alert('No session ID available or no agent selected');
      return;
    }

    setChatStarted(true);
    setIsEndingChat(false);
    connectChatWebSocket();
  }, [visitor.session_id, selectedAgent?.id]);

  const connectChatWebSocket = useCallback(() => {
    if (!visitor.session_id || !selectedAgent?.id || isConnecting || chatWebSocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    setIsConnecting(true);
    
    const wsUrl = `${API_ENDPOINTS.WS_BASE}ws/chat/${visitor.session_id}/agent/${selectedAgent.id}`;
    
    try {
      chatWebSocketRef.current = new WebSocket(wsUrl);

      chatWebSocketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      chatWebSocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
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
            console.log('Chat connected');
          } else if (data.type === 'typing_indicator') {
            // Handle typing indicator
          } else if (data.type === 'session_closed') {
            console.log('Session closed by server:', data);
            handleChatEndedBySystem();
          } else if (data.type === 'chat_ended') {
            console.log('Chat ended by server:', data);
            handleChatEndedBySystem();
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      chatWebSocketRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        if (event.code === 1000 && 
            (event.reason === 'Chat ended by system' || 
             event.reason === 'Session closed' ||
             event.reason === 'Visitor disconnected' ||
             event.reason === 'Component unmounting')) {
          handleChatEndedBySystem();
          return;
        }
        
        if (event.code !== 1000 && 
            chatStarted && 
            !isEndingChat) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (chatStarted && !isEndingChat) {
              connectChatWebSocket();
            }
          }, 3000);
        }
      };

      chatWebSocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnecting(false);
    }
  }, [visitor.session_id, selectedAgent?.id, isConnecting, chatStarted, isEndingChat]);

  const endChatSession = useCallback(async () => {
  
    setIsEndingChat(true);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Try to send close_session message via WebSocket first
    if (chatWebSocketRef.current && chatWebSocketRef.current.readyState === WebSocket.OPEN) {
      try {
        const closeMessage = {
          type: 'close_session',
          reason: 'agent_ended_chat',
          timestamp: new Date().toISOString()
        };
        
      
        chatWebSocketRef.current.send(JSON.stringify(closeMessage));
        
        // Add system message indicating session is being closed
        setChatMessages(prev => [...prev, {
          id: `${Date.now()}-session-closing`,
          sender: 'system',
          message: 'Closing chat session...',
          timestamp: new Date().toISOString(),
          status: 'sent'
        }]);
        
        // Wait a bit for the server to process the message
        setTimeout(() => {
          if (chatWebSocketRef.current) {
            chatWebSocketRef.current.close(1000, 'Chat ended by agent');
            chatWebSocketRef.current = null;
          }
          finalizeChatEnd();
        }, 1000);
        
      } catch (error) {
        console.error('Error sending close_session message:', error);
        setChatMessages(prev => [...prev, {
          id: `${Date.now()}-session-error`,
          sender: 'system',
          message: 'Error occurred while closing session',
          timestamp: new Date().toISOString(),
          status: 'sent'
        }]);
        
        // Fallback to API call
        await fallbackEndSession();
      }
    } else {
      console.log('WebSocket not connected, using API fallback');
      // Fallback to API call if WebSocket is not connected
      await fallbackEndSession();
    }
  }, [visitor.visitor_id, visitor.session_id, selectedAgent?.id, onChatEnded]);

  const fallbackEndSession = async () => {
    try {
      // Try to end session via API as fallback
      const response = await api.post(`${API_ENDPOINTS.CLOSE_SESSION}/${visitor.session_id}`, {
        reason: 'agent_ended_chat',
        agent_id: selectedAgent?.id
      });
      
      if (response.data.success) {
        setChatMessages(prev => [...prev, {
          id: `${Date.now()}-session-closed`,
          sender: 'system',
          message: 'Chat session ended via API',
          timestamp: new Date().toISOString(),
          status: 'sent'
        }]);
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      console.error('Error ending session via API:', error);
      setChatMessages(prev => [...prev, {
        id: `${Date.now()}-session-error`,
        sender: 'system',
        message: 'Failed to end session properly',
        timestamp: new Date().toISOString(),
        status: 'sent'
      }]);
    }
    
    finalizeChatEnd();
  };

  const finalizeChatEnd = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setChatStarted(false);
    
    setTimeout(() => {
      setChatMessages([]);
      setIsEndingChat(false);
      
      // Emit global event for session closed by agent
      globalEventEmitter.emit(EVENTS.VISITOR_DISCONNECTED, {
        visitor_id: visitor.visitor_id,
        session_id: visitor.session_id,
        reason: 'agent_ended_chat',
        timestamp: new Date().toISOString()
      });
      
      if (onChatEnded) {
        onChatEnded();
      }
    }, 1500);
  };

  const handleChatEndedBySystem = useCallback(() => {
    setIsEndingChat(true);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (chatWebSocketRef.current) {
      chatWebSocketRef.current.close(1000, 'Chat ended by system');
      chatWebSocketRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setChatStarted(false);
    
    setChatMessages(prev => [...prev, {
      id: `${Date.now()}-system-ended`,
      sender: 'system',
      message: 'Chat session ended by system',
      timestamp: new Date().toISOString(),
      status: 'sent'
    }]);
    
    setTimeout(() => {
      if (onChatEnded) {
        onChatEnded();
      }
    }, 1500);
  }, [onChatEnded]);

  const sendChatMessage = useCallback(() => {
    if (!chatMessage.trim() || !chatWebSocketRef.current || chatWebSocketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'chat_message',
      message: chatMessage.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      console.log('Sending chat message:', message);
      chatWebSocketRef.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
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

  const getConnectionStatus = () => {
    if (isEndingChat) return { text: 'Ending Session...', color: 'bg-orange-500' };
    if (isConnecting) return { text: 'Connecting...', color: 'bg-yellow-500' };
    if (isConnected) return { text: 'Connected', color: 'bg-green-500' };
    if (chatStarted) return { text: 'Disconnected', color: 'bg-red-500' };
    return { text: 'Not Started', color: 'bg-gray-500' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="flex-1 flex flex-col border-r border-gray-200">
      {/* Chat Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600 bg-blue-50">
          Current Chat
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${connectionStatus.color}`}></div>
            <span className="text-xs text-gray-500">{connectionStatus.text}</span>
          </div>
        </div>
      </div>
      
      {/* Chat Content */}
      {!chatStarted ? (
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
          <div className="text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">Start Chat</p>
            <p className="text-sm mb-4">Click below to connect to this visitor's chat session</p>
            <button 
              onClick={startChat}
              className="px-6 py-3 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={!visitor.session_id || !selectedAgent?.id || isEndingChat}
            >
              {visitor.session_id && selectedAgent?.id ? 'Start Chat' : 'No Session or Agent Available'}
            </button>
            {!selectedAgent && (
              <p className="text-xs text-red-500 mt-2">No agent selected. Please select an agent first.</p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Chat Controls */}
          <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Agent: {selectedAgent?.name}
              </div>
              <button 
                onClick={endChatSession}
                disabled={isEndingChat}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEndingChat ? 'Ending Session...' : 'End Chat'}
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
  );
};

export default ChatInterface;