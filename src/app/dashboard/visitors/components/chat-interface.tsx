"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Smile, ThumbsUp, Paperclip, Lightbulb, Globe, MessageCircle } from 'lucide-react';
import { useGlobalChat } from '@/contexts/global-chat-context';

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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  visitor, 
  selectedAgent,
  onClose,
  onChatEnded
}) => {
  const [chatMessage, setChatMessage] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { 
    chatMessages, 
    isConnected, 
    isConnecting, 
    isTyping, 
    isLoadingHistory,
    currentAgent, 
    canSend,
    sendChatMessage,
    sendTypingIndicator,
    sendMessageSeen
  } = useGlobalChat();

  const handleSendMessage = () => {
    if (!canSend) return;
    if (chatMessage.trim()) {
      sendChatMessage(chatMessage);
      setChatMessage("");
      // Stop typing indicator when message is sent
      sendTypingIndicator(false);
      // Clear any pending typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!canSend) return;
    setChatMessage(e.target.value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    if (e.target.value.trim()) {
      sendTypingIndicator(true);
      
      // Set timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
        typingTimeoutRef.current = null;
      }, 1000);
    } else {
      sendTypingIndicator(false);
    }
  };

  const handleBlur = () => {
    if (!canSend) return;
    // Stop typing indicator when textarea loses focus
    sendTypingIndicator(false);
    // Clear any pending typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Mark visitor messages as seen when they're displayed
  useEffect(() => {
    if (isConnected && chatMessages.length > 0) {
      // Send message_seen for visitor messages that are delivered but not read
      const unseenVisitorMessages = chatMessages
        .filter(msg => msg.sender === 'visitor' && msg.status === 'delivered');
      
      // Send seen notification for each delivered message
      unseenVisitorMessages.forEach(msg => {
        sendMessageSeen(msg.id);
      });
    }
  }, [chatMessages, isConnected, sendMessageSeen]);

  return (
    <div className="flex flex-col h-full min-h-0">
      
      {/* Chat Messages Area */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-2 bg-white"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}
              >
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      <span className="text-xs">Loading chat history...</span>
                    </div>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle className="w-12 h-12 mb-2" />
                    <span className="text-sm">No messages yet</span>
                  </div>
                ) : (
          chatMessages.map((message, index) => {
            const isConsecutiveFromSameSender = index > 0 && 
              chatMessages[index - 1].sender === message.sender &&
              new Date(message.timestamp).getTime() - new Date(chatMessages[index - 1].timestamp).getTime() < 30000;
            
            const isLastMessage = index === chatMessages.length - 1;
            const nextMessage = !isLastMessage ? chatMessages[index + 1] : null;
            const isLastInGroup = isLastMessage || 
              (nextMessage && nextMessage.sender !== message.sender) ||
              (nextMessage && new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime() >= 30000);
            
            return (
              <div key={message.id} className="flex flex-col">
                {!isConsecutiveFromSameSender && (
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${
                      message.sender === 'agent' ? 'text-gray-900' : 'text-blue-600'
                    }`}>
                      {message.sender === 'agent' ? (currentAgent?.name || 'Agent') : 'Visitor'}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                <div className={`text-xs whitespace-pre-wrap max-w-48 break-words ${
                  message.sender === 'agent' ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {message.message}
                </div>
                {message.sender === 'agent' && (
                  <div className="flex justify-end mt-1">
                    {message.status === 'read' ? (
                      // Double checkmarks for read messages
                      <div className="flex">
                        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="w-3 h-3 text-blue-500 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : message.status === 'delivered' ? (
                      // Single checkmark for delivered messages
                      <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      // Empty circle for pending messages
                      <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      </svg>
                    )}
                  </div>
                )}
                {isLastInGroup && (
                  <div className="border-b border-gray-200 border-dashed my-2"></div>
                        )}
                      </div>
            );
          })
        )}
        
        {/* Connection Status */}
        {isConnecting && (
          <div className="text-xs text-gray-500 text-center py-2">
            Connecting...
                      </div>
        )}
        
        {!isConnected && !isConnecting && (
          <div className="text-xs text-gray-500 text-center py-2">
            Disconnected
                </div>
              )}
              
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-center items-center py-2">
            <div className="text-xs text-gray-500">
              Visitor is typing...
            </div>
          </div>
        )}
          </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="relative border border-gray-300 p-4">
                  <textarea
                value={chatMessage}
                    onChange={handleTyping}
            onKeyPress={handleKeyPress}
            onBlur={handleBlur}
            placeholder="Type your message..."
            className="w-full text-sm border-none outline-none resize-none pr-16"
            rows={3}
                    disabled={!isConnected || !canSend}
          />
          
        
            </div>
            
            {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
                  <Smile className="h-4 w-4" />
            <span>Emoji</span>
                </button>
          <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
                  <ThumbsUp className="h-4 w-4" />
            <span>Rating</span>
                </button>
          <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
                  <Paperclip className="h-4 w-4" />
            <span>Attach</span>
                </button>
              </div>
            </div>
    </div>
  );
};

export default ChatInterface;