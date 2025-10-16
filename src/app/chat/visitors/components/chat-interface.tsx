"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Smile, ThumbsUp, Paperclip, MessageCircle, FileText, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useGlobalChat } from '@/contexts/global-chat-context';
import { useAuth } from '@/contexts/auth-context';
import { Visitor } from '../../types';
import api from '@/lib/axios';

interface ChatHistoryRecord {
  chat_session_id: string;
  agent_info?: {
    name: string;
    email: string;
    role: string;
  };
  agent_id?: string;
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
  }>;
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

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!visitor.session_id || !visitor.visitor_id) return;

    const fileKey = `${file.name}-${Date.now()}`;
    setUploadingFiles(prev => new Set(prev).add(fileKey));

    try {
      // 1. Get presigned URL
      const presignResponse = await api.post(
        `/chat/${visitor.session_id}/visitor/${visitor.visitor_id}/attachments/presign`,
        {
          file_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          size: file.size
        }
      );

      if (!presignResponse.data.success) {
        throw new Error('Failed to get upload URL');
      }

      const { upload_url, headers, s3_key, public_url } = presignResponse.data;

      // 2. Upload to S3 using presigned URL
      if (upload_url) {
        // Start with Content-Type from file, then merge backend headers (as in fe_flow_test.py)
        const uploadHeaders: Record<string, string> = {
          'Content-Type': file.type || 'application/octet-stream'
        };
        
        // Merge additional headers from backend response
        if (headers) {
          Object.assign(uploadHeaders, headers);
        }

        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: uploadHeaders
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload file to S3: ${uploadResponse.status}`);
        }
      } else if (public_url) {
        // Public bucket mode
        const uploadResponse = await fetch(public_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream'
          }
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to public bucket');
        }
      }

      // 3. Commit attachment
      await api.post(
        `/chat/${visitor.session_id}/visitor/${visitor.visitor_id}/attachments/upload`,
        {
          file_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          size: file.size,
          s3_key: s3_key,
          caption: '',
          sender_type: 'client_agent',
          sender_id: currentAgent?.id
        }
      );

      // Remove from pending files
      setPendingFiles(prev => prev.filter(f => f !== file));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload ${file.name}`);
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };

  // Upload all pending files
  const handleUploadAllFiles = async () => {
    if (pendingFiles.length === 0) return;
    
    for (const file of pendingFiles) {
      await handleFileUpload(file);
    }
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
                  chatMessages[index - 1].sender !== 'system' && // Exclude system messages
                  new Date(message.timestamp).getTime() - new Date(chatMessages[index - 1].timestamp).getTime() < 30000;
              
                // Check if this is a system message
                const isSystemMessage = message.sender === 'system';
                const visitorDisplayName = (visitor.first_name && visitor.first_name.trim())
                  ? visitor.first_name
                  : `#${visitor.visitor_id.substring(0, 8)}`;
                
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
                              {message.sender === 'agent' ? (currentAgent?.name || 'Agent') : visitorDisplayName}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                        )}
                        { (message as any).type === 'attachment' && (message as any).attachment_name ? (
                          <div className="text-xs max-w-48 break-words flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-gray-600" />
                            <a
                              href={(message as any).attachment_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                              title={(message as any).attachment_name}
                            >
                              {(message as any).attachment_name}
                            </a>
                          </div>
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
            {visitor.isDisconnected ? (
              /* Disconnected state - show message */
              <div className="relative h-full w-full">
                <div className="absolute inset-0 flex items-center justify-center p-2 bg-gray-100">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      Visitor is disconnected
                    </div>
                    <div className="text-xs text-gray-500">
                      The visitor has left the chat session
                    </div>
                  </div>
                </div>
              </div>
            ) : !hasStartedTyping && chatMessages.length === 0 ? (
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
          {/* Pending attachments chips */}
          {pendingFiles.length > 0 && (
            <div className="absolute left-3 bottom-2 flex items-center gap-2 flex-wrap max-w-[70%]">
              {pendingFiles.map((file, idx) => {
                const fileKey = `${file.name}-${Date.now()}`;
                const isUploading = uploadingFiles.has(fileKey);
                
                return (
                  <div key={idx} className="flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-sm text-[10px] text-blue-700">
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span className="truncate max-w-32" title={file.name}>{file.name}</span>
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingFiles(pendingFiles.filter((_, i) => i !== idx))}
                        className="hover:text-blue-900"
                        aria-label="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

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
            <label className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 cursor-pointer">
              <Paperclip className="h-4 w-4" />
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
                          <span className="text-gray-500">—</span>
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
                      <span className="text-gray-900 text-xs">—</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-600 text-xs w-24">Comment:</span>
                      <span className="text-gray-900 text-xs">—</span>
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
                                {!isConsecutiveFromSameSender && (
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs font-medium ${
                                      message.sender_type === 'client_agent' ? 'text-gray-900' : 'text-blue-600'
                                    }`}>
                              {message.sender_type === 'client_agent' 
                                ? (selectedPastChat.agent_info?.name || 'Agent') 
                                : (visitor.first_name?.trim() ? visitor.first_name : `#${visitor.visitor_id.substring(0, 8)}`)}
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
            Past chats ({visitor.visitor_chat_count || 0})
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'current' ? renderCurrentChat() : renderPastChats()}
    </div>
  );
};

export default ChatInterface;