import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';

const API_BASE = 'http://localhost:8000/api/v1';

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

interface Notification {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  visitor_id?: string;
  visitor_name?: string;
  visitor_status?: string;
}

export const useVisitors = () => {
  const { user } = useAuth();
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sseStatus, setSseStatus] = useState('disconnected');
  const [searchTerm, setSearchTerm] = useState('');

  const eventSourceRef = useRef<EventSource | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingVisitorOperations = useRef<Set<string>>(new Set());
  const lastNotificationTime = useRef<number>(0);
  const notificationIds = useRef<Set<number>>(new Set());
  const visitorNotificationTracker = useRef<Map<string, { type: string, timestamp: number }>>(new Map());

  // Get client ID and agent info from authenticated user
  const CLIENT_ID = user?.client_id;
  const CURRENT_AGENT = user ? {
    id: user.user_id,
    name: user.name || user.email
  } : null;

  const playNotificationSound = () => {
    try {
      // Create a better notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant notification sound (ding-dong)
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // First tone (ding)
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator1.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      // Second tone (dong) - slightly lower
      oscillator2.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
      oscillator2.frequency.setValueAtTime(500, audioContext.currentTime + 0.4);
      oscillator2.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
      
      // Volume control
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      // Play the sound
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.3);
      
      oscillator2.start(audioContext.currentTime + 0.3);
      oscillator2.stop(audioContext.currentTime + 0.6);
      
    } catch (error) {
      console.log('Web Audio API failed, trying fallback:', error);
      
      // Fallback: Try to play audio file if available
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.log('Audio file also failed:', err);
        });
      }
    }
  };

  const connectSSE = () => {
    if (!CURRENT_AGENT?.id) return;
    const sseUrl = `${API_BASE}/notifications/stream/${CURRENT_AGENT.id}`;
    
    eventSourceRef.current = new EventSource(sseUrl);

    eventSourceRef.current.onopen = () => {
      setSseStatus('connected');
    };

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_visitor') {
        const currentTime = Date.now();
        const visitorId = data.visitor_id;
        
        // Check if we recently created a notification for this visitor
        const lastNotification = visitorNotificationTracker.current.get(visitorId);
        if (lastNotification && 
            lastNotification.type === 'new_visitor' && 
            currentTime - lastNotification.timestamp < 3000) { // 3 second window
          return;
        }
        
        // Check if a new_visitor notification for this visitor already exists
        const existingNewVisitorNotification = notifications.find(n => 
          n.visitor_id === visitorId && n.type === 'new_visitor'
        );
        
        if (existingNewVisitorNotification) {
          return;
        }
        
        // Track this notification creation
        visitorNotificationTracker.current.set(visitorId, {
          type: 'new_visitor',
          timestamp: currentTime
        });
        
        // Play notification sound ONLY for new visitors arriving
        playNotificationSound();
        
        // Create unique notification ID
        const notificationId = currentTime + Math.floor(Math.random() * 1000);
        
        // Ensure this ID hasn't been used
        while (notificationIds.current.has(notificationId)) {
          Math.floor(Math.random() * 1000000);
        }
        notificationIds.current.add(notificationId);
        
        setNotifications(prev => {
          // Final check: ensure no duplicate exists
          const hasExisting = prev.some(n => n.visitor_id === visitorId && n.type === 'new_visitor');
          if (hasExisting) {
            return prev;
          }
          
          return [...prev, {
            id: notificationId,
            type: 'new_visitor',
            message: `New visitor: ${visitorId}`,
            timestamp: new Date().toISOString(),
            visitor_id: visitorId,
            visitor_name: data.metadata?.name,
            visitor_status: 'new'
          }];
        });
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
          notificationIds.current.delete(notificationId);
          // Clean up tracker entry after notification expires
          setTimeout(() => {
            const trackedNotification = visitorNotificationTracker.current.get(visitorId);
            if (trackedNotification && trackedNotification.timestamp === currentTime) {
              visitorNotificationTracker.current.delete(visitorId);
            }
          }, 1000);
        }, 5000);
        
        // Fetch updated visitor list immediately to show new visitor in incoming chats
        setTimeout(() => fetchVisitors(), 100); // Small delay to ensure backend is updated
        
        // Try to get the latest message for this visitor to show in notification (async)
        fetch(`http://localhost:8000/api/v1/chat/visitor-messages/${visitorId}`)
          .then(response => response.json())
          .then(responseData => {
            if (responseData.success && responseData.messages && responseData.messages.length > 0) {
              const latestMessage = responseData.messages[responseData.messages.length - 1];
              if (latestMessage.sender_type === 'visitor') {
                const messagePreview = latestMessage.message.substring(0, 50) + (latestMessage.message.length > 50 ? '...' : '');
                // Update the notification with message preview
                setNotifications(prev => prev.map(n => 
                  n.id === notificationId 
                    ? { ...n, message: `New visitor: ${visitorId} - "${messagePreview}"` }
                    : n
                ));
              }
            }
          })
          .catch(error => {
            console.log('Could not fetch message preview:', error);
          });
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE error:', error);
      setSseStatus('error');
      
      setTimeout(() => {
        connectSSE();
      }, 5000);
    };
  };

  const disconnectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setSseStatus('disconnected');
    }
  };

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      // Try to fetch from a single endpoint first to see what we get
      const allResponse = await axios.get(`${API_BASE}/chat/all-visitors/${CLIENT_ID}`);
      
      if (allResponse.data.visitors && allResponse.data.visitors.length > 0) {
        // Filter out disconnected visitors (status: 'disconnected', 'offline', 'closed')
        const activeVisitors = allResponse.data.visitors.filter((visitor: Visitor) => {
          const status = visitor.status?.toLowerCase();
          return !['disconnected', 'offline', 'closed', 'inactive'].includes(status);
        });
        
        setVisitors(activeVisitors);
      } else {
        // Try individual endpoints
        try {
          const pendingResponse = await axios.get(`${API_BASE}/chat/pending-visitors/${CLIENT_ID}`);
          
          if (pendingResponse.data.visitors && pendingResponse.data.visitors.length > 0) {
            const activeVisitors = pendingResponse.data.visitors.filter((visitor: Visitor) => {
              const status = visitor.status?.toLowerCase();
              return !['disconnected', 'offline', 'closed', 'inactive'].includes(status);
            });
            setVisitors(activeVisitors);
          } else {
            setVisitors([]);
          }
        } catch (pendingError) {
          try {
            const assignedResponse = await axios.get(`${API_BASE}/chat/assigned-visitors/${CLIENT_ID}`);
            
            if (assignedResponse.data.visitors && assignedResponse.data.visitors.length > 0) {
              const activeVisitors = assignedResponse.data.visitors.filter((visitor: Visitor) => {
                const status = visitor.status?.toLowerCase();
                return !['disconnected', 'offline', 'closed', 'inactive'].includes(status);
              });
              setVisitors(activeVisitors);
            } else {
              setVisitors([]);
            }
          } catch (assignedError) {
            setVisitors([]);
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching visitors:', error);
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  // Shared function to handle taking a visitor and showing success notification
  const handleTakeVisitorSuccess = (visitorId: string, visitorName?: string) => {
    const currentTime = Date.now();
    
    // Check if we recently created a notification for this visitor
    const lastNotification = visitorNotificationTracker.current.get(visitorId);
    if (lastNotification && 
        lastNotification.type === 'success' && 
        currentTime - lastNotification.timestamp < 3000) { // 3 second window
      return;
    }
    
    // Global debounce: If any notification was created within 500ms, ignore
    if (currentTime - lastNotificationTime.current < 500) {
      return;
    }
    
    lastNotificationTime.current = currentTime;
    
    // Check if a success notification for this visitor already exists in current notifications
    const existingSuccessNotification = notifications.find(n => 
      n.visitor_id === visitorId && n.type === 'success'
    );
    
    if (existingSuccessNotification) {
      return;
    }
    
    // Track this notification creation
    visitorNotificationTracker.current.set(visitorId, {
      type: 'success',
      timestamp: currentTime
    });
    
    // Remove any existing new_visitor notification for this visitor
    setNotifications(prev => prev.filter(n => 
      !(n.visitor_id === visitorId && n.type === 'new_visitor')
    ));

    // Use a more unique ID system
    const notificationId = currentTime + Math.floor(Math.random() * 1000);
    
    // Ensure this ID hasn't been used
    while (notificationIds.current.has(notificationId)) {
      Math.floor(Math.random() * 1000000);
    }
    notificationIds.current.add(notificationId);
    
    setNotifications(prev => {
      // Final check: ensure no duplicate exists
      const hasExisting = prev.some(n => n.visitor_id === visitorId && n.type === 'success');
      if (hasExisting) {
        return prev;
      }
      
      const newNotifications = [...prev, {
        id: notificationId,
        type: 'success',
        message: `Successfully picked visitor ${visitorId}`,
        timestamp: new Date().toISOString(),
        visitor_id: visitorId,
        visitor_name: visitorName,
        visitor_status: 'assigned'
      }];
      return newNotifications;
    });

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      notificationIds.current.delete(notificationId);
      // Clean up tracker entry after notification expires
      setTimeout(() => {
        const trackedNotification = visitorNotificationTracker.current.get(visitorId);
        if (trackedNotification && trackedNotification.timestamp === currentTime) {
          visitorNotificationTracker.current.delete(visitorId);
        }
      }, 1000);
    }, 5000);

    setTimeout(() => fetchVisitors(), 500);
  };

  const takeVisitor = async (visitor: Visitor) => {
    if (!CURRENT_AGENT?.id) return;
    try {
      const response = await axios.post(`${API_BASE}/chat/take-visitor`, {
        agent_id: CURRENT_AGENT.id,
        visitor_id: visitor.visitor_id
      });

      if (response.data.success) {
        handleTakeVisitorSuccess(visitor.visitor_id, visitor.metadata?.name);
      } else {
        alert(response.data.message || 'Failed to assign visitor');
      }
    } catch (error) {
      console.error('Error taking visitor:', error);
      alert('Failed to assign visitor');
    }
  };

  // Function to take visitor by ID (for notifications)
  const takeVisitorById = async (visitorId: string) => {
    if (!CURRENT_AGENT?.id) return;
    
    // Check if operation is already in progress
    if (pendingVisitorOperations.current.has(visitorId)) {
      return;
    }
    
    // Mark operation as pending
    pendingVisitorOperations.current.add(visitorId);
    
    try {
      const response = await axios.post(`${API_BASE}/chat/take-visitor`, {
        agent_id: CURRENT_AGENT.id,
        visitor_id: visitorId
      });

      if (response.data.success) {
        handleTakeVisitorSuccess(visitorId);
      } else {
        alert(response.data.message || 'Failed to assign visitor');
      }
    } catch (error) {
      console.error('Error taking visitor by ID:', error);
      alert('Failed to assign visitor');
    } finally {
      // Remove from pending operations
      pendingVisitorOperations.current.delete(visitorId);
    }
  };

  const removeVisitor = (visitorId: string) => {
    setVisitors(prev => prev.filter(v => v.visitor_id !== visitorId));
    
    // If this visitor was selected for details, close the popup
    if (selectedVisitor?.visitor_id === visitorId) {
      setSelectedVisitor(null);
      setIsPopupOpen(false);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleVisitorClick = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedVisitor(null);
  };

  // Filter visitors based on search term
  const filterVisitors = (visitorList: Visitor[]) => {
    if (!searchTerm.trim()) return visitorList;
    
    const term = searchTerm.toLowerCase();
    return visitorList.filter(visitor => 
      visitor.visitor_id.toLowerCase().includes(term) ||
      visitor.metadata?.name?.toLowerCase().includes(term) ||
      visitor.metadata?.email?.toLowerCase().includes(term) ||
      visitor.status.toLowerCase().includes(term) ||
      visitor.agent_name?.toLowerCase().includes(term)
    );
  };

  // Filter visitors for different sections - more flexible filtering
  const allVisitors = filterVisitors(visitors);
  
  const incomingChats = allVisitors.filter(v => {
    const hasNoAgent = !v.agent_id || v.agent_id === '';
    const isPending = v.status && ['pending', 'PENDING', 'idle', 'IDLE', 'new', 'NEW'].includes(v.status.toLowerCase());
    return hasNoAgent && isPending;
  });
  
  const servedVisitors = allVisitors.filter(v => {
    const hasAgent = v.agent_id && v.agent_id !== '';
    const isActive = v.status && ['assigned', 'ASSIGNED', 'active', 'ACTIVE', 'serving', 'SERVING'].includes(v.status.toLowerCase());
    return hasAgent && isActive;
  });
  
  const activeWebsiteVisitors = allVisitors.filter(v => {
    const hasNoAgent = !v.agent_id || v.agent_id === '';
    const isActive = v.status && ['active', 'ACTIVE', 'online', 'ONLINE'].includes(v.status.toLowerCase());
    return hasNoAgent && isActive;
  });

  // Initialize SSE connection
  useEffect(() => {
    if (!CURRENT_AGENT?.id || !CLIENT_ID) return;
    
    connectSSE();
    fetchVisitors();
    
    // Create audio element for notification sound
    audioRef.current = new Audio('/notification-sound.mp3'); // You can add your own sound file
    audioRef.current.volume = 0.5;
    
    // Set up periodic cleanup of disconnected visitors
    const cleanupInterval = setInterval(() => {
      setVisitors(prev => prev.filter(visitor => {
        const status = visitor.status?.toLowerCase();
        return !['disconnected', 'offline', 'closed', 'inactive'].includes(status);
      }));
    }, 30000); // Check every 30 seconds
    
    return () => {
      disconnectSSE();
      clearInterval(cleanupInterval);
      // Clear tracking data
      notificationIds.current.clear();
      visitorNotificationTracker.current.clear();
      pendingVisitorOperations.current.clear();
    };
  }, [CURRENT_AGENT?.id, CLIENT_ID]);

  return {
    // State
    selectedVisitor,
    isPopupOpen,
    visitors,
    loading,
    notifications,
    sseStatus,
    searchTerm,
    allVisitors,
    incomingChats,
    servedVisitors,
    activeWebsiteVisitors,
    
    // Actions
    setSearchTerm,
    fetchVisitors,
    removeVisitor,
    clearNotifications,
    handleVisitorClick,
    closePopup,
    takeVisitorById,
    
    // Constants
    CURRENT_AGENT
  };
};
