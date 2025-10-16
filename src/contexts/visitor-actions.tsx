"use client";

import React, { createContext, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
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
  const { openChat } = useGlobalChat();
  
  
  // Cache user data to avoid repeated API calls
  const userCache = useRef<{ user: any; timestamp: number } | null>(null);
  const USER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Cleanup expired user cache
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // Clean up expired user cache
      if (userCache.current && (now - userCache.current.timestamp) > USER_CACHE_DURATION) {
        userCache.current = null;
      }
    }, 30000); // Run every 30 seconds
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // Global takeVisitor function that works from any page
  const globalTakeVisitor = useCallback(async (visitorId: string, visitorData?: any) => {
    try {
      // Get current user info from cache or API
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      let user;
      const now = Date.now();
      
      // Check if we have cached user data
      if (userCache.current && (now - userCache.current.timestamp) < USER_CACHE_DURATION) {
        user = userCache.current.user;
      } else {
        // Fetch user data from API and cache it
        const userResponse = await api.get('/auth/me');
        user = userResponse.data;
        userCache.current = { user, timestamp: now };
      }
      
      if (!user || !user.user_id) {
        return;
      }

      // Make the API call to take the visitor with IP address if available
      const response = await api.post('/chat/take-visitor', {
        agent_id: user.user_id,
        visitor_id: visitorId,
        ip_address: visitorData?.metadata?.ip_address || null,
      });

      if (response.data.success) {
        // Get visitor data from the API response
        const { session_id, metadata, visitor_past_count, visitor_chat_count, first_name, last_name } = response.data;
        
        // Create visitor object with API response data
        const visitor = {
          visitor_id: visitorId,
          agent_id: user.user_id,
          agent_name: user.organization_name || user.name || user.email,
          status: "active",
          started_at: new Date().toISOString(), // Use current time since API doesn't return started_at
          session_id: session_id,
          metadata: metadata || {},
          visitor_past_count: visitor_past_count || 0,
          visitor_chat_count: visitor_chat_count || 0,
          first_name: first_name || null,
          last_name: last_name || null,
        };
        
        // Open the chat dialog (this will handle adding to minimized chats if needed)
        openChat(visitor);
      }
    } catch (error: any) {
      console.error('Failed to take visitor:', error);
    }
  }, [openChat]);


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