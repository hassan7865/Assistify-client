import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";
import { useGlobalNotifications } from "@/contexts/global-notifications";
import { useVisitorActions } from "@/contexts/visitor-actions";

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
  const { addNotification: addGlobalNotification } = useGlobalNotifications();
  const { showSuccessNotification } = useVisitorActions();
  
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [pendingVisitors, setPendingVisitors] = useState<Visitor[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [sseStatus, setSseStatus] = useState("disconnected");
  const [searchTerm, setSearchTerm] = useState("");

  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingVisitorOperations = useRef<Set<string>>(new Set());
  const isConnectedRef = useRef<boolean>(false);

  const CLIENT_ID = user?.client_id;
  const CURRENT_AGENT = user
    ? {
        id: user.user_id,
        name: user.name || user.email,
      }
    : null;



  const connectSSE = useCallback(() => {
    if (!CURRENT_AGENT?.id || isConnectedRef.current) return;
    
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log('SSE already connected');
      return;
    }
    
    disconnectSSE();
    
    const sseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/notifications/stream/${CURRENT_AGENT.id}`;
    console.log('Connecting to SSE:', sseUrl);

    eventSourceRef.current = new EventSource(sseUrl);
    isConnectedRef.current = true;

    eventSourceRef.current.onopen = () => {
      console.log('SSE Connected successfully');
      setSseStatus("connected");
    };

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('SSE Message received:', data);

      if (data.type === "new_visitor") {
        const visitorId = data.visitor_id;
        const visitorName = data.metadata?.name || visitorId;
        
        // Add to global notifications (appears on all pages)
        addGlobalNotification({
          type: "new_visitor",
          message: `New visitor: ${visitorName}`,
          visitor_id: visitorId,
          visitor_name: data.metadata?.name,
          visitor_status: "new"
        });



        setTimeout(() => fetchVisitors(), 50);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error("SSE error:", error);
      setSseStatus("error");
      isConnectedRef.current = false;

      setTimeout(() => {
        if (CURRENT_AGENT?.id) {
          connectSSE();
        }
      }, 3000);
    };
  }, [CURRENT_AGENT?.id, addGlobalNotification]);

  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Disconnecting SSE');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      isConnectedRef.current = false;
      setSseStatus("disconnected");
    }
  }, []);

  const fetchVisitors = useCallback(async () => {
    if (!CLIENT_ID) {
      console.log('No CLIENT_ID available, skipping fetch');
      return;
    }

    setLoading(true);
    
    try {
      const [pendingResult, activeResult] = await Promise.allSettled([
        api.get(`/api/v1/chat/pending-visitors/${CLIENT_ID}`),
        api.get(`/api/v1/chat/active-visitors/${CLIENT_ID}`)
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
    console.log(`handleTakeVisitorSuccess called for visitor: ${visitorId}`);
    
    // Use global notification system for success message
    const displayName = visitorName || visitorId;
    showSuccessNotification(visitorId, displayName);

    // Refresh data
    setTimeout(() => fetchVisitors(), 300);
  }, [showSuccessNotification, fetchVisitors]);

  const takeVisitorById = useCallback(async (visitorId: string) => {
    if (!CURRENT_AGENT?.id) return;

    if (pendingVisitorOperations.current.has(visitorId)) {
      console.log(`Operation already in progress for visitor ${visitorId}`);
      return;
    }

    pendingVisitorOperations.current.add(visitorId);

    try {
      console.log('Taking visitor:', visitorId);
      const response = await api.post(`/api/v1/chat/take-visitor`, {
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

    // SSE connection is now handled globally, so we don't connect here
    // connectSSE();
    fetchVisitors();



    return () => {
      console.log('Cleaning up useVisitors hook');
      // disconnectSSE(); // SSE is now handled globally
      
      pendingVisitorOperations.current.clear();
      isConnectedRef.current = false;
      

    };
  }, [CURRENT_AGENT?.id, CLIENT_ID, fetchVisitors]);

  useEffect(() => {
    console.log('Visitors state updated:', {
      total: visitors.length,
      pending: pendingVisitors.length,
      active: activeVisitors.length
    });
  }, [visitors, pendingVisitors, activeVisitors]);

  return {
    selectedVisitor,
    isPopupOpen,
    visitors,
    pendingVisitors,
    activeVisitors,
    loading,
    sseStatus,
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