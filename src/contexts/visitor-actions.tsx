"use client";

import React, { createContext, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import api from '@/lib/axios';
import { useGlobalChat } from '@/contexts/global-chat-context';
import { globalEventEmitter, EVENTS } from '@/lib/event-emitter';

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
  
  // Store pending visitor assignments to complete them when SSE event arrives
  const pendingAssignments = useRef<Map<string, { user: any; visitorId: string; timestamp: number }>>(new Map());
  
  // Cache user data to avoid repeated API calls
  const userCache = useRef<{ user: any; timestamp: number } | null>(null);
  const USER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Cleanup old pending assignments to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 2 * 60 * 1000; // 2 minutes
      
      for (const [visitorId, assignment] of pendingAssignments.current.entries()) {
        const age = now - assignment.timestamp;
        if (age > maxAge) {
          pendingAssignments.current.delete(visitorId);
        }
      }
      
      // Clean up expired user cache
      if (userCache.current && (now - userCache.current.timestamp) > USER_CACHE_DURATION) {
        userCache.current = null;
      }
    }, 30000); // Run every 30 seconds
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // Global takeVisitor function that works from any page
  const globalTakeVisitor = useCallback(async (visitorId: string) => {
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

      // Store the assignment BEFORE making the API call to avoid race condition
      pendingAssignments.current.set(visitorId, { user, visitorId, timestamp: Date.now() });

      // Make the API call to take the visitor
      const response = await api.post('/chat/take-visitor', {
        agent_id: user.user_id,
        visitor_id: visitorId,
      });

      if (response.data.success) {
        // The actual visitor object creation and chat opening will happen
        // when the VISITOR_TAKEN event is received from SSE
      } else {
        // Remove pending assignment if API call failed
        pendingAssignments.current.delete(visitorId);
      }
    } catch (error: any) {
      // Remove pending assignment if there was an error
      pendingAssignments.current.delete(visitorId);
    }
  }, [openChat, setMinimizedChats]);

  // Listen for VISITOR_TAKEN events to complete pending assignments
  useEffect(() => {
    const handleVisitorTaken = (eventData: any) => {
      const { visitor_id, assigned_agent_id, session_id, metadata } = eventData;
      const pendingAssignment = pendingAssignments.current.get(visitor_id);
      
      if (pendingAssignment && pendingAssignment.user.user_id === assigned_agent_id) {
        // Create visitor object with SSE data
        const visitor = {
          visitor_id: visitor_id,
          agent_id: assigned_agent_id,
          agent_name: pendingAssignment.user.name || pendingAssignment.user.email,
          status: "active",
          started_at: new Date().toISOString(),
          session_id: session_id, // From SSE event
          metadata: metadata || {} // From SSE event
        };
        
        // Add to minimized chats
        setMinimizedChats(prev => {
          const exists = prev.some(chat => chat.visitor_id === visitor_id);
          if (!exists) {
            return [...prev, visitor];
          }
          return prev;
        });
        
        // Open the chat dialog
        openChat(visitor);
        
        // Remove from pending assignments
        pendingAssignments.current.delete(visitor_id);
      }
    };

    globalEventEmitter.on(EVENTS.VISITOR_TAKEN, handleVisitorTaken);
    
    return () => {
      globalEventEmitter.off(EVENTS.VISITOR_TAKEN, handleVisitorTaken);
    };
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