"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useVisitorRequests } from '@/contexts/visitor-requests';
import { UserRoleEnum } from '@/lib/constants';
import { globalEventEmitter, EVENTS } from '@/lib/event-emitter';
import { FULL_API_BASE_URL } from '@/lib/axios';
import SSEManager from '@/lib/sse-manager';

const VisitorMonitor: React.FC = () => {
  const { user } = useAuth();
  const { addRequest, removeRequest } = useVisitorRequests();
  const sseManager = SSEManager.getInstance();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
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
        name: user.name || user.email,
      };
    }
    return null;
  }, [user]);

  // Initialize audio element
  const initializeAudio = useCallback(() => {
    if (audioRef.current) return; // Already initialized
    
    try {
      audioRef.current = new Audio('/notification-sound.mp3');
      audioRef.current.volume = 0.6;
      audioRef.current.preload = 'auto';
      
      audioRef.current.addEventListener('error', () => {
        // Don't throw error, just log warning
      });
      
      // Try to load the audio
      audioRef.current.load();
    } catch (error) {
      // Ignore audio initialization errors
    }
  }, []);

  // Play notification sound using native HTML5 Audio
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      try {
      // Reset to beginning and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    } catch (error) {
      // Ignore audio play errors
    }
  } else {
    // Audio not initialized yet, initialize it
    initializeAudio();
    // Try to play after a short delay to allow initialization
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    }, 100);
  }
  }, [initializeAudio]);



  // SSE message handler
  const handleSSEMessage = useCallback((data: any) => {
    
    if (data.type == "new_visitor") {
      const visitorId = data.visitor_id;
      
      // Store visitor data for later use in visitor_assigned events
      visitorDataCache.current.set(visitorId, {
        session_id: data.session_id,
        metadata: data.visitor_metadata,
        timestamp: data.timestamp,
        client_id: data.client_id
      });
      
      // Add visitor request instead of notification
      addRequest({
        visitor_id: visitorId,
        metadata: data.metadata
      });

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
        timestamp: new Date().toISOString()
      };
      
      globalEventEmitter.emit(EVENTS.VISITOR_TAKEN, eventData);
      
      // Clean up stored data after use
      visitorDataCache.current.delete(visitorId);
    }
  }, [getCurrentAgent, addRequest, removeRequest, playNotificationSound]);

  // Initialize audio immediately when component mounts
  useEffect(() => {
    initializeAudio();
    
    // Add a global click handler to enable audio context (for autoplay restrictions)
    const enableAudio = () => {
      if (audioRef.current) {
        // Try to play and immediately pause to enable audio context
        try {
          audioRef.current.play().then(() => {
            audioRef.current?.pause();
          }).catch(() => {
            // Ignore autoplay errors
          });
        } catch (error) {
          // Ignore autoplay errors
        }
      }
    };
    
    // Enable audio on first user interaction
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, [initializeAudio]);

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

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);


  // This component doesn't render anything visible
  return null;
};

export default VisitorMonitor;
