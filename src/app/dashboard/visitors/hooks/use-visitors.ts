import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/auth-context";
import { useGlobalNotifications } from "@/contexts/global-notifications";
import { useVisitorActions } from "@/contexts/visitor-actions";
import { globalEventEmitter, EVENTS } from "@/lib/event-emitter";

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

export const useVisitors = () => {
  const { user } = useAuth();
  const { addNotification: addGlobalNotification, removeNotificationsByVisitorId } = useGlobalNotifications();
  const { showSuccessNotification } = useVisitorActions();
  
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [pendingVisitors, setPendingVisitors] = useState<Visitor[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const pendingVisitorOperations = useRef<Set<string>>(new Set());

  const CLIENT_ID = user?.client_id;
  const CURRENT_AGENT = user
    ? {
        id: user.user_id,
        name: user.name || user.email,
      }
    : null;





  const fetchVisitors = useCallback(async () => {
    if (!CLIENT_ID) {
      console.log('No CLIENT_ID available, skipping fetch');
      return;
    }

    setLoading(true);
    
    try {
      const [pendingResult, activeResult] = await Promise.allSettled([
        api.get(`/chat/pending-visitors/${CLIENT_ID}`),
        api.get(`/chat/active-visitors/${CLIENT_ID}`)
      ]);

      let pendingVisitorsData: Visitor[] = [];
      if (pendingResult.status === 'fulfilled') {
        pendingVisitorsData = pendingResult.value.data.visitors || [];
      } else {
        console.error('Failed to fetch pending visitors:', pendingResult.reason);
      }

      let activeVisitorsData: Visitor[] = [];
      if (activeResult.status === 'fulfilled') {
        activeVisitorsData = activeResult.value.data.visitors || [];
      } else {
        console.error('Failed to fetch active visitors:', activeResult.reason);
      }

      const filteredPendingVisitors = pendingVisitorsData.filter(
        (visitor: Visitor) => {
          const status = visitor.status?.toLowerCase();
          return !["disconnected", "offline", "closed", "inactive"].includes(status);
        }
      );

      const filteredActiveVisitors = activeVisitorsData.filter(
        (visitor: Visitor) => {
          const status = visitor.status?.toLowerCase();
          return !["disconnected", "offline", "closed", "inactive"].includes(status);
        }
      );

      setPendingVisitors(filteredPendingVisitors);
      setActiveVisitors(filteredActiveVisitors);
      
      const allVisitors = [...filteredPendingVisitors, ...filteredActiveVisitors];
      setVisitors(allVisitors);

    } catch (error) {
      console.error("Error in fetchVisitors:", error);
    } finally {
      setLoading(false);
    }
  }, [CLIENT_ID]);

  // Success handler using global notifications
  const handleTakeVisitorSuccess = useCallback((visitorId: string, visitorName?: string) => {
    // Remove any existing notifications for this visitor immediately
    removeNotificationsByVisitorId(visitorId);
    
    // Use global notification system for success message
    const displayName = visitorName || visitorId;
    showSuccessNotification(visitorId, displayName);

    // Refresh immediately for the agent who took the visitor
    fetchVisitors();
  }, [showSuccessNotification, removeNotificationsByVisitorId, fetchVisitors]);

  const takeVisitorById = useCallback(async (visitorId: string) => {
    if (!CURRENT_AGENT?.id) return;

    if (pendingVisitorOperations.current.has(visitorId)) {
      console.log(`Operation already in progress for visitor ${visitorId}`);
      return;
    }

    pendingVisitorOperations.current.add(visitorId);

    try {
      console.log('Taking visitor:', visitorId);
      const response = await api.post(`/chat/take-visitor`, {
        agent_id: CURRENT_AGENT.id,
        visitor_id: visitorId,
      });

      console.log('Take visitor response:', response.data);

      if (response.data.success) {
        const visitor = visitors.find(v => v.visitor_id === visitorId);
        const visitorName = visitor?.metadata?.name || visitorId;
        
        handleTakeVisitorSuccess(visitorId, visitorName);
      } else {
        // Use global notification for errors
        addGlobalNotification({
          type: "error",
          message: response.data.message || "Failed to assign visitor",
          visitor_id: visitorId,
          visitor_status: "error"
        });
      }
    } catch (error) {
      console.error("Error taking visitor by ID:", error);
      
      // Use global notification for network errors
      addGlobalNotification({
        type: "error",
        message: "Failed to assign visitor - network error",
        visitor_id: visitorId,
        visitor_status: "error"
      });
    } finally {
      setTimeout(() => {
        pendingVisitorOperations.current.delete(visitorId);
      }, 500);
    }
  }, [CURRENT_AGENT?.id, visitors, handleTakeVisitorSuccess, addGlobalNotification]);

  const removeVisitor = useCallback((visitorId: string) => {
    setVisitors((prev) => prev.filter((v) => v.visitor_id !== visitorId));
    setPendingVisitors((prev) => prev.filter((v) => v.visitor_id !== visitorId));
    setActiveVisitors((prev) => prev.filter((v) => v.visitor_id !== visitorId));

    if (selectedVisitor?.visitor_id === visitorId) {
      setSelectedVisitor(null);
      setIsPopupOpen(false);
    }
  }, [selectedVisitor]);


  const handleVisitorClick = useCallback((visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setIsPopupOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setIsPopupOpen(false);
    setSelectedVisitor(null);
  }, []);

  const filterVisitors = useCallback((visitorList: Visitor[]) => {
    if (!searchTerm.trim()) return visitorList;

    const term = searchTerm.toLowerCase();
    return visitorList.filter(
      (visitor) =>
        visitor.visitor_id.toLowerCase().includes(term) ||
        visitor.metadata?.name?.toLowerCase().includes(term) ||
        visitor.metadata?.email?.toLowerCase().includes(term) ||
        visitor.status.toLowerCase().includes(term) ||
        visitor.agent_name?.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Filter visitors for different sections
  const allVisitors = filterVisitors(visitors);
  const incomingChats = filterVisitors(pendingVisitors);
  const servedVisitors = filterVisitors(activeVisitors);

  const activeWebsiteVisitors = filterVisitors(pendingVisitors).filter((v) => {
    const isActive = v.status && 
      ["active", "ACTIVE", "online", "ONLINE"].includes(v.status.toLowerCase());
    return isActive;
  });



  // Initialize effect
  useEffect(() => {
    if (!CURRENT_AGENT?.id || !CLIENT_ID) {
      console.log('Missing CURRENT_AGENT or CLIENT_ID');
      return;
    }

    console.log('Initializing useVisitors hook');
    console.log('Agent ID:', CURRENT_AGENT.id);
    console.log('Client ID:', CLIENT_ID);

    // Fetch initial visitors data
    fetchVisitors();

    return () => {
      console.log('Cleaning up useVisitors hook');
      pendingVisitorOperations.current.clear();
    };
  }, [CURRENT_AGENT?.id, CLIENT_ID, fetchVisitors]);

  useEffect(() => {
    console.log('Visitors state updated:', {
      total: visitors.length,
      pending: pendingVisitors.length,
      active: activeVisitors.length
    });
  }, [visitors, pendingVisitors, activeVisitors]);

  // Listen for global visitor events
  useEffect(() => {
    const handleNewVisitor = (visitorData: any) => {
      console.log('Global new visitor event received:', visitorData);
      // Refresh visitors data when a new visitor arrives
      fetchVisitors();
    };

    const handleVisitorTaken = (visitorData: any) => {
      fetchVisitors();
    };

    const handleVisitorDisconnected = (visitorData: any) => {
      console.log('Global visitor disconnected event received:', visitorData);
      // Refresh visitors data when a visitor disconnects
      fetchVisitors();
    };

    // Register event listeners
    globalEventEmitter.on(EVENTS.NEW_VISITOR, handleNewVisitor);
    globalEventEmitter.on(EVENTS.VISITOR_TAKEN, handleVisitorTaken);
    globalEventEmitter.on(EVENTS.VISITOR_DISCONNECTED, handleVisitorDisconnected);

    // Cleanup event listeners
    return () => {
      globalEventEmitter.off(EVENTS.NEW_VISITOR, handleNewVisitor);
      globalEventEmitter.off(EVENTS.VISITOR_TAKEN, handleVisitorTaken);
      globalEventEmitter.off(EVENTS.VISITOR_DISCONNECTED, handleVisitorDisconnected);
    };
  }, [fetchVisitors]);

  return {
    selectedVisitor,
    isPopupOpen,
    visitors,
    pendingVisitors,
    activeVisitors,
    loading,
    searchTerm,
    allVisitors,
    incomingChats,
    servedVisitors,
    activeWebsiteVisitors,
    setSearchTerm,
    fetchVisitors,
    removeVisitor,
    handleVisitorClick,
    closePopup,
    takeVisitorById,
    CURRENT_AGENT,
  };
};