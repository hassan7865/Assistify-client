import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/auth-context";
import { useGlobalChat } from "@/contexts/global-chat-context";
import { globalEventEmitter, EVENTS } from "@/lib/event-emitter";
import { Visitor } from "../../types";

export const useVisitors = () => {
  const { user } = useAuth();
  const { openChat, setCurrentAgent, minimizedChats, closeMinimizedChat, removeVisitorChatState } = useGlobalChat();
  
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
        name: user.organization_name || user.name || user.email,
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

      // Replace visitor_id with first_name (if present)
      const mapName = (v: Visitor): Visitor => ({
        ...v,
        // If backend provided first_name, keep it; otherwise, try metadata
        first_name: v.first_name || v.metadata?.name || undefined,
      });

      const namedPending = filteredPendingVisitors.map(mapName);
      const namedActive = filteredActiveVisitors.map(mapName);

      // Merge with minimized chats to ensure UI reflects persisted name after reload
      const mergeWithMinimized = (list: Visitor[]) => list.map(v => {
        const persisted = minimizedChats.find(m => m.visitor_id === v.visitor_id);
        if (!persisted) return v;
        return {
          ...v,
          first_name: persisted.first_name ?? v.first_name,
          last_name: persisted.last_name ?? v.last_name,
          metadata: { ...(v.metadata || {}), ...(persisted.metadata || {}) }
        };
      });

      const displayPending = mergeWithMinimized(namedPending);
      const displayActive = mergeWithMinimized(namedActive);

      setPendingVisitors(displayPending);
      setActiveVisitors(displayActive);
      
      const allVisitors = [...displayPending, ...displayActive];
      setVisitors(allVisitors);

      // Clean up minimized chats and visitor map for visitors no longer in pending/active status
      const validVisitorIds = new Set(allVisitors.map(visitor => visitor.visitor_id));
      
      // Remove minimized chats for visitors not in the current list
      minimizedChats.forEach(minimizedChat => {
        if (!validVisitorIds.has(minimizedChat.visitor_id)) {
          // This visitor is no longer pending or active, remove from minimized chats and visitor map
          closeMinimizedChat(minimizedChat.visitor_id);
          removeVisitorChatState(minimizedChat.visitor_id);
        }
      });

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
      // Get the current visitor data to extract IP address
      const currentVisitor = visitors.find(v => v.visitor_id === visitorId);
      
      const response = await api.post(`/chat/take-visitor`, {
        agent_id: CURRENT_AGENT.id,
        visitor_id: visitorId,
        ip_address: currentVisitor?.metadata?.ip_address || null,
      });

      if (response.data.success) {
        // Extract the counts and other data from API response
        const { session_id, metadata, visitor_past_count, visitor_chat_count, first_name, last_name } = response.data;
        
        // Create updated visitor with agent info and counts
        const updatedVisitor = {
          ...currentVisitor,
          visitor_id: visitorId,
          agent_id: CURRENT_AGENT.id,
          agent_name: CURRENT_AGENT.name,
          status: "active",
          session_id: session_id,
          metadata: metadata || currentVisitor?.metadata || {},
          visitor_past_count: visitor_past_count || 0,
          visitor_chat_count: visitor_chat_count || 0,
          // Prefer name returned by API; else keep current/persisted name; else fallback to metadata.name
          first_name: (first_name ?? currentVisitor?.first_name ?? currentVisitor?.metadata?.name) || null,
          last_name: (last_name ?? currentVisitor?.last_name) || null,
          // Use API response data if available, otherwise keep current data
          ...(response.data.visitor || {})
        } as Visitor;
        
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
        
        // Update the main visitors list and two lists, ensuring the display uses name first
        const applyUpdate = (v: Visitor) => (
          v.visitor_id === visitorId
            ? updatedVisitor
            : v
        );

        setVisitors(prev => prev.map(applyUpdate));
        setPendingVisitors(prev => prev.map(applyUpdate));
        setActiveVisitors(prev => prev.map(applyUpdate));
        
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

    const handleUpdateVisitorName = ({ visitorId, first_name }: { visitorId: string; first_name: string }) => {
      setVisitors(prev => prev.map(v => v.visitor_id === visitorId ? { ...v, first_name } : v));
      setPendingVisitors(prev => prev.map(v => v.visitor_id === visitorId ? { ...v, first_name } : v));
      setActiveVisitors(prev => prev.map(v => v.visitor_id === visitorId ? { ...v, first_name } : v));
    };


    // Register event listeners
    globalEventEmitter.on(EVENTS.NEW_VISITOR, handleNewVisitor);
    globalEventEmitter.on(EVENTS.VISITOR_TAKEN, handleVisitorTaken);
    globalEventEmitter.on(EVENTS.VISITOR_DISCONNECTED, handleVisitorDisconnected);
    globalEventEmitter.on(EVENTS.UPDATE_VISITOR_LAST_MESSAGE, handleUpdateLastMessage);
    globalEventEmitter.on(EVENTS.UPDATE_VISITOR_NAME, handleUpdateVisitorName);

    // Cleanup event listeners
    return () => {
      globalEventEmitter.off(EVENTS.NEW_VISITOR, handleNewVisitor);
      globalEventEmitter.off(EVENTS.VISITOR_TAKEN, handleVisitorTaken);
      globalEventEmitter.off(EVENTS.VISITOR_DISCONNECTED, handleVisitorDisconnected);
      globalEventEmitter.off(EVENTS.UPDATE_VISITOR_LAST_MESSAGE, handleUpdateLastMessage);
      globalEventEmitter.off(EVENTS.UPDATE_VISITOR_NAME, handleUpdateVisitorName);
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