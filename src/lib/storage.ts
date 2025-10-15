/**
 * Local Storage utilities for chat persistence
 * Handles saving and retrieving minimized chat state
 */

export interface StoredMinimizedChat {
  visitor_id: string;
  visitor_name?: string;
  agent_name?: string;
  status: string;
  lastMessage?: string;
  timestamp?: string;
  hasUnreadMessages?: boolean;
  session_id?: string;
  agent_id?: string;
  started_at?: string;
  message_count?: number;
  visitor_past_count?: number;
  visitor_chat_count?: number;
  isDisconnected?: boolean;
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

export interface StoredChatState {
  minimizedChats: StoredMinimizedChat[];
  lastUpdated: string;
}

const STORAGE_KEYS = {
  MINIMIZED_CHATS: 'craftech_minimized_chats',
  CHAT_PREFERENCES: 'craftech_chat_preferences'
} as const;

/**
 * Storage utility class for managing chat state persistence
 */
export class ChatStorage {
  /**
   * Save minimized chats to localStorage
   */
  static saveMinimizedChats(chats: StoredMinimizedChat[]): void {
    try {
      const state: StoredChatState = {
        minimizedChats: chats,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.MINIMIZED_CHATS, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save minimized chats to localStorage:', error);
    }
  }

  /**
   * Load minimized chats from localStorage
   */
  static loadMinimizedChats(): StoredMinimizedChat[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MINIMIZED_CHATS);
      if (!stored) return [];

      const state: StoredChatState = JSON.parse(stored);
      
      // Validate the stored data
      if (!state.minimizedChats || !Array.isArray(state.minimizedChats)) {
        return [];
      }

      // Filter out chats older than 24 hours to prevent stale data
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const now = Date.now();
      
      const validChats = state.minimizedChats.filter(chat => {
        const chatTime = chat.timestamp ? new Date(chat.timestamp).getTime() : now;
        return (now - chatTime) < maxAge;
      });

      // If we filtered out chats, save the cleaned version
      if (validChats.length !== state.minimizedChats.length) {
        this.saveMinimizedChats(validChats);
      }

      return validChats;
    } catch (error) {
      console.warn('Failed to load minimized chats from localStorage:', error);
      return [];
    }
  }

  /**
   * Add a single minimized chat
   */
  static addMinimizedChat(chat: StoredMinimizedChat): void {
    const existingChats = this.loadMinimizedChats();
    
    // Check if chat already exists
    const existingIndex = existingChats.findIndex(c => c.visitor_id === chat.visitor_id);
    
    if (existingIndex >= 0) {
      // Update existing chat
      existingChats[existingIndex] = {
        ...existingChats[existingIndex],
        ...chat,
        timestamp: new Date().toISOString()
      };
    } else {
      // Add new chat
      existingChats.push({
        ...chat,
        timestamp: new Date().toISOString()
      });
    }

    this.saveMinimizedChats(existingChats);
  }

  /**
   * Remove a minimized chat
   */
  static removeMinimizedChat(visitorId: string): void {
    const existingChats = this.loadMinimizedChats();
    const filteredChats = existingChats.filter(chat => chat.visitor_id !== visitorId);
    this.saveMinimizedChats(filteredChats);
  }

  /**
   * Update unread status for a minimized chat
   */
  static updateMinimizedChatUnread(visitorId: string, hasUnreadMessages: boolean): void {
    const existingChats = this.loadMinimizedChats();
    const updatedChats = existingChats.map(chat => {
      if (chat.visitor_id === visitorId) {
        return { ...chat, hasUnreadMessages };
      }
      return chat;
    });
    this.saveMinimizedChats(updatedChats);
  }

  /**
   * Clear all minimized chats
   */
  static clearMinimizedChats(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.MINIMIZED_CHATS);
    } catch (error) {
      console.warn('Failed to clear minimized chats from localStorage:', error);
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): { used: number; available: number; total: number } {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MINIMIZED_CHATS);
      const used = stored ? new Blob([stored]).size : 0;
      
      // Estimate available space (most browsers limit to ~5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate
      const available = total - used;
      
      return { used, available, total };
    } catch (error) {
      return { used: 0, available: 0, total: 0 };
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean up old/stale data
   */
  static cleanup(): void {
    try {
      const chats = this.loadMinimizedChats();
      
      // Remove chats that are disconnected, closed, or inactive
      const activeChats = chats.filter(chat => {
        const status = chat.status?.toLowerCase();
        return !["disconnected", "offline", "closed", "inactive"].includes(status);
      });

      // Remove chats older than 7 days
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const now = Date.now();
      const recentChats = activeChats.filter(chat => {
        const chatTime = chat.timestamp ? new Date(chat.timestamp).getTime() : now;
        return (now - chatTime) < maxAge;
      });

      if (recentChats.length !== chats.length) {
        this.saveMinimizedChats(recentChats);
      }
    } catch (error) {
      console.warn('Failed to cleanup chat storage:', error);
    }
  }
}

/**
 * Hook for managing minimized chat persistence
 * This can be used in React components
 */
export const useChatPersistence = () => {
  const saveChats = (chats: StoredMinimizedChat[]) => {
    ChatStorage.saveMinimizedChats(chats);
  };

  const loadChats = (): StoredMinimizedChat[] => {
    return ChatStorage.loadMinimizedChats();
  };

  const addChat = (chat: StoredMinimizedChat) => {
    ChatStorage.addMinimizedChat(chat);
  };

  const removeChat = (visitorId: string) => {
    ChatStorage.removeMinimizedChat(visitorId);
  };

  const updateUnread = (visitorId: string, hasUnreadMessages: boolean) => {
    ChatStorage.updateMinimizedChatUnread(visitorId, hasUnreadMessages);
  };

  const clearChats = () => {
    ChatStorage.clearMinimizedChats();
  };

  const isStorageAvailable = ChatStorage.isAvailable();
  const storageInfo = ChatStorage.getStorageInfo();

  return {
    saveChats,
    loadChats,
    addChat,
    removeChat,
    updateUnread,
    clearChats,
    isStorageAvailable,
    storageInfo
  };
};

export default ChatStorage;
