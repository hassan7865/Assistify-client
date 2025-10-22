"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useVisitorRequests } from '@/contexts/visitor-requests';
import { UserRoleEnum } from '@/lib/constants';
import { globalEventEmitter, EVENTS } from '@/lib/event-emitter';
import { FULL_API_BASE_URL } from '@/lib/axios';
import SSEManager from '@/lib/sse-manager';
import { playNewVisitorSound, playPendingVisitorSound, playVisitorMessageSound } from '@/lib/sound-utils';

const VisitorMonitor: React.FC = () => {
  const { user } = useAuth();
  const { addRequest, removeRequest } = useVisitorRequests();
  const sseManager = SSEManager.getInstance();
  
  // Store visitor data from new_visitor events to use later in visitor_assigned events
  const visitorDataCache = useRef<Map<string, any>>(new Map());
  
  // Cleanup old visitor data periodically to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      for (const [visitorId, data] of visitorDataCache.current.entries()) {
        const age = now - (data.timestamp * 1000); // Convert to milliseconds
        if (age > maxAge) {
          visitorDataCache.current.delete(visitorId);
        }
      }
    }, 60000); // Run every minute
    
    return () => clearInterval(cleanupInterval);
  }, []);
  

  // Get current agent from user context (same logic as useVisitors hook)
  const getCurrentAgent = useCallback(() => {
    if (user) {
      return {
        id: user.user_id,
        name: user.organization_name || user.name || user.email,
      };
    }
    return null;
  }, [user]);

  // SSE message handler
  const handleSSEMessage = useCallback((data: any) => {
    
    if (data.type == "new_visitor") {
      const visitorId = data.visitor_id;
      
      // Store visitor data for later use in visitor_assigned events
      visitorDataCache.current.set(visitorId, {
        session_id: data.session_id,
        metadata: data.visitor_metadata,
        visitor_details: data.visitor_details,
        timestamp: data.timestamp,
        client_id: data.client_id
      });
      
      // Play sound for new visitor arrival (UNRESOLVED state)
      playNewVisitorSound();
      
      // Emit global event to notify other components (for visitor list refresh)
      globalEventEmitter.emit(EVENTS.NEW_VISITOR, {
        visitor_id: visitorId,
        metadata: data.metadata,
        visitor_details: data.visitor_details,
        timestamp: new Date().toISOString()
      });
    } else if (data.type == "visitor_pending") {
      const visitorId = data.visitor_id;
      
      // Visitor sent a message and is now PENDING (waiting for agent response)
      // Add visitor request and play notification sound
      addRequest({
        visitor_id: visitorId,
        metadata: data.metadata
      });

      // Refresh visitor lists to move to "Incoming chats"
      globalEventEmitter.emit(EVENTS.NEW_VISITOR, {
        visitor_id: visitorId,
        timestamp: new Date().toISOString()
      });

      // Play sound for pending visitor (status changed to PENDING)
      playPendingVisitorSound();
    } else if (data.type == "visitor_message") {
      const visitorId = data.visitor_id;
      
      // Play sound for visitor message received (even when agent not connected to chat)
      playVisitorMessageSound();
      
      // Emit global event to notify other components
      globalEventEmitter.emit(EVENTS.NEW_VISITOR, {
        visitor_id: visitorId,
        timestamp: new Date().toISOString()
      });
    } else if (data.type == "visitor_assigned") {
      const visitorId = data.visitor_id;
      const assignedAgentId = data.assigned_agent_id;
      const currentAgent = getCurrentAgent();
      
      // Get stored visitor data from new_visitor event
      const storedVisitorData = visitorDataCache.current.get(visitorId);
      
      // Remove visitor request when assigned
      removeRequest(visitorId);
      
      // Emit global event to notify other components (especially useVisitors hook)
      const eventData = {
        visitor_id: visitorId,
        assigned_agent_id: assignedAgentId,
        session_id: data.session_id || storedVisitorData?.session_id, // Prefer session_id from visitor_assigned event, fallback to stored
        metadata: data.visitor_metadata || storedVisitorData?.metadata, // Prefer metadata from visitor_assigned event, fallback to stored
        visitor_details: data.visitor_details || storedVisitorData?.visitor_details, // Include visitor_details
        timestamp: new Date().toISOString()
      };
      
      globalEventEmitter.emit(EVENTS.VISITOR_TAKEN, eventData);
      
      // Clean up stored data after use
      visitorDataCache.current.delete(visitorId);
    } else if (data.type == "visitor_left") {
      const visitorId = data.visitor_id;
      const sessionId = data.session_id;
      
      // Remove visitor request if they left before being assigned
      removeRequest(visitorId);
      
      // Emit global event to notify other components to remove the visitor
      globalEventEmitter.emit(EVENTS.VISITOR_DISCONNECTED, {
        visitor_id: visitorId,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      });
      
      // Clean up stored data
      visitorDataCache.current.delete(visitorId);
    } else if (data.type == "visitor_details_changed") {
      // Handle visitor details update (from agent or visitor)
      globalEventEmitter.emit(EVENTS.VISITOR_DETAILS_UPDATED, {
        visitor_details: data.visitor_details,
        source: data.source, // 'agent' or 'visitor'
        timestamp: new Date().toISOString()
      });
    } else if (data.type == "visitor_ended_chat") {
      // Visitor clicked "End Chat" button
      const visitorId = data.visitor_id;
      const sessionId = data.session_id;
      
      // Emit event to mark visitor as disconnected (similar to visitor_left)
      globalEventEmitter.emit(EVENTS.VISITOR_DISCONNECTED, {
        visitor_id: visitorId,
        session_id: sessionId,
        ended_by: 'visitor',
        timestamp: new Date().toISOString()
      });
    } else if (data.type == "visitor_active") {
      // Status changed from PENDING/UNRESOLVED → ACTIVE (agent started chatting)
      const visitorId = data.visitor_id;
      
      // Remove serve request from sidebar immediately
      removeRequest(visitorId);
      
      // Refresh immediately - backend has already committed the transaction
      globalEventEmitter.emit(EVENTS.NEW_VISITOR, {
        visitor_id: visitorId,
        timestamp: new Date().toISOString()
      });
    } else if (data.type == "visitor_unresolved") {
      // Status changed from ACTIVE → UNRESOLVED (all agents left)
      const visitorId = data.visitor_id;
      
      // Refresh immediately - backend has already committed the transaction
      globalEventEmitter.emit(EVENTS.NEW_VISITOR, {
        visitor_id: visitorId,
        timestamp: new Date().toISOString()
      });
    }
  }, [getCurrentAgent, addRequest, removeRequest]);

  // Initialize SSE connection when component mounts
  useEffect(() => {
    // Run visitor monitor for client agents and client admins
    if (user && (user.role === UserRoleEnum.CLIENT_AGENT || user.role === UserRoleEnum.CLIENT_ADMIN)) {
      const currentAgent = getCurrentAgent();
      
      if (currentAgent?.id) {
        // Add listener to global SSE manager
        sseManager.addListener(handleSSEMessage);

        // Connect immediately - no delay needed
        sseManager.connect(currentAgent.id, FULL_API_BASE_URL);

        return () => {
          sseManager.removeListener(handleSSEMessage);
        };
      }
    }
  }, [user?.role, user?.user_id, getCurrentAgent, handleSSEMessage]); // Depend on role and user_id to handle user changes

  // This component doesn't render anything visible
  return null;
};

export default VisitorMonitor;
