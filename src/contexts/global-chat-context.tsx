"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { globalEventEmitter, EVENTS } from '@/lib/event-emitter';
import { API_BASE_URL } from '@/lib/axios';
import api from '@/lib/axios';

interface Visitor {
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
}

interface ChatMessage {
  id: string;
  sender: 'visitor' | 'agent' | 'system';
  sender_id?: string;
  message: string;
  timestamp: string;
  status?: 'read';
}

interface GlobalChatContextType {
  // Chat Dialog State
  selectedVisitor: Visitor | null;
  isChatOpen: boolean;
  showEndChatDialog: boolean;
  isSwitchingVisitor: boolean;
  canSend: boolean;
  
  // Minimized Chats State
  minimizedChats: Visitor[];
  
  // WebSocket State (for current selected visitor)
  isConnected: boolean;
  isConnecting: boolean;
  chatMessages: ChatMessage[];
  isTyping: boolean;
  isLoadingHistory: boolean;
  isEndingChat: boolean;
  
  // Chat Dialog Actions
  openChat: (visitor: Visitor) => void;
  closeChat: () => void;
  minimizeChat: () => void;
  maximizeChat: (visitorId: string) => void;
  closeMinimizedChat: (visitorId: string) => void;
  
  // End Chat Dialog Actions
  setShowEndChatDialog: (show: boolean) => void;
  handleEndChat: () => void;
  
  // Chat Message Actions
  sendChatMessage: (message: string) => void;
  sendTypingIndicator: (isTyping: boolean) => void;
  sendMessageSeen: (messageId: string) => void;
  
  // Current Agent Info
  currentAgent: { id: string; name: string } | null;
  setCurrentAgent: (agent: { id: string; name: string } | null) => void;
}

const GlobalChatContext = createContext<GlobalChatContextType | undefined>(undefined);

export const useGlobalChat = () => {
  const context = useContext(GlobalChatContext);
  if (!context) {
    throw new Error('useGlobalChat must be used within a GlobalChatProvider');
  }
  return context;
};

interface GlobalChatProviderProps {
  children: ReactNode;
}

interface VisitorChatState {
  chatMessages: ChatMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  isTyping: boolean;
  isLoadingHistory: boolean;
  wsConnection: WebSocket | null;
}

