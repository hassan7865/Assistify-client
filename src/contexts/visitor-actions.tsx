"use client";

import React, { createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import { useGlobalChat } from '@/contexts/global-chat-context';

interface VisitorActionsContextType {
  takeVisitor: (visitorId: string) => void;
  setTakeVisitorHandler: (handler: (visitorId: string) => void) => void;
}

const VisitorActionsContext = createContext<VisitorActionsContextType | undefined>(undefined);

export const useVisitorActions = () => {
  const context = useContext(VisitorActionsContext);
  if (!context) {
    throw new Error('useVisitorActions must be used within a VisitorActionsProvider');
  }
  return context;
};

interface VisitorActionsProviderProps {
  children: ReactNode;
}

export const VisitorActionsProvider: React.FC<VisitorActionsProviderProps> = ({ children }) => {
  // Use useRef to store the handler to avoid recreating functions
  const takeVisitorHandlerRef = useRef<((visitorId: string) => void) | null>(null);
  const { openChat, setMinimizedChats } = useGlobalChat();

  // Global takeVisitor function that works from any page
  const globalTakeVisitor = useCallback(async (visitorId: string) => {
    try {
      // Get current user info from localStorage or make an API call
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      // Get current user info to get agent_id and client_id
      const userResponse = await api.get('/auth/me');
      const user = userResponse.data;
      
      if (!user || !user.user_id) {
        return;
      }

      // Make the API call to take the visitor
      const response = await api.post('/chat/take-visitor', {
        agent_id: user.user_id,
        visitor_id: visitorId,
      });

      if (response.data.success) {
        // Create visitor object for UI updates
        const visitor = {
          visitor_id: visitorId,
          agent_id: user.user_id,
          agent_name: user.name || user.email,
          status: "active",
          started_at: new Date().toISOString(),
          session_id: response.data.session_id || undefined, // Only set if exists
          metadata: response.data.metadata || {}
        };
        
        // Add to minimized chats
        setMinimizedChats(prev => {
          const exists = prev.some(chat => chat.visitor_id === visitorId);
          if (!exists) {
            return [...prev, visitor];
          }
          return prev;
        });
        
        // Open the chat dialog
        openChat(visitor);
      } else {
      }
    } catch (error: any) {
    }
  }, [openChat, setMinimizedChats]);

  const takeVisitor = useCallback((visitorId: string) => {
    // First try the page-specific handler if available
    if (takeVisitorHandlerRef.current) {
      takeVisitorHandlerRef.current(visitorId);
    } else {
      // Fallback to global handler
      globalTakeVisitor(visitorId);
    }
  }, [globalTakeVisitor]);

  const setTakeVisitorHandler = useCallback((handler: (visitorId: string) => void) => {
    takeVisitorHandlerRef.current = handler;
  }, []);

  const contextValue = React.useMemo(() => ({
    takeVisitor,
    setTakeVisitorHandler
  }), [takeVisitor, setTakeVisitorHandler]);

  return (
    <VisitorActionsContext.Provider value={contextValue}>
      {children}
    </VisitorActionsContext.Provider>
  );
};