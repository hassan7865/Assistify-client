"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Smile, ThumbsUp, Paperclip, MessageCircle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useGlobalChat } from '@/contexts/global-chat-context';
import { Visitor } from '../../types';

interface ChatInterfaceProps {
  visitor: Visitor;
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenMessagesRef = useRef<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { 
    chatMessages, 
    isConnected, 
    isConnecting, 
    isTyping, 
    isLoadingHistory,
    currentAgent, 
    canSend,
    hasStartedTyping,
    setHasStartedTyping,
    sendChatMessage,
    sendSystemMessage,
    sendTypingIndicator,
    sendMessageSeen,
    selectedVisitor
  } = useGlobalChat();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Focus textarea when user starts typing
  useEffect(() => {
    if (hasStartedTyping && textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor position to the end of the text
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [hasStartedTyping]);

  const handleSendMessage = async () => {
    if (!canSend) return;
    if (chatMessage.trim()) {
      // Check if this is the first message from the agent
      const hasAgentMessages = chatMessages.some(msg => msg.sender === 'agent');
      
      if (!hasAgentMessages) {
        const joinedMessage = `${currentAgent?.name || 'Agent'} has joined the chat`;
        sendSystemMessage(joinedMessage);
      
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
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
    
    // Mark that user has started typing
    if (!hasStartedTyping) {
      setHasStartedTyping(true);
    }
    
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

  // Emoji picker functions
  const handleEmojiClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const currentPosition = textareaRef.current?.selectionStart || 0;
    const newMessage = chatMessage.slice(0, currentPosition) + emoji + chatMessage.slice(currentPosition);
    setChatMessage(newMessage);
    
    // Focus back to textarea and set cursor position after emoji
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(currentPosition + emoji.length, currentPosition + emoji.length);
      }
    }, 0);
    
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Mark visitor messages as seen when they're displayed
  useEffect(() => {
    if (isConnected && chatMessages.length > 0) {
      // Send message_seen for visitor messages that are delivered but not read
      const unseenVisitorMessages = chatMessages
        .filter(msg => 
          msg.sender === 'visitor' && 
          msg.seen_status === 'delivered' && 
          !seenMessagesRef.current.has(msg.id)
        );
      
      // Send seen notification for each delivered message
      unseenVisitorMessages.forEach(msg => {
        seenMessagesRef.current.add(msg.id);
        sendMessageSeen(msg.id);
      });
    }
  }, [chatMessages, isConnected, sendMessageSeen]);

  return (
    <div className="flex flex-col h-full min-h-0 gap-2 p-2">
      
      {/* Chat Tabs */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="flex w-fit bg-transparent h-auto p-0 gap-0">
          <button className="text-xs font-bold px-2 py-1 bg-white text-gray-800 border-t border-b border-l border-r border-blue-300 rounded-none">
            Current chat
          </button>
          <button className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-800 border-l border-gray-300 rounded-none">
            Past chats (5)
          </button>
        </div>
      </div>
      
      {/* Chat Messages Area */}
      <div className="bg-white shadow-sm flex-[3] min-h-0 overflow-hidden flex flex-col mt-2">
        
        {/* Messages Container */}
        <div className="flex-1 bg-gray-50 relative min-h-0">
          <div 
            className={`h-full p-4 space-y-2 ${
              chatMessages.length > 0 || isLoadingHistory || isConnecting || (!isConnected && !isConnecting) || isTyping 
                ? 'overflow-y-auto custom-scrollbar' 
                : 'overflow-hidden'
            }`}
          >
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <span className="text-xs">Loading chat history...</span>
                </div>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                {/* Empty state - no content to avoid unnecessary scrollbars */}
              </div>
            ) : (
              chatMessages.map((message, index) => {
                const isConsecutiveFromSameSender = index > 0 && 
                  chatMessages[index - 1].sender === message.sender &&
                  chatMessages[index - 1].sender !== 'system' && // Exclude system messages
                  new Date(message.timestamp).getTime() - new Date(chatMessages[index - 1].timestamp).getTime() < 30000;
              
                // Check if this is a system message
                const isSystemMessage = message.sender === 'system';
                
                return (
                  <div key={message.id} className="flex flex-col">
                    {/* Add separator line for non-consecutive messages */}
                    {!isConsecutiveFromSameSender && index > 0 && !isSystemMessage && (
                      <div className="border-b border-gray-400 border-dashed my-2"></div>
                    )}
                    
                    {isSystemMessage ? (
                      // Special styling for agent joined message
                      <div className="flex justify-center items-center">
                        <div className="text-xs text-gray-500 italic">
                          {message.message}
                        </div>
                        <div className="text-xs text-gray-400 ml-2">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    ) : (
                      <>
                        {!isConsecutiveFromSameSender && (
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                              message.sender === 'agent' ? 'text-gray-900' : 'text-blue-600'
                            }`}>
                              {message.sender === 'agent' ? (currentAgent?.name || 'Agent') : 'Visitor'}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                        )}
                        <div className={`text-xs whitespace-pre-wrap max-w-48 break-words ${
                          message.sender === 'agent' ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {message.message}
                        </div>
                      </>
                    )}
                    {message.sender === 'agent' && !isSystemMessage && (
                      <div className="flex justify-end">
                        {message.seen_status == 'read' ? (
                          // Double checkmarks for read messages
                          <div className="flex">
                            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <svg className="w-3 h-3 text-blue-500 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : message.seen_status == 'delivered' ? (
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
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area or Agent Info Card */}
      {canSend ? (
    <div className="bg-white shadow-sm border border-gray-200 focus-within:border-blue-800 focus-within:border flex-[2] min-h-[120px]">
    <div className="relative h-full">
      {!hasStartedTyping && chatMessages.length === 0 ? (
        /* Initial state - show centered message with hidden textarea */
        <div className="relative h-full w-full">
          {/* Hidden textarea to capture typing */}
          <textarea
            value={chatMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            onBlur={handleBlur}
            placeholder=""
            className="absolute inset-0 text-sm border-none outline-none resize-none p-3 h-full w-full opacity-0"
            disabled={!isConnected}
          />
          {/* Centered message overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-2">
            <span 
              style={{ 
                fontWeight: 100,
                color: 'black',
                fontSize: '16px',
                lineHeight: 'normal',
                padding: '10px',
                textAlign: 'center'
              }}
            >
              You're viewing this chat
              Start typing to join the chat.
            </span>
          </div>
        </div>
      ) : (
        /* Typing state - show textarea with action buttons */
        <>
          <textarea
            ref={textareaRef}
            value={chatMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            onBlur={handleBlur}
            placeholder=""
            className="text-sm border-none outline-none resize-none p-3 w-full h-full"
            disabled={!isConnected}
          />
          {/* Action Buttons - positioned at bottom right */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <button 
              onClick={handleEmojiClick}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Smile className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
              <Paperclip className="h-4 w-4" />
            </button>
          </div>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div 
              ref={emojiPickerRef}
              className="absolute bottom-12 right-2 z-50"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                width={300}
                height={400}
                searchDisabled={false}
                skinTonesDisabled={false}
                previewConfig={{
                  showPreview: true,
                  defaultEmoji: '1f60a'
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  </div>
      ) : (
        <div className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-xs italic text-gray-500">
                Agent {visitor.agent_name} has joined the conversation
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;