export const GlobalChatProvider: React.FC<GlobalChatProviderProps> = ({ children }) => {
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const [minimizedChats, setMinimizedChats] = useState<Visitor[]>([]);
  const [currentAgent, setCurrentAgent] = useState<{ id: string; name: string } | null>(null);
  const [isSwitchingVisitor, setIsSwitchingVisitor] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  
  // Store chat state per visitor
  const [visitorChatStates, setVisitorChatStates] = useState<Map<string, VisitorChatState>>(new Map());
  
  // Get current visitor's chat state
  const getCurrentChatState = useCallback((): VisitorChatState => {
    if (!selectedVisitor) {
            return {
              chatMessages: [],
              isConnected: false,
              isConnecting: false,
              isTyping: false,
              isLoadingHistory: false,
              wsConnection: null
            };
    }
    
    const state = visitorChatStates.get(selectedVisitor.visitor_id);
    if (!state) {
      const defaultState: VisitorChatState = {
        chatMessages: [],
        isConnected: false,
        isConnecting: false,
        isTyping: false,
        isLoadingHistory: false,
        wsConnection: null
      };
      setVisitorChatStates(prev => new Map(prev).set(selectedVisitor.visitor_id, defaultState));
      return defaultState;
    }
    return state;
  }, [selectedVisitor, visitorChatStates]);
  
  // Update current visitor's chat state
  const updateCurrentChatState = useCallback((updates: Partial<VisitorChatState>) => {
    if (!selectedVisitor) return;
    
    setVisitorChatStates(prev => {
      const newMap = new Map(prev);
        const currentState = newMap.get(selectedVisitor.visitor_id) || {
          chatMessages: [],
          isConnected: false,
          isConnecting: false,
          isTyping: false,
          isLoadingHistory: false,
          wsConnection: null
        };
      newMap.set(selectedVisitor.visitor_id, { ...currentState, ...updates });
      return newMap;
    });
  }, [selectedVisitor]);

  const fetchChatHistory = useCallback(async (sessionId: string, visitor: Visitor) => {
    try {
      // Set loading state
      setVisitorChatStates(prev => {
        const newMap = new Map(prev);
        const currentState = newMap.get(visitor.visitor_id) || {
          chatMessages: [],
          isConnected: false,
          isConnecting: false,
          isTyping: false,
          isLoadingHistory: false,
          wsConnection: null
        };
        newMap.set(visitor.visitor_id, { ...currentState, isLoadingHistory: true, chatMessages: [] });
        return newMap;
      });
      
      // Add cache-busting parameter to ensure fresh data
      const response = await api.get(`/chat/conversation/${sessionId}`);
      
      if (response.data && response.data.data && response.data.data.messages) {
        const formattedMessages = response.data.data.messages.map((msg: any) => ({
          id: msg.message_id || `${Date.now()}-${Math.random()}`,
          sender: msg.sender_type === 'visitor' ? 'visitor' : 
                 msg.sender_type === 'agent' ? 'agent' : 'system',
          sender_id: msg.sender_id,
          message: msg.message,
          timestamp: msg.timestamp || new Date().toISOString(),
          status: msg.status || undefined
        }));
        
        // Update the visitor's chat state directly
        setVisitorChatStates(prev => {
          const newMap = new Map(prev);
          const currentState = newMap.get(visitor.visitor_id) || {
            chatMessages: [],
            isConnected: false,
            isConnecting: false,
            isTyping: false,
            isLoadingHistory: false,
            wsConnection: null
          };
          newMap.set(visitor.visitor_id, { ...currentState, chatMessages: formattedMessages, isLoadingHistory: false });
          return newMap;
        });
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      // Clear loading state on error
      setVisitorChatStates(prev => {
        const newMap = new Map(prev);
        const currentState = newMap.get(visitor.visitor_id);
        if (currentState) {
          newMap.set(visitor.visitor_id, { ...currentState, isLoadingHistory: false });
        }
        return newMap;
      });
    }
  }, []);

  const connectChatWebSocket = useCallback(() => {
    if (!selectedVisitor?.session_id || !currentAgent?.id) {
      return;
    }
    
    const currentState = getCurrentChatState();
    if (currentState.isConnecting || currentState.wsConnection?.readyState === WebSocket.OPEN) {
      return;
    }
    
    updateCurrentChatState({ isConnecting: true });
    
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/chat/${selectedVisitor.session_id}/agent/${currentAgent.id}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      updateCurrentChatState({ wsConnection: ws });

      ws.onopen = () => {
        updateCurrentChatState({ isConnected: true, isConnecting: false });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'chat_message') {
            const newMessage: ChatMessage = {
              id: data.message_id || `${Date.now()}-${Math.random()}`,
              sender: data.sender_type === 'visitor' ? 'visitor' : 
                     data.sender_type === 'agent' ? 'agent' : 'system',
              sender_id: data.sender_id,
              message: data.message,
              timestamp: data.timestamp || new Date().toISOString(),
              status: undefined
            };
            
            // Use functional state update to avoid stale closure issues
            setVisitorChatStates(prev => {
              const newMap = new Map(prev);
              const currentState = newMap.get(selectedVisitor!.visitor_id);
              if (currentState) {
                newMap.set(selectedVisitor!.visitor_id, {
                  ...currentState,
                  chatMessages: [...currentState.chatMessages, newMessage]
                });
              }
              return newMap;
            });
          } else if (data.type === 'typing_indicator') {
            setVisitorChatStates(prev => {
              const newMap = new Map(prev);
              const currentState = newMap.get(selectedVisitor!.visitor_id);
              if (currentState) {
                newMap.set(selectedVisitor!.visitor_id, {
                  ...currentState,
                  isTyping: Boolean(data.is_typing && data.sender_type === 'visitor')
                });
              }
              return newMap;
            });
          } else if (data.type === 'message_seen') {
            if (data.sender_type === 'visitor') {
              setVisitorChatStates(prev => {
                const newMap = new Map(prev);
                const currentState = newMap.get(selectedVisitor!.visitor_id);
                if (currentState) {
                  const updatedMessages = currentState.chatMessages.map(msg => 
                    msg.sender === 'agent' && msg.id === data.message_id 
                      ? { ...msg, status: 'read' as const }
                      : msg
                  );
                  newMap.set(selectedVisitor!.visitor_id, {
                    ...currentState,
                    chatMessages: updatedMessages
                  });
                }
                return newMap;
              });
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setVisitorChatStates(prev => {
          const newMap = new Map(prev);
          const currentState = newMap.get(selectedVisitor!.visitor_id);
          if (currentState) {
            newMap.set(selectedVisitor!.visitor_id, {
              ...currentState,
              isConnected: false,
              isConnecting: false,
              wsConnection: null
            });
          }
          return newMap;
        });
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setVisitorChatStates(prev => {
          const newMap = new Map(prev);
          const currentState = newMap.get(selectedVisitor!.visitor_id);
          if (currentState) {
            newMap.set(selectedVisitor!.visitor_id, {
              ...currentState,
              isConnected: false,
              isConnecting: false,
              wsConnection: null
            });
          }
          return newMap;
        });
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setVisitorChatStates(prev => {
        const newMap = new Map(prev);
        const currentState = newMap.get(selectedVisitor!.visitor_id);
        if (currentState) {
          newMap.set(selectedVisitor!.visitor_id, {
            ...currentState,
            isConnecting: false
          });
        }
        return newMap;
      });
    }
  }, [selectedVisitor?.session_id, currentAgent?.id, getCurrentChatState, updateCurrentChatState]);

  const openChat = useCallback(async (visitor: Visitor) => {
    // Show switching animation if we're switching to a different visitor
    if (selectedVisitor && selectedVisitor.visitor_id !== visitor.visitor_id) {
      setIsSwitchingVisitor(true);
      // Small delay to show the switching animation
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    setSelectedVisitor(visitor);
    setIsChatOpen(true);
    setShowEndChatDialog(false);
    setIsSwitchingVisitor(false);
    
    // Remove from minimized chats if it was there
    setMinimizedChats(prev => prev.filter(chat => chat.visitor_id !== visitor.visitor_id));
    // Ensure agent is set if visitor has agent_id
    if (visitor.agent_id && visitor.agent_name && !currentAgent) {
      setCurrentAgent({ id: visitor.agent_id, name: visitor.agent_name });
    }
    // Always fetch fresh chat history if session_id exists
    if (visitor.session_id) {
      await fetchChatHistory(visitor.session_id, visitor);
    }
  }, [currentAgent, fetchChatHistory, selectedVisitor]);

  // Connect WebSocket when visitor and agent are available
  useEffect(() => {
    if (selectedVisitor?.session_id && currentAgent?.id && isChatOpen) {
      const currentState = getCurrentChatState();
      if (!currentState.isConnecting && (!currentState.wsConnection || currentState.wsConnection.readyState !== WebSocket.OPEN)) {
        connectChatWebSocket();
      }
    }
  }, [selectedVisitor?.session_id, currentAgent?.id, isChatOpen, getCurrentChatState, connectChatWebSocket]);

  const closeChat = useCallback(() => {
    // Close WebSocket connection for current visitor
    const currentState = getCurrentChatState();
    if (currentState.wsConnection) {
      currentState.wsConnection.close(1000, 'Component unmounting');
    }
    
    setIsChatOpen(false);
    setSelectedVisitor(null);
    setShowEndChatDialog(false);
  }, [getCurrentChatState]);

  const minimizeChat = useCallback(() => {
    if (selectedVisitor) {
      // Add to minimized chats if not already there
      setMinimizedChats(prev => {
        const exists = prev.some(chat => chat.visitor_id === selectedVisitor.visitor_id);
        if (!exists) {
          return [...prev, selectedVisitor];
        }
        return prev;
      });
      // Close the chat dialog
      setIsChatOpen(false);
      setSelectedVisitor(null);
      setShowEndChatDialog(false);
    }
  }, [selectedVisitor]);

  const maximizeChat = useCallback((visitorId: string) => {
    const visitor = minimizedChats.find(chat => chat.visitor_id === visitorId);
    if (visitor) {
      setSelectedVisitor(visitor);
      setIsChatOpen(true);
      setShowEndChatDialog(false);
      // Ensure agent is set if visitor has agent_id
      if (visitor.agent_id && visitor.agent_name && !currentAgent) {
        setCurrentAgent({ id: visitor.agent_id, name: visitor.agent_name });
      }
      // Remove from minimized chats
      setMinimizedChats(prev => prev.filter(chat => chat.visitor_id !== visitorId));
    }
  }, [minimizedChats, currentAgent]);

  const closeMinimizedChat = useCallback((visitorId: string) => {
    // Find the visitor from minimized chats
    const visitor = minimizedChats.find(chat => chat.visitor_id === visitorId);
    if (visitor) {
      // Open the chat dialog with this visitor
      setSelectedVisitor(visitor);
      setIsChatOpen(true);
      // Show the end chat dialog immediately
      setShowEndChatDialog(true);
      // Remove from minimized chats
      setMinimizedChats(prev => prev.filter(chat => chat.visitor_id !== visitorId));
    }
  }, [minimizedChats]);

  const handleEndChat = useCallback(() => {
    if (!selectedVisitor || !currentAgent?.id) return;
    
    // Set loading state
    setIsEndingChat(true);
    
    // Send WebSocket close_session message directly
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/chat/${selectedVisitor.session_id}/agent/${currentAgent.id}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      const closeMessage = {
        type: 'close_session',
        reason: 'agent_ended_chat',
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(closeMessage));
      ws.close();
      
      // Wait for backend to process the WebSocket message before updating UI
      setTimeout(() => {
        // Remove visitor from local map
        setVisitorChatStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(selectedVisitor.visitor_id);
          return newMap;
        });
        
        // Remove from minimized chats
        setMinimizedChats(prev => prev.filter(chat => chat.visitor_id !== selectedVisitor.visitor_id));
        
        // Emit global event for session closed by agent
        globalEventEmitter.emit(EVENTS.VISITOR_DISCONNECTED, {
          visitor_id: selectedVisitor.visitor_id,
          session_id: selectedVisitor.session_id,
          reason: 'agent_ended_chat',
          timestamp: new Date().toISOString()
        });
        
        setShowEndChatDialog(false);
        setIsChatOpen(false);
        setSelectedVisitor(null);
        setIsEndingChat(false); // Reset loading state
      }, 1000); // 1 second delay to allow backend processing
    };
    
    ws.onerror = () => {
      setIsEndingChat(false); // Reset loading state on error
    };
  }, [selectedVisitor, currentAgent]);

  const sendChatMessage = useCallback((message: string) => {
    if (!message.trim()) return;
    
    // Validate that the logged-in agent can send messages to this visitor
    if (selectedVisitor?.agent_id && currentAgent?.id && selectedVisitor.agent_id !== currentAgent.id) {
      console.warn('Agent is not authorized to send messages to this visitor');
      return;
    }
    
    const currentState = getCurrentChatState();
    if (!currentState.wsConnection || currentState.wsConnection.readyState !== WebSocket.OPEN) return;
    
    const chatMessage = {
      type: 'chat_message',
      message: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    currentState.wsConnection.send(JSON.stringify(chatMessage));
  }, [getCurrentChatState]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    // Validate that the logged-in agent can send typing indicators to this visitor
    if (selectedVisitor?.agent_id && currentAgent?.id && selectedVisitor.agent_id !== currentAgent.id) {
      return;
    }
    
    const currentState = getCurrentChatState();
    if (!currentState.wsConnection || currentState.wsConnection.readyState !== WebSocket.OPEN) return;
    
    const typingMessage = {
      type: 'typing_indicator',
      is_typing: isTyping,
      sender_type: 'agent',
      timestamp: new Date().toISOString()
    };
    
    currentState.wsConnection.send(JSON.stringify(typingMessage));
  }, [getCurrentChatState]);

  const sendMessageSeen = useCallback((messageId: string) => {
    // Validate that the logged-in agent can send message seen status to this visitor
    if (selectedVisitor?.agent_id && currentAgent?.id && selectedVisitor.agent_id !== currentAgent.id) {
      return;
    }
    
    const currentState = getCurrentChatState();
    if (!currentState.wsConnection || currentState.wsConnection.readyState !== WebSocket.OPEN) return;
    
    const seenMessage = {
      type: 'message_seen',
      message_id: messageId,
      sender_type: 'agent',
      timestamp: new Date().toISOString()
    };
    
    currentState.wsConnection.send(JSON.stringify(seenMessage));
  }, [getCurrentChatState]);

  const handleCloseWithDialog = useCallback(() => {
    if (selectedVisitor?.agent_id && selectedVisitor?.status === 'active') {
      setShowEndChatDialog(true);
    } else {
      closeChat();
    }
  }, [selectedVisitor, closeChat]);

  // Get current visitor's chat state for the context value
  const currentChatState = getCurrentChatState();

  const value: GlobalChatContextType = {
    selectedVisitor,
    isChatOpen,
    showEndChatDialog,
    isSwitchingVisitor,
    canSend: Boolean(selectedVisitor?.agent_id && currentAgent?.id && selectedVisitor.agent_id === currentAgent.id),
    minimizedChats,
    isConnected: currentChatState.isConnected,
    isConnecting: currentChatState.isConnecting,
    chatMessages: currentChatState.chatMessages,
    isTyping: currentChatState.isTyping,
    isLoadingHistory: currentChatState.isLoadingHistory,
    isEndingChat,
    openChat,
    closeChat: handleCloseWithDialog,
    minimizeChat,
    maximizeChat,
    closeMinimizedChat,
    setShowEndChatDialog,
    handleEndChat,
    sendChatMessage,
    sendTypingIndicator,
    sendMessageSeen,
    currentAgent,
    setCurrentAgent,
  };

  return (
    <GlobalChatContext.Provider value={value}>
      {children}
    </GlobalChatContext.Provider>
  );
};
