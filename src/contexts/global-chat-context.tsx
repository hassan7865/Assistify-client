"use client";

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  ReactNode, 
  useRef, 
  useEffect,
  useMemo,
  useReducer
} from 'react';
import { globalEventEmitter, EVENTS } from '@/lib/event-emitter';
import { API_BASE_URL } from '@/lib/axios';
import api from '@/lib/axios';
import { ChatStorage, StoredMinimizedChat } from '@/lib/storage';
import { playVisitorMessageSound } from '@/lib/sound-utils';

// Types
interface Visitor {
  visitor_id: string;
  status: string;
  agent_id?: string;
  agent_name?: string;
  started_at?: string;
  session_id?: string;
  message_count?: number;
  hasUnreadMessages?: boolean;
  unread_count?: number;
  isDisconnected?: boolean; // Visitor left the site (offline)
  hasLeft?: boolean; // Visitor ended the chat (can still continue)
  visitor_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    contact?: string;
    past_visit?: number;
    chat_count?: number;
    ip_address?: string;
    client_id?: string;
  };
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
  seen_status?: 'delivered' | 'read';
  sender_name?: string | null;
  // Extended fields for attachments
  type?: 'text' | 'attachment' | 'system';
  attachment?: {
    s3_key: string;
    file_name: string;
    mime_type: string;
    size: number;
    url: string;
  };
}

interface VisitorChatState {
  chatMessages: ChatMessage[];
  pastChatHistory: any[];
  isConnected: boolean;
  isConnecting: boolean;
  isTyping: boolean;
  isLoadingHistory: boolean;
  wsConnection: WebSocket | null;
  connectionTimeout: NodeJS.Timeout | null;
  lastActivity: number;
}

interface GlobalChatContextType {
  // Chat Dialog State
  selectedVisitor: Visitor | null;
  isChatOpen: boolean;
  showEndChatDialog: boolean;
  isSwitchingVisitor: boolean;
  canSend: boolean;
  hasStartedTyping: boolean;
  
  // Minimized Chats State
  minimizedChats: Visitor[];
  
  // WebSocket State (for current selected visitor)
  isConnected: boolean; // Actual WebSocket connection status
  hasActiveConnection: boolean; // True if WebSocket is actually connected
  isConnecting: boolean;
  chatMessages: ChatMessage[];
  pastChatHistory: any[];
  isTyping: boolean;
  isLoadingHistory: boolean;
  isEndingChat: boolean;
  
  // Chat Dialog Actions
  openChat: (visitor: Visitor) => void;
  closeChat: () => void;
  minimizeChat: () => void;
  maximizeChat: (visitorId: string) => void;
  closeMinimizedChat: (visitorId: string) => void;
  removeVisitorChatState: (visitorId: string) => void;
  updateMinimizedChatUnread: (visitorId: string, hasUnreadMessages: boolean, unread_count?: number) => void;
  updateVisitorName: (visitorId: string, firstName: string) => void;
  continueChat: () => void;
  
  // End Chat Dialog Actions
  setShowEndChatDialog: (show: boolean) => void;
  setHasStartedTyping: (hasStarted: boolean) => void;
  handleEndChat: () => void;
  
  // Chat Message Actions
  sendChatMessage: (message: string) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
  sendMessageSeen: (messageId: string) => void;
  sendRatingRequest: () => void;
  
  // Current Agent Info
  currentAgent: { id: string; name: string } | null;
  setCurrentAgent: (agent: { id: string; name: string } | null) => void;
}

// State Management with useReducer
type ChatAction = 
  | { type: 'SET_SELECTED_VISITOR'; payload: Visitor | null }
  | { type: 'SET_CHAT_OPEN'; payload: boolean }
  | { type: 'SET_END_CHAT_DIALOG'; payload: boolean }
  | { type: 'SET_SWITCHING_VISITOR'; payload: boolean }
  | { type: 'SET_ENDING_CHAT'; payload: boolean }
  | { type: 'SET_HAS_STARTED_TYPING'; payload: boolean }
  | { type: 'SET_MINIMIZED_CHATS'; payload: Visitor[] }
  | { type: 'ADD_MINIMIZED_CHAT'; payload: Visitor }
  | { type: 'REMOVE_MINIMIZED_CHAT'; payload: string }
  | { type: 'UPDATE_MINIMIZED_CHAT_UNREAD'; payload: { visitorId: string; hasUnreadMessages: boolean; unread_count?: number } }
  | { type: 'UPDATE_VISITOR_NAME'; payload: { visitorId: string; firstName: string } }
  | { type: 'UPDATE_VISITOR_DETAILS'; payload: { ipAddress: string; visitorDetails: any } }
  | { type: 'UPDATE_VISITOR_CHAT_STATE'; payload: { visitorId: string; updates: Partial<VisitorChatState> } }
  | { type: 'REMOVE_VISITOR_CHAT_STATE'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { visitorId: string; message: ChatMessage } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { visitorId: string; messageId: string; status: 'read' } }
  | { type: 'SET_TYPING'; payload: { visitorId: string; isTyping: boolean } };

interface ChatState {
  selectedVisitor: Visitor | null;
  isChatOpen: boolean;
  showEndChatDialog: boolean;
  isSwitchingVisitor: boolean;
  isEndingChat: boolean;
  hasStartedTyping: boolean;
  minimizedChats: Visitor[];
  visitorChatStates: Map<string, VisitorChatState>;
}

const initialState: ChatState = {
  selectedVisitor: null,
  isChatOpen: false,
  showEndChatDialog: false,
  isSwitchingVisitor: false,
  isEndingChat: false,
  hasStartedTyping: false,
  minimizedChats: [],
  visitorChatStates: new Map(),
};

