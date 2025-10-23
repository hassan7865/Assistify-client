"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Smile, ThumbsUp, ThumbsDown, Paperclip, MessageCircle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useGlobalChat } from '@/contexts/global-chat-context';
import { useAuth } from '@/contexts/auth-context';
import { Visitor } from '../../types';
import api from '@/lib/axios';
import AttachmentMessage from '@/components/ui/attachment-message';
import UploadingAttachment from '@/components/ui/uploading-attachment';

interface ChatHistoryRecord {
  chat_session_id: string;
  visitor_id?: string;
  agent_info?: {
    name: string;
    email: string;
    role: string;
  };
  agent_id?: string;
  visitor_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    contact?: string;
    past_visits?: number;
    chat_count?: number;
  };
  created_at: string;
  updated_at?: string;
  message_count: number;
  ip_addr?: string;
  last_message?: {
    content: string;
    sender_type: string;
    timestamp: string;
  };
  messages?: Array<{
    sender_type: string;
    sender_id: string;
    message: string;
    timestamp: string;
    sender_name?: string; // Agent name for client_agent messages, visitor name for visitor messages
    type?: 'text' | 'attachment' | 'system';
    attachment?: {
      file_name: string;
      url: string;
      mime_type?: string;
      size?: number;
    };
  }>;
  session_rating?: {
    session_id: string;
    rating: string;
    note?: string;
  };
  satisfaction?: number;
}

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
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [pastChatHistory, setPastChatHistory] = useState<ChatHistoryRecord[]>([]);
  const [selectedPastChat, setSelectedPastChat] = useState<ChatHistoryRecord | null>(null);
  const [loadingPastHistory, setLoadingPastHistory] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenMessagesRef = useRef<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const ratingPopoverRef = useRef<HTMLDivElement>(null);
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
    sendTypingIndicator,
    sendMessageSeen,
    sendRatingRequest,
    selectedVisitor,
    continueChat,
    isEndingChat,
    handleEndChat
  } = useGlobalChat();

  // Auth (top-level hook usage)
  const { user } = useAuth();

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
      // Backend handles "Agent joined" system message when WebSocket connects
      await sendChatMessage(chatMessage);
      setChatMessage("");
      // Stop typing indicator when message is sent
      sendTypingIndicator(false);
      // Clear any pending typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      // Keep hasStartedTyping true so action buttons remain visible
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setChatMessage(value);

    // Show input actions immediately on first keystroke
    if (!hasStartedTyping) {
      setHasStartedTyping(true);
    }

    // Only emit typing indicators when allowed to send
    if (!canSend) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      sendTypingIndicator(true);
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

  // Rating modal handlers
  const handleRatingClick = () => {
    setShowRatingModal(true);
  };

  const handleSendRatingRequest = async () => {
    try {
      // Send rating request via websocket using the global chat context
      sendRatingRequest();
      setShowRatingModal(false);
    } catch (error) {
      console.error('Error sending rating request:', error);
    }
  };

  const handleCancelRating = () => {
    setShowRatingModal(false);
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!visitor.session_id || !visitor.visitor_id || !currentAgent?.id) return;

    const fileKey = `${file.name}-${Date.now()}`;
    setUploadingFiles(prev => new Set(prev).add(fileKey));
    
    // Remove from pending files immediately when upload starts
    setPendingFiles(prev => prev.filter(f => f !== file));

    try {
      // Use direct upload endpoint that bypasses presigned URLs
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', '');

      console.log('Uploading file directly to backend:', { name: file.name, type: file.type, size: file.size });

      const response = await api.post(
        `/attachments/agent/${visitor.session_id}/${currentAgent.id}/direct-upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data.success) {
        throw new Error(`Upload failed: ${JSON.stringify(response.data)}`);
      }

      console.log('Direct upload successful:', response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };


  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (ratingPopoverRef.current && !ratingPopoverRef.current.contains(event.target as Node)) {
        setShowRatingModal(false);
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

  // Fetch past chat history from real API
  const fetchPastChatHistory = async () => {
    if (!user?.client_id) {
      console.error('No client_id available for fetching chat history');
      setLoadingPastHistory(false);
      return;
    }

    setLoadingPastHistory(true);
    
    try {
      const response = await api.get(`/chat/history/${user.client_id}`, {
        params: {
          page: 1,
          page_size: 100, // Get more records at once
          ip_address: visitor.metadata?.ip_address || null
        }
      });

      if (response.data.success && response.data.data) {
        const historyData = response.data.data;
        const history = historyData.conversations || [];
        setPastChatHistory(history);
      } else {
        console.error('Failed to fetch chat history:', response.data);
        setPastChatHistory([]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setPastChatHistory([]);
    } finally {
      setLoadingPastHistory(false);
    }
  };

  const formatTranscriptHeader = (dateString: string) => {
    const date = new Date(dateString);
    const long = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    });
    return `Chat on ${long}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Load past history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && pastChatHistory.length === 0) {
      fetchPastChatHistory();
    }
  }, [activeTab]);

  const renderCurrentChat = () => (
    <div className="flex flex-col h-full min-h-0">
      {/* Current Chat Content */}
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
                  chatMessages[index - 1].sender_id === message.sender_id && // Check actual sender ID for multi-agent
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
                              {message.sender_name || 
                               (message.sender === 'agent' ? 'Agent' : 
                               message.sender === 'visitor' ? (visitor.visitor_details?.first_name || `Visitor #${visitor.visitor_id.substring(0, 8)}`) : '-')}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                        )}
                        { (message as any).type === 'attachment' && (message as any).attachment ? (
                          <AttachmentMessage
                            attachment={(message as any).attachment}
                            senderType={message.sender === 'agent' ? 'agent' : 'visitor'}
                          />
                        ) : (
                          <div className={`text-xs whitespace-pre-wrap max-w-48 break-words ${
                            message.sender === 'agent' ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {message.message}
                          </div>
                        )}
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
            
            {/* Uploading Progress Messages */}
            {Array.from(uploadingFiles).map((fileKey) => {
              // Extract filename from the fileKey (format: "filename-timestamp")
              const fileName = fileKey.split('-').slice(0, -1).join('-');
              const timestamp = new Date().toISOString();
              
              return (
                <div key={fileKey} className="flex flex-col">
                  <UploadingAttachment
                    fileName={fileName}
                    senderName={user?.name || 'Agent'}
                    timestamp={timestamp}
                    senderType="agent"
                    isConsecutive={false}
                  />
                </div>
              );
            })}
            
            {/* Connection Status */}
            {isConnecting && (
              <div className="text-xs text-gray-500 text-center py-2">
                Connecting...
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
    <div className="bg-white shadow-sm border border-gray-200 focus-within:border-blue-800 focus-within:border flex-[2] min-h-[90px]">
    <div className="relative h-full">
            {visitor.isDisconnected ? (
              /* Visitor went offline - show message (no continue option) */
              <div className="relative h-full w-full">
                <div className="absolute inset-0 flex items-center justify-center p-2 bg-gray-100">
                  <div className="text-center">
                    <div 
                      className="mb-1"
                      style={{
                        fontWeight: 100,
                        color: 'black',
                        fontSize: '16px',
                        lineHeight: 'normal',
                      }}
                    >
                      {visitor.visitor_details?.first_name || `Visitor #${visitor.visitor_id.substring(0, 8)}`} has gone offline
                    </div>
                    <div className="text-xs text-gray-500">
                      The visitor has left the site
                    </div>
                  </div>
                </div>
              </div>
            ) : visitor.hasLeft ? (
              /* Visitor ended chat - show message with continue button */
              <div className="relative h-full w-full">
                <div className="absolute inset-0 flex items-center justify-center p-2 bg-gray-50">
                  <div className="text-center">
                    <div 
                      className="flex flex-wrap items-center justify-center gap-2"
                      style={{
                        fontWeight: 100,
                        color: 'black',
                        fontSize: '16px',
                        lineHeight: 'normal',
                      }}
                    >
                      <span>
                        {visitor.visitor_details?.first_name || `Visitor #${visitor.visitor_id.substring(0, 8)}`} has left the chat
                      </span>
                      <button
                        onClick={continueChat}
                        className="text-xs px-2 py-1 bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-sm cursor-pointer"
                      >
                        Continue chat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
        /* Unified input area: overlay hides and actions show as soon as typing starts */
        <div className="relative h-full w-full">
          <textarea
            ref={textareaRef}
            value={chatMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            onBlur={handleBlur}
            placeholder=""
            className={`border-none outline-none resize-none p-3 w-full h-full ${chatMessage.trim().length === 0 ? 'caret-transparent' : ''}`}
            style={{
              fontWeight: 100,
              color: 'black',
              fontSize: '16px',
              lineHeight: 'normal',
            }}
            disabled={visitor.isDisconnected || visitor.hasLeft}
          />
          {/* Initial overlay text - hidden when there's text OR after typing has started */}
          {chatMessage.trim().length === 0 && !hasStartedTyping && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-2">
              <div 
                style={{ 
                  fontWeight: 100,
                  color: 'black',
                  fontSize: '16px',
                  lineHeight: 'normal',
                  padding: '10px',
                  textAlign: 'center'
                }}
              >
                You're viewing this chat<br />
                Start typing to join the chat.
              </div>
            </div>
          )}
          

          {hasStartedTyping && (
          <div className="absolute bottom-2 right-2 flex items-center gap-4">
            <button 
              onClick={handleEmojiClick}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Smile className="h-4 w-4" />
              <span>Emoji</span>
            </button>
             <button 
               onClick={handleRatingClick}
               className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
             >
               <ThumbsUp className="h-4 w-4" />
               <span>Rating</span>
             </button>
            <label className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 cursor-pointer">
              <Paperclip className="h-4 w-4" />
              <span>Attach</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length) {
                    setPendingFiles(prev => [...prev, ...files]);
                    // Auto-upload files when selected
                    files.forEach(file => handleFileUpload(file));
                  }
                  e.currentTarget.value = '';
                }}
              />
            </label>
          </div>
          )}

          {/* Rating popover */}
          {showRatingModal && (
            <div 
              ref={ratingPopoverRef}
              className="absolute bottom-12 right-2 z-50"
            >
              <div className="bg-white shadow-lg rounded-md border border-gray-200 p-3 w-64">
                <div className="text-sm text-gray-800 mb-3">Request a rating from the visitor</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendRatingRequest}
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Send
                  </button>
                  <button
                    onClick={handleCancelRating}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 text-gray-800 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
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
        </div>
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

  const renderPastChats = () => (
    <div className="flex flex-col h-full min-h-0">
      {/* Past Chat Content */}
      <div className="bg-white shadow-sm flex-[3] min-h-0 overflow-hidden flex flex-col mt-2">
        {loadingPastHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              <span className="text-xs">Loading past chat history...</span>
            </div>
          </div>
        ) : pastChatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className='text-xs'>No past chats found</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            {/* Past Chat History Table */}
            <div className={`${selectedPastChat ? 'basis-[30%]' : 'flex-1'} min-h-0 overflow-hidden w-full`}>
              <div className="h-full bg-gray-50 w-full">
                <div className="h-full overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-max">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-30">
                      <tr>
                        <th className="text-left p-2 text-[10px] font-bold text-gray-700 w-32">Agent</th>
                        <th className="text-left p-2 text-[10px] font-bold text-gray-700 w-20">Satisfaction</th>
                        <th className="text-left p-2 text-[10px] font-bold text-gray-700 w-24">Time</th>
                        <th className="text-left p-2 text-[10px] font-bold text-gray-700 w-96">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastChatHistory.map((chat) => (
                        <tr 
                          key={chat.chat_session_id}
                          className={`cursor-pointer hover:bg-gray-100 border-b border-gray-100 ${
                            selectedPastChat?.chat_session_id === chat.chat_session_id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedPastChat(chat)}
                        >
                        <td className="p-2 text-[11px] font-medium">
                          {chat.agent_info?.name || '—'}
                        </td>
                        <td className="p-2 text-[11px]">
                          {chat.session_rating ? (
                            <div className="flex items-center justify-center">
                              {chat.session_rating.rating === 'thumbs_up' ? (
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                              ) : chat.session_rating.rating === 'thumbs_down' ? (
                                <ThumbsDown className="w-4 h-4 text-red-600" />
                              ) : (
                                <span className="text-gray-600 text-xs">{chat.session_rating.rating}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="p-2 text-[11px] text-gray-600">
                          {new Date(chat.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-2 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-[10px]">
                              {chat.message_count}
                            </span>
                            <span className="truncate">
                              {chat.last_message?.content || 'No messages'}
                            </span>
                          </div>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Selected Past Chat Messages - Slides up from bottom */}
            {selectedPastChat && (
              <div className="basis-[70%] min-h-0 bg-white border-t border-gray-200 overflow-y-auto animate-in slide-in-from-bottom duration-300">
                <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {formatTranscriptHeader(selectedPastChat.created_at)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button className="p-1 rounded-full hover:bg-gray-100">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button 
                        className="p-1 rounded-full hover:bg-gray-100"
                        onClick={() => setSelectedPastChat(null)}
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rating/Comment/Tags Section - Copied from history sidebar */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="space-y-3">
                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-600 text-xs w-24">Rating:</span>
                      <span className="text-gray-900 text-xs">
                        {selectedPastChat.session_rating ? (
                          <div className="flex items-center gap-1">
                            {selectedPastChat.session_rating.rating === 'thumbs_up' ? (
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                                <span className="text-green-600 text-sm">Good</span>
                              </div>
                            ) : selectedPastChat.session_rating.rating === 'thumbs_down' ? (
                              <div className="flex items-center gap-1">
                                <ThumbsDown className="w-4 h-4 text-red-600" />
                                <span className="text-red-600 text-sm">Bad</span>
                              </div>
                            ) : (
                              <span className="text-gray-600 text-xs">{selectedPastChat.session_rating.rating}</span>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-600 text-xs w-24">Comment:</span>
                      <span className="text-gray-900 text-xs">
                        {selectedPastChat.session_rating?.note || '—'}
                      </span>
                    </div>

                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-600 text-xs w-24">Tags:</span>
                      <span className="text-gray-900 text-xs">—</span>
                    </div>
                   
      
                  </div>
                </div>

                {/* Chat Messages - Copied from history sidebar transcript */}
                <div className="flex-1 bg-gray-50 relative min-h-0">
                  <div className="h-full p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {/* Real messages from selected past chat */}
                    {selectedPastChat.messages && selectedPastChat.messages.length > 0 ? (
                      selectedPastChat.messages.map((message, index) => {
                        const isConsecutiveFromSameSender = index > 0 && 
                          selectedPastChat.messages![index - 1].sender_type === message.sender_type &&
                          selectedPastChat.messages![index - 1].sender_id === message.sender_id && // Check actual sender ID for multi-agent
                          message.sender_type !== 'system';
                        
                        const isSystemMessage = message.sender_type === 'system';
                        
                        return (
                          <div key={index} className="flex flex-col">
                            {/* Add separator line for non-consecutive messages */}
                            {!isConsecutiveFromSameSender && index > 0 && !isSystemMessage && (
                              <div className="border-b border-gray-400 border-dashed my-2"></div>
                            )}
                            
                            {isSystemMessage ? (
                              // Special styling for system messages - copied from history sidebar
                              <div className="flex justify-center items-center">
                                <div className="text-xs text-gray-500 italic">
                                  {message.message}
                                </div>
                                <div className="text-xs text-gray-400 ml-2">
                                  {formatTime(message.timestamp)}
                                </div>
                              </div>
                            ) : (
                              <>
                                {message.type === 'attachment' && message.attachment ? (
                                  <AttachmentMessage
                                    attachment={message.attachment}
                                    senderType={message.sender_type === 'client_agent' ? 'agent' : 'visitor'}
                                  />
                                ) : (
                                  <>
                                    {!isConsecutiveFromSameSender && (
                                      <div className="flex items-center justify-between">
                                        <span className={`text-xs font-medium ${
                                          message.sender_type === 'client_agent' ? 'text-gray-900' : 'text-blue-600'
                                        }`}>
                                          {message.sender_name || 
                                           (message.sender_type == 'client_agent' ? 
                                             (message.sender_id === selectedPastChat.agent_id ? (selectedPastChat.agent_info?.name || 'Agent') : 'Agent') : 
                                           message.sender_type == 'visitor' ? (selectedPastChat.visitor_details?.first_name || selectedPastChat.visitor_id?.substring(0, 8) || 'Visitor') : '-')}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                          {formatTime(message.timestamp)}
                                        </span>
                                      </div>
                                    )}
                                    <div className={`text-xs whitespace-pre-wrap max-w-48 break-words ${
                                      message.sender_type === 'client_agent' ? 'text-gray-900' : 'text-gray-700'
                                    }`}>
                                      {message.message}
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-sm text-gray-500">No messages found</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
           </div>
         )}
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 gap-2 p-2 w-full max-w-full overflow-hidden min-w-0">
      {/* Chat Tabs */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="flex w-fit bg-transparent h-auto p-0 gap-0">
          <button 
            onClick={() => setActiveTab('current')}
            className={`text-xs font-bold px-2 py-1 border-t border-b border-l border-r rounded-none ${
              activeTab === 'current' 
                ? 'bg-white text-gray-800 border-blue-300' 
                : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
            }`}
          >
            Current chat
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`text-xs font-bold px-2 py-1 border-l border-t border-b border-r rounded-none ${
              activeTab === 'history' 
                ? 'bg-white text-gray-800 border-blue-300' 
                : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
            }`}
          >
            Past chats ({visitor.visitor_details?.chat_count || 0})
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'current' ? renderCurrentChat() : renderPastChats()}
      
      {/* Removed fullscreen rating modal in favor of inline popover above action icons */}
    </div>
  );
};

export default ChatInterface;