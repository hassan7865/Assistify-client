"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useGlobalNotifications } from '@/contexts/global-notifications';
import { UserRoleEnum } from '@/lib/constants';
import { globalEventEmitter, EVENTS } from '@/lib/event-emitter';
import { FULL_API_BASE_URL } from '@/lib/axios';
import SSEManager from '@/lib/sse-manager';
import { Howl } from 'howler';

const VisitorMonitor: React.FC = () => {
  const { user } = useAuth();
  const { addNotification, removeNotificationsByVisitorId } = useGlobalNotifications();
  const sseManager = SSEManager.getInstance();
  const soundRef = useRef<Howl | null>(null);
  

  // Get current agent from user context (same logic as useVisitors hook)
  const getCurrentAgent = useCallback(() => {
    if (user) {
      return {
        id: user.user_id,
        name: user.name || user.email,
      };
    }
    return null;
  }, [user]);

  // Play notification sound using Howler
  const playNotificationSound = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.play();
    }
  }, []);



  const createNotification = useCallback((type: string, visitorId: string, message: string, visitorName?: string, visitorStatus?: string) => {
    addNotification({
      type,
      message,
      visitor_id: visitorId,
      visitor_name: visitorName,
      visitor_status: visitorStatus,
    });
  }, [addNotification]);

  // SSE message handler
  const handleSSEMessage = useCallback((data: any) => {
    if (data.type == "new_visitor") {
      const visitorId = data.visitor_id;
      
      createNotification(
        "new_visitor",
        visitorId,
        `New visitor: ${data.metadata?.name || visitorId}`,
        data.metadata?.name,
        "new"
      );

      // Emit global event to notify other components
      globalEventEmitter.emit(EVENTS.NEW_VISITOR, {
        visitor_id: visitorId,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      });

      // Play sound for new visitor
      playNotificationSound();
    } else if (data.type == "visitor_assigned") {
      const visitorId = data.visitor_id;
      const assignedAgentId = data.assigned_agent_id;
      const currentAgent = getCurrentAgent();
      
      // Remove any existing notifications for this visitor (like "new visitor" notifications)
      removeNotificationsByVisitorId(visitorId);
      
      // Emit global event to notify other components (especially useVisitors hook)
      globalEventEmitter.emit(EVENTS.VISITOR_TAKEN, {
        visitor_id: visitorId,
        assigned_agent_id: assignedAgentId,
        timestamp: new Date().toISOString()
      });

      // Only show notification if visitor was assigned to current agent
      if (currentAgent && assignedAgentId === currentAgent.id) {
        createNotification(
          "success",
          visitorId,
          `Visitor assigned to you successfully`,
          undefined,
          "assigned"
        );
      }
    }
  }, [getCurrentAgent, createNotification, removeNotificationsByVisitorId, playNotificationSound]);

  // Initialize SSE connection when component mounts
  useEffect(() => {
    // Only run visitor monitor for client agents
    if (user && user.role === UserRoleEnum.CLIENT_AGENT) {
      const currentAgent = getCurrentAgent();
      
      if (currentAgent?.id) {
        // Initialize Howler sound
        soundRef.current = new Howl({
          src: ['/notification-sound.mp3'],
          volume: 0.6,
          preload: true,
          html5: true, // Use HTML5 audio for better compatibility
          onload: () => {
            // Sound loaded successfully
          },
          onloaderror: () => {
            // Sound failed to load
          }
        });

        // Add listener to global SSE manager
        sseManager.addListener(handleSSEMessage);

        // Small delay to ensure auth is fully loaded, then connect
        const timer = setTimeout(() => {
          sseManager.connect(currentAgent.id, FULL_API_BASE_URL);
        }, 1000);

        return () => {
          clearTimeout(timer);
          sseManager.removeListener(handleSSEMessage);
          
          // Clean up Howler sound
          if (soundRef.current) {
            soundRef.current.unload();
            soundRef.current = null;
          }
        };
      }
    }
  }, [user?.role, user?.user_id]); // Depend on role and user_id to handle user changes


  // This component doesn't render anything visible
  return null;
};

export default VisitorMonitor;
