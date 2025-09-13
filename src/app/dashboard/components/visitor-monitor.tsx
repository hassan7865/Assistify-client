"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useGlobalNotifications } from '@/contexts/global-notifications';
import { UserRoleEnum } from '@/lib/constants';
import { globalEventEmitter, EVENTS } from '@/lib/event-emitter';
import { FULL_API_BASE_URL } from '@/lib/axios';

const VisitorMonitor: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useGlobalNotifications();
  const eventSourceRef = useRef<EventSource | null>(null);
  const isConnectedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      if (audioRef.current) {
        // Reset the audio to the beginning in case it's already played
        audioRef.current.currentTime = 0;
        
        // Play the audio file
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Notification sound played successfully');
            })
            .catch((error) => {
              console.warn('Failed to play notification sound:', error);
              // Fallback to Web Audio API if file playback fails
              playFallbackSound();
            });
        }
      } else {
        console.warn('Audio element not available, using fallback sound');
        playFallbackSound();
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
      playFallbackSound();
    }
  }, []);

  // Fallback Web Audio API sound
  const playFallbackSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator1.frequency.setValueAtTime(900, audioContext.currentTime);
      oscillator1.frequency.setValueAtTime(1100, audioContext.currentTime + 0.05);
      oscillator1.frequency.setValueAtTime(900, audioContext.currentTime + 0.1);

      oscillator2.frequency.setValueAtTime(700, audioContext.currentTime + 0.15);
      oscillator2.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.15);

      oscillator2.start(audioContext.currentTime + 0.15);
      oscillator2.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Fallback sound also failed:', error);
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

  const connectSSE = useCallback(() => {
    const currentAgent = getCurrentAgent();
    if (!currentAgent?.id || isConnectedRef.current) return;
    
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log('SSE already connected');
      return;
    }
    
    disconnectSSE();
    
    const sseUrl = `${FULL_API_BASE_URL}/notifications/stream/${currentAgent.id}`;
    console.log('Connecting to SSE from global monitor:', sseUrl);

    eventSourceRef.current = new EventSource(sseUrl);
    isConnectedRef.current = true;

    eventSourceRef.current.onopen = () => {
      console.log('Global SSE Connected successfully');
    };

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Global SSE Message received:', data);

      if (data.type === "new_visitor") {
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
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error("Global SSE error:", error);
      isConnectedRef.current = false;

      // Reconnect after 3 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (getCurrentAgent()?.id) {
          connectSSE();
        }
      }, 3000);
    };
  }, [getCurrentAgent, createNotification]);

  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Disconnecting global SSE');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      isConnectedRef.current = false;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Initialize SSE connection when component mounts
  useEffect(() => {
    // Only run visitor monitor for client agents
    if (user && user.role === UserRoleEnum.CLIENT_AGENT) {
      // Initialize audio element with the file from public folder
      audioRef.current = new Audio("/notification-sound.mp3");
      audioRef.current.volume = 0.6; // Adjust volume as needed
      audioRef.current.preload = "auto"; // Preload the audio file
      
      // Optional: Test if the audio file loads successfully
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('Notification sound loaded successfully');
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.warn('Failed to load notification sound file:', e);
      });

      // Small delay to ensure auth is fully loaded
      const timer = setTimeout(() => {
        connectSSE();
      }, 1000);

      return () => {
        clearTimeout(timer);
        disconnectSSE();
        
        // Clean up audio element
        if (audioRef.current) {
          audioRef.current.removeEventListener('canplaythrough', () => {});
          audioRef.current.removeEventListener('error', () => {});
          audioRef.current = null;
        }
      };
    }
  }, [user, connectSSE, disconnectSSE]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSSE();
    };
  }, [disconnectSSE]);

  // This component doesn't render anything visible
  return null;
};

export default VisitorMonitor;
