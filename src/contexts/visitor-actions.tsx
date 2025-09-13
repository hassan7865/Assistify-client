"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react';
import { useGlobalNotifications } from './global-notifications';
import api from '@/lib/axios';

interface VisitorActionsContextType {
  takeVisitor: (visitorId: string) => void;
  setTakeVisitorHandler: (handler: (visitorId: string) => void) => void;
  showSuccessNotification: (visitorId: string, visitorName?: string) => void;
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

// Comprehensive notification deduplication manager
class GlobalNotificationDeduplicator {
  private operationTracker = new Map<string, {
    type: string;
    timestamp: number;
    visitorId: string;
    operation: string;
  }>();
  
  private messageHashTracker = new Map<string, {
    timestamp: number;
    count: number;
  }>();
  
  private visitorOperationStates = new Map<string, {
    state: 'idle' | 'in_progress' | 'completed';
    operation: string;
    timestamp: number;
  }>();

  private readonly OPERATION_COOLDOWN = 30000; // 30 seconds
  private readonly MESSAGE_DEDUP_WINDOW = 15000; // 15 seconds
  private readonly MAX_DUPLICATE_MESSAGES = 2;

  private createOperationKey(visitorId: string, operation: string, type: string): string {
    return `${operation}_${visitorId}_${type}`;
  }

  private createMessageHash(type: string, visitorId: string, message: string): string {
    // Create unique hash for the exact same notification
    const cleanMessage = message.replace(/\s+/g, '').toLowerCase();
    return `${type}_${visitorId}_${cleanMessage}`;
  }

  shouldAllowNotification(
    type: string,
    visitorId: string,
    message: string,
    operation?: string
  ): { allowed: boolean; reason?: string } {
    const currentTime = Date.now();
    
    // 1. Check operation-based deduplication
    if (operation) {
      const operationKey = this.createOperationKey(visitorId, operation, type);
      const existingOperation = this.operationTracker.get(operationKey);
      
      if (existingOperation && currentTime - existingOperation.timestamp < this.OPERATION_COOLDOWN) {
        console.log(`Blocked duplicate ${type} notification for operation: ${operation} on visitor: ${visitorId}`);
        return { allowed: false, reason: 'operation_cooldown' };
      }
    }

    // 2. Check visitor operation state
    const visitorState = this.visitorOperationStates.get(visitorId);
    if (operation && visitorState && visitorState.operation === operation) {
      if (visitorState.state === 'in_progress' && type === 'success') {
        // Allow success if operation was in progress
        this.visitorOperationStates.set(visitorId, {
          ...visitorState,
          state: 'completed',
          timestamp: currentTime
        });
      } else if (visitorState.state === 'completed' && 
                 currentTime - visitorState.timestamp < this.OPERATION_COOLDOWN) {
        console.log(`Blocked duplicate ${type} notification - operation already completed for visitor: ${visitorId}`);
        return { allowed: false, reason: 'operation_already_completed' };
      }
    }

    // 3. Check message hash deduplication
    const messageHash = this.createMessageHash(type, visitorId, message);
    const existingMessage = this.messageHashTracker.get(messageHash);
    
    if (existingMessage && currentTime - existingMessage.timestamp < this.MESSAGE_DEDUP_WINDOW) {
      existingMessage.count++;
      existingMessage.timestamp = currentTime;
      
      if (existingMessage.count > this.MAX_DUPLICATE_MESSAGES) {
        console.log(`Blocked duplicate ${type} notification - too many identical messages for visitor: ${visitorId}`);
        return { allowed: false, reason: 'too_many_duplicates' };
      }
    } else {
      this.messageHashTracker.set(messageHash, {
        timestamp: currentTime,
        count: 1
      });
    }

    // 4. Track this notification if allowed
    if (operation) {
      const operationKey = this.createOperationKey(visitorId, operation, type);
      this.operationTracker.set(operationKey, {
        type,
        timestamp: currentTime,
        visitorId,
        operation
      });

      // Update visitor operation state
      if (type === 'success' || type === 'error') {
        this.visitorOperationStates.set(visitorId, {
          state: 'completed',
          operation,
          timestamp: currentTime
        });
      } else {
        this.visitorOperationStates.set(visitorId, {
          state: 'in_progress',
          operation,
          timestamp: currentTime
        });
      }
    }

    return { allowed: true };
  }

  markOperationInProgress(visitorId: string, operation: string): void {
    this.visitorOperationStates.set(visitorId, {
      state: 'in_progress',
      operation,
      timestamp: Date.now()
    });
  }

  cleanupExpired(): void {
    const currentTime = Date.now();
    
    // Cleanup expired operations
    this.operationTracker.forEach((value, key) => {
      if (currentTime - value.timestamp > this.OPERATION_COOLDOWN * 2) {
        this.operationTracker.delete(key);
      }
    });

    // Cleanup expired messages
    this.messageHashTracker.forEach((value, key) => {
      if (currentTime - value.timestamp > this.MESSAGE_DEDUP_WINDOW * 2) {
        this.messageHashTracker.delete(key);
      }
    });

    // Cleanup expired visitor states
    this.visitorOperationStates.forEach((value, key) => {
      if (currentTime - value.timestamp > this.OPERATION_COOLDOWN * 2) {
        this.visitorOperationStates.delete(key);
      }
    });
  }

  clear(): void {
    this.operationTracker.clear();
    this.messageHashTracker.clear();
    this.visitorOperationStates.clear();
  }

