// Shared types for chat functionality
export interface Visitor {
  visitor_id: string;
  status: string;
  agent_id?: string;
  agent_name?: string;
  started_at?: string;
  session_id?: string;
  message_count?: number;
  last_message?: {
    content: string;
    sender_type: string;
    timestamp: string;
  };
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

export interface ChatMessage {
  id: string;
  sender: 'visitor' | 'agent' | 'system';
  sender_id?: string;
  message: string;
  timestamp: string;
  seen_status?: 'delivered' | 'read';
}

export interface MinimizedChat {
  visitor_id: string;
  visitor_name?: string;
  agent_name?: string;
  status: string;
  lastMessage?: string;
  timestamp?: string;
}

// Utility functions for visitor data
export const getVisitorName = (visitor: Visitor): string => {
  return visitor.metadata?.name || 
         visitor.visitor_id?.substring(0, 8) || 
         'Anonymous';
};

export const getAgentName = (visitor: Visitor): string => {
  return visitor.agent_name || 'Unassigned';
};

// Utility functions for chat conversation data
export const getConversationVisitorName = (conversation: { metadata?: { name?: string }; visitor_id?: string }): string => {
  return conversation.metadata?.name || 
         conversation.visitor_id?.substring(0, 8) || 
         'Anonymous';
};

export const getConversationAgentName = (conversation: { agent_info?: { name: string }; agent_id?: string }): string => {
  if (conversation.agent_info) {
    return conversation.agent_info.name;
  }
  return conversation.agent_id ? 'Agent' : 'Unassigned';
};

export const getChatDuration = (startedAt?: string): string => {
  if (!startedAt) return '0m';
  
  const startTime = new Date(startedAt).getTime();
  const currentTime = new Date().getTime();
  const durationMs = currentTime - startTime;
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};
