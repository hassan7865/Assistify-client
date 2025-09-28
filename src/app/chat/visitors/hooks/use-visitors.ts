import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/auth-context";
import { useGlobalChat } from "@/contexts/global-chat-context";
import { globalEventEmitter, EVENTS } from "@/lib/event-emitter";
import { Visitor } from "../../types";

export const useVisitors = () => {
  const { user } = useAuth();
  const { openChat, setCurrentAgent, minimizedChats } = useGlobalChat();
  
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
      }

      let activeVisitorsData: Visitor[] = [];
      if (activeResult.status === 'fulfilled') {
        activeVisitorsData = activeResult.value.data.visitors || [];
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
      console.error('Failed to fetch visitors:', error);
    } finally {
      setLoading(false);
    }
  }, [CLIENT_ID]);


  const takeVisitorById = useCallback(async (visitorId: string, skipRefresh = false) => {
    if (!CURRENT_AGENT?.id) return;

    if (pendingVisitorOperations.current.has(visitorId)) {
      return;
    }

    pendingVisitorOperations.current.add(visitorId);

    try {
      const response = await api.post(`/chat/take-visitor`, {
        agent_id: CURRENT_AGENT.id,
        visitor_id: visitorId,
      });

      if (response.data.success) {
        // Get the current visitor data from our state
        const currentVisitor = visitors.find(v => v.visitor_id === visitorId);
        
        // Create updated visitor with agent info
        const updatedVisitor = {
          ...currentVisitor,
          visitor_id: visitorId,
          agent_id: CURRENT_AGENT.id,
          agent_name: CURRENT_AGENT.name,
          status: "active",
          // Use API response data if available, otherwise keep current data
          ...(response.data.visitor || {})
        };
        
        // Remove visitor from pending list if it exists there
        setPendingVisitors(prev => prev.filter(v => v.visitor_id !== visitorId));
        
        // Add visitor to active list
        setActiveVisitors(prev => {
          // Check if visitor already exists in active list
          const exists = prev.some(v => v.visitor_id === visitorId);
          if (exists) {
            // Update existing visitor
            return prev.map(v => v.visitor_id === visitorId ? updatedVisitor : v);
          } else {
            // Add new visitor
            return [...prev, updatedVisitor];
          }
        });
        
        // Update the main visitors list
        setVisitors(prev => prev.map(v => 
          v.visitor_id === visitorId 
            ? updatedVisitor
            : v
        ));
        
        // If skipRefresh is false, open chat dialog (this will handle minimizing current chat if needed)
        if (!skipRefresh) {
          // Open the chat dialog (this will auto-minimize any currently open chat)
          openChat(updatedVisitor);
        }
      }
    } catch (error) {
      console.error('Failed to take visitor:', error);
    } finally {
      setTimeout(() => {
        pendingVisitorOperations.current.delete(visitorId);
      }, 500);
    }
  }, [CURRENT_AGENT?.id, visitors, fetchVisitors]);

  const removeVisitor = useCallback((visitorId: string) => {
    setVisitors((prev) => prev.filter((v) => v.visitor_id !== visitorId));
    setPendingVisitors((prev) => prev.filter((v) => v.visitor_id !== visitorId));
    setActiveVisitors((prev) => prev.filter((v) => v.visitor_id !== visitorId));
  }, []);


  const handleVisitorClick = useCallback((visitor: Visitor) => {
    // Open the chat dialog (this will handle minimizing current chat if needed)
    openChat(visitor);
  }, [openChat]);

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




  // Initialize effect
  useEffect(() => {
    if (!CURRENT_AGENT?.id || !CLIENT_ID) {
      return;
    }

    // Set current agent in global context
    setCurrentAgent(CURRENT_AGENT);

    // Fetch initial visitors data
    fetchVisitors();

    return () => {
      pendingVisitorOperations.current.clear();
    };
  }, [CURRENT_AGENT?.id, CLIENT_ID, fetchVisitors, setCurrentAgent]);


  // Listen for global visitor events
  useEffect(() => {
    const handleNewVisitor = (visitorData: any) => {
      // Refresh visitors data when a new visitor arrives
      fetchVisitors();
    };

    const handleVisitorTaken = (visitorData: any) => {
      fetchVisitors();
    };

    const handleVisitorDisconnected = (visitorData: any) => {
      // Immediately remove visitor from local state
      if (visitorData.visitor_id) {
        removeVisitor(visitorData.visitor_id);
      }
      // Also refresh visitors data to ensure consistency
      fetchVisitors();
    };

    const handleUpdateLastMessage = ({ visitorId, lastMessage }: { visitorId: string; lastMessage: { content: string; sender_type: string; timestamp: string } }) => {
      setVisitors(prev => prev.map(visitor => 
        visitor.visitor_id === visitorId 
          ? { ...visitor, last_message: lastMessage }
          : visitor
      ));
      setPendingVisitors(prev => prev.map(visitor => 
        visitor.visitor_id === visitorId 
          ? { ...visitor, last_message: lastMessage }
          : visitor
      ));
      setActiveVisitors(prev => prev.map(visitor => 
        visitor.visitor_id === visitorId 
          ? { ...visitor, last_message: lastMessage }
          : visitor
      ));
    };


    // Register event listeners
    globalEventEmitter.on(EVENTS.NEW_VISITOR, handleNewVisitor);
    globalEventEmitter.on(EVENTS.VISITOR_TAKEN, handleVisitorTaken);
    globalEventEmitter.on(EVENTS.VISITOR_DISCONNECTED, handleVisitorDisconnected);
    globalEventEmitter.on(EVENTS.UPDATE_VISITOR_LAST_MESSAGE, handleUpdateLastMessage);

    // Cleanup event listeners
    return () => {
      globalEventEmitter.off(EVENTS.NEW_VISITOR, handleNewVisitor);
      globalEventEmitter.off(EVENTS.VISITOR_TAKEN, handleVisitorTaken);
      globalEventEmitter.off(EVENTS.VISITOR_DISCONNECTED, handleVisitorDisconnected);
      globalEventEmitter.off(EVENTS.UPDATE_VISITOR_LAST_MESSAGE, handleUpdateLastMessage);
    };
  }, [fetchVisitors, removeVisitor]);

  return {
    visitors,
    pendingVisitors,
    activeVisitors,
    loading,
    searchTerm,
    allVisitors,
    incomingChats,
    servedVisitors,
    setSearchTerm,
    fetchVisitors,
    removeVisitor,
    handleVisitorClick,
    takeVisitorById,
    CURRENT_AGENT,
  };
};