  getStats() {
    return {
      operations: this.operationTracker.size,
      messages: this.messageHashTracker.size,
      visitorStates: this.visitorOperationStates.size
    };
  }
}

export const VisitorActionsProvider: React.FC<VisitorActionsProviderProps> = ({ children }) => {
  // Use useRef to store the handler to avoid recreating functions
  const takeVisitorHandlerRef = useRef<((visitorId: string) => void) | null>(null);
  const [isTakingVisitor, setIsTakingVisitor] = useState(false);
  const deduplicator = useRef(new GlobalNotificationDeduplicator());
  const { addNotification } = useGlobalNotifications();
  


  // Cleanup interval
  React.useEffect(() => {
    const interval = setInterval(() => {
      deduplicator.current.cleanupExpired();
    }, 30000); // Cleanup every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Global takeVisitor function that works from any page
  const globalTakeVisitor = useCallback(async (visitorId: string) => {
    // Prevent duplicate calls
    if (isTakingVisitor) {
      console.log('Already taking a visitor, skipping duplicate call');
      return;
    }

    // Mark operation as in progress
    deduplicator.current.markOperationInProgress(visitorId, 'take_visitor');
    setIsTakingVisitor(true);
    
    try {
      console.log(`Global takeVisitor called for visitor: ${visitorId}`);
      
      // Get current user info from localStorage or make an API call
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        
        if (deduplicator.current.shouldAllowNotification('error', visitorId, 'Authentication required to take visitor', 'take_visitor_auth').allowed) {
          addNotification({
            type: "error",
            message: "Authentication required to take visitor",
            visitor_id: visitorId,
            visitor_status: "error"
          });
        }
        return;
      }

      console.log('Getting user info...');
      // Get current user info to get agent_id and client_id
      const userResponse = await api.get('/auth/me');
      const user = userResponse.data;
      
      console.log('User info received:', user);
      
      if (!user || !user.user_id) {
        console.error('Failed to get user info');
        
        if (deduplicator.current.shouldAllowNotification('error', visitorId, 'Failed to get user information', 'take_visitor_user').allowed) {
          addNotification({
            type: "error",
            message: "Failed to get user information",
            visitor_id: visitorId,
            visitor_status: "error"
          });
        }
        return;
      }

      console.log(`Making API call to take visitor ${visitorId} with agent ${user.user_id}`);
      
      // Make the API call to take the visitor
      const response = await api.post('/chat/take-visitor', {
        agent_id: user.user_id,
        visitor_id: visitorId,
      });

      console.log('Take visitor response:', response.data);

      if (response.data.success) {
        // Show success notification with deduplication
        const displayName = `Visitor ${visitorId.substring(0, 8)}`;
        showSuccessNotification(visitorId, displayName);
        
        console.log(`Successfully took visitor ${visitorId} from global context`);
      } else {
        console.error('Failed to take visitor:', response.data.message);
        
        if (deduplicator.current.shouldAllowNotification('error', visitorId, response.data.message || 'Failed to assign visitor', 'take_visitor_failed').allowed) {
          addNotification({
            type: "error",
            message: `Failed to assign visitor: ${response.data.message}`,
            visitor_id: visitorId,
            visitor_status: "error"
          });
        }
      }
    } catch (error: any) {
      console.error('Error taking visitor from global context:', error);
      console.error('Error details:', error.response?.data);
      
      const errorMessage = `Failed to assign visitor: ${error.response?.data?.detail || 'Network error'}`;
      if (deduplicator.current.shouldAllowNotification('error', visitorId, errorMessage, 'take_visitor_network').allowed) {
        addNotification({
          type: "error",
          message: errorMessage,
          visitor_id: visitorId,
          visitor_status: "error"
        });
      }
    } finally {
      setIsTakingVisitor(false);
    }
  }, [addNotification, isTakingVisitor]);

  const takeVisitor = useCallback((visitorId: string) => {
    console.log('VisitorActions: takeVisitor called with visitorId:', visitorId);
    console.log('VisitorActions: takeVisitorHandler available:', !!takeVisitorHandlerRef.current);
    
    // First try the page-specific handler if available
    if (takeVisitorHandlerRef.current) {
      console.log('VisitorActions: Using page-specific handler');
      takeVisitorHandlerRef.current(visitorId);
      // Don't call global handler when page-specific handler is available
      return;
    }
    
    // Only use global handler if no page-specific handler is set
    console.log('VisitorActions: No page-specific handler, using global handler');
    globalTakeVisitor(visitorId);
  }, [globalTakeVisitor]);

  const setTakeVisitorHandler = useCallback((handler: (visitorId: string) => void) => {
    takeVisitorHandlerRef.current = handler;
  }, []);

  const showSuccessNotification = useCallback((visitorId: string, visitorName?: string) => {
    const displayName = visitorName || visitorId;
    const message = `Successfully assigned visitor ${displayName}`;
    
    // Check deduplication before adding notification
    const checkResult = deduplicator.current.shouldAllowNotification('success', visitorId, message, 'take_visitor');
    
    if (!checkResult.allowed) {
      console.log(`Skipping duplicate success notification for visitor: ${visitorId} - Reason: ${checkResult.reason}`);
      return;
    }

    console.log(`Adding success notification for visitor: ${visitorId}`);
    addNotification({
      type: "success",
      message,
      visitor_id: visitorId,
      visitor_name: visitorName,
      visitor_status: "assigned"
    });
  }, [addNotification]);

  const contextValue = React.useMemo(() => ({
    takeVisitor,
    setTakeVisitorHandler,
    showSuccessNotification
  }), [takeVisitor, setTakeVisitorHandler, showSuccessNotification]);

  return (
    <VisitorActionsContext.Provider value={contextValue}>
      {children}
    </VisitorActionsContext.Provider>
  );
};