const createDefaultChatState = (): VisitorChatState => ({
  chatMessages: [],
  pastChatHistory: [],
  isConnected: false,
  isConnecting: false,
  isTyping: false,
  isLoadingHistory: false,
  wsConnection: null,
  connectionTimeout: null,
  lastActivity: Date.now(),
});

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_SELECTED_VISITOR':
      return { ...state, selectedVisitor: action.payload };
    
    case 'SET_CHAT_OPEN':
      return { ...state, isChatOpen: action.payload };
    
    case 'SET_END_CHAT_DIALOG':
      return { ...state, showEndChatDialog: action.payload };
    
    case 'SET_SWITCHING_VISITOR':
      return { ...state, isSwitchingVisitor: action.payload };
    
    case 'SET_ENDING_CHAT':
      return { ...state, isEndingChat: action.payload };
    
    case 'SET_HAS_STARTED_TYPING':
      return { ...state, hasStartedTyping: action.payload };
    
    case 'SET_MINIMIZED_CHATS':
      return { ...state, minimizedChats: action.payload };
    
    case 'ADD_MINIMIZED_CHAT':
      return {
        ...state,
        minimizedChats: state.minimizedChats.some(chat => chat.visitor_id === action.payload.visitor_id)
          ? state.minimizedChats
          : [...state.minimizedChats, { ...action.payload, hasUnreadMessages: false } as Visitor]
      };
    
    case 'REMOVE_MINIMIZED_CHAT':
      return {
        ...state,
        minimizedChats: state.minimizedChats.filter(chat => chat.visitor_id !== action.payload)
      };
    
    case 'UPDATE_MINIMIZED_CHAT_UNREAD':
      return {
        ...state,
        minimizedChats: state.minimizedChats.map(chat => {
          if (chat.visitor_id === action.payload.visitorId) {
            // If we're setting to true, only do it if the chat is minimized and not currently selected
            if (action.payload.hasUnreadMessages) {
              const isMinimized = state.minimizedChats.some(c => c.visitor_id === action.payload.visitorId);
              const isCurrentlySelected = state.selectedVisitor?.visitor_id === action.payload.visitorId;
              
              if (isMinimized && !isCurrentlySelected) {
                return { 
                  ...chat, 
                  hasUnreadMessages: true,
                  unread_count: action.payload.unread_count !== undefined ? action.payload.unread_count : (chat.unread_count || 0) + 1
                } as Visitor;
              }
              return chat;
            } else {
              // If we're setting to false, keep the count but clear hasUnreadMessages flag
              return { ...chat, hasUnreadMessages: false } as Visitor;
            }
          }
          return chat;
        })
      };
    
    case 'UPDATE_VISITOR_NAME':
      return {
        ...state,
        selectedVisitor: state.selectedVisitor?.visitor_id === action.payload.visitorId
          ? { 
              ...state.selectedVisitor, 
              visitor_details: {
                ...state.selectedVisitor.visitor_details,
                first_name: action.payload.firstName
              }
            }
          : state.selectedVisitor,
        minimizedChats: state.minimizedChats.map(chat =>
          chat.visitor_id === action.payload.visitorId
            ? { 
                ...chat, 
                visitor_details: {
                  ...chat.visitor_details,
                  first_name: action.payload.firstName
                }
              }
            : chat
        )
      };
    
    case 'UPDATE_VISITOR_DETAILS':
      return {
        ...state,
        selectedVisitor: state.selectedVisitor?.visitor_details?.ip_address === action.payload.ipAddress ||
                         state.selectedVisitor?.metadata?.ip_address === action.payload.ipAddress
          ? { 
              ...state.selectedVisitor, 
              visitor_details: action.payload.visitorDetails
            }
          : state.selectedVisitor,
        minimizedChats: state.minimizedChats.map(chat =>
          chat.visitor_details?.ip_address === action.payload.ipAddress ||
          chat.metadata?.ip_address === action.payload.ipAddress
            ? { 
                ...chat, 
                visitor_details: action.payload.visitorDetails
              }
            : chat
        )
      };
    
    case 'UPDATE_VISITOR_CHAT_STATE': {
      const newMap = new Map(state.visitorChatStates);
      const currentState = newMap.get(action.payload.visitorId) || createDefaultChatState();
      newMap.set(action.payload.visitorId, { ...currentState, ...action.payload.updates });
      return { ...state, visitorChatStates: newMap };
    }
    
    case 'REMOVE_VISITOR_CHAT_STATE': {
      const newMap = new Map(state.visitorChatStates);
      const chatState = newMap.get(action.payload);
      
      // Clean up WebSocket and timeout
      if (chatState?.wsConnection) {
        chatState.wsConnection.close(1000, 'Chat state removed');
      }
      if (chatState?.connectionTimeout) {
        clearTimeout(chatState.connectionTimeout);
      }
      
      newMap.delete(action.payload);
      return { ...state, visitorChatStates: newMap };
    }
    
    case 'ADD_MESSAGE': {
      const newMap = new Map(state.visitorChatStates);
      const currentState = newMap.get(action.payload.visitorId) || createDefaultChatState();
      const updatedMessages = [...currentState.chatMessages, action.payload.message];
      newMap.set(action.payload.visitorId, { 
        ...currentState, 
        chatMessages: updatedMessages,
        lastActivity: Date.now()
      });
      
      // Update message_count in minimized chats if this is a visitor message
      const updatedMinimizedChats = state.minimizedChats.map(chat => {
        if (chat.visitor_id === action.payload.visitorId && action.payload.message.sender === 'visitor') {
          return {
            ...chat,
            message_count: (chat.message_count || 0) + 1
          };
        }
        return chat;
      });
      
      return { 
        ...state, 
        visitorChatStates: newMap,
        minimizedChats: updatedMinimizedChats
      };
    }
    
    case 'UPDATE_MESSAGE_STATUS': {
      const newMap = new Map(state.visitorChatStates);
      const currentState = newMap.get(action.payload.visitorId);
      if (currentState) {
        const updatedMessages = currentState.chatMessages.map(msg => 
          msg.id === action.payload.messageId 
            ? { ...msg, seen_status: action.payload.status }
            : msg
        );
        newMap.set(action.payload.visitorId, { ...currentState, chatMessages: updatedMessages });
      }
      return { ...state, visitorChatStates: newMap };
    }
    
    case 'SET_TYPING': {
      const newMap = new Map(state.visitorChatStates);
      const currentState = newMap.get(action.payload.visitorId) || createDefaultChatState();
      newMap.set(action.payload.visitorId, { ...currentState, isTyping: action.payload.isTyping });
      return { ...state, visitorChatStates: newMap };
    }
    
    default:
      return state;
  }
}

const GlobalChatContext = createContext<GlobalChatContextType | undefined>(undefined);

export const useGlobalChat = () => {
  const context = useContext(GlobalChatContext);
  if (!context) {
    throw new Error('useGlobalChat must be used within a GlobalChatProvider');
  }
  return context;
};

// WebSocket Connection Manager Class
class WebSocketManager {
  private connections = new Map<string, WebSocket>();
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>();
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;

  connect(
    visitorId: string, 
    sessionId: string, 
    agentId: string, 
    onMessage: (data: any) => void,
    onOpen: () => void,
    onClose: () => void,
    onError: (error: Event) => void
  ): WebSocket | null {
    // Close existing connection if any
    this.disconnect(visitorId);

    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/chat/${sessionId}/agent/${agentId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      this.connections.set(visitorId, ws);

      ws.onopen = onOpen;
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      ws.onerror = onError;
      ws.onclose = (event) => {
        this.connections.delete(visitorId);
        onClose();
        
        // Auto-reconnect logic for unexpected closes
        if (event.code !== 1000 && event.code !== 1001) {
          this.scheduleReconnect(visitorId, sessionId, agentId, onMessage, onOpen, onClose, onError);
        }
      };

      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      onError(error as Event);
      return null;
    }
  }

  disconnect(visitorId: string): void {
    const ws = this.connections.get(visitorId);
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.close(1000, 'Disconnect requested');
    }
    this.connections.delete(visitorId);

    // Clear reconnect timeout
    const timeout = this.reconnectTimeouts.get(visitorId);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(visitorId);
    }
  }

  send(visitorId: string, message: any): boolean {
    const ws = this.connections.get(visitorId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  private scheduleReconnect(
    visitorId: string, 
    sessionId: string, 
    agentId: string,
    onMessage: (data: any) => void,
    onOpen: () => void,
    onClose: () => void,
    onError: (error: Event) => void
  ): void {
    const timeout = setTimeout(() => {
      this.connect(visitorId, sessionId, agentId, onMessage, onOpen, onClose, onError);
    }, this.reconnectDelay);
    
    this.reconnectTimeouts.set(visitorId, timeout);
  }

  disconnectAll(): void {
    for (const [visitorId] of this.connections) {
      this.disconnect(visitorId);
    }
  }

  getConnection(visitorId: string): WebSocket | undefined {
    return this.connections.get(visitorId);
  }
}

export const GlobalChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [currentAgent, setCurrentAgent] = useState<{ id: string; name: string } | null>(null);
  
  // Use refs to avoid stale closures
  const currentAgentRef = useRef(currentAgent);
  const stateRef = useRef(state);
  
  // WebSocket manager instance
  const wsManagerRef = useRef(new WebSocketManager());
  
  // Load minimized chats from localStorage on mount
  useEffect(() => {
    if (ChatStorage.isAvailable()) {
      const storedChats = ChatStorage.loadMinimizedChats();
      if (storedChats.length > 0) {
        
        const visitors: Visitor[] = storedChats.map(storedChat => ({
          visitor_id: storedChat.visitor_id,
          status: storedChat.status,
          agent_id: storedChat.agent_id,
          agent_name: storedChat.agent_name,
          session_id: storedChat.session_id,
          started_at: storedChat.started_at,
          message_count: storedChat.message_count,
          isDisconnected: storedChat.isDisconnected,
          visitor_details: storedChat.visitor_details,
          metadata: storedChat.metadata,
          hasUnreadMessages: storedChat.hasUnreadMessages,
          unread_count: storedChat.unread_count
        } as Visitor));
        
        dispatch({ type: 'SET_MINIMIZED_CHATS', payload: visitors });
      }
      
      // Clean up old data
      ChatStorage.cleanup();
    }
  }, []);
  
  // Update refs when state changes
  useEffect(() => {
    currentAgentRef.current = currentAgent;
  }, [currentAgent]);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist minimized chats to localStorage whenever they change
  useEffect(() => {
    if (ChatStorage.isAvailable() && state.minimizedChats.length >= 0) {
      // Convert Visitor format to StoredMinimizedChat format
      const storedChats: StoredMinimizedChat[] = state.minimizedChats.map(visitor => ({
        visitor_id: visitor.visitor_id,
        visitor_name: visitor.metadata?.name,
        agent_name: visitor.agent_name,
        status: visitor.status,
        session_id: visitor.session_id,
        agent_id: visitor.agent_id,
        started_at: visitor.started_at,
        message_count: visitor.message_count,
        visitor_details: visitor.visitor_details,
        isDisconnected: visitor.isDisconnected,
        hasUnreadMessages: visitor.hasUnreadMessages,
        unread_count: visitor.unread_count,
        metadata: visitor.metadata,
        timestamp: new Date().toISOString()
      }));
      
      ChatStorage.saveMinimizedChats(storedChats);
    }
  }, [state.minimizedChats]);

  // API call manager with abort controllers
  const activeRequestsRef = useRef(new Map<string, AbortController>());

  // Helper function to get current visitor chat state
  const getCurrentChatState = useCallback((): VisitorChatState => {
    if (!state.selectedVisitor) {
      return createDefaultChatState();
    }
    return state.visitorChatStates.get(state.selectedVisitor.visitor_id) || createDefaultChatState();
  }, [state.selectedVisitor, state.visitorChatStates]);

  // Update visitor last message helper
  const updateVisitorLastMessage = useCallback((
    visitorId: string, 
    lastMessage: { content: string; sender_type: string; timestamp: string }
  ) => {
    globalEventEmitter.emit(EVENTS.UPDATE_VISITOR_LAST_MESSAGE, { visitorId, lastMessage });
  }, []);

  // Fetch chat history with abort controller
  const fetchChatHistory = useCallback(async (sessionId: string, visitor: Visitor) => {
    // Cancel any existing request for this visitor
    const existingController = activeRequestsRef.current.get(visitor.visitor_id);
    if (existingController) {
      existingController.abort();
    }

    const controller = new AbortController();
    activeRequestsRef.current.set(visitor.visitor_id, controller);

    try {
      dispatch({
        type: 'UPDATE_VISITOR_CHAT_STATE',
        payload: {
          visitorId: visitor.visitor_id,
          updates: { isLoadingHistory: true, chatMessages: [] }
        }
      });

      const response = await api.get(`/chat/conversation/${sessionId}`, {
        signal: controller.signal
      });

      if (response.data?.data?.messages) {
        const formattedMessages: ChatMessage[] = response.data.data.messages.map((msg: any) => ({
          id: msg.message_id || `${Date.now()}-${Math.random()}`,
          sender: msg.sender_type === 'visitor' ? 'visitor' : 
                 (msg.sender_type === 'agent' || msg.sender_type === 'client_agent') ? 'agent' : 'system',
          sender_id: msg.sender_id,
          message: msg.message,
          timestamp: msg.timestamp || new Date().toISOString(),
          seen_status: msg.seen_status || 'delivered',
          type: msg.attachment ? 'attachment' : 'text',
          attachment: msg.attachment, // Include the full attachment object
          attachment_name: msg.attachment?.file_name,
          attachment_url: msg.attachment?.s3_url
        }));
        
        // Also fetch past history for the same visitor (by IP address)
        let pastHistory: any[] = [];
        if (visitor.metadata?.ip_address && currentAgent?.id) {
          try {
            const historyResponse = await api.get(`/chat/history/${currentAgent.id}`, {
              params: {
                page: 1,
                page_size: 100,
                ip_address: visitor.metadata.ip_address
              },
              signal: controller.signal
            });

            if (historyResponse.data?.success && historyResponse.data?.data) {
              pastHistory = historyResponse.data.data.conversations || [];
            }
          } catch (historyError) {
            console.warn('Failed to fetch past history in fetchChatHistory:', historyError);
          }
        }
        
        dispatch({
          type: 'UPDATE_VISITOR_CHAT_STATE',
          payload: {
            visitorId: visitor.visitor_id,
            updates: { 
              chatMessages: formattedMessages, 
              pastChatHistory: pastHistory,
              isLoadingHistory: false 
            }
          }
        });

        // Update last message
        if (formattedMessages.length > 0) {
          const lastMessage = formattedMessages[formattedMessages.length - 1];
          updateVisitorLastMessage(visitor.visitor_id, {
            content: lastMessage.message.length > 100 
              ? lastMessage.message.substring(0, 100) + "..." 
              : lastMessage.message,
            sender_type: lastMessage.sender,
            timestamp: lastMessage.timestamp
          });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      
      if (error?.response?.status !== 404) {
        console.warn('Failed to fetch chat history:', error);
      }
      
      dispatch({
        type: 'UPDATE_VISITOR_CHAT_STATE',
        payload: {
          visitorId: visitor.visitor_id,
          updates: { isLoadingHistory: false }
        }
      });
    } finally {
      activeRequestsRef.current.delete(visitor.visitor_id);
    }
  }, [updateVisitorLastMessage]);

  // WebSocket event handlers
  const createWebSocketHandlers = useCallback((visitor: Visitor) => {
    const onMessage = (data: any) => {
      if (data.type === 'chat_message' || data.type === 'message') {
        const isAttachment = data.type === 'message' && data.attachment;
        const newMessage: ChatMessage = {
          id: data.message_id || `${Date.now()}-${Math.random()}`,
          sender: data.sender_type === 'visitor' ? 'visitor' : 
                 (data.sender_type === 'agent' || data.sender_type === 'client_agent') ? 'agent' : 'system',
          sender_id: data.sender_id,
          sender_name: data.sender_name || null,
          message: data.message || data.attachment?.file_name || '',
          timestamp: data.timestamp || new Date().toISOString(),
          seen_status: 'delivered',
          type: isAttachment ? 'attachment' : (data.sender_type === 'system' ? 'system' : 'text'),
          attachment: data.attachment
        };
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { visitorId: visitor.visitor_id, message: newMessage }
        });

        updateVisitorLastMessage(visitor.visitor_id, {
          content: newMessage.message.length > 100 
            ? newMessage.message.substring(0, 100) + "..." 
            : newMessage.message,
          sender_type: newMessage.sender,
          timestamp: newMessage.timestamp
        });

        // Auto-mark visitor messages as seen
        if (data.sender_type === 'visitor') {
          // Play sound for visitor message received
          playVisitorMessageSound();
          
          // Count unread visitor messages
          const chatState = state.visitorChatStates.get(visitor.visitor_id);
          const unreadVisitorMessages = chatState?.chatMessages.filter(msg => 
            msg.sender === 'visitor' && msg.seen_status === 'delivered'
          ) || [];
          const unreadCount = unreadVisitorMessages.length + 1; // +1 for the new message
          
          // Mark minimized chat as having unread messages if it's minimized and not currently selected
          dispatch({
            type: 'UPDATE_MINIMIZED_CHAT_UNREAD',
            payload: { visitorId: visitor.visitor_id, hasUnreadMessages: true, unread_count: unreadCount }
          });
          
          setTimeout(() => {
            sendMessageSeen(newMessage.id);
          }, 100);
        }
      } else if (data.type === 'typing_indicator') {
        dispatch({
          type: 'SET_TYPING',
          payload: {
            visitorId: visitor.visitor_id,
            isTyping: Boolean(data.is_typing && data.sender_type === 'visitor')
          }
        });
      } else if (data.type === 'message_seen') {
        dispatch({
          type: 'UPDATE_MESSAGE_STATUS',
          payload: {
            visitorId: visitor.visitor_id,
            messageId: data.message_id,
            status: 'read'
          }
        });
      } else if (data.type === 'visitor_ended_chat') {
        // Visitor ended the chat - add system message
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          sender: 'system',
          message: data.message || 'Visitor ended the chat.',
          timestamp: data.timestamp || new Date().toISOString(),
          type: 'system'
        };
        
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { visitorId: visitor.visitor_id, message: systemMessage }
        });
      }
    };

    const onOpen = () => {
      dispatch({
        type: 'UPDATE_VISITOR_CHAT_STATE',
        payload: {
          visitorId: visitor.visitor_id,
          updates: { isConnected: true, isConnecting: false }
        }
      });
    };

    const onClose = () => {
      dispatch({
        type: 'UPDATE_VISITOR_CHAT_STATE',
        payload: {
          visitorId: visitor.visitor_id,
          updates: { isConnected: false, isConnecting: false, wsConnection: null }
        }
      });
    };

    const onError = (error: Event) => {
      console.error('WebSocket error:', error);
      dispatch({
        type: 'UPDATE_VISITOR_CHAT_STATE',
        payload: {
          visitorId: visitor.visitor_id,
          updates: { isConnected: false, isConnecting: false, wsConnection: null }
        }
      });
    };

    return { onMessage, onOpen, onClose, onError };
  }, [updateVisitorLastMessage]);

  // Connect WebSocket for visitor
  const connectWebSocket = useCallback(async (visitor: Visitor) => {
    if (!visitor.session_id || !currentAgent?.id) {
      return;
    }

    const chatState = state.visitorChatStates.get(visitor.visitor_id);
    if (chatState?.isConnecting || chatState?.isConnected) {
      return;
    }

    dispatch({
      type: 'UPDATE_VISITOR_CHAT_STATE',
      payload: {
        visitorId: visitor.visitor_id,
        updates: { isConnecting: true }
      }
    });

    // Fetch latest conversation data and past history before connecting WebSocket
    try {
      // Fetch conversation data
      const conversationResponse = await api.get(`/chat/conversation/${visitor.session_id}`);
      if (conversationResponse.data?.success && conversationResponse.data?.data) {
        const conversation = conversationResponse.data.data;
        const messages = conversation.messages || [];
        
        // Convert conversation messages to ChatMessage format
        const chatMessages: ChatMessage[] = messages.map((msg: any) => ({
          id: msg.message_id || `${Date.now()}-${msg.sender_id}`,
          sender: msg.sender_type === 'client_agent' ? 'agent' : 
                  msg.sender_type === 'visitor' ? 'visitor' : 'system',
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          message: msg.message || '',
          timestamp: msg.timestamp,
          seen_status: msg.seen_status || 'delivered',
          type: msg.attachment ? 'attachment' : 'text',
          attachment: msg.attachment, // Include the full attachment object
          attachment_name: msg.attachment?.file_name,
          attachment_url: msg.attachment?.s3_url
        }));

        // Update chat messages with latest conversation data
        dispatch({
          type: 'UPDATE_VISITOR_CHAT_STATE',
          payload: {
            visitorId: visitor.visitor_id,
            updates: { 
              chatMessages: chatMessages,
              lastActivity: Date.now()
            }
          }
        });
      }

      // Fetch past history data for the same visitor (by IP address)
      if (visitor.metadata?.ip_address && currentAgent?.id) {
        try {
          const historyResponse = await api.get(`/chat/history/${currentAgent.id}`, {
            params: {
              page: 1,
              page_size: 100,
              ip_address: visitor.metadata.ip_address
            }
          });

          if (historyResponse.data?.success && historyResponse.data?.data) {
            const historyData = historyResponse.data.data;
            const pastHistory = historyData.conversations || [];
            
            // Update visitor with past history data
            dispatch({
              type: 'UPDATE_VISITOR_CHAT_STATE',
              payload: {
                visitorId: visitor.visitor_id,
                updates: { 
                  pastChatHistory: pastHistory,
                  lastActivity: Date.now()
                }
              }
            });
          }
        } catch (historyError) {
          console.warn('Failed to fetch past history data:', historyError);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch conversation data before WebSocket connection:', error);
    }

    const handlers = createWebSocketHandlers(visitor);
    const ws = wsManagerRef.current.connect(
      visitor.visitor_id,
      visitor.session_id,
      currentAgent.id,
      handlers.onMessage,
      handlers.onOpen,
      handlers.onClose,
      handlers.onError
    );

    if (ws) {
      dispatch({
        type: 'UPDATE_VISITOR_CHAT_STATE',
        payload: {
          visitorId: visitor.visitor_id,
          updates: { wsConnection: ws }
        }
      });
    }
  }, [currentAgent, state.visitorChatStates, createWebSocketHandlers, api]);

  // Chat actions
  const openChat = useCallback(async (visitor: Visitor) => {
    // Prevent opening chat for visitors with closed status
    if (visitor.status === 'closed') {
      return;
    }

    // Handle minimizing current chat if switching visitors
    if (state.selectedVisitor && state.selectedVisitor.visitor_id !== visitor.visitor_id && state.isChatOpen) {
      dispatch({ type: 'ADD_MINIMIZED_CHAT', payload: state.selectedVisitor });
    }

    // Handle switching animation
    if (state.selectedVisitor && state.selectedVisitor.visitor_id !== visitor.visitor_id) {
      dispatch({ type: 'SET_SWITCHING_VISITOR', payload: true });
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Add visitor to minimized chats if it's not already there (multi-agent support)
    const exists = state.minimizedChats.some(chat => chat.visitor_id === visitor.visitor_id);
    if (!exists) {
      dispatch({ type: 'ADD_MINIMIZED_CHAT', payload: visitor });
    }

    dispatch({ type: 'SET_SELECTED_VISITOR', payload: visitor });
    dispatch({ type: 'SET_CHAT_OPEN', payload: true });
    dispatch({ type: 'SET_END_CHAT_DIALOG', payload: false });
    dispatch({ type: 'SET_SWITCHING_VISITOR', payload: false });
    dispatch({ type: 'SET_HAS_STARTED_TYPING', payload: false });

    // Set agent if needed
    if (visitor.agent_id && visitor.agent_name && !currentAgent) {
      setCurrentAgent({ id: visitor.agent_id, name: visitor.agent_name });
    }

    // Fetch history only (WebSocket connects when agent sends first message)
    if (visitor.session_id?.trim()) {
      fetchChatHistory(visitor.session_id, visitor);
    }
  }, [state.selectedVisitor, state.isChatOpen, state.minimizedChats, currentAgent, fetchChatHistory]);

  const closeChat = useCallback(() => {
    if (state.selectedVisitor) {
      wsManagerRef.current.disconnect(state.selectedVisitor.visitor_id);
      
      // If visitor is disconnected, remove from minimized chats
      if (state.selectedVisitor.isDisconnected) {
        dispatch({ type: 'REMOVE_MINIMIZED_CHAT', payload: state.selectedVisitor.visitor_id });
        dispatch({ type: 'REMOVE_VISITOR_CHAT_STATE', payload: state.selectedVisitor.visitor_id });
      }
    }
    
    dispatch({ type: 'SET_CHAT_OPEN', payload: false });
    dispatch({ type: 'SET_SELECTED_VISITOR', payload: null });
    dispatch({ type: 'SET_END_CHAT_DIALOG', payload: false });
  }, [state.selectedVisitor]);

  const minimizeChat = useCallback(() => {
    if (!state.selectedVisitor) return;

    // Get the current chat state to count visitor messages (multi-agent support)
    const chatState = state.visitorChatStates.get(state.selectedVisitor.visitor_id);
    const visitorMessageCount = chatState?.chatMessages.filter(msg => msg.sender === 'visitor').length || 0;
    
    dispatch({ 
      type: 'ADD_MINIMIZED_CHAT', 
      payload: { 
        ...state.selectedVisitor, 
        message_count: visitorMessageCount 
      } 
    });
    
    dispatch({ type: 'SET_CHAT_OPEN', payload: false });
    dispatch({ type: 'SET_SELECTED_VISITOR', payload: null });
    dispatch({ type: 'SET_END_CHAT_DIALOG', payload: false });
  }, [state.selectedVisitor, state.visitorChatStates]);

  const maximizeChat = useCallback((visitorId: string) => {
    const visitor = state.minimizedChats.find(chat => chat.visitor_id === visitorId);
    if (!visitor) return;

    if (state.selectedVisitor && state.selectedVisitor.visitor_id !== visitorId && state.isChatOpen) {
      dispatch({ type: 'ADD_MINIMIZED_CHAT', payload: state.selectedVisitor });
    }

    dispatch({ type: 'SET_SELECTED_VISITOR', payload: visitor });
    dispatch({ type: 'SET_CHAT_OPEN', payload: true });
    dispatch({ type: 'SET_END_CHAT_DIALOG', payload: false });

    // Clear unread messages when maximizing the chat
    updateMinimizedChatUnread(visitorId, false);

    if (visitor.agent_id && visitor.agent_name && !currentAgent) {
      setCurrentAgent({ id: visitor.agent_id, name: visitor.agent_name });
    }

    // Fetch chat history to restore messages after page reload
    if (visitor.session_id?.trim()) {
      fetchChatHistory(visitor.session_id, visitor);
    }
  }, [state.minimizedChats, state.selectedVisitor, state.isChatOpen, currentAgent, fetchChatHistory]);

  const closeMinimizedChat = useCallback((visitorId: string) => {
    const visitor = state.minimizedChats.find(chat => chat.visitor_id === visitorId);
    if (!visitor) return;

    // If visitor is disconnected, just remove from minimized chats without session cleanup
    if (visitor.isDisconnected) {
      dispatch({ type: 'REMOVE_MINIMIZED_CHAT', payload: visitorId });
      dispatch({ type: 'REMOVE_VISITOR_CHAT_STATE', payload: visitorId });
      return;
    }

    // Otherwise, show end chat dialog
    dispatch({ type: 'SET_SELECTED_VISITOR', payload: visitor });
    dispatch({ type: 'SET_CHAT_OPEN', payload: true });
    dispatch({ type: 'SET_END_CHAT_DIALOG', payload: true });
  }, [state.minimizedChats]);

  const removeVisitorChatState = useCallback((visitorId: string) => {
    dispatch({ type: 'REMOVE_VISITOR_CHAT_STATE', payload: visitorId });
    // Also remove from localStorage
    if (ChatStorage.isAvailable()) {
      ChatStorage.removeMinimizedChat(visitorId);
    }
  }, []);

  const updateMinimizedChatUnread = useCallback((visitorId: string, hasUnreadMessages: boolean, unread_count?: number) => {
    dispatch({ type: 'UPDATE_MINIMIZED_CHAT_UNREAD', payload: { visitorId, hasUnreadMessages, unread_count } });
  }, []);

  const updateVisitorName = useCallback((visitorId: string, firstName: string) => {
    dispatch({ type: 'UPDATE_VISITOR_NAME', payload: { visitorId, firstName } });
  }, []);

  const continueChat = useCallback(() => {
    if (!state.selectedVisitor) return;
    
    // Clear the hasLeft flag to allow continuing the chat
    dispatch({ 
      type: 'SET_SELECTED_VISITOR', 
      payload: { ...state.selectedVisitor, hasLeft: false } as Visitor
    });
    
    // Also update in minimized chats
    const updatedMinimizedChats = state.minimizedChats.map(chat =>
      chat.visitor_id === state.selectedVisitor?.visitor_id 
        ? { ...chat, hasLeft: false } 
        : chat
    );
    dispatch({ type: 'SET_MINIMIZED_CHATS', payload: updatedMinimizedChats });
  }, [state.selectedVisitor, state.minimizedChats]);

  const handleEndChat = useCallback(() => {
    if (!state.selectedVisitor || !currentAgent?.id) return;

    // Check if session is already ended to prevent duplicate cleanup
    if (state.selectedVisitor.status === 'closed') {
      // Just close the dialog without emitting events or cleanup
      dispatch({ type: 'SET_END_CHAT_DIALOG', payload: false });
      dispatch({ type: 'SET_CHAT_OPEN', payload: false });
      dispatch({ type: 'SET_SELECTED_VISITOR', payload: null });
      dispatch({ type: 'SET_ENDING_CHAT', payload: false });
      return;
    }

    dispatch({ type: 'SET_ENDING_CHAT', payload: true });

    const success = wsManagerRef.current.send(state.selectedVisitor.visitor_id, {
        type: 'leave_chat',
        timestamp: new Date().toISOString()
    });

    // Immediately close the dialog after sending the socket message
    dispatch({ type: 'SET_END_CHAT_DIALOG', payload: false });
    dispatch({ type: 'SET_CHAT_OPEN', payload: false });
    dispatch({ type: 'SET_SELECTED_VISITOR', payload: null });
    dispatch({ type: 'SET_ENDING_CHAT', payload: false });

    // Clean up visitor data in background
    if (state.selectedVisitor) {
      dispatch({ type: 'REMOVE_VISITOR_CHAT_STATE', payload: state.selectedVisitor.visitor_id });
      dispatch({ type: 'REMOVE_MINIMIZED_CHAT', payload: state.selectedVisitor.visitor_id });
      
      // Emit visitor disconnected event to clean up all contexts
      globalEventEmitter.emit(EVENTS.VISITOR_DISCONNECTED, {
        visitor_id: state.selectedVisitor.visitor_id,
        session_id: state.selectedVisitor.session_id,
        reason: 'agent_ended_chat',
        timestamp: new Date().toISOString()
      });
    }
  }, [state.selectedVisitor, currentAgent]);

  // Message actions
  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim() || !state.selectedVisitor || !currentAgent?.id) return;
    
    // Connect WebSocket if not already connected (lazy connection)
    const chatState = state.visitorChatStates.get(state.selectedVisitor.visitor_id);
    if (!chatState?.isConnected && !chatState?.isConnecting) {
      connectWebSocket(state.selectedVisitor);
      // Wait longer for connection to establish reliably
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Send the message (if not connected yet, it will queue and send when connected)
    const sent = wsManagerRef.current.send(state.selectedVisitor.visitor_id, {
      type: 'chat_message',
      message: message.trim(),
      sender_type: 'client_agent',
      timestamp: new Date().toISOString()
    });
    
    // If send failed, try reconnecting and sending again
    if (!sent) {
      console.log('First send failed, reconnecting...');
      connectWebSocket(state.selectedVisitor);
      await new Promise(resolve => setTimeout(resolve, 1000));
      wsManagerRef.current.send(state.selectedVisitor.visitor_id, {
        type: 'chat_message',
        message: message.trim(),
        sender_type: 'client_agent',
        timestamp: new Date().toISOString()
      });
    }
  }, [state.selectedVisitor, currentAgent, state.visitorChatStates, connectWebSocket]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!state.selectedVisitor || !currentAgent?.id) return;
    
    // Only send typing indicator if already connected
    // Don't connect WebSocket just for typing - wait for actual message
    const chatState = state.visitorChatStates.get(state.selectedVisitor.visitor_id);
    if (!chatState?.isConnected) {
      return; // Don't connect or send typing if not connected yet
    }
    
    wsManagerRef.current.send(state.selectedVisitor.visitor_id, {
      type: 'typing_indicator',
      is_typing: isTyping,
      sender_type: 'client_agent',
      timestamp: new Date().toISOString()
    });
  }, [state.selectedVisitor, currentAgent, state.visitorChatStates]);

  const sendMessageSeen = useCallback((messageId: string) => {
    if (!state.selectedVisitor || !currentAgent?.id) return;
    
    // Only send message_seen if already connected
    const chatState = state.visitorChatStates.get(state.selectedVisitor.visitor_id);
    if (!chatState?.isConnected) {
      return; // Don't send if not connected yet
    }
    
    wsManagerRef.current.send(state.selectedVisitor.visitor_id, {
      type: 'message_seen',
      message_id: messageId,
      sender_type: 'client_agent',
      timestamp: new Date().toISOString()
    });
  }, [state.selectedVisitor, currentAgent, state.visitorChatStates]);

  const sendRatingRequest = useCallback(() => {
    if (!state.selectedVisitor || !currentAgent?.id) return;
    
    // Only send rating request if already connected
    const chatState = state.visitorChatStates.get(state.selectedVisitor.visitor_id);
    if (!chatState?.isConnected) {
      return; // Don't send if not connected yet
    }
    
    wsManagerRef.current.send(state.selectedVisitor.visitor_id, {
      type: 'request_rating',
      sender_type: 'client_agent',
      sender_id: currentAgent.id,
      timestamp: new Date().toISOString()
    });
  }, [state.selectedVisitor, currentAgent, state.visitorChatStates]);

  // Handle close with dialog
  const handleCloseWithDialog = useCallback(() => {
    if (!state.selectedVisitor) return;
    
    // Get current chat state for this visitor
    const chatState = state.visitorChatStates.get(state.selectedVisitor.visitor_id);
    const visitorId = state.selectedVisitor.visitor_id;
    
    // Scenario 1: Not connected → Just close and remove from minimized
    if (!chatState?.isConnected) {
      // Close dialog and remove from minimized chats
      dispatch({ type: 'REMOVE_MINIMIZED_CHAT', payload: visitorId });
      dispatch({ type: 'REMOVE_VISITOR_CHAT_STATE', payload: visitorId });
      closeChat();
      return;
    }
    
    // Scenario 3: Visitor disconnected (offline) → Just close and remove from minimized
    if (state.selectedVisitor.isDisconnected) {
      // Close dialog and remove from minimized chats
      dispatch({ type: 'REMOVE_MINIMIZED_CHAT', payload: visitorId });
      dispatch({ type: 'REMOVE_VISITOR_CHAT_STATE', payload: visitorId });
      closeChat();
      return;
    }
    
    // Visitor has left (ended chat) - don't remove, just minimize
    if (state.selectedVisitor.hasLeft) {
      closeChat();
      return;
    }
    
    // Scenario 2: Connected and visitor active → Show end chat dialog
    dispatch({ type: 'SET_END_CHAT_DIALOG', payload: true });
  }, [state.selectedVisitor, state.visitorChatStates, closeChat]);

  // Don't auto-connect WebSocket - connect only when agent sends first message
  // useEffect(() => {
  //   if (state.selectedVisitor && state.isChatOpen) {
  //     connectWebSocket(state.selectedVisitor);
  //   }
  // }, [state.selectedVisitor?.visitor_id, state.isChatOpen, currentAgent?.id, connectWebSocket]);

  // Event listeners
  useEffect(() => {
    const handleVisitorTaken = (eventData: any) => {
      // Multi-agent support: Don't remove chat when another agent takes it
      // Multiple agents can work on the same visitor simultaneously
    };

    const handleVisitorDisconnected = (eventData: any) => {
      const { visitor_id, reason, ended_by } = eventData;
      
      // Only handle if this is a visitor leaving (not agent ending chat)
      if (reason === 'agent_ended_chat') return;
      
      // Distinguish between two scenarios:
      // 1. ended_by === 'visitor': Visitor clicked "End Chat" button (hasLeft = true, can continue)
      // 2. No ended_by or other: Visitor left the site (isDisconnected = true, offline)
      const hasLeft = ended_by === 'visitor';
      const isDisconnected = !ended_by;
      
      // Mark visitor in selected visitor
      if (state.selectedVisitor?.visitor_id === visitor_id) {
        dispatch({ 
          type: 'SET_SELECTED_VISITOR', 
          payload: { 
            ...state.selectedVisitor, 
            hasLeft: hasLeft,
            isDisconnected: isDisconnected 
          } as Visitor
        });
      }
      
      // Mark visitor in minimized chats
      const updatedMinimizedChats = state.minimizedChats.map(chat =>
        chat.visitor_id === visitor_id 
          ? { ...chat, hasLeft: hasLeft, isDisconnected: isDisconnected } 
          : chat
      );
      dispatch({ type: 'SET_MINIMIZED_CHATS', payload: updatedMinimizedChats });
    };

    globalEventEmitter.on(EVENTS.VISITOR_TAKEN, handleVisitorTaken);
    globalEventEmitter.on(EVENTS.VISITOR_DISCONNECTED, handleVisitorDisconnected);
    
    return () => {
      globalEventEmitter.off(EVENTS.VISITOR_TAKEN, handleVisitorTaken);
      globalEventEmitter.off(EVENTS.VISITOR_DISCONNECTED, handleVisitorDisconnected);
    };
  }, [currentAgent, state.selectedVisitor, state.isChatOpen, state.minimizedChats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all active requests
      activeRequestsRef.current.forEach(controller => {
        controller.abort();
      });
      activeRequestsRef.current.clear();
      
      // Disconnect all WebSocket connections
      wsManagerRef.current.disconnectAll();
    };
  }, []);

  // Listen for visitor details updated event
  useEffect(() => {
    const handleVisitorDetailsUpdated = ({ visitor_details }: { visitor_details: any; source: 'agent' | 'visitor' }) => {
      const ipAddress = visitor_details.ip_address;
      if (ipAddress) {
        dispatch({
          type: 'UPDATE_VISITOR_DETAILS',
          payload: { ipAddress, visitorDetails: visitor_details }
        });
      }
    };

    globalEventEmitter.on(EVENTS.VISITOR_DETAILS_UPDATED, handleVisitorDetailsUpdated);

    return () => {
      globalEventEmitter.off(EVENTS.VISITOR_DETAILS_UPDATED, handleVisitorDetailsUpdated);
    };
  }, []);

  // Periodic cleanup of inactive connections
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const inactivityThreshold = 30 * 60 * 1000; // 30 minutes
      
      state.visitorChatStates.forEach((chatState, visitorId) => {
        if (now - chatState.lastActivity > inactivityThreshold) {
          // Check if this visitor is not currently selected or minimized
          const isSelected = state.selectedVisitor?.visitor_id === visitorId;
          const isMinimized = state.minimizedChats.some(chat => chat.visitor_id === visitorId);
          
          if (!isSelected && !isMinimized) {
            dispatch({ type: 'REMOVE_VISITOR_CHAT_STATE', payload: visitorId });
            wsManagerRef.current.disconnect(visitorId);
          }
        }
      });
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [state.visitorChatStates, state.selectedVisitor, state.minimizedChats]);

  // Get current chat state for context value
  const currentChatState = useMemo(() => getCurrentChatState(), [getCurrentChatState]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: GlobalChatContextType = useMemo(() => ({
    // State
    selectedVisitor: state.selectedVisitor,
    isChatOpen: state.isChatOpen,
    showEndChatDialog: state.showEndChatDialog,
    isSwitchingVisitor: state.isSwitchingVisitor,
    canSend: Boolean(
      state.selectedVisitor && currentAgent?.id
    ), // Multi-agent support: any agent can send messages
    hasStartedTyping: state.hasStartedTyping,
    minimizedChats: state.minimizedChats,
    
    // WebSocket state for current visitor
    isConnected: currentChatState.isConnected, // Actual WebSocket connection status
    hasActiveConnection: currentChatState.isConnected, // Same as isConnected (kept for backwards compatibility)
    isConnecting: currentChatState.isConnecting,
    chatMessages: currentChatState.chatMessages,
    pastChatHistory: currentChatState.pastChatHistory,
    isTyping: currentChatState.isTyping,
    isLoadingHistory: currentChatState.isLoadingHistory,
    isEndingChat: state.isEndingChat,
    
    // Actions
    openChat,
    closeChat: handleCloseWithDialog,
    minimizeChat,
    maximizeChat,
    closeMinimizedChat,
    removeVisitorChatState,
    updateMinimizedChatUnread,
    updateVisitorName,
    continueChat,
    setShowEndChatDialog: (show: boolean) => {
      dispatch({ type: 'SET_END_CHAT_DIALOG', payload: show });
    },
    setHasStartedTyping: (hasStarted: boolean) => {
      dispatch({ type: 'SET_HAS_STARTED_TYPING', payload: hasStarted });
    },
    handleEndChat,
    sendChatMessage,
    sendTypingIndicator,
    sendMessageSeen,
    sendRatingRequest,
    currentAgent,
    setCurrentAgent,
  }), [
    state.selectedVisitor,
    state.isChatOpen,
    state.showEndChatDialog,
    state.isSwitchingVisitor,
    state.minimizedChats,
    state.isEndingChat,
    currentAgent,
    currentChatState,
    openChat,
    handleCloseWithDialog,
    minimizeChat,
    maximizeChat,
    closeMinimizedChat,
    removeVisitorChatState,
    updateMinimizedChatUnread,
    updateVisitorName,
    continueChat,
    handleEndChat,
    sendChatMessage,
    sendTypingIndicator,
    sendMessageSeen,
    sendRatingRequest,
  ]);

  return (
    <GlobalChatContext.Provider value={contextValue}>
      {children}
    </GlobalChatContext.Provider>
  